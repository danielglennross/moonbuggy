'use strict';

import { forType, moduleResolvers, rule, schema, moduleImports } from '../../../moonbuggy/index';

@moduleImports(
  forType('Query', moduleResolvers('User', ['user'])),
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
