'use strict';

import { IResolver, Context, IModule } from '../../../schema';
import { module, importResolvers, exportSchema, exportResolvers, rule } from '../../../decorators';

const requestExists = (context: Context): boolean => !!context.request;

@module('User')
@exportSchema('basic', 'address')
@exportResolvers('user')
@importResolvers('Settings', 'settings')
class User implements IModule {

  @rule(requestExists)
  public user(root: any, args: any, context: Context): IResolver {
    return {
      id: '1',
      name: 'daniel',
      address: {
        line1: 'line1',
        postcode: 'ne23 ftg',
      },
    };
  }

  public address(): string {
    return `
      type Address {
        line1: Stirng
        postcode: String
      }
    `;
  }

  public basic(): string {
    return `
      type User {
        id: String
        name: String
        address: Address
        settings: [Setting]
      }
    `;
  }

}

export default new User();
