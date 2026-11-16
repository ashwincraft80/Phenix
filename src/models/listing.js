/**
 * Byproduct Listing Domain Model (Supply)
 * Phenix / Project ReguFlow - Member 1 Backend Core Services
 */

import { ValidationError } from './organization.js';
import { PHYSICAL_STATES, HAZARD_TIERS } from './material.js';

export const LISTING_STATUSES = Object.freeze([
  'DRAFT',
  'ACTIVE',
  'RESERVED',
  'DEPLETED',
  'EXPIRED',
  'CANCELLED'
]);

export function validateListing(data) {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Listing data must be a non-null object');
  }

  const facilityId = data.facility_id ?? data.facilityId;
  if (facilityId === undefined || facilityId === null || isNaN(Number(facilityId)) || Number(facilityId) <= 0) {
    throw new ValidationError(`Valid positive facility ID is required: ${facilityId}`, 'facility_id');
  }

  const materialId = data.material_id ?? data.materialId;
  if (materialId === undefined || materialId === null || isNaN(Number(materialId)) || Number(materialId) <= 0) {
    throw new ValidationError(`Valid positive material ID is required: ${materialId}`, 'material_id');
  }

  const listingCode = data.listing_code ?? data.listingCode;
  if (!listingCode || typeof listingCode !== 'string' || listingCode.trim().length === 0 || listingCode.length > 64) {
    throw new ValidationError('Listing code is required (1-64 characters)', 'listing_code');
  }

  const purity = Number(data.purity_percentage ?? data.purityPercentage);
  if (isNaN(purity) || purity < 0.0 || purity > 100.0) {
    throw new ValidationError(`Purity percentage must be between 0.0 and 100.0: ${data.purity_percentage ?? data.purityPercentage}`, 'purity_percentage');
  }

  const totalQty = Number(data.total_quantity ?? data.totalQuantity);
  if (isNaN(totalQty) || totalQty <= 0) {
    throw new ValidationError(`Total quantity must be greater than 0: ${data.total_quantity ?? data.totalQuantity}`, 'total_quantity');
  }

  const availableQty = Number(data.available_quantity ?? data.availableQuantity ?? totalQty);
  if (isNaN(availableQty) || availableQty < 0) {
    throw new ValidationError(`Available quantity must be non-negative: ${availableQty}`, 'available_quantity');
  }
  if (availableQty > totalQty) {
    throw new ValidationError(`Available quantity (${availableQty}) cannot exceed total quantity (${totalQty})`, 'available_quantity');
  }

  const pricePerUnit = Number(data.price_per_unit_inr ?? data.pricePerUnit ?? 0.0);
  if (isNaN(pricePerUnit) || pricePerUnit < 0) {
    throw new ValidationError(`Price per unit must be non-negative: ${data.price_per_unit_inr ?? data.pricePerUnit}`, 'price_per_unit_inr');
  }

  const moq = Number(data.minimum_order_quantity ?? data.minimumOrderQuantity ?? 1.0);
  if (isNaN(moq) || moq <= 0) {
    throw new ValidationError(`Minimum order quantity must be greater than 0: ${data.minimum_order_quantity ?? data.minimumOrderQuantity}`, 'minimum_order_quantity');
  }

  const status = (data.status ?? 'ACTIVE').toUpperCase();
  if (!LISTING_STATUSES.includes(status)) {
    throw new ValidationError(`Invalid listing status: ${status}. Allowed: ${LISTING_STATUSES.join(', ')}`, 'status');
  }

  let physicalState = (data.physical_state ?? data.physicalState ?? 'SOLID').toUpperCase();
  if (!PHYSICAL_STATES.includes(physicalState)) {
    throw new ValidationError(`Invalid physical state: ${physicalState}`, 'physical_state');
  }

  let hazardTier = (data.hazard_tier ?? data.hazardTier ?? 'NON_HAZARDOUS').toUpperCase();
  if (!HAZARD_TIERS.includes(hazardTier)) {
    throw new ValidationError(`Invalid hazard tier: ${hazardTier}`, 'hazard_tier');
  }

  let chemicalComposition = data.chemical_composition ?? data.chemicalComposition ?? '{}';
  if (typeof chemicalComposition === 'object') {
    chemicalComposition = JSON.stringify(chemicalComposition);
  } else if (typeof chemicalComposition === 'string') {
    try {
      JSON.parse(chemicalComposition);
    } catch {
      throw new ValidationError(`Chemical composition must be valid JSON: ${chemicalComposition}`, 'chemical_composition');
    }
  } else {
    throw new ValidationError('Chemical composition must be a valid JSON string or object', 'chemical_composition');
  }

  // Dates
  const fromRaw = data.available_from ?? data.availableFrom ?? new Date().toISOString().split('T')[0];
  const untilRaw = data.available_until ?? data.availableUntil ?? new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];
  const fromDate = new Date(fromRaw);
  const untilDate = new Date(untilRaw);
  if (isNaN(fromDate.getTime()) || isNaN(untilDate.getTime())) {
    throw new ValidationError('Valid available_from and available_until dates are required', 'available_dates');
  }
  if (untilDate < fromDate) {
    throw new ValidationError(`available_until (${untilRaw}) cannot precede available_from (${fromRaw})`, 'available_dates');
  }

  return {
    listing_id: data.listing_id ?? data.listingId ?? null,
    facility_id: Number(facilityId),
    material_id: Number(materialId),
    listing_code: listingCode.trim(),
    title: (data.title ?? listingCode).trim(),
    description: data.description ? String(data.description).trim() : null,
    physical_state: physicalState,
    hazard_tier: hazardTier,
    chemical_composition: chemicalComposition,
    purity_percentage: purity,
    total_quantity: totalQty,
    available_quantity: availableQty,
    quantity_unit: (data.quantity_unit ?? data.unit ?? 'MT').trim(),
    price_per_unit_inr: pricePerUnit,
    minimum_order_quantity: moq,
    available_from: fromRaw,
    available_until: untilRaw,
    status: status,
    created_at: data.created_at ?? data.createdAt ?? new Date().toISOString(),
    updated_at: data.updated_at ?? data.updatedAt ?? new Date().toISOString()
  };
}

export class Listing {
  constructor(data) {
    const validated = validateListing(data);
    Object.assign(this, validated);
  }

  toJSON() {
    return { ...this };
  }
}
