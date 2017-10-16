import requireDir = require('require-dir');

import { metaKey } from './schema';
import { Tag, Schema, Resolver, Importer, TypeOption, ModuleResolverOption } from './decorators/types';
import { getNonEnumerableEntries } from './utils/objectExt';

import {
  $schemas,
  $resolvers,
  $moduleName,
  $importResolvers,
} from './schema';

export class BundleOptions {
  public moduleRootDir: string;
  public moduleFilename: string;
}

export class Bundle {
  public typeDefs: string[];
  public resolvers: object;
}

interface IField {
  field: string;
}

class SchemaField implements IField {
  public field: string;
}

class ResolverField implements IField {
  public field: string;

  public name: string;
  public typeFor: string;
  public export: boolean;
  public root: boolean;
}

function bundleSchema(m: any, bundle: Bundle) {
  (m[$schemas] || []).forEach((sProp: SchemaField) => {
    const schemaFn = m.prototype[sProp.field].bind(m.prototype);
    const schemaRes = schemaFn() as string;
    bundle.typeDefs = [...bundle.typeDefs, schemaRes];
  });
}

function bundleResolvers(m: any, bundle: Bundle) {
  (m[$resolvers] || []).forEach((rProp: ResolverField) => {
    if (rProp.export) {
      return;
    }

    let resolverFnOrObj = m.prototype[rProp.field];
    if (resolverFnOrObj instanceof Function) {
      resolverFnOrObj = resolverFnOrObj.bind(m.prototype);
    }

    if (rProp.root) {
      bundle.resolvers = {
        ...bundle.resolvers || {},
        [rProp.name]: resolverFnOrObj,
      };
    }

    if (rProp.typeFor) {
      bundle.resolvers[rProp.typeFor] = {
        ...bundle.resolvers[rProp.typeFor] || {},
        [rProp.name]: resolverFnOrObj,
      };
    }
  });
}

function bundleImportResolvers(m: any, bundle: Bundle, modules: any[]) {
  (m[$importResolvers] || []).forEach((irProp: TypeOption) => {

    irProp.importOptions.forEach((ro: ModuleResolverOption) => {

      const matchingModule = modules.find(
        (ir: any) => ir.__proto__.constructor[$moduleName] === ro.moduleName,
      );

      if (!matchingModule) {
        return;
      }

      const filteredModule =
        getNonEnumerableEntries(matchingModule.__proto__)
        .reduce((arr, [k, v]): any => {
          const n = matchingModule.__proto__.constructor;

          const exported = (<ResolverField[]>n[$resolvers])
            .filter(r => r.export)
            .find(e => e.field === k);

          if (exported) {
            arr = [...arr, {
              name: exported.name,
              value: v,
            }];
          }
          return arr;
        }, []);

      if (!filteredModule.length) {
        return;
      }

      (ro.resolverNames || []).forEach((rn: string) => {
        const { name, value } = filteredModule.find(v => v.name === rn);
        bundle.resolvers[irProp.typeName] = {
          ...bundle.resolvers[irProp.typeName] || {},
          [name]: value as any,
        };
      });
    });

  });
}

export function getBundle(options: BundleOptions): Bundle {
  const defaultBundle: Bundle = {
    typeDefs: [],
    resolvers: {},
  };

  const dirs = requireDir(
    options.moduleRootDir || './modules', { recurse: true },
  );

  const modules = Object.values(dirs).map(
    m => (m[options.moduleFilename || 'index'] || {}).default,
  ).filter(Boolean);

  modules.forEach((m: any) => {
    const mod = m.__proto__.constructor;

    mod[$moduleName] = mod.name;

    function attachMetaDataToModule(tag: Tag, field: string) {
      tag.match({
        Schema: (meta: Schema) => {
          mod[meta.type] = [...mod[meta.type] || [], (<SchemaField>{
            field,
          })];
        },
        Resolver: (meta: Resolver) => {
          mod[meta.type] = [...mod[meta.type] || [], (<ResolverField>{
            field,
            name: meta.name || field,
            export: meta.export,
            typeFor: meta.typeFor,
            root: meta.root,
          })];
        },
        Importer: (meta: Importer) => {
          mod[meta.type] = meta.importTypes;
        },
      });
    }

    // fetch meta from the object
    const modMeta: Tag = Reflect.getMetadata(metaKey, mod);
    if (modMeta) {
      attachMetaDataToModule(modMeta, mod[$moduleName]);
    }

    // fetch meta from the object's members
    const obj: any = (mod as any).prototype;
    getNonEnumerableEntries(obj).forEach(([key, value]: any) => {
      const fieldMeta: Tag = Reflect.getMetadata(metaKey, obj, key);
      if (fieldMeta) {
        attachMetaDataToModule(fieldMeta, key);
      }
    });
  });

  const bundled: Bundle = modules.reduce((b: Bundle, m: any) => {
    const mod = m.__proto__.constructor;

    bundleSchema(mod, b);
    bundleResolvers(mod, b);
    bundleImportResolvers(mod, b, modules);

    return b;
  }, defaultBundle);

  return bundled;
}
