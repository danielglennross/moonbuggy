import 'reflect-metadata';

import { rulePredicate } from './types';
import { getNonEnumerableEntries, tuple } from '../utils/objectExt';

export function rule(predicate: rulePredicate, error: Error = null) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function(...args: any[]): Promise<any> {
      const [ root, query, context, paramInfo ] = args;

      const [ok, err] = await tuple(predicate(context));

      if (!ok || err) {
        throw error || new Error(`rule failed for ${propertyKey}`);
      }

      const result = originalMethod.apply(this, args);
      return result;
    };
    return descriptor;
  };
}
