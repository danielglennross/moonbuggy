import 'reflect-metadata';

import { Resolver } from './types';
import { metaKey, $resolvers } from '../schema';

export type ResolverFn = (option: Resolver) => void;

export function firstClass(): ResolverFn {
  return function (option: Resolver) {
    option.root = true;
  };
}

export function asExport(): ResolverFn {
  return function (option: Resolver) {
    option.export = true;
  };
}

export function inType(n: string): ResolverFn {
  return function (option: Resolver) {
    option.typeFor = n;
  };
}

export function name(n: string): ResolverFn {
  return function (option: Resolver) {
    option.name = n;
  };
}

export function resolver(...options: ResolverFn[]) {
  const data = options.reduce<Resolver>((obj, fn): any => {
    fn(obj);
    return obj;
  }, <Resolver>{
    type: $resolvers,
  });
  return Reflect.metadata(metaKey, data);
}
