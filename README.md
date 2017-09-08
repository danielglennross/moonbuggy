An AOP framework for building modular Apollo GraphQL schema

See `src/example` for full example

```ts
'use strict';

import { Request } from 'hapi';
import { 
  module, 
  importResolvers, 
  rule, 
  ExportResolver, 
  Resolver, 
  Schema 
} from './decorators';

const isAuth = (request: Request): boolean => Boolean(request.auth.credentials);

// define our module name
// import resolvers from `Setting` modules to be used (optional)
@module('User', importResolvers('Setting', 'getSettings')) 
class User {

  @ExportResolver() // mark resolver as exported (isn't bundled into `User` module resolvers) - used by another
  @rule(isAuth, new Error('User is unauthenticated')) // define a precondition (optional)
  public user(root: any, args: any, context: Request) {
    return {
      id: '1',
      name: 'daniel',
      address: {
        line1: 'line1',
        postcode: 'ne23 ftg',
      },
    };
  }

  @Resolver('friends') // mark as internal resolver (i.e. used only by this `User` module)
  public friendsResolver(root: any, args: any, context: Request) {
    return [{
      name: 'graeme',
    }];
  }

  @Schema() // mark partial/full schema
  public friends() {
    return `
      type Friend {
        name: String
      }
    `;
  }

  @Schema() // mark partial/full schema
  public address() {
    return `
      type Address {
        line1: String
        postcode: String
      }
    `;
  }

  @Schema() // mark partial/full schema
  public basic() {
    return `
      type User {
        id: String
        name: String
        address: Address
        friends: [Friend]
        getSettings: [Setting]
      }
    `;
  }

}

export default new User(); // return instance of module as default export
```