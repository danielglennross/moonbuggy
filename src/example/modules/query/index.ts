'use strict';

import { module, rule, schema, imports } from '../../../index';

@module(
  imports('User', ['user']),
)
class Query {

  @schema()
  public query() {
    return `
      type Query {
        user: User
      }
    `;
  }

}

export default new Query();
