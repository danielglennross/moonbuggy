```ts

'use strict';

import * as hapi from "hapi";

// @module - marks the module name
// @resolver - marks a resolver func
// @schema - marks a schema func
// @rule - evaluates a func with sig: `(context: Context): boolean`

// marker interface for resolver functions (forces func to return something, unlike `any`)
interface IResolver {}
interface IModule {}

// context to be passed down
class Context {
  request: hapi.Request
}

// constraints
const isAuth = (context: Context): boolean => context.request.auth.credentials;
const hasScope = (scope: string) => (context: Context): boolean => context.request.auth.credentials.scope.includes(scope);

@module('module')
class MyModule implements IModule {

  public MyModule() {}

  @resolver
  @rule(isAuth)
  public user(root: any, args: any, context: Context): IResolver {
    return {
      id: '1234',
      name: 'daniel'
    };
  }

  @resolver
  @rule(isAuth)
  @rule(hasScope('setting'))
  public setting(root: any, args: any, context: Context): IResolver {
    return {
      id: 'isAdmin',
      value: 'true'
    };
  }

  @schema
  public user(): string {
    return `
      type User {
        id: String,
        name: String
      }
    `;
  }

  @schema
  public setting(): string {
    return `
      type Setting {
        id: String,
        value: String
      }
    `;
  }

}

export default new MyModule();
```