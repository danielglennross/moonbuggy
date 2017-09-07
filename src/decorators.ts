'use strict';

import 'reflect-metadata';
import {
  Context,
  ImportResolver,
  IGraphQLMeta,
  ResolverLookup,
} from './schema';

export type rulePredicate = (context: Context) => boolean;

// Class decorators

// Only one allowed
export function module(name: string) {
  return function(target: Object) {
    target['__moduleName'] = name;

    const obj: any = (target as any).prototype;

    Object.getOwnPropertyNames(obj).map(k => [k, obj[k]]).forEach(([key, value]: any) => {
      const graphQLMeta: IGraphQLMeta = Reflect.getMetadata('design:graphqlmeta', obj, key) || {};
      if (['schema'].includes(graphQLMeta.type)) {
        const field = `__${graphQLMeta.type}s`;
        target[field] = [...target[field] || [], graphQLMeta.name || key];
      }

      if (['resolver', 'exportresolver'].includes(graphQLMeta.type)) {
        const field = `__${graphQLMeta.type}s`;
        target[field] = [...target[field] || [], {
          field: key,
          name: graphQLMeta.name || key,
        } as ResolverLookup];
      }
    });
  };
}

// Multiple allowed
export function importResolvers(moduleName: string, ...resolvers: string[]) {
  return function(target: Object) {
    const importResolver: ImportResolver = { moduleName, resolverNames: resolvers };
    target['__importResolvers'] = [...target['__importResolvers'] || [], importResolver];
  };
}

// Method decorators
export function Schema() {
  return Reflect.metadata('design:graphqlmeta', {
    type: 'schema',
  } as IGraphQLMeta);
}

export function Resolver(name: string = null) {
  return Reflect.metadata('design:graphqlmeta', {
    type: 'resolver',
    name,
  } as IGraphQLMeta);
}

export function ExportResolver(name: string = null) {
  return Reflect.metadata('design:graphqlmeta', {
    type: 'exportresolver',
    name,
  } as IGraphQLMeta);
}

// Multiple allowed
export function rule(predicate: rulePredicate, error: Error = null) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function(...args: any[]) {
      const [ root, query, context, paramInfo ] = args;

      const strongContext = { request: context } as Context;
      if (!predicate(strongContext)) {
        throw error || Error(`rule failed for ${propertyKey}`);
      }

      const result = originalMethod.apply(this, args);
      return result;
    };
    return descriptor;
  };
}
