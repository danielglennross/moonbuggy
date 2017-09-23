'use strict';

import requireDir = require('require-dir');

import { getNonEnumerableEntries } from './utils/objectExt';

import {
  Resolver,
  ImportModule,
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
  public typeDefs: string;
  public resolvers: object;
}

function bundleSchema(m: any, bundle: Bundle) {
  (m[$schemas] || []).forEach((sProp: string) => {
    const schemaFn = m.prototype[sProp];
    const schemaRes = schemaFn() as string;
    bundle.typeDefs = bundle.typeDefs.concat(schemaRes);
  });
}

function bundleResolvers(m: any, bundle: Bundle) {
  (m[$resolvers] || []).forEach((rProp: Resolver) => {
    if (rProp.export) {
      return;
    }

    const resolverFn = m.prototype[rProp.field];
    bundle.resolvers[m[$moduleName]] = Object.assign(
      bundle.resolvers[m[$moduleName]] || {}, { [rProp.name]: resolverFn },
    );
  });
}

function bundleImportResolvers(m: any, bundle: Bundle, modules: any[]) {
  (m[$importResolvers] || []).forEach((irProp: ImportModule) => {
    const matchingModule = modules.find(
      (ir: any) => ir.__proto__.constructor[$moduleName] === irProp.moduleName,
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

    (irProp.resolverNames || []).forEach((rn: string) => {
      const { name, value } = filteredModule.find(v => v.name === rn);
      bundle.resolvers[m[$moduleName]] = Object.assign(
        bundle.resolvers[m[$moduleName]] || {}, { [name]: value as any },
      );
    });
  });
}

export function getBundle(options: BundleOptions): Bundle {
  const defaultBundle: Bundle = {
    typeDefs: '',
    resolvers: {},
  };

  const dirs = requireDir(
    options.moduleRootDir || './modules', { recurse: true },
  );

  const modules = Object.values(dirs).map(
    m => m[options.moduleFilename || 'index'].default,
  );

  const bundled: Bundle = modules.reduce((b: Bundle, m: any) => {
    const mod = m.__proto__.constructor;
    if (mod[$moduleName]) {
      bundleSchema(mod, b);
      bundleResolvers(mod, b);
      bundleImportResolvers(mod, b, modules);
    }
    return b;
  }, defaultBundle);

  return bundled;
}
