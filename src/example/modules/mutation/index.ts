'use strict';

import { module, rule, schema, imports, name } from '../../../index';

@module(name('Mutation'),
  imports('Registration', ['register']),
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
