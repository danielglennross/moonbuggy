export interface ITagPattern {
  Schema: (schema: Schema) => void;
  Resolver: (resolver: Resolver) => void;
  Importer: (importer: Importer) => void;
}

export interface ITagMatcher {
  match(pattern: ITagPattern);
}

export abstract class Tag implements ITagMatcher {
  public type: symbol;
  public abstract match(p: ITagPattern);
}

export class Schema extends Tag {
  public match(p: ITagPattern) {
    return p.Schema(this);
  }
}

export class Resolver extends Tag {
  public name: string;
  public typeFor: string;

  public export: boolean;
  public root: boolean;

  public match(p: ITagPattern) {
    return p.Resolver(this);
  }
}

export class Importer extends Tag {
  public importTypes: TypeOption[];

  public match(p: ITagPattern) {
    return p.Importer(this);
  }
}

export class ModuleResolverOption {
  public moduleName: string;
  public resolverNames: string[];
}

export class TypeOption {
  public typeName: string;
  public importOptions: ModuleResolverOption[];
}

export type rulePredicate = (context: any) => boolean | Promise<boolean>;
