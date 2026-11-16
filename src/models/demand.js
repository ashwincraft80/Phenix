/**
 * Demand Requirement Domain Model (Buyer Offtake)
 * Phenix / Project ReguFlow - Member 1 Backend Core Services
 */

import { ValidationError } from './organization.js';
import { PHYSICAL_STATES, HAZARD_TIERS } from './material.js';

export const DEMAND_STATUSES = Object.freeze([
  'OPEN',
  'PARTIALLY_FULFILLED',
  'FULFILLED',
  'EXPIRED',
  'CANCELLED'
]);

export const DEMAND_FREQUENCIES = Object.freeze([
  'ONE_TIME',
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'CONTINUOUS'
]);

export function validateDemand(data) {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Demand data must be a non-null object');
  }

  const facilityId = data.facility_id ?? data.facilityId;
  if (facilityId === undefined || facilityId === null || isNaN(Number(facilityId)) || Number(facilityId) <= 0) {
    throw new ValidationError(`Valid positive facility ID is required: ${facilityId}`, 'facility_id');
  }

  const materialId = data.material_id ?? data.materialId;
  if (materialId === undefined || materialId === null || isNaN(Number(materialId)) || Number(materialId) <= 0) {
    throw new ValidationError(`Valid positive material ID is required: ${materialId}`, 'material_id');
  }

  const demandCode = data.demand_code ?? data.demandCode;
  if (!demandCode || typeof demandCode !== 'string' || demandCode.trim().length === 0 || demandCode.length > 64) {
    throw new ValidationError('Demand code is required (1-64 characters)', 'demand_code');
  }

  const physicalState = (data.required_physical_state ?? data.requiredPhysicalState ?? 'SOLID').toUpperCase();
  if (!PHYSICAL_STATES.includes(physicalState)) {
    throw new ValidationError(
      `Invalid required physical state: ${physicalState}. Allowed: ${PHYSICAL_STATES.join(', ')}`,
      'required_physical_state'
    );
  }

  const minPurity = Number(data.minimum_purity_percentage ?? data.minimumPurityPercentage);
  if (isNaN(minPurity) || minPurity < 0.0 || minPurity > 100.0) {
    throw new ValidationError(`Minimum purity percentage must be between 0.0 and 100.0: ${data.minimum_purity_percentage ?? data.minimumPurityPercentage}`, 'minimum_purity_percentage');
  }

  let acceptableTiers = data.acceptable_hazard_tiers ?? data.acceptableHazardTiers;
  if (typeof acceptableTiers === 'string') {
    try {
      acceptableTiers = JSON.parse(acceptableTiers);
    } catch {
      acceptableTiers = acceptableTiers.split(',').map(s => s.trim().toUpperCase());
    }
  }
  if (!Array.isArray(acceptableTiers) || acceptableTiers.length === 0) {
    throw new ValidationError('Acceptable hazard tiers must be a non-empty array of hazard tiers', 'acceptable_hazard_tiers');
  }
  for (const tier of acceptableTiers) {
    if (!HAZARD_TIERS.includes(tier)) {
      throw new ValidationError(`Invalid hazard tier in acceptable_hazard_tiers: ${tier}. Allowed: ${HAZARD_TIERS.join(', ')}`, 'acceptable_hazard_tiers');
    }
  }

  const requiredQty = Number(data.required_quantity ?? data.requiredQuantity);
  if (isNaN(requiredQty) || requiredQty <= 0) {
    throw new ValidationError(`Required quantity must be greater than 0: ${data.required_quantity ?? data.requiredQuantity}`, 'required_quantity');
  }

  const frequency = (data.frequency ?? 'ONE_TIME').toUpperCase();
  if (!DEMAND_FREQUENCIES.includes(frequency)) {
    throw new ValidationError(`Invalid frequency: ${frequency}. Allowed: ${DEMAND_FREQUENCIES.join(', ')}`, 'frequency');
  }

  let maxDist = data.max_logistics_distance_km ?? data.maxLogisticsDistanceKm;
  if (maxDist !== undefined && maxDist !== null && maxDist !== '') {
    maxDist = Number(maxDist);
    if (isNaN(maxDist) || maxDist <= 0) {
      throw new ValidationError(`max_logistics_distance_km must be a positive number if provided: ${maxDist}`, 'max_logistics_distance_km');
    }
  } else {
    maxDist = null;
  }

  let maxPrice = data.max_price_per_unit_inr ?? data.maxPricePerUnit;
  if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
    maxPrice = Number(maxPrice);
    if (isNaN(maxPrice) || maxPrice < 0) {
      throw new ValidationError(`max_price_per_unit_inr must be non-negative: ${maxPrice}`, 'max_price_per_unit_inr');
    }
  } else {
    maxPrice = null;
  }

  const status = (data.status ?? 'OPEN').toUpperCase();
  if (!DEMAND_STATUSES.includes(status)) {
    throw new ValidationError(`Invalid demand status: ${status}. Allowed: ${DEMAND_STATUSES.join(', ')}`, 'status');
  }

  return {
    demand_id: data.demand_id ?? data.demandId ?? null,
    facility_id: Number(facilityId),
    material_id: Number(materialId),
    demand_code: demandCode.trim(),
    title: (data.title ?? demandCode).trim(),
    required_physical_state: physicalState,
    minimum_purity_percentage: minPurity,
    acceptable_hazard_tiers: JSON.stringify(acceptableTiers),
    acceptableHazardTiersArray: acceptableTiers,
    required_quantity: requiredQty,
    quantity_unit: (data.quantity_unit ?? data.unit ?? 'MT').trim(),
    max_price_per_unit_inr: maxPrice,
    frequency: frequency,
    max_logistics_distance_km: maxDist,
    status: status,
    created_at: data.created_at ?? data.createdAt ?? new Date().toISOString(),
    updated_at: data.updated_at ?? data.updatedAt ?? new Date().toISOString()
  };
}

export class Demand {
  constructor(data) {
    const validated = validateDemand(data);
    Object.assign(this, validated);
  }

  toJSON() {
    return { ...this };
  }
}
