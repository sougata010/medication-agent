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

  // Image Proxy to hide 404s/503s and try multiple free providers
  app.get('/api/chemical-image', async (req, res) => {
    try {
      const name = req.query.name;
      if (!name) return res.status(400).send('Name required');
      
      let imageBuffer = null;
      let contentType = 'image/png';
      let sourceName = 'Generic Icon';
      
      // Provider 1: PubChem
      try {
        const pubChemRes = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/PNG?record_type=2d&image_size=small`);
        if (pubChemRes.ok) {
          imageBuffer = await pubChemRes.arrayBuffer();
          sourceName = 'PubChem';
        }
      } catch (e) {
        console.error('PubChem fetch failed', e.message);
      }
      
      // Provider 2: NCI Cactus (Chemical Identifier Resolver)
      if (!imageBuffer) {
        try {
          const cactusRes = await fetch(`https://cactus.nci.nih.gov/chemical/structure/${encodeURIComponent(name)}/image`);
          if (cactusRes.ok) {
            imageBuffer = await cactusRes.arrayBuffer();
            contentType = 'image/gif';
            sourceName = 'NCI Cactus';
          }
        } catch (e) {
          console.error('NCI Cactus fetch failed', e.message);
        }
      }
      
      res.setHeader('Access-Control-Expose-Headers', 'X-Image-Source');
      res.setHeader('X-Image-Source', sourceName);

      if (imageBuffer) {
        res.setHeader('Content-Type', contentType);
        return res.send(Buffer.from(imageBuffer));
      }
      
      // Fallback: Generic SVG Hexagon
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.send('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>');
    } catch (err) {
      res.setHeader('Access-Control-Expose-Headers', 'X-Image-Source');
      res.setHeader('X-Image-Source', 'Generic Icon');
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>');
    }
  });

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
