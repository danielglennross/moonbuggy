'use strict';

import { forType, moduleResolvers, rule, schema, moduleImports, name } from '../../../moonbuggy/index';

@moduleImports(
  forType('Mutation', moduleResolvers('Registration', ['register'])),
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
