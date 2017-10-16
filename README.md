An AOP framework for building modular Apollo-Server GraphQL schema

See `src/example` for full example

```ts
import { Request } from 'hapi';
import * as json from 'graphql-type-json';
import { 
  imports,
  moduleResolver,
  forType,
  firstClass, 
  name,
  rule,
  inType, 
  asExport, 
  resolver, 
  schema 
} from './index';

const isAuth = (request: Request): boolean => Boolean(request.auth.credentials);

// optionally import exported resolvers from other modules
// for use within specified types
@imports(
  forType('Player', moduleResolver('Setting', ['getSettings']),
) 
class User {
  // define resolver (name is method name by default, use `name` to override)
  //
  // optionally mark resolver as `asExport` 
  // this resolver will not be bundled up in this module but can be imported by others
  @resolver(name('user'), asExport()) 
  // optionally define pre-conditions (can have multiple)
  @rule(isAuth, new Error('User is unauthenticated'))
  public user(root: any, args: any, context: Request) {
    return {
      id: '1',
      name: 'daniel',
      address: {
        line1: 'line1',
        postcode: 'ne23 ftg',
      },
    };
  }

  // register the resolver for field `friends` in type `User`
  @resolver(name('friends'), inType('User'))
  public friendsResolver(root: any, args: any, context: Request) {
    return [{
      name: 'graeme',
    }];
  }

  // register a root level type resolver (note, this example is a getter)
  @resolver(firstClass())
  public get JSON() {
    return json
  }

  // mark partial/full schema
  @schema()
  public friends() {
    return `
      type Friend {
        name: String
      }
    `;
  }

  @schema()
  public address() {
    return `
      type Address {
        line1: String
        postcode: String
      }
    `;
  }

  @schema()
  public basic() {
    return `
      type User {
        id: String
        name: String
        address: Address
        friends: [Friend]
        getSettings: [Setting]
      }
    `;
  }

}

export default new User(); // return instance of module as default export
```

For Mutations, if we want to simulate a union type -  we can take advatage of `inputMappers`.
Here, we define an input with multiple fields - yet provide only one resolver for the type.
An `inputMapper` decorates the resolver which states which input field we're decorating, and the rules
associated with each field in the union type. 

A mutation request should only provide one implemented field. The corresponding
rule is evaluated ensuring the request is valid, and the field's data is passed to the single resolver.

```typescript
import {
  inputMapper, 
  field,
  name,
  rule, 
  asExport, 
  resolver, 
  schema 
} from './index';

class Registration {

  @resolver(
    name('register'),
    asExport(),
  )
  @inputMapper('input', new Error('failed to authorize register input'),
    field('retail', (request) => !!request.auth.credentials.retail),
    field('digital', (request) => !!request.auth.credentials.digital),
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
```

Using the framework (with hapi):

```typescript
import { Server } from 'hapi';
import { graphqlHapi, graphiqlHapi } from 'graphql-server-hapi';
import { makeExecutableSchema } from 'graphql-tools';
import { getBundle, BundleOptions, Bundle } from '../index';

const options: BundleOptions = {
  moduleRootDir: `${__dirname}/modules`,
  moduleFilename: 'index',
};

const { typeDefs, resolvers }: Bundle = getBundle(options);

const schema = {
  typeDefs,
  resolvers,
} as any;

const executableSchema = makeExecutableSchema(schema);

const server = new Server();

server.connection({
  host: 'localhost',
  port: 8080,
});

server.register([{
  register: graphqlHapi,
  options: {
    path: '/graphql',
    graphqlOptions: (request) => ({
      pretty: true,
      schema: executableSchema,
      context: request,
    }),
  },
}, {
  register: graphiqlHapi,
  options: {
    path: '/graphiql',
    graphiqlOptions: {
      endpointURL: '/graphql',
    },
  },
}]);

server.start((err) => {
  if (err) {
    throw err;
  }
  // tslint:disable-next-line no-console
  console.log(`Server running at: ${server.info.uri}`);
});
```