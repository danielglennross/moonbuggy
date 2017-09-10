'use strict';

import 'reflect-metadata';
import { getNonEnumerableEntries, tuple } from './objectExt';
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

export function exportOnly(): ResolverOptionFn {
  return function(option: GraphQLOptionalMeta) {
   option.export = true;
  };
 }

export type rulePredicate = (context: any) => boolean | Promise<boolean>;

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

export function imports(moduleName: string, resolvers: string[]): ModuleOptionFn {
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
    descriptor.value = async function(...args: any[]): Promise<any> {
      const [ root, query, context, paramInfo ] = args;
    
      const [ok, err] = await tuple(predicate(context))

      if (!ok || err) {
        throw error || Error(`rule failed for ${propertyKey}`);
      }

      const result = originalMethod.apply(this, args);
      return result;
    };
    return descriptor;
  };
}

export interface ifield {
  name: string,
  rule: rulePredicate
}

export function field(name: string, rule: rulePredicate): ifield  {
  return { name, rule };
}

export function inputMapper(name: string, ...fields: ifield[]) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function(...args: any[]): Promise<any> {
      const [ root, data, context, paramInfo ] = args;
    
      const inputs = getNonEnumerableEntries(data[name]).filter(([, v]:any) => Boolean(v));
      if (inputs.length !== 1) {
        throw new Error('Only one field allowed');
      }

      const [fieldName] = inputs[0];
      const mapping = fields.find(f => f.name === fieldName);
      if (!mapping) {
        throw new Error('Cannot find mapper');
      }
      
      const [ok, err] = await tuple(mapping.rule(context));
      if (err || !ok) {
        throw new Error(err || "Failed auth");
      }

      const result = originalMethod.apply(this, [
        root, 
        Object.assign(data, { [name]: data[name][fieldName] }), 
        context, 
        paramInfo
      ]);

      return result;
    };
    return descriptor;
  };
}
