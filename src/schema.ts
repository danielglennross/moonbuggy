'use strict';

import * as hapi from 'hapi';

export class Resolver {
  public name: string;
  public field: string;
  public export: boolean;
}

export class ImportResolver {
  public moduleName: string;
  public resolverNames: string[];
}
