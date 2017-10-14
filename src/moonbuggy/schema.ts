export class Resolver {
  public name: string;
  public field: string;
  public export: boolean;
  public root: boolean;
  public typeFor: string;
}

export const $schemas = Symbol('schemas');
export const $resolvers = Symbol('resolvers');
export const $moduleName = Symbol('moduleName');
export const $importResolvers = Symbol('importResolvers');
