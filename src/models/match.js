/**
 * Match Proposal Domain Model
 * Phenix / Project ReguFlow - Member 1 Backend Core Services
 */

import { ValidationError } from './organization.js';

export const MATCH_STATUSES = Object.freeze([
  'PROPOSED',
  'ACCEPTED_SUPPLIER',
  'ACCEPTED_BUYER',
  'MUTUALLY_ACCEPTED',
  'REJECTED',
  'EXPIRED'
]);

export function validateMatch(data) {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Match proposal data must be a non-null object');
  }

  const supplyListingId = data.supply_listing_id ?? data.supplyListingId;
  if (supplyListingId === undefined || supplyListingId === null || isNaN(Number(supplyListingId)) || Number(supplyListingId) <= 0) {
    throw new ValidationError(`Valid positive supply listing ID is required: ${supplyListingId}`, 'supply_listing_id');
  }

  const demandRequirementId = data.demand_requirement_id ?? data.demandRequirementId;
  if (demandRequirementId === undefined || demandRequirementId === null || isNaN(Number(demandRequirementId)) || Number(demandRequirementId) <= 0) {
    throw new ValidationError(`Valid positive demand requirement ID is required: ${demandRequirementId}`, 'demand_requirement_id');
  }

  const matchScore = Number(data.match_score ?? data.matchScore);
  if (isNaN(matchScore) || matchScore < 0.0 || matchScore > 1.0) {
    throw new ValidationError(`Match score must be a number between 0.0 and 1.0: ${data.match_score ?? data.matchScore}`, 'match_score');
  }

  const matScore = Number(data.score_material_compat ?? data.scoreMaterialCompat ?? data.materialScore ?? 0.0);
  if (isNaN(matScore) || matScore < 0.0 || matScore > 1.0) {
    throw new ValidationError(`Material compatibility score must be between 0.0 and 1.0: ${matScore}`, 'score_material_compat');
  }

  const qtyScore = Number(data.score_quantity_compat ?? data.scoreQuantityCompat ?? data.quantityScore ?? 0.0);
  if (isNaN(qtyScore) || qtyScore < 0.0 || qtyScore > 1.0) {
    throw new ValidationError(`Quantity compatibility score must be between 0.0 and 1.0: ${qtyScore}`, 'score_quantity_compat');
  }

  const proxScore = Number(data.score_proximity ?? data.scoreProximity ?? data.distanceScore ?? data.proximityScore ?? 0.0);
  if (isNaN(proxScore) || proxScore < 0.0 || proxScore > 1.0) {
    throw new ValidationError(`Proximity score must be between 0.0 and 1.0: ${proxScore}`, 'score_proximity');
  }

  const esgScore = Number(data.score_esg_reliability ?? data.scoreEsgReliability ?? data.esgScore ?? 0.0);
  if (isNaN(esgScore) || esgScore < 0.0 || esgScore > 1.0) {
    throw new ValidationError(`ESG & reliability score must be between 0.0 and 1.0: ${esgScore}`, 'score_esg_reliability');
  }

  const distanceKm = Number(data.distance_km ?? data.distanceKm);
  if (isNaN(distanceKm) || distanceKm < 0.0) {
    throw new ValidationError(`Distance (km) must be a non-negative number: ${data.distance_km ?? data.distanceKm}`, 'distance_km');
  }

  const transitCost = Number(data.estimated_transit_cost_inr ?? data.estimatedTransitCostINR ?? data.transitCost ?? 0.0);
  if (isNaN(transitCost) || transitCost < 0.0) {
    throw new ValidationError(`Estimated transit cost must be non-negative: ${transitCost}`, 'estimated_transit_cost_inr');
  }

  const transitHours = Number(data.estimated_transit_hours ?? data.estimatedTransitHours ?? data.transitHours ?? 0.0);
  if (isNaN(transitHours) || transitHours < 0.0) {
    throw new ValidationError(`Estimated transit hours must be non-negative: ${transitHours}`, 'estimated_transit_hours');
  }

  const status = (data.status ?? 'PROPOSED').toUpperCase();
  if (!MATCH_STATUSES.includes(status)) {
    throw new ValidationError(`Invalid match status: ${status}. Allowed: ${MATCH_STATUSES.join(', ')}`, 'status');
  }

  const proposedAt = data.proposed_at ?? data.proposedAt ?? new Date().toISOString();
  const expiresAt = data.expires_at ?? data.expiresAt ?? new Date(Date.now() + 14 * 86400000).toISOString();

  return {
    match_id: data.match_id ?? data.matchId ?? null,
    supply_listing_id: Number(supplyListingId),
    demand_requirement_id: Number(demandRequirementId),
    match_score: matchScore,
    score_material_compat: matScore,
    score_quantity_compat: qtyScore,
    score_proximity: proxScore,
    score_esg_reliability: esgScore,
    distance_km: distanceKm,
    estimated_transit_cost_inr: transitCost,
    estimated_transit_hours: transitHours,
    status: status,
    rejection_reason: data.rejection_reason ?? data.rejectionReason ?? null,
    proposed_at: proposedAt,
    expires_at: expiresAt
  };
}

export class Match {
  constructor(data) {
    const validated = validateMatch(data);
    Object.assign(this, validated);
  }

  toJSON() {
    return { ...this };
  }
}
