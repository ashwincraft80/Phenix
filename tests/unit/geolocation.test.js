/**
 * Unit Tests: Geolocation & Logistics Service
 * Phenix / Project ReguFlow - Member 1 Backend Core Services
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  haversineDistance,
  computeBoundingBox,
  calculateLogistics,
  validateCoordinates,
  HAZARD_MULTIPLIERS,
  BASE_FREIGHT_RATE_INR,
  TERMINAL_FEE_INR
} from '../../src/services/geolocation.js';

describe('Geolocation Service: Haversine Great-Circle Distance', () => {
  // Real Indian industrial cluster coordinates
  const DAHEJ = { lat: 21.7122, lon: 72.5873 };
  const ANKLESHWAR = { lat: 21.6264, lon: 73.0152 };
  const CHAKAN_PUNE = { lat: 18.7606, lon: 73.8636 };
  const TALEGAON = { lat: 18.7297, lon: 73.6828 };

  test('computes accurate distance between Dahej and Ankleshwar (45.2 - 45.4 km)', () => {
    const distance = haversineDistance(DAHEJ.lat, DAHEJ.lon, ANKLESHWAR.lat, ANKLESHWAR.lon);
    assert.strictEqual(typeof distance, 'number');
    assert.ok(distance >= 45.2 && distance <= 45.4, `Expected distance between 45.2 and 45.4 km, got ${distance}`);
    assert.strictEqual(distance, 45.235);
  });

  test('computes accurate distance between Chakan and Talegaon (~19 - 21 km)', () => {
    const distance = haversineDistance(CHAKAN_PUNE.lat, CHAKAN_PUNE.lon, TALEGAON.lat, TALEGAON.lon);
    assert.ok(distance >= 19.0 && distance <= 21.0, `Expected ~20 km, got ${distance}`);
  });

  test('coincident coordinates yield exactly 0.000 km without NaN or precision issues', () => {
    const zero1 = haversineDistance(19.0760, 72.8777, 19.0760, 72.8777);
    assert.strictEqual(zero1, 0.000);

    const zero2 = haversineDistance(0.0, 0.0, 0.0, 0.0);
    assert.strictEqual(zero2, 0.000);

    const zero3 = haversineDistance(-45.1234, 120.5678, -45.1234, 120.5678);
    assert.strictEqual(zero3, 0.000);
  });

  test('antipodal coordinates yield approximately 20,015 km', () => {
    // Equator antipodal (0, 0) to (0, 180)
    const antipodalEq = haversineDistance(0.0, 0.0, 0.0, 180.0);
    assert.ok(Math.abs(antipodalEq - 20015.0) < 10.0, `Expected ~20,015 km, got ${antipodalEq}`);

    // Off-equator antipodal (45, 0) to (-45, 180)
    const antipodalOff = haversineDistance(45.0, 0.0, -45.0, 180.0);
    assert.ok(Math.abs(antipodalOff - 20015.0) < 10.0, `Expected ~20,015 km, got ${antipodalOff}`);
  });

  test('polar coordinates compute smoothly without division by zero', () => {
    // North pole to South pole
    const polarDistance = haversineDistance(90.0, 0.0, -90.0, 0.0);
    assert.ok(Math.abs(polarDistance - 20015.0) < 10.0, `Expected ~20,015 km for pole-to-pole, got ${polarDistance}`);

    // North pole to equator
    const poleToEquator = haversineDistance(90.0, 0.0, 0.0, 0.0);
    assert.ok(Math.abs(poleToEquator - 10007.5) < 10.0, `Expected ~10,007 km, got ${poleToEquator}`);
  });

  test('coordinates out of bounds throw RangeError', () => {
    assert.throws(() => haversineDistance(90.0001, 72.0, 20.0, 73.0), RangeError);
    assert.throws(() => haversineDistance(-90.5, 72.0, 20.0, 73.0), RangeError);
    assert.throws(() => haversineDistance(20.0, 180.0001, 20.0, 73.0), RangeError);
    assert.throws(() => haversineDistance(20.0, -181.0, 20.0, 73.0), RangeError);
    assert.throws(() => haversineDistance(20.0, 72.0, -91.0, 73.0), RangeError);
    assert.throws(() => haversineDistance(20.0, 72.0, 20.0, 185.0), RangeError);
  });

  test('non-numeric or NaN coordinates throw TypeError', () => {
    assert.throws(() => haversineDistance(NaN, 72.0, 20.0, 73.0), TypeError);
    assert.throws(() => haversineDistance(20.0, '72.0', 20.0, 73.0), TypeError);
    assert.throws(() => haversineDistance(20.0, null, 20.0, 73.0), TypeError);
    assert.throws(() => haversineDistance(20.0, 72.0, undefined, 73.0), TypeError);
    assert.throws(() => haversineDistance(Infinity, 72.0, 20.0, 73.0), TypeError);
  });
});

describe('Geolocation Service: Spatial Bounding Box', () => {
  test('computes symmetric bounding box around Dahej', () => {
    const center = { lat: 21.7122, lon: 72.5873 };
    const radiusKm = 50.0;
    const box = computeBoundingBox(center.lat, center.lon, radiusKm);

    assert.ok(box.minLat < center.lat && box.maxLat > center.lat);
    assert.ok(box.minLon < center.lon && box.maxLon > center.lon);

    // Delta latitude should be approx 50 / 111.32 ≈ 0.449
    const expectedDeltaLat = radiusKm / 111.32;
    assert.ok(Math.abs((box.maxLat - center.lat) - expectedDeltaLat) < 0.001);

    // Ankleshwar (45.235 km away) must be contained in the 50km bounding box
    const ankleshwar = { lat: 21.6264, lon: 73.0152 };
    assert.ok(ankleshwar.lat >= box.minLat && ankleshwar.lat <= box.maxLat, 'Ankleshwar lat should be inside box');
    assert.ok(ankleshwar.lon >= box.minLon && ankleshwar.lon <= box.maxLon, 'Ankleshwar lon should be inside box');
  });

  test('handles zero radius bounding box', () => {
    const box = computeBoundingBox(20.0, 75.0, 0);
    assert.strictEqual(box.minLat, 20.0);
    assert.strictEqual(box.maxLat, 20.0);
    assert.strictEqual(box.minLon, 75.0);
    assert.strictEqual(box.maxLon, 75.0);
  });

  test('clamps bounding box near poles to [-90, +90] and [-180, +180]', () => {
    const polarBox = computeBoundingBox(89.0, 10.0, 500.0);
    assert.ok(polarBox.maxLat <= 90.0, 'maxLat must not exceed 90');
    assert.ok(polarBox.minLat >= -90.0, 'minLat must not be below -90');
    assert.ok(polarBox.minLon >= -180.0, 'minLon must be >= -180');
    assert.ok(polarBox.maxLon <= 180.0, 'maxLon must be <= 180');
  });

  test('extreme pole bounding box expands deltaLon to full longitude span', () => {
    const northPoleBox = computeBoundingBox(90.0, 0.0, 100.0);
    assert.strictEqual(northPoleBox.maxLat, 90.0);
    assert.strictEqual(northPoleBox.minLon, -180.0);
    assert.strictEqual(northPoleBox.maxLon, 180.0);
  });

  test('invalid arguments throw TypeError or RangeError', () => {
    assert.throws(() => computeBoundingBox('20', 75, 50), TypeError);
    assert.throws(() => computeBoundingBox(20, 75, -10), RangeError);
    assert.throws(() => computeBoundingBox(95, 75, 50), RangeError);
  });
});

describe('Geolocation Service: Freight Logistics Cost & Transit Estimator', () => {
  test('calculates correct freight cost with NON_HAZARDOUS tier (multiplier 1.0)', () => {
    const distanceKm = 100.0;
    const quantityTons = 10.0;
    const logistics = calculateLogistics(distanceKm, quantityTons, 'NON_HAZARDOUS');

    // Expected: 1500 + (100 * 8.50 * 1.0 * 10) = 1500 + 8500 = 10000.00 INR
    assert.strictEqual(logistics.estimatedCostINR, 10000.00);
    assert.strictEqual(logistics.routeFeasible, true);

    // Transit duration: 4.0 buffer + (100 / 35) + 0 rest = 4.0 + 2.857 = 6.86 hours
    assert.strictEqual(logistics.transitDurationHours, 6.86);
  });

  test('applies exact hazard multipliers for each tier', () => {
    const dist = 50.0;
    const qty = 20.0;
    // Base freight = 50 * 8.50 * 20 = 8500
    // Fixed fee = 1500

    // NON_HAZARDOUS: 1500 + 8500 * 1.00 = 10000
    const nonHaz = calculateLogistics(dist, qty, 'NON_HAZARDOUS');
    assert.strictEqual(nonHaz.estimatedCostINR, 10000.00);

    // HAZARDOUS_CLASS_B: 1500 + 8500 * 1.20 = 1500 + 10200 = 11700
    const hazB = calculateLogistics(dist, qty, 'HAZARDOUS_CLASS_B');
    assert.strictEqual(hazB.estimatedCostINR, 11700.00);

    // HAZARDOUS_CLASS_A: 1500 + 8500 * 1.80 = 1500 + 15300 = 16800
    const hazA = calculateLogistics(dist, qty, 'HAZARDOUS_CLASS_A');
    assert.strictEqual(hazA.estimatedCostINR, 16800.00);

    // TOXIC_CORROSIVE: 1500 + 8500 * 2.40 = 1500 + 20400 = 21900
    const toxic = calculateLogistics(dist, qty, 'TOXIC_CORROSIVE');
    assert.strictEqual(toxic.estimatedCostINR, 21900.00);
  });

  test('calculates mandatory driver rest periods for long routes', () => {
    // 750 km route: 2 rest stops of 14 hours each (floor(750/350) = 2)
    // Driving: 750 / 35 = 21.428 hours
    // Rest: 2 * 14 = 28 hours
    // Buffer: 4 hours
    // Total = 4 + 21.43 + 28 = 53.43 hours
    const longTrip = calculateLogistics(750.0, 15.0, 'NON_HAZARDOUS');
    assert.strictEqual(longTrip.transitDurationHours, 53.43);
  });

  test('handles zero distance logistics', () => {
    const zeroTrip = calculateLogistics(0.0, 10.0, 'NON_HAZARDOUS');
    assert.strictEqual(zeroTrip.estimatedCostINR, 1500.00); // Fixed terminal fee only
    assert.strictEqual(zeroTrip.transitDurationHours, 4.00); // Terminal buffer only
  });

  test('rejects negative distance or quantity', () => {
    assert.throws(() => calculateLogistics(-10, 10, 'NON_HAZARDOUS'), RangeError);
    assert.throws(() => calculateLogistics(100, -5, 'NON_HAZARDOUS'), RangeError);
    assert.throws(() => calculateLogistics('100', 10, 'NON_HAZARDOUS'), TypeError);
  });
});
