'use strict';

import requireDir = require('require-dir');

import { ResolverLookup, ImportResolver } from './schema';

//type schema = () => Schema;
//type resolver = (...args: any[]) => Resolver;

export class Options {
  public root: string;
  public moduleFilename: string;
}

export class Bundle {
  public typeDefs: string;
  public resolvers: object;
}

export function getBundle(options: Options): Bundle {
  const defaultBundle: Bundle = {
    typeDefs: '',
    resolvers: {},
  };

  const dirs = requireDir(options.root || './modules', { recurse: true });

  const modules = Object.values(dirs).map(m => m[options.moduleFilename || 'index'].default);

  const bundled: Bundle = modules.reduce((b: Bundle, mod: /*IModule*/ any) => {
    // if we don't have a module name, ignore
    const m = mod.__proto__.constructor;

    if (!m.__moduleName) {
      return b;
    }

    // concat all schemas in class
    (m.__schemas || []).forEach((sProp: string) => {
      const schemaFn = m.prototype[sProp];
      const schemaRes = schemaFn() as string;
      b.typeDefs = b.typeDefs.concat(schemaRes);
    });

    // reduce all resolvers in file
    (m.__resolvers || []).forEach((rProp: ResolverLookup) => {
      const resolverFn = m.prototype[rProp.field];
      b.resolvers[m.__moduleName] = Object.assign(
        b.resolvers[m.__moduleName] || {}, { [rProp.name]: resolverFn },
      );
    });

    // reduce all imported resolvers in file
    (m.__importResolvers || []).forEach((irProp: ImportResolver) => {
      const matchingModule = modules.find(
        (ir: any) => ir.__proto__.constructor.__moduleName === irProp.moduleName,
      );

      if (!matchingModule) {
        return;
      }

      const filteredModule =
        Object.getOwnPropertyNames(matchingModule.__proto__)
        .map(k => [k, matchingModule[k]])
        .reduce((arr, [k, v]): any => {
          const n = matchingModule.__proto__.constructor;
          const exported = n.__exportresolvers.find(e => e.field === k);
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
        b.resolvers[m.__moduleName] = Object.assign(
          b.resolvers[m.__moduleName] || {}, { [name]: value as any },
        );
      });
    });

    return b;
  }, defaultBundle);

  return bundled;
}
