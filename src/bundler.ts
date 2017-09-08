'use strict';

import requireDir = require('require-dir');

import { getNonEnumerableEntries } from './objectExt';
import { Resolver, ImportResolver } from './schema';

export class Options {
  public root: string;
  public moduleFilename: string;
}

export class Bundle {
  public typeDefs: string;
  public resolvers: object;
}

function bundleSchema(m: any, bundle: Bundle) {
  (m.__schemas || []).forEach((sProp: string) => {
    const schemaFn = m.prototype[sProp];
    const schemaRes = schemaFn() as string;
    bundle.typeDefs = bundle.typeDefs.concat(schemaRes);
  });
}

function bundleResolvers(_module: any, bundle: Bundle) {
  (_module.__resolvers || []).forEach((rProp: Resolver) => {
    if (rProp.export) {
      return;
    }

    const resolverFn = _module.prototype[rProp.field];
    bundle.resolvers[_module.__moduleName] = Object.assign(
      bundle.resolvers[_module.__moduleName] || {}, { [rProp.name]: resolverFn },
    );
  });
}

function bundleImportResolvers(_module: any, bundle: Bundle, modules: any[]) {
  (_module.__importResolvers || []).forEach((irProp: ImportResolver) => {
    const matchingModule = modules.find(
      (ir: any) => ir.__proto__.constructor.__moduleName === irProp.moduleName,
    );

    if (!matchingModule) {
      return;
    }

    const filteredModule =
      getNonEnumerableEntries(matchingModule.__proto__)
      .reduce((arr, [k, v]): any => {
        const n = matchingModule.__proto__.constructor;

        const exported = (<Resolver[]>n.__resolvers)
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
      bundle.resolvers[_module.__moduleName] = Object.assign(
        bundle.resolvers[_module.__moduleName] || {}, { [name]: value as any },
      );
    });
  });
}

export function getBundle(options: Options): Bundle {
  const defaultBundle: Bundle = {
    typeDefs: '',
    resolvers: {},
  };

  const dirs = requireDir(
    options.root || './modules', { recurse: true },
  );

  const modules = Object.values(dirs).map(
    m => m[options.moduleFilename || 'index'].default,
  );

  const bundled: Bundle = modules.reduce((b: Bundle, m: any) => {
    const _module = m.__proto__.constructor;
    if (_module.__moduleName) {
      bundleSchema(_module, b);
      bundleResolvers(_module, b);
      bundleImportResolvers(_module, b, modules);
    }
    return b;
  }, defaultBundle);

  return bundled;
}
