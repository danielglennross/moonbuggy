'use strict';

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
