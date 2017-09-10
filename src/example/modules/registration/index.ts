'use strict';

import { module, rule, Schema, Resolver, exportOnly, name, imports } from '../../../decorators';

@module('Registration')
class Registration {

  @Resolver(
    name('register'), 
    exportOnly(),
  )
  @inputMapper('register',
    field('retail', (request) => request.retail),
    field('digital', (request) => request.digital)
  )
  public register(root: any, args: any, context: any) {

  }

  @Schema()
  public mapper() {
    return `
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
