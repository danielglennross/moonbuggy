'use strict';

import * as hapi from 'hapi';

export class ResolverLookup {
  public name: string;
  public field: string;
}

export class ImportResolver {
  public moduleName: string;
  public resolverNames: string[];
}

// ts can't serialize complex types like interfaces,
// so our reflection api can only with with built in types / classes

export interface IGraphQLMeta {
  type: string;
  name: string;
}

export class Context {
  public request: hapi.Request;
}
