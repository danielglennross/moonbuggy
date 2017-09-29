export type rulePredicate = (context: any) => boolean | Promise<boolean>;

export interface ITagPattern {
  SimpleTag: (meta: SimpleTag) => void;
  OptionsTag: (optionalMeta: OptionsTag) => void;
}

export interface ITagMatcher {
  match(metaDataPattern: ITagPattern);
}

export abstract class Tag implements ITagMatcher {
  public type: symbol;
  public abstract match(p: ITagPattern);
}

export class SimpleTag extends Tag {
  public match(p: ITagPattern) {
    return p.SimpleTag(this);
  }
}

export class OptionsTag extends Tag implements INameOption {
  public name: string;
  public export: boolean;

  public match(p: ITagPattern) {
    return p.OptionsTag(this);
  }
}

export interface INameOption {
  name: string;
}

export type OptionNameFn = (option: INameOption) => void;

export function name(n: string): OptionNameFn {
  return function (option: INameOption) {
    option.name = n;
  };
}
