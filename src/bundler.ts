'use strict';

import requireDir = require('require-dir');

import { IResolver, IModule, ImportResolver } from './schema';

type schema = () => string;
type resolver = (...args: any[]) => IResolver;

export class Options {
  public root: string;
  public moduleFilename: string;
}

export class Bundle {
  public schema: string;
  public resolvers: object;
}

export function getBundle(options: Options): Bundle {
  const defaultBundle: Bundle = {
    schema: '',
    resolvers: {},
  };

  const dirs = requireDir(options.root || './modules', { recurse: true });

  const modules: IModule[] = Object.values(dirs).map(m => m[options.moduleFilename || 'index'].default);

  const bundled: Bundle = modules.reduce((b: Bundle, mm: /*IModule*/ any) => {
    // if we don't have a module name, ignore
    const m = mm.__proto__.constructor;

    if (!m.__moduleName) {
      return b;
    }

    // concat all schemas in class
    (m.__schemas || []).forEach((sProp: string) => {
      const schemaFn: schema = m.prototype[sProp];
      const schemaRes = schemaFn();
      b.schema.concat(schemaRes);
    });

    // reduce all resolvers in file
    (m.__resolvers || []).forEach((rProp: string) => {
      const resolverFn: resolver = m.prototype[rProp];
      b.resolvers[m.__moduleName] = Object.assign(
        b.resolvers[m.__moduleName] || {}, { [rProp]: resolverFn },
      );
    });

    // reduce all imported resolvers in file
    (m.__importResolvers || []).forEach((irProp: ImportResolver) => {
      const matchingModule = modules.find(
        (ir: /*IModule*/ any) => ir.__moduleName === irProp.moduleName,
      );

      if (!matchingModule) {
        return;
      }

      (irProp.resolverNames || []).forEach((rn: string) => {
        const matchingResolverFn: IResolver = matchingModule[rn];
        b.resolvers[m.__moduleName] = Object.assign(
          b.resolvers[m.__moduleName] || {}, { [rn]: matchingResolverFn },
        );
      });
    });

    return b;
  }, defaultBundle);

  return bundled;
}
