import 'reflect-metadata';

import { Tag, SimpleTag, OptionsTag, ImportOption, ResolverOption, TypeOption } from './types';
import { getNonEnumerableEntries } from '../utils/objectExt';
import { Resolver, $moduleName, $importResolvers } from '../schema';

export type TypeOptionFn = (option: TypeOption) => void;

export type ResolverOptionFn = (option: ResolverOption) => void;

export type ImportOptionFn = (option: ImportOption) => void;

export function moduleResolver(moduleName: string, resolverNames: string[]): ResolverOptionFn {
  return function (option: ResolverOption) {
    option.moduleName = moduleName;
    option.resolverNames = resolverNames;
  };
}

export function forType(typeName: string, ...resolvers: ResolverOptionFn[]): TypeOptionFn {
  return function(option: TypeOption) {
    option.typeName = typeName;
    resolvers.forEach(r => {
      const io = new ResolverOption();
      r(io);
      option.importOptions = [...option.importOptions || [], io];
    });
  };
}

export function imports(...options: TypeOptionFn[]) {
  const option = new ImportOption();

  option.type = $importResolvers;

  options.forEach(o => {
    const op = new TypeOption();
    o(op);
    option.importTypes = [...option.importTypes || [], op];
  });

  return Reflect.metadata('design:graphqlmeta', option);
}
