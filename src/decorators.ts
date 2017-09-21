'use strict';

import 'reflect-metadata';
import { getNonEnumerableEntries, tuple } from './objectExt';
import { ImportResolver, Resolver as ModuleResolver, $schemas, $resolvers, $importResolvers, $moduleName } from './schema';

abstract class BaseGraphQLMeta implements IMetaDataMatcher {
  public type: symbol;
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

    target[$moduleName] = moduleName;
    target[$importResolvers] = moduleOption.importResolvers;

    const obj: any = (target as any).prototype;

    getNonEnumerableEntries(obj).forEach(([key, value]: any) => {
      function attachMetaDataToModule(m: BaseGraphQLMeta) {
        m.match({
          Meta: (meta: GraphQLMeta) => {
            target[m.type] = [...target[m.type] || [], key];
          },
          OptionalMeta: (meta: GraphQLOptionalMeta) => {
            target[m.type] = [...target[m.type] || [], (<ModuleResolver>{
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
  meta.type = $schemas;
  return Reflect.metadata('design:graphqlmeta', meta);
}

export function Resolver(...options: ResolverOptionFn[]) {
  const meta = new GraphQLOptionalMeta();
  meta.type = $resolvers;
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
        throw error || new Error(`rule failed for ${propertyKey}`);
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

export function inputMapper(inputName: string, ...fields: ifield[])
  : (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;

export function inputMapper(inputName: string, error: Error, ...fields: ifield[])
  : (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;

export function inputMapper(inputName: string, errorOrField: Error | ifield, ...fields: ifield[]) {
  let error: Error = null;
  if (errorOrField instanceof Error) {
    error = errorOrField
  } else {
    fields = [errorOrField as ifield, ...fields]
  }
  
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function(...args: any[]): Promise<any> {
      const [ root, data, context, paramInfo ] = args;
    
      const inputs = getNonEnumerableEntries(data[inputName]).filter(([, v]:any) => Boolean(v));
      if (inputs.length !== 1) {
        throw new Error('Only one field allowed in an input union');
      }

      const [fieldName] = inputs[0];
      const mapping = fields.find(f => f.name === fieldName);
      if (!mapping) {
        throw new Error('Cannot find type matcher');
      }
      
      const [ok, err] = await tuple(mapping.rule(context));
      if (err || !ok) {
        throw error || new Error(`rule failed for ${propertyKey}`);
      }

      const result = originalMethod.apply(this, [
        root, 
        Object.assign(data, { [inputName]: data[inputName][fieldName] }), 
        context, 
        paramInfo
      ]);

      return result;
    };
    return descriptor;
  };
}
