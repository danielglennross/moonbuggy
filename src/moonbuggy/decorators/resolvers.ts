import 'reflect-metadata';

import { OptionsTag } from './types';
import { $resolvers } from '../schema';

export type ResolverOptionFn = (option: OptionsTag) => void;

export function root(): ResolverOptionFn {
  return function (option: OptionsTag) {
    option.root = true;
  };
}

export function exportOnly(): ResolverOptionFn {
  return function (option: OptionsTag) {
    option.export = true;
  };
}

export function typeFor(name: string): ResolverOptionFn {
  return function (option: OptionsTag) {
    option.typeFor = name;
  };
}

export function resolver(...options: ResolverOptionFn[]) {
  const meta = new OptionsTag();
  meta.type = $resolvers;
  const data: OptionsTag = options.reduce((obj, op): any => {
    op(obj);
    return obj;
  }, meta);
  return Reflect.metadata('design:graphqlmeta', data);
}
