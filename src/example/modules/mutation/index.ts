'use strict';

import { forType, moduleResolver, rule, schema, imports, name } from '../../../moonbuggy/index';

@imports(
  forType('Mutation', moduleResolver('Registration', ['register'])),
)
class Mutation {

  @schema()
  public mutation() {
    return `
      type Mutation {
        register (input: RegistrationUnion): Result
      }
    `;
  }

}

export default new Mutation();
