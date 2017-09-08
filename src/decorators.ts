'use strict';

import 'reflect-metadata';
import { getNonEnumerableEntries } from './objectExt';
import { ImportResolver, Resolver as ModuleResolver } from './schema';

abstract class BaseGraphQLMeta implements IMetaDataMatcher {
  public type: string;
  public abstract match(p: IMetaDataPattern);
}

class GraphQLMeta extends BaseGraphQLMeta {
  public match(p: IMetaDataPattern) {
    return p.Meta(this);
  }
}

class GraphQLOptionalMeta extends BaseGraphQLMeta {
  public name: string;
  public export: boolean;

  public match(p: IMetaDataPattern) {
    return p.OptionalMeta(this);
  }
}

type ResolverOptionFn = (option: GraphQLOptionalMeta) => void;

export function name(n: string): ResolverOptionFn {
 return function(option: GraphQLOptionalMeta) {
  option.name = n;
 };
}

export function exported(): ResolverOptionFn {
  return function(option: GraphQLOptionalMeta) {
   option.export = true;
  };
 }

export type rulePredicate = (context: any) => boolean;

interface IMetaDataPattern {
  Meta: (meta: GraphQLMeta) => void;
  OptionalMeta: (optionalMeta: GraphQLOptionalMeta) => void;
}

interface IMetaDataMatcher {
  match(metaDataPattern: IMetaDataPattern);
}

// Class decorators

// Multiple allowed
class ModuleOption {
  public importResolvers: ImportResolver[];
}

type ModuleOptionFn = (option: ModuleOption) => void;

export function importResolvers(moduleName: string, ...resolvers: string[]): ModuleOptionFn {
  return function(option: ModuleOption) {
    const importResolver: ImportResolver = { moduleName, resolverNames: resolvers };
    option.importResolvers = [...option.importResolvers || [], importResolver];
  };
}

// Only one allowed
export function module(moduleName: string, ...options: ModuleOptionFn[]) {
  return function(target: Object) {
    const moduleOption: ModuleOption = {
      importResolvers: [],
    };

    options.forEach(o => o(moduleOption));

    target['__moduleName'] = moduleName;
    target['__importResolvers'] = moduleOption.importResolvers;

    const obj: any = (target as any).prototype;

    getNonEnumerableEntries(obj).forEach(([key, value]: any) => {
      function attachMetaDataToModule(m: BaseGraphQLMeta) {
        m.match({
          Meta: (meta: GraphQLMeta) => {
            const field = `__${meta.type}s`;
            target[field] = [...target[field] || [], key];
          },
          OptionalMeta: (meta: GraphQLOptionalMeta) => {
            const field = `__${meta.type}s`;
            target[field] = [...target[field] || [], (<ModuleResolver>{
              field: key,
              name: meta.name || key,
              export: meta.export,
            })];
          },
        });
      }

      const graphQLMeta: BaseGraphQLMeta = Reflect.getMetadata('design:graphqlmeta', obj, key);
      if (graphQLMeta) {
        attachMetaDataToModule(graphQLMeta);
      }
    });
  };
}

// Method decorators
export function Schema() {
  const meta = new GraphQLMeta();
  meta.type = 'schema';
  return Reflect.metadata('design:graphqlmeta', meta);
}

export function Resolver(...options: ResolverOptionFn[]) {
  const meta = new GraphQLOptionalMeta();
  meta.type = 'resolver';
  const data: GraphQLOptionalMeta = options.reduce((obj, op): any => {
    op(obj);
    return obj;
  }, meta);
  return Reflect.metadata('design:graphqlmeta', data);
}

// Multiple allowed
export function rule(predicate: rulePredicate, error: Error = null) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function(...args: any[]) {
      const [ root, query, context, paramInfo ] = args;

      if (!predicate(context)) {
        throw error || Error(`rule failed for ${propertyKey}`);
      }

      const result = originalMethod.apply(this, args);
      return result;
    };
    return descriptor;
  };
}
