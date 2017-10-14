import requireDir = require('require-dir');

import { Tag, SimpleTag, OptionsTag, ImportOption, TypeOption, ResolverOption } from './decorators/types';
import { getNonEnumerableEntries } from './utils/objectExt';

import {
  Resolver,
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

function bundleSchema(m: any, bundle: Bundle) {
  (m[$schemas] || []).forEach((sProp: string) => {
    const schemaFn = m.prototype[sProp].bind(m.prototype);
    const schemaRes = schemaFn() as string;
    bundle.typeDefs = [...bundle.typeDefs, schemaRes];
  });
}

function bundleResolvers(m: any, bundle: Bundle) {
  (m[$resolvers] || []).forEach((rProp: Resolver) => {
    if (rProp.export) {
      return;
    }

    let resolverFn = m.prototype[rProp.field];
    if (resolverFn instanceof Function) {
      resolverFn = resolverFn.bind(m.prototype);
    }

    if (rProp.root) {
      bundle.resolvers = {
        ...bundle.resolvers || {},
        [rProp.name]: resolverFn,
      };
    }

    if (rProp.typeFor) {
      bundle.resolvers[rProp.typeFor] = {
        ...bundle.resolvers[rProp.typeFor] || {},
        [rProp.name]: resolverFn,
      };
    }
  });
}

function bundleImportResolvers(m: any, bundle: Bundle, modules: any[]) {
  (m[$importResolvers] || []).forEach((irProp: TypeOption) => {

    irProp.importOptions.forEach((ro: ResolverOption) => {

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

          const exported = (<Resolver[]>n[$resolvers])
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
    m => m[options.moduleFilename || 'index'].default,
  ).filter(Boolean);

  modules.forEach((m: any) => {
    const mod = m.__proto__.constructor;

    mod[$moduleName] = mod.name;

    function attachMetaDataToModule(mm: Tag, key: string) {
      mm.match({
        SimpleTag: (meta: SimpleTag) => {
          mod[meta.type] = [...mod[meta.type] || [], key];
        },
        OptionsTag: (meta: OptionsTag) => {
          mod[meta.type] = [...mod[meta.type] || [], (<Resolver>{
            field: key,
            name: meta.name || key,
            export: meta.export,
            typeFor: meta.typeFor,
            root: meta.root,
          })];
        },
        ImportTag: (meta: ImportOption) => {
          mod[meta.type] = meta.importTypes;
        },
      });
    }

    const tag: Tag = Reflect.getMetadata('design:graphqlmeta', mod);
    if (tag) {
      attachMetaDataToModule(tag, mod[$moduleName]);
    }

    const obj: any = (mod as any).prototype;
    getNonEnumerableEntries(obj).forEach(([key, value]: any) => {
      const graphQLMeta: Tag = Reflect.getMetadata('design:graphqlmeta', obj, key);
      if (graphQLMeta) {
        attachMetaDataToModule(graphQLMeta, key);
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
