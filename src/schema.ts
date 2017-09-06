'use strict';

import * as hapi from 'hapi';

export class ImportResolver {
  public moduleName: string;
  public resolverNames: string[];
}

export interface IModule {}

export interface IResolver {}

export class Context {
  public request: hapi.Request;
}
