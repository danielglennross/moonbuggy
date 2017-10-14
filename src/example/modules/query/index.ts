'use strict';

import { forType, moduleResolver, rule, schema, imports } from '../../../moonbuggy/index';

@imports(
  forType('Query', moduleResolver('User', ['user'])),
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
