import 'reflect-metadata';

import { metaKey, $schemas } from '../schema';

import { Schema } from './types';

export function schema() {
  const meta = <Schema>{ type: $schemas };
  return Reflect.metadata(metaKey, meta);
}
