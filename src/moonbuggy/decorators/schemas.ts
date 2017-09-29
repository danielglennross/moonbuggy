import 'reflect-metadata';

import { $schemas } from '../schema';

import { SimpleTag } from './types';

export function schema() {
  const meta = new SimpleTag();
  meta.type = $schemas;
  return Reflect.metadata('design:graphqlmeta', meta);
}
