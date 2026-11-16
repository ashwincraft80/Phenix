/**
 * Algorithmic Matchmaking Engine
 * Phenix / Project ReguFlow - Member 1 Backend Core Services
 */

import { haversineDistance, calculateLogistics } from './geolocation.js';

export const DEFAULT_WEIGHTS = Object.freeze({
  material: 0.35,  // w_m: Material compatibility
  quantity: 0.25,  // w_q: Quantity satisfaction ratio
  proximity: 0.25, // w_p: Logistics proximity
  esg: 0.15        // w_e: ESG & corporate reliability standing
});

/**
 * Normalizes matchmaking dimension weights so their sum equals 1.0
 */
export function normalizeWeights(weights) {
  if (!weights || typeof weights !== 'object') {
    return { ...DEFAULT_WEIGHTS };
  }

  const wm = Number(weights.material ?? weights.wm ?? weights.w_m ?? weights.materialWeight ?? DEFAULT_WEIGHTS.material);
  const wq = Number(weights.quantity ?? weights.wq ?? weights.w_q ?? weights.quantityWeight ?? DEFAULT_WEIGHTS.quantity);
  const wp = Number(weights.proximity ?? weights.distance ?? weights.wp ?? weights.w_p ?? weights.distanceWeight ?? weights.proximityWeight ?? DEFAULT_WEIGHTS.proximity);
  const we = Number(weights.esg ?? weights.we ?? weights.w_e ?? weights.esgWeight ?? DEFAULT_WEIGHTS.esg);

  const safeWm = isNaN(wm) || wm < 0 ? 0 : wm;
  const safeWq = isNaN(wq) || wq < 0 ? 0 : wq;
  const safeWp = isNaN(wp) || wp < 0 ? 0 : wp;
  const safeWe = isNaN(we) || we < 0 ? 0 : we;

  const total = safeWm + safeWq + safeWp + safeWe;
  if (total <= 0) {
    return { ...DEFAULT_WEIGHTS };
  }

  return {
    material: safeWm / total,
    quantity: safeWq / total,
    proximity: safeWp / total,
    esg: safeWe / total
  };
}

/**
 * Material Compatibility Scorer: S_mat = C_tax * C_state * C_purity * C_hazard
 */
export function calculateMaterialScore(supplyListing, demandReq) {
  const reasons = [];

  // 1. Taxonomic alignment C_tax
  const supplyMatId = supplyListing.material_id ?? supplyListing.materialId;
  const demandMatId = demandReq.material_id ?? demandReq.materialId;

  let cTax = 0.0;
  if (supplyMatId !== undefined && demandMatId !== undefined && supplyMatId === demandMatId) {
    cTax = 1.0;
  } else {
    const supplySub = (supplyListing.subcategory ?? supplyListing.sub_category ?? '').trim().toLowerCase();
    const demandSub = (demandReq.subcategory ?? demandReq.sub_category ?? '').trim().toLowerCase();
    const supplyCat = (supplyListing.primary_category ?? supplyListing.primaryCategory ?? '').trim().toLowerCase();
    const demandCat = (demandReq.primary_category ?? demandReq.primaryCategory ?? '').trim().toLowerCase();

    if (supplySub && demandSub && supplySub === demandSub) {
      cTax = 0.8;
    } else if (supplyCat && demandCat && supplyCat === demandCat) {
      cTax = 0.5;
    } else {
      cTax = 0.0;
      reasons.push('Material taxonomy mismatch (material_id and categories do not match)');
    }
  }

  // 2. Physical state compatibility C_state
  const supplyState = (supplyListing.physical_state ?? supplyListing.physicalState ?? '').trim().toUpperCase();
  const demandState = (demandReq.required_physical_state ?? demandReq.requiredPhysicalState ?? '').trim().toUpperCase();

  let cState = 0.0;
  if (supplyState && demandState && supplyState === demandState) {
    cState = 1.0;
  } else {
    cState = 0.0;
    reasons.push(`Physical state mismatch: supply is ${supplyState || 'unknown'}, demand requires ${demandState || 'unknown'}`);
  }

  // 3. Purity compliance C_purity
  const pS = Number(supplyListing.purity_percentage ?? supplyListing.purityPercentage ?? 0.0);
  const pDMin = Number(demandReq.minimum_purity_percentage ?? demandReq.minimumPurityPercentage ?? 0.0);

  let cPurity = 1.0;
  if (pDMin > 0.0) {
    if (pS >= pDMin) {
      cPurity = 1.0;
    } else {
      // Penalty formula: max(0.0, 1.0 - 3.0 * ((pDMin - pS) / pDMin))
      const degradation = 3.0 * ((pDMin - pS) / pDMin);
      cPurity = Math.max(0.0, 1.0 - degradation);
      reasons.push(`Purity degradation penalty applied: supply ${pS}% < required minimum ${pDMin}% (factor: ${cPurity.toFixed(3)})`);
    }
  }

  // 4. Hazard tier admissibility C_hazard
  const supplyHazard = (supplyListing.hazard_tier ?? supplyListing.hazardTier ?? 'NON_HAZARDOUS').trim().toUpperCase();
  let acceptableTiers = demandReq.acceptable_hazard_tiers ?? demandReq.acceptableHazardTiers;

  if (typeof acceptableTiers === 'string') {
    try {
      acceptableTiers = JSON.parse(acceptableTiers);
    } catch {
      acceptableTiers = acceptableTiers.split(',').map(s => s.trim().toUpperCase());
    }
  }

  let cHazard = 0.0;
  if (Array.isArray(acceptableTiers)) {
    const normalizedAcceptable = acceptableTiers.map(t => String(t).trim().toUpperCase());
    if (normalizedAcceptable.includes(supplyHazard)) {
      cHazard = 1.0;
    } else {
      cHazard = 0.0;
      reasons.push(`Hazard tier mismatch: supply is ${supplyHazard}, acceptable: [${normalizedAcceptable.join(', ')}]`);
    }
  } else {
    // If unspecified, only non-hazardous is acceptable
    cHazard = supplyHazard === 'NON_HAZARDOUS' ? 1.0 : 0.0;
    if (cHazard === 0.0) {
      reasons.push(`Hazard tier not accepted: ${supplyHazard}`);
    }
  }

  const sMat = cTax * cState * cPurity * cHazard;
  return {
    score: Math.max(0.0, Math.min(1.0, sMat)),
    cTax,
    cState,
    cPurity,
    cHazard,
    reasons
  };
}

/**
 * Quantity Satisfaction Ratio Scorer: S_qty
 */
export function calculateQuantityScore(supplyListing, demandReq) {
  const reasons = [];

  const qS = Number(supplyListing.available_quantity ?? supplyListing.availableQuantity ?? supplyListing.total_quantity ?? supplyListing.totalQuantity ?? 0.0);
  const qD = Number(demandReq.required_quantity ?? demandReq.requiredQuantity ?? 0.0);
  const moq = Number(supplyListing.minimum_order_quantity ?? supplyListing.minimumOrderQuantity ?? 1.0);

  if (qS <= 0.0) {
    reasons.push('Supply listing has zero available quantity');
    return { score: 0.0, reasons };
  }

  if (qS < moq) {
    reasons.push(`Available supply (${qS}) is below minimum order quantity (${moq})`);
    return { score: 0.0, reasons };
  }

  if (qD <= 0.0) {
    reasons.push('Demand required quantity must be greater than zero');
    return { score: 0.0, reasons };
  }

  let sQty = 0.0;
  if (qS >= qD) {
    // Complete fulfillment capability: dampens oversupply
    const ratio = qS / qD;
    const oversupplyTerm = (ratio - 1.0) / (ratio + 1.0);
    sQty = 1.0 - 0.10 * Math.min(1.0, oversupplyTerm);
  } else {
    // Partial fulfillment capability: power curve (qS / qD)^0.80
    const ratio = qS / qD;
    sQty = Math.pow(ratio, 0.80);
  }

  return {
    score: Math.max(0.0, Math.min(1.0, sQty)),
    reasons
  };
}

/**
 * Logistics Proximity Decay Scorer: S_prox
 */
export function calculateProximityScore(distanceKm, demandReq) {
  const reasons = [];
  const d = Math.max(0.0, Number(distanceKm ?? 0.0));
  const maxDistance = demandReq?.max_logistics_distance_km ?? demandReq?.maxLogisticsDistanceKm;

  if (maxDistance !== undefined && maxDistance !== null && maxDistance > 0 && d > Number(maxDistance)) {
    reasons.push(`Distance ${d} km exceeds buyer maximum allowable distance ${maxDistance} km`);
    return { score: 0.0, reasons };
  }

  // Characteristic scale distance d0 = 300.0 km
  // S_prox = 1.0 / (1.0 + (d / 300.0)^2)
  const normalizedDistance = d / 300.0;
  const sProx = 1.0 / (1.0 + (normalizedDistance * normalizedDistance));

  return {
    score: Math.max(0.0, Math.min(1.0, sProx)),
    reasons
  };
}

/**
 * ESG & Corporate Reliability Composite Scorer: S_esg
 */
export function calculateEsgScore(orgSupplier, orgReceiver) {
  const esgS = Number(orgSupplier?.esg_score ?? orgSupplier?.esgScore ?? 50.0);
  const relS = Number(orgSupplier?.reliability_rating ?? orgSupplier?.reliabilityRating ?? 3.0);

  const esgD = Number(orgReceiver?.esg_score ?? orgReceiver?.esgScore ?? 50.0);
  const relD = Number(orgReceiver?.reliability_rating ?? orgReceiver?.reliabilityRating ?? 3.0);

  const supplierComposite = 0.60 * (esgS / 100.0) + 0.40 * (relS / 5.0);
  const receiverComposite = 0.60 * (esgD / 100.0) + 0.40 * (relD / 5.0);

  const sEsg = 0.50 * (supplierComposite + receiverComposite);

  return {
    score: Math.max(0.0, Math.min(1.0, sEsg))
  };
}

/**
 * Net Composite Match Score
 *
 * @param {object} supplyListing Listing object
 * @param {object} demandReq Demand requirement object
 * @param {number} distanceKm Distance between facilities in km
 * @param {object} [orgSupplier] Supplier organization object
 * @param {object} [orgReceiver] Receiver organization object
 * @param {object} [weights] Custom weights
 * @returns {{ netScore: number, eligible: boolean, breakdown: { materialScore: number, quantityScore: number, distanceScore: number, esgScore: number, proximityScore: number }, reasons: string[] }}
 */
export function calculateMatchScore(supplyListing, demandReq, distanceKm = 0, orgSupplier = null, orgReceiver = null, weights = null) {
  const normWeights = normalizeWeights(weights);

  // Evaluate individual sub-scorers
  const matResult = calculateMaterialScore(supplyListing, demandReq);
  const qtyResult = calculateQuantityScore(supplyListing, demandReq);
  const proxResult = calculateProximityScore(distanceKm, demandReq);
  const esgResult = calculateEsgScore(orgSupplier, orgReceiver);

  const allReasons = [
    ...matResult.reasons,
    ...qtyResult.reasons,
    ...proxResult.reasons
  ];

  let netScore = 0.0;
  let eligible = true;

  // Hard zero threshold: if S_mat < 0.50, candidate is deemed fundamentally incompatible
  if (matResult.score < 0.50) {
    netScore = 0.0;
    eligible = false;
    allReasons.push(`Hard incompatibility: Material compatibility score (${matResult.score.toFixed(3)}) is below 0.50 threshold`);
  } else {
    netScore = (normWeights.material * matResult.score) +
               (normWeights.quantity * qtyResult.score) +
               (normWeights.proximity * proxResult.score) +
               (normWeights.esg * esgResult.score);

    netScore = Math.max(0.0, Math.min(1.0, netScore));
    eligible = netScore > 0.0;
  }

  const roundedNet = Number(netScore.toFixed(4));
  const roundedMat = Number(matResult.score.toFixed(4));
  const roundedQty = Number(qtyResult.score.toFixed(4));
  const roundedProx = Number(proxResult.score.toFixed(4));
  const roundedEsg = Number(esgResult.score.toFixed(4));

  return {
    netScore: roundedNet,
    eligible,
    breakdown: {
      materialScore: roundedMat,
      quantityScore: roundedQty,
      distanceScore: roundedProx,
      proximityScore: roundedProx,
      esgScore: roundedEsg
    },
    reasons: allReasons
  };
}

/**
 * Multi-Criteria Candidate Ranker
 *
 * @param {object} demandReq Single demand requirement
 * @param {Array<object>} supplyListings Array of byproduct listings
 * @param {object|Map} facilitiesMap Facility lookup dictionary or Map
 * @param {object|Map} organizationsMap Organization lookup dictionary or Map
 * @param {object} [options] Ranking and filtering options
 * @returns {Array<object>} Ranked candidate matches sorted descending by netScore
 */
export function rankCandidates(demandReq, supplyListings, facilitiesMap = {}, organizationsMap = {}, options = {}) {
  if (!demandReq || !Array.isArray(supplyListings)) {
    return [];
  }

  const getFacility = (facilityId) => {
    if (!facilityId) return null;
    if (facilitiesMap instanceof Map) return facilitiesMap.get(facilityId);
    return facilitiesMap[facilityId] ?? null;
  };

  const getOrganization = (orgId) => {
    if (!orgId) return null;
    if (organizationsMap instanceof Map) return organizationsMap.get(orgId);
    return organizationsMap[orgId] ?? null;
  };

  // Resolve demand facility and receiver org
  const demandFacilityId = demandReq.facility_id ?? demandReq.facilityId;
  const demandFacility = demandReq.facility ?? getFacility(demandFacilityId);
  const receiverOrgId = demandFacility?.organization_id ?? demandFacility?.organizationId ?? demandReq.organization_id ?? demandReq.organizationId;
  const orgReceiver = demandReq.organization ?? getOrganization(receiverOrgId);

  const candidates = [];

  for (const listing of supplyListings) {
    const listingFacilityId = listing.facility_id ?? listing.facilityId;
    const listingFacility = listing.facility ?? getFacility(listingFacilityId);
    const supplierOrgId = listingFacility?.organization_id ?? listingFacility?.organizationId ?? listing.organization_id ?? listing.organizationId;
    const orgSupplier = listing.organization ?? getOrganization(supplierOrgId);

    // Compute distance if facilities have coordinates
    let distanceKm = 0.0;
    if (demandFacility && listingFacility &&
        typeof demandFacility.latitude === 'number' && typeof demandFacility.longitude === 'number' &&
        typeof listingFacility.latitude === 'number' && typeof listingFacility.longitude === 'number') {
      distanceKm = haversineDistance(
        demandFacility.latitude, demandFacility.longitude,
        listingFacility.latitude, listingFacility.longitude
      );
    } else if (listing.distance_km !== undefined || listing.distanceKm !== undefined) {
      distanceKm = Number(listing.distance_km ?? listing.distanceKm ?? 0.0);
    }

    const matchResult = calculateMatchScore(
      listing,
      demandReq,
      distanceKm,
      orgSupplier,
      orgReceiver,
      options.weights
    );

    const tradeQty = Math.min(
      Number(listing.available_quantity ?? listing.availableQuantity ?? 0.0),
      Number(demandReq.required_quantity ?? demandReq.requiredQuantity ?? 0.0)
    );
    const hazardTier = listing.hazard_tier ?? listing.hazardTier ?? 'NON_HAZARDOUS';
    const logistics = calculateLogistics(distanceKm, tradeQty, hazardTier);

    candidates.push({
      listing,
      distanceKm,
      netScore: matchResult.netScore,
      eligible: matchResult.eligible,
      breakdown: matchResult.breakdown,
      logistics,
      reasons: matchResult.reasons
    });
  }

  // Sort candidates descending by netScore; secondary sort ascending by distanceKm
  candidates.sort((a, b) => {
    if (b.netScore !== a.netScore) {
      return b.netScore - a.netScore;
    }
    return a.distanceKm - b.distanceKm;
  });

  let result = candidates;
  if (options.onlyEligible) {
    result = result.filter(c => c.eligible);
  }
  if (typeof options.limit === 'number' && options.limit > 0) {
    result = result.slice(0, options.limit);
  }

  return result;
}
