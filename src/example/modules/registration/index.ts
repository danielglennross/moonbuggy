'use strict';

import { module, rule, Schema, Resolver, exportOnly, name, imports, inputMapper, field } from '../../../decorators';

@module('Registration')
class Registration {

  @Resolver(
    name('register'), 
    exportOnly(),
  )
  @inputMapper('input', new Error('fails'),
    field('retail', (request) => !!request),
    field('digital', (request) => !!request)
  )
  public register(root: any, args: any, context: any) {
    return {
      name: 'daniel'
    };
  }

  @Schema()
  public mapper() {
    return `
      type Result {
        name: String
      }

      input Retail {
        PIN: String
      }

      input Digital {
        username: String
      }

      input RegistrationUnion {
        retail: Retail
        digital: Digital
      }
    `;
  }

}

export default new Registration();