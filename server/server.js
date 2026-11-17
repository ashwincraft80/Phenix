require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB, getDbStatus } = require('./config/db');

// Route imports
const dealRoutes = require('./routes/deal.routes');
const impactRoutes = require('./routes/impact.routes');
const matchRoutes = require('./routes/match.routes');
const companyRoutes = require('./routes/company.routes');
const listingRoutes = require('./routes/listing.routes');

const app = express();
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 5001;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[${req.method}] ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// API Routes
app.use('/api/deals', dealRoutes);
app.use('/api/impact', impactRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/listings', listingRoutes);

// System Health & Diagnostics
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'SymbioLink Industrial Resource Exchange Engine',
    mission: 'Viksit Bharat 2026 Circular Economy (SB_S1)',
    timestamp: new Date().toISOString(),
    database: getDbStatus(),
    endpoints: {
      deals: '/api/deals',
      impactAggregate: '/api/impact/aggregate',
      impactCertificate: '/api/impact/certificate/:dealId',
      matchmaking: '/api/match/:listingId',
      companies: '/api/companies',
      listings: '/api/listings'
    }
  });
});

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'SymbioLink B2B Industrial Resource Exchange API',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.url}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Helper to listen with port collision fallback (e.g. macOS AirPlay occupying port 5000)
function listenOnPort(appInstance, portToTry) {
  return new Promise((resolve, reject) => {
    const serverInstance = appInstance.listen(portToTry, () => {
      resolve({ server: serverInstance, port: portToTry });
    });

    serverInstance.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        reject(err);
      } else {
        reject(err);
      }
    });
  });
}

// Start Server & Connect DB
const startServer = async (port = DEFAULT_PORT) => {
  await connectDB();

  let activeServer = null;
  let activePort = port;

  try {
    const result = await listenOnPort(app, activePort);
    activeServer = result.server;
    activePort = result.port;
  } catch (err) {
    if (err.code === 'EADDRINUSE' && activePort === 5000) {
      console.warn(`⚠️  Port 5000 is occupied (e.g. macOS AirPlay Receiver). Automatically falling back to port 5001...`);
      const result = await listenOnPort(app, 5001);
      activeServer = result.server;
      activePort = result.port;
    } else {
      throw err;
    }
  }

  console.log(`\n======================================================`);
  console.log(`🚀 SymbioLink Backend Engine listening on http://localhost:${activePort}`);
  console.log(`📊 Impact Analytics Endpoint: http://localhost:${activePort}/api/impact/aggregate`);
  console.log(`🤝 Deal State Machine Endpoint: http://localhost:${activePort}/api/deals`);
  console.log(`⚡ Algorithmic Matchmaker: http://localhost:${activePort}/api/match/L1`);
  console.log(`======================================================\n`);

  return activeServer;
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
