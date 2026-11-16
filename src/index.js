/**
 * Phenix / Project ReguFlow - Member 1 Backend Core Services
 * Main Package Entrypoint
 */

// Domain Models & Validation Helpers
export * from './models/index.js';

// Geolocation & Logistics Services
export {
  haversineDistance,
  computeBoundingBox,
  calculateLogistics,
  validateCoordinates,
  HAZARD_MULTIPLIERS,
  BASE_FREIGHT_RATE_INR,
  TERMINAL_FEE_INR,
  AVG_TRUCK_SPEED_KMH,
  BUFFER_HOURS
} from './services/geolocation.js';

// Algorithmic Matchmaking Engine
export {
  DEFAULT_WEIGHTS,
  normalizeWeights,
  calculateMaterialScore,
  calculateQuantityScore,
  calculateProximityScore,
  calculateEsgScore,
  calculateMatchScore,
  rankCandidates
} from './services/matchmaking.js';

// Database & Schema Layer
export {
  getDatabase,
  initSchema,
  runSchema
} from './db/database.js';

export {
  SCHEMA_SQL
} from './db/schema.js';
