An AOP framework for building modular Apollo GraphQL schema

See `src/example` for full example

```ts
'use strict';

import { Context } from './schema';
import { 
  module, 
  importResolvers, 
  rule, 
  ExportResolver, 
  Resolver, 
  Schema 
} from './decorators';

const isAuth = (context: Context): boolean => Boolean(context.request.auth.credentials);

@module('User') // define our module name
@importResolvers('Setting', 'getSettings') // import resolvers from `Setting` modules to be used
class User {

  @ExportResolver() // mark resolver as exported (isn't bundled into `User` module resolvers) - used by another
  @rule(isAuth, new Error('User is unauthenticated')) // define a precondition
  public user(root: any, args: any, context: Context) {
    return {
      id: '1',
      name: 'daniel',
      address: {
        line1: 'line1',
        postcode: 'ne23 ftg',
      },
    };
  }

  @Resolver() // mark as internal resolver (i.e. used only by this `User` module)
  public friends(root: any, args: any, context: Context) {
    return [{
      name: 'graeme',
    }];
  }

  @Schema() // mark partial/full schema
  public friendsSch() {
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