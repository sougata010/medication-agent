const express = require('express');
const { ApolloServer } = require('@apollo/server');
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
  
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError: (formattedError, error) => {
      console.error('GraphQL Execution Error:', error);
      return formattedError;
    },
  });

  await server.start();

  // Basic CORS setup to allow frontend queries
  app.use(cors());
  app.use(express.json());

  app.use('/graphql', expressMiddleware(server));

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
