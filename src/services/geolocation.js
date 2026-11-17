/**
 * Geolocation & Logistics Service
 * Phenix / Project ReguFlow - Member 1 Backend Core Services
 */

const EARTH_RADIUS_KM = 6371.0088;
const DEG_TO_RAD = Math.PI / 180.0;
const RAD_TO_DEG = 180.0 / Math.PI;

export const HAZARD_MULTIPLIERS = Object.freeze({
  NON_HAZARDOUS: 1.00,
  HAZARDOUS_CLASS_B: 1.20,
  HAZARDOUS_CLASS_A: 1.80,
  TOXIC_CORROSIVE: 2.40,
  // Aliases for compatibility
  LOW: 1.00,
  MEDIUM: 1.20,
  HIGH: 1.80
});

export const BASE_FREIGHT_RATE_INR = 8.50; // INR per ton*km
export const TERMINAL_FEE_INR = 1500.00;   // Fixed terminal loading/unloading
export const AVG_TRUCK_SPEED_KMH = 35.0;  // Average commercial speed km/h
export const BUFFER_HOURS = 4.0;          // Loading/terminal turnaround buffer
export const REST_INTERVAL_KM = 350.0;    // Driver mandatory rest interval
export const REST_DURATION_HOURS = 14.0;  // Driver mandatory rest duration

/**
 * Validates coordinate pair
 * @throws {TypeError} if not finite numbers
 * @throws {RangeError} if latitude not in [-90, 90] or longitude not in [-180, 180]
 */
export function validateCoordinates(lat, lon, label = 'Coordinates') {
  if (typeof lat !== 'number' || typeof lon !== 'number' ||
      Number.isNaN(lat) || Number.isNaN(lon) ||
      !Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new TypeError(`${label} must be valid finite numbers: lat=${lat}, lon=${lon}`);
  }
  if (lat < -90.0 || lat > 90.0) {
    throw new RangeError(`Latitude out of range: must be between -90.0 and +90.0 degrees: ${lat}`);
  }
  if (lon < -180.0 || lon > 180.0) {
    throw new RangeError(`Longitude out of range: must be between -180.0 and +180.0 degrees: ${lon}`);
  }
}

/**
 * High-Precision Haversine Great-Circle Distance
 * Uses WGS-84 mean spherical radius R = 6371.0088 km
 *
 * @param {number} lat1 Latitude of point 1 in degrees
 * @param {number} lon1 Longitude of point 1 in degrees
 * @param {number} lat2 Latitude of point 2 in degrees
 * @param {number} lon2 Longitude of point 2 in degrees
 * @returns {number} Distance in kilometers rounded to 3 decimal places
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  validateCoordinates(lat1, lon1, 'Source coordinates');
  validateCoordinates(lat2, lon2, 'Destination coordinates');

  // Coincident points check to prevent precision artifacts
  if (lat1 === lat2 && lon1 === lon2) {
    return 0.000;
  }

  const phi1 = lat1 * DEG_TO_RAD;
  const phi2 = lat2 * DEG_TO_RAD;
  const deltaPhi = (lat2 - lat1) * DEG_TO_RAD;
  const deltaLambda = (lon2 - lon1) * DEG_TO_RAD;

  // Intermediate square chord length: a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
  const sinHalfDeltaPhi = Math.sin(deltaPhi / 2.0);
  const sinHalfDeltaLambda = Math.sin(deltaLambda / 2.0);

  const a = (sinHalfDeltaPhi * sinHalfDeltaPhi) +
            Math.cos(phi1) * Math.cos(phi2) * (sinHalfDeltaLambda * sinHalfDeltaLambda);

  // Clamp a to [0.0, 1.0] to safeguard against floating point inaccuracies
  const clampedA = Math.min(1.0, Math.max(0.0, a));

  // Angular distance in radians: c = 2 ⋅ atan2(√a, √(1−a))
  const c = 2.0 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(Math.max(0.0, 1.0 - clampedA)));

  const distanceKm = EARTH_RADIUS_KM * c;
  return Math.round(distanceKm * 1000.0) / 1000.0;
}

/**
 * Computes spatial bounding box around a center coordinate
 *
 * @param {number} lat Center latitude in degrees
 * @param {number} lon Center longitude in degrees
 * @param {number} maxDistanceKm Maximum search radius in km
 * @returns {{ minLat: number, maxLat: number, minLon: number, maxLon: number }}
 */
export function computeBoundingBox(lat, lon, maxDistanceKm) {
  validateCoordinates(lat, lon, 'Center coordinates');

  if (typeof maxDistanceKm !== 'number' || Number.isNaN(maxDistanceKm) || !Number.isFinite(maxDistanceKm)) {
    throw new TypeError(`maxDistanceKm must be a valid finite number: ${maxDistanceKm}`);
  }
  if (maxDistanceKm < 0) {
    throw new RangeError(`maxDistanceKm must be non-negative: ${maxDistanceKm}`);
  }

  if (maxDistanceKm === 0) {
    return { minLat: lat, maxLat: lat, minLon: lon, maxLon: lon };
  }

  const deltaLat = maxDistanceKm / 111.32;
  const minLat = Math.max(-90.0, lat - deltaLat);
  const maxLat = Math.min(90.0, lat + deltaLat);

  // Near polar regions, cos(lat) approaches 0, expanding deltaLon to full span
  const latRad = lat * DEG_TO_RAD;
  const cosLat = Math.cos(latRad);

  let minLon, maxLon;
  if (Math.abs(cosLat) < 1e-6) {
    minLon = -180.0;
    maxLon = 180.0;
  } else {
    const deltaLon = maxDistanceKm / (111.32 * Math.abs(cosLat));
    minLon = Math.max(-180.0, lon - deltaLon);
    maxLon = Math.min(180.0, lon + deltaLon);
  }

  return { minLat, maxLat, minLon, maxLon };
}

/**
 * Computes estimated freight transit cost and turnaround time
 *
 * @param {number} distanceKm Distance in kilometers
 * @param {number} quantityTons Material mass in metric tons
 * @param {string} hazardTier Material hazard classification
 * @returns {{ estimatedCostINR: number, transitDurationHours: number, routeFeasible: boolean }}
 */
export function calculateLogistics(distanceKm, quantityTons, hazardTier = 'NON_HAZARDOUS') {
  if (typeof distanceKm !== 'number' || Number.isNaN(distanceKm) || !Number.isFinite(distanceKm)) {
    throw new TypeError(`distanceKm must be a valid finite number: ${distanceKm}`);
  }
  if (distanceKm < 0) {
    throw new RangeError(`distanceKm must be non-negative: ${distanceKm}`);
  }

  if (typeof quantityTons !== 'number' || Number.isNaN(quantityTons) || !Number.isFinite(quantityTons)) {
    throw new TypeError(`quantityTons must be a valid finite number: ${quantityTons}`);
  }
  if (quantityTons < 0) {
    throw new RangeError(`quantityTons must be non-negative: ${quantityTons}`);
  }

  const normalizedTier = String(hazardTier || 'NON_HAZARDOUS').toUpperCase().trim();
  const muH = HAZARD_MULTIPLIERS[normalizedTier] ?? 1.00;

  // Cost = Fixed + (distanceKm * Rate_base * mu_H * quantityTons)
  const cost = TERMINAL_FEE_INR + (distanceKm * BASE_FREIGHT_RATE_INR * muH * quantityTons);
  const estimatedCostINR = Math.round(cost * 100.0) / 100.0;

  // Transit hours = buffer(4.0) + (distanceKm / 35.0) + floor(distanceKm / 350.0) * 14.0
  const drivingHours = distanceKm / AVG_TRUCK_SPEED_KMH;
  const mandatoryRestStops = Math.floor(distanceKm / REST_INTERVAL_KM);
  const restHours = mandatoryRestStops * REST_DURATION_HOURS;
  const transitDurationHours = Math.round((BUFFER_HOURS + drivingHours + restHours) * 100.0) / 100.0;

  return {
    estimatedCostINR,
    transitDurationHours,
    routeFeasible: true
  };
}
