'use strict';

import { module, rule, Schema, imports } from '../../../decorators';

@module('Mutation', 
  imports('Registration', ['register'])
)
class Mutation {

  @Schema()
  public mutation() {
    return `
      type Mutation {
        register (input: RegistrationUnion): Result
      }
    `;
  }

}

export default new Mutation();
