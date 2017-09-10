'use strict';

import { module, rule, Schema, imports } from '../../../decorators';

@module('Query', 
  imports('User', ['user']),
)
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
