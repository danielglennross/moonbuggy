import 'reflect-metadata';

import { Importer, ModuleResolverOption, TypeOption } from './types';
import { getNonEnumerableEntries } from '../utils/objectExt';
import { metaKey, $importResolvers } from '../schema';

export type TypeOptionFn = (option: TypeOption) => void;

export type ModuleResolverOptionFn = (option: ModuleResolverOption) => void;

export function moduleResolvers(moduleName: string, resolverNames: string[]): ModuleResolverOptionFn {
  return function (option: ModuleResolverOption) {
    option.moduleName = moduleName;
    option.resolverNames = resolverNames;
  };
}

export function forType(typeName: string, ...resolvers: ModuleResolverOptionFn[]): TypeOptionFn {
  return function(option: TypeOption) {
    option.typeName = typeName;
    resolvers.forEach(fn => {
      const ro = new ModuleResolverOption();
      fn(ro);
      option.importOptions = [...option.importOptions || [], ro];
    });
  };
}

export function moduleImports(...options: TypeOptionFn[]) {
  const option = options.reduce<Importer>((obj, fn) => {
    const op = new TypeOption();
    fn(op);
    option.importTypes = [...option.importTypes || [], op];
    return obj;
  }, <Importer>{
    type: $importResolvers,
  });

  return Reflect.metadata(metaKey, option);
}
