'use strict';

import { Context, ImportResolver } from './schema';

export type rulePredicate = (context: Context) => boolean;

// Class decorators

// Only one allowed
export function module(name: string) {
  return function(target: Object) {
    target['__moduleName'] = name;
  };
}

export function exportSchema(...schemas: string[]) {
  return function(target: Object) {
    target['__schemas'] = schemas;
  };
}

export function exportResolvers(...resolvers: string[]) {
  return function(target: Object) {
    target['__resolvers'] = resolvers;
  };
}

// Multiple allowed
export function importResolvers(moduleName: string, ...resolvers: string[]) {
  return function(target: Object) {
    const importRs = target['__importResolvers'] || [];
    const importResolver: ImportResolver = { moduleName, resolverNames: resolvers };
    importRs.push(importResolver);
  };
}

// Method decorators

// Multiple allowed
export function rule(predicate: rulePredicate, error: Error = null) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function(...args: any[]) {
      const { root, query, context, paramInfo }: any = args;

      const strongContext = context as Context;
      if (!predicate(strongContext)) {
        throw error || Error(`rule failed for ${propertyKey}`);
      }

      const result = originalMethod.apply(this, args);
      return result;
    };
    return descriptor;
  };
}
