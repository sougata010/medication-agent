const express = require('express');
const { ApolloServer } = require('@apollo/server');
const jwt = require('jsonwebtoken');
const { expressMiddleware } = require('@apollo/server/express4');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const db = require('./db');

const PORT = process.env.GRAPHQL_PORT || 4000;

async function startServer() {
  const app = express();
  
  const PUBLIC_OPERATIONS = [
    'register', 'verifyOTP', 'login', 'googleLogin', 
    'generatePasskeyRegistrationOptions', 'verifyPasskeyRegistration',
    'generatePasskeyAuthenticationOptions', 'verifyPasskeyAuthentication',
    'requestPasswordReset', 'resetPassword', 'createUser' // Kept createUser public if legacy scripts use it
  ];

  // Wrap resolvers to enforce authentication globally
  const wrappedResolvers = { ...resolvers };
  for (const type of ['Query', 'Mutation']) {
    if (wrappedResolvers[type]) {
      wrappedResolvers[type] = { ...wrappedResolvers[type] }; // clone the object so we don't mutate the original cache
      for (const [fieldName, resolver] of Object.entries(wrappedResolvers[type])) {
        if (!PUBLIC_OPERATIONS.includes(fieldName)) {
          wrappedResolvers[type][fieldName] = async (parent, args, context, info) => {
            if (!context.user) throw new Error('Unauthorized: Missing or invalid authentication token.');
            
            // If the query takes an id or userId argument, ensure it matches the authenticated user
            const targetId = args.id || args.userId;
            if (targetId && parseInt(targetId) !== context.user.id) {
              throw new Error('Forbidden: You are not authorized to access data for this user ID.');
            }
            return resolver(parent, args, context, info);
          };
        }
      }
    }
  }

  const server = new ApolloServer({
    typeDefs,
    resolvers: wrappedResolvers,
    formatError: (formattedError, error) => {
      console.error('GraphQL Execution Error:', error);
      return formattedError;
    },
  });

  await server.start();

  // Basic CORS setup to allow frontend queries
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.use('/graphql', expressMiddleware(server, {
    context: async ({ req }) => {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.replace('Bearer ', '');
      
      let user = null;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-medgraph-key-change-in-prod');
          user = { id: decoded.userId };
        } catch (e) {
          console.error('JWT verification failed:', e.message);
        }
      }
      
      return { user };
    },
  }));

  // Health check endpoint
  app.get('/health', async (req, res) => {
    try {
      const dbCheck = await db.query('SELECT NOW()');
      res.json({
        status: 'UP',
        database: 'CONNECTED',
        timestamp: dbCheck.rows[0].now
      });
    } catch (err) {
      res.status(500).json({
        status: 'DOWN',
        database: 'DISCONNECTED',
        error: err.message
      });
    }
  });

  app.listen(PORT, () => {
    console.log(`🚀 GraphQL Gateway ready at http://localhost:${PORT}/graphql`);
    console.log(`🏥 Health check endpoint at http://localhost:${PORT}/health`);
  });
}

startServer().catch(err => {
  console.error('Fatal error starting GraphQL server:', err);
  process.exit(1);
});
