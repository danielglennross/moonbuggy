'use strict';

import { Context } from '../../../schema';
import { module, rule, Schema, importResolvers } from '../../../decorators';

@module('Query')
@importResolvers('User', 'user')
class Query {

  @Schema()
  public basic() {
    return `
      type Query {
        user: User
      }
    `;
  }

}

export default new Query();
