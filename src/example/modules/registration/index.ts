'use strict';

import {
  rule,
  schema,
  resolver,
  asExport,
  name,
  inputMapper,
  field,
} from '../../../moonbuggy/index';

class Registration {

  @resolver(
    name('register'),
    asExport(),
  )
  @inputMapper('input', new Error('fails'),
    field('retail', (request) => !!request),
    field('digital', (request) => !!request),
  )
  public register(root: any, args: any, context: any) {
    return {
      name: 'daniel',
    };
  }

  @schema()
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
