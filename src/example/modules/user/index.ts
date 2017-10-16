'use strict';

import {
  forType,
  inType,
  moduleResolvers,
  moduleImports,
  rule,
  resolver,
  schema,
  asExport,
} from '../../../moonbuggy/index';

const requestExists = (context: any): boolean => !!context;

@moduleImports(
  forType('User', moduleResolvers('Setting', ['getSettings'])),
)
class User {

  @resolver(asExport())
  @rule(requestExists)
  public user(root: any, args: any, context: any) {
    return {
      id: '1',
      name: 'daniel',
      address: {
        line1: 'line1',
        postcode: 'ne23 ftg',
      },
    };
  }

  @resolver(inType('User'))
  public friends(root: any, args: any, context: any) {
    return [{
      name: 'graeme',
    }];
  }

  @schema()
  public friendsSch() {
    return `
      type Friend {
        name: String
      }
    `;
  }

  @schema()
  public address() {
    return `
      type Address {
        line1: String
        postcode: String
      }
    `;
  }

  @schema()
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

export default new User();
