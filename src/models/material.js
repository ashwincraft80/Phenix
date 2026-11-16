/**
 * Material Catalog Domain Model
 * Phenix / Project ReguFlow - Member 1 Backend Core Services
 */

import { ValidationError } from './organization.js';

export const PHYSICAL_STATES = Object.freeze(['SOLID', 'LIQUID', 'GAS', 'SLURRY']);

export const HAZARD_TIERS = Object.freeze([
  'NON_HAZARDOUS',
  'HAZARDOUS_CLASS_A',
  'HAZARDOUS_CLASS_B',
  'TOXIC_CORROSIVE'
]);

export function validateMaterial(data) {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Material data must be a non-null object');
  }

  const materialCode = data.material_code ?? data.materialCode;
  if (!materialCode || typeof materialCode !== 'string' || materialCode.trim().length === 0 || materialCode.length > 64) {
    throw new ValidationError('Material code is required (1-64 characters)', 'material_code');
  }

  const materialName = data.material_name ?? data.materialName ?? data.name;
  if (!materialName || typeof materialName !== 'string' || materialName.trim().length === 0 || materialName.length > 255) {
    throw new ValidationError('Material name is required (1-255 characters)', 'material_name');
  }

  const primaryCategory = data.primary_category ?? data.primaryCategory;
  if (!primaryCategory || typeof primaryCategory !== 'string' || primaryCategory.trim().length === 0) {
    throw new ValidationError('Primary category is required', 'primary_category');
  }

  const physicalState = (data.physical_state ?? data.physicalState ?? '').toUpperCase();
  if (!PHYSICAL_STATES.includes(physicalState)) {
    throw new ValidationError(
      `Invalid physical state: ${physicalState}. Allowed: ${PHYSICAL_STATES.join(', ')}`,
      'physical_state'
    );
  }

  const defaultHazardTier = (data.default_hazard_tier ?? data.defaultHazardTier ?? 'NON_HAZARDOUS').toUpperCase();
  if (!HAZARD_TIERS.includes(defaultHazardTier)) {
    throw new ValidationError(
      `Invalid hazard tier: ${defaultHazardTier}. Allowed: ${HAZARD_TIERS.join(', ')}`,
      'default_hazard_tier'
    );
  }

  const carbonOffsetFactor = Number(data.carbon_offset_factor_kg_per_unit ?? data.carbonOffsetFactor ?? 0.0);
  if (isNaN(carbonOffsetFactor) || carbonOffsetFactor < 0) {
    throw new ValidationError(`Carbon offset factor must be a non-negative number: ${carbonOffsetFactor}`, 'carbon_offset_factor');
  }

  const landfillDiversionFactor = Number(data.landfill_diversion_factor_tons_per_unit ?? data.landfillDiversionFactor ?? 0.0);
  if (isNaN(landfillDiversionFactor) || landfillDiversionFactor < 0) {
    throw new ValidationError(`Landfill diversion factor must be a non-negative number: ${landfillDiversionFactor}`, 'landfill_diversion_factor');
  }

  const standardUnit = (data.standard_unit ?? data.standardUnit ?? 'MT').trim();

  return {
    material_id: data.material_id ?? data.materialId ?? null,
    material_code: materialCode.trim(),
    material_name: materialName.trim(),
    primary_category: primaryCategory.trim(),
    physical_state: physicalState,
    default_hazard_tier: defaultHazardTier,
    carbon_offset_factor_kg_per_unit: carbonOffsetFactor,
    landfill_diversion_factor_tons_per_unit: landfillDiversionFactor,
    standard_unit: standardUnit
  };
}

export class Material {
  constructor(data) {
    const validated = validateMaterial(data);
    Object.assign(this, validated);
  }

  toJSON() {
    return { ...this };
  }
}
