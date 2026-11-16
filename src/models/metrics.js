/**
 * Sustainability & ESG Metrics Domain Model
 * Phenix / Project ReguFlow - Member 1 Backend Core Services
 */

import { ValidationError } from './organization.js';

export function validateMetrics(data) {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Sustainability metrics data must be a non-null object');
  }

  const transactionId = data.transaction_id ?? data.transactionId;
  if (transactionId === undefined || transactionId === null || isNaN(Number(transactionId)) || Number(transactionId) <= 0) {
    throw new ValidationError(`Valid positive transaction ID is required: ${transactionId}`, 'transaction_id');
  }

  const carbonOffset = Number(data.embodied_carbon_offset_kg ?? data.embodiedCarbonOffsetKg ?? 0.0);
  if (isNaN(carbonOffset) || carbonOffset < 0) {
    throw new ValidationError(`Embodied carbon offset (kg) must be non-negative: ${carbonOffset}`, 'embodied_carbon_offset_kg');
  }

  const landfillTons = Number(data.landfill_diversion_tons ?? data.landfillDiversionTons ?? 0.0);
  if (isNaN(landfillTons) || landfillTons < 0) {
    throw new ValidationError(`Landfill diversion tons must be non-negative: ${landfillTons}`, 'landfill_diversion_tons');
  }

  const circularityCoeff = Number(data.circularity_coefficient ?? data.circularityCoefficient ?? 0.0);
  if (isNaN(circularityCoeff) || circularityCoeff < 0.0 || circularityCoeff > 1.0) {
    throw new ValidationError(`Circularity coefficient must be between 0.0 and 1.0: ${circularityCoeff}`, 'circularity_coefficient');
  }

  const waterSaved = Number(data.water_saved_kl ?? data.waterSavedKl ?? 0.0);
  if (isNaN(waterSaved) || waterSaved < 0) {
    throw new ValidationError(`Water saved (kL) must be non-negative: ${waterSaved}`, 'water_saved_kl');
  }

  return {
    metric_id: data.metric_id ?? data.metricId ?? null,
    transaction_id: Number(transactionId),
    embodied_carbon_offset_kg: carbonOffset,
    landfill_diversion_tons: landfillTons,
    circularity_coefficient: circularityCoeff,
    water_saved_kl: waterSaved,
    recorded_at: data.recorded_at ?? data.recordedAt ?? new Date().toISOString()
  };
}

export class SustainabilityMetrics {
  constructor(data) {
    const validated = validateMetrics(data);
    Object.assign(this, validated);
  }

  toJSON() {
    return { ...this };
  }
}
