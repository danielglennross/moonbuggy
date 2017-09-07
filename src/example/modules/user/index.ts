'use strict';

import { Context } from '../../../schema';
import { module, importResolvers, rule, ExportResolver, Resolver, Schema } from '../../../decorators';

const requestExists = (context: Context): boolean => !!context.request;

@module('User')
@importResolvers('Setting', 'getSettings')
class User {

  @ExportResolver()
  @rule(requestExists)
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

  @Resolver()
  public friends(root: any, args: any, context: Context) {
    return [{
      name: 'graeme',
    }];
  }

  @Schema()
  public friendsSch() {
    return `
      type Friend {
        name: String
      }
    `;
  }

  @Schema()
  public address() {
    return `
      type Address {
        line1: String
        postcode: String
      }
    `;
  }

  @Schema()
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
