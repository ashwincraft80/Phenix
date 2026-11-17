/**
 * Deal State Machine & Lifecycle Service
 * Phenix / Project ReguFlow - Member 2 Backend Logistics & Verification
 */

import { createHash } from 'node:crypto';
import { calculateDealImpact } from './esgFormulas.js';

export const DEAL_STATUSES = Object.freeze([
  'INITIATED',
  'IN_NEGOTIATION',
  'LOGISTICS_DISPATCHED',
  'DELIVERED_VERIFIED',
  'CANCELLED'
]);

export const DEAL_STAGES = Object.freeze({
  INITIATED: 0,
  IN_NEGOTIATION: 1,
  LOGISTICS_DISPATCHED: 2,
  DELIVERED_VERIFIED: 3,
  CANCELLED: -1
});

export class DealService {
  constructor(initialDeals = []) {
    this.deals = JSON.parse(JSON.stringify(initialDeals));
  }

  getDeals({ status, materialCategory, companyId } = {}) {
    let result = this.deals.slice();
    if (status) {
      result = result.filter(d => d.status === status);
    }
    if (materialCategory) {
      result = result.filter(d => d.materialCategory === materialCategory);
    }
    if (companyId) {
      result = result.filter(d =>
        d.supplierCompany === companyId ||
        d.buyerCompany === companyId ||
        d.supplierCompany?._id === companyId ||
        d.buyerCompany?._id === companyId
      );
    }
    return result;
  }

  getDealById(id) {
    return this.deals.find(d => d._id === id || d.dealCode === id) || null;
  }

  createDeal(data) {
    const quantity = Number(data.quantity) || 100;
    const pricePerTon = Number(data.pricePerTon) || 1000;
    const distanceKm = Number(data.logistics?.distanceKm) || 0;
    const dealCode = data.dealCode || `DL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();

    const impact = calculateDealImpact({
      material: data.material,
      materialCategory: data.materialCategory,
      quantityTons: quantity,
      distanceKm: distanceKm,
      agreedPricePerTon: pricePerTon
    });

    const newDeal = {
      _id: data._id || `deal_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      dealCode,
      sourceListing: data.sourceListing || data.targetListingId || null,
      matchedListing: data.matchedListing || data.matchedListingId || null,
      supplierCompany: data.supplierCompany || data.supplierCompanyId || 'comp_tata_steel',
      buyerCompany: data.buyerCompany || data.buyerCompanyId || 'comp_prism_cement',
      material: data.material || 'Industrial Byproduct',
      materialCategory: data.materialCategory || 'Industrial Slag',
      quantity,
      unit: data.unit || 'Tons',
      pricePerTon,
      totalValue: Number(data.totalValue) || (quantity * pricePerTon),
      status: 'INITIATED',
      stageIndex: DEAL_STAGES.INITIATED,
      logistics: {
        distanceKm,
        transportMode: data.logistics?.transportMode || 'Heavy Duty Green Fleet Tipper',
        pickupLocation: data.logistics?.pickupLocation || '',
        deliveryLocation: data.logistics?.deliveryLocation || '',
        transporterName: data.logistics?.transporterName || 'National Industrial Logistics Network',
        vehicleNumber: data.logistics?.vehicleNumber || '',
        driverName: data.logistics?.driverName || '',
        driverPhone: data.logistics?.driverPhone || '',
        gatePassNumber: '',
        consignmentManifestCode: '',
        dispatchedAt: null,
        deliveredAt: null,
        ...(data.logistics || {})
      },
      verification: {
        weighbridgeSlipNumber: '',
        grossWeightTons: 0,
        tareWeightTons: 0,
        netVerifiedQuantity: 0,
        weighbridgeLocation: '',
        qualityInspectionPassed: false,
        verifiedBy: '',
        verifiedAt: null,
        digitalCertificateHash: '',
        ...(data.verification || {})
      },
      terms: {
        paymentTerms: 'Simulated Escrow Handshake - 100% on Weighbridge Verification',
        packagingType: 'Bulk Tipper Truck',
        pickupWindowDays: 3,
        notes: data.notes || '',
        ...(data.terms || {})
      },
      impactMetrics: impact,
      timeline: [
        {
          status: 'INITIATED',
          title: 'Deal Initiated & Escrow Reserved',
          description: data.notes || `Exchange agreement initialized for ${quantity} Tons of ${data.material}.`,
          timestamp: now,
          actor: data.actor || 'SymbioLink Engine'
        }
      ],
      createdAt: now,
      updatedAt: now
    };

    this.deals.unshift(newDeal);
    return newDeal;
  }

  advanceDealStatus(id, updatePayload) {
    const deal = this.getDealById(id);
    if (!deal) return null;

    const newStatus = updatePayload.status;
    if (!DEAL_STATUSES.includes(newStatus)) {
      throw new Error(`Invalid deal status '${newStatus}'. Must be one of: ${DEAL_STATUSES.join(', ')}`);
    }

    const now = new Date();
    deal.status = newStatus;
    deal.stageIndex = DEAL_STAGES[newStatus];
    deal.updatedAt = now;

    if (newStatus === 'IN_NEGOTIATION') {
      if (updatePayload.pricePerTon) deal.pricePerTon = Number(updatePayload.pricePerTon);
      if (updatePayload.quantity) deal.quantity = Number(updatePayload.quantity);
      deal.totalValue = deal.pricePerTon * deal.quantity;

      deal.timeline.push({
        status: 'IN_NEGOTIATION',
        title: updatePayload.title || 'Terms Negotiated & Commercial Lock',
        description: updatePayload.notes || 'Commercial pricing, delivery timeframe and transport responsibility agreed.',
        timestamp: now,
        actor: updatePayload.actor || 'Trading Partner'
      });
    } else if (newStatus === 'LOGISTICS_DISPATCHED') {
      const codeSuffix = Math.floor(1000 + Math.random() * 9000);
      deal.logistics.gatePassNumber = updatePayload.gatePassNumber || deal.logistics.gatePassNumber || `GP-${deal.dealCode.replace('DL-', '')}-${codeSuffix}`;
      deal.logistics.consignmentManifestCode = updatePayload.consignmentManifestCode || deal.logistics.consignmentManifestCode || `MNF-SYM-${codeSuffix}`;
      deal.logistics.vehicleNumber = updatePayload.vehicleNumber || deal.logistics.vehicleNumber || 'JH-05-CD-4421';
      deal.logistics.transporterName = updatePayload.transporterName || deal.logistics.transporterName || 'Viksit Green Freight Logistics';
      deal.logistics.driverName = updatePayload.driverName || deal.logistics.driverName || 'Rameshwar Singh';
      deal.logistics.driverPhone = updatePayload.driverPhone || deal.logistics.driverPhone || '+91 94312 44510';
      deal.logistics.dispatchedAt = now;

      deal.timeline.push({
        status: 'LOGISTICS_DISPATCHED',
        title: updatePayload.title || `Gate Pass ${deal.logistics.gatePassNumber} Cleared & In-Transit`,
        description: updatePayload.notes || `Dispatched via vehicle ${deal.logistics.vehicleNumber}. Digital chain-of-custody manifest active.`,
        timestamp: now,
        actor: updatePayload.actor || 'Supplier Dispatch Gate'
      });
    } else if (newStatus === 'DELIVERED_VERIFIED') {
      const verifiedTons = Number(updatePayload.verifiedTonnage || updatePayload.quantity || deal.quantity);
      const tare = Number(updatePayload.tareWeightTons) || 35;
      const gross = verifiedTons + tare;
      const slipNum = updatePayload.weighbridgeSlipNumber || `WB-CHAIBASA-${Math.floor(1000 + Math.random() * 9000)}`;

      const rawPayload = `${deal.dealCode}:${deal.supplierCompany}:${deal.buyerCompany}:${verifiedTons}:${now.toISOString()}`;
      const certHash = createHash('sha256').update(rawPayload).digest('hex');

      deal.logistics.deliveredAt = now;
      deal.verification = {
        weighbridgeSlipNumber: slipNum,
        grossWeightTons: gross,
        tareWeightTons: tare,
        netVerifiedQuantity: verifiedTons,
        weighbridgeLocation: updatePayload.weighbridgeLocation || 'Inbound Automated Weighbridge Scale #1',
        qualityInspectionPassed: true,
        verifiedBy: updatePayload.verifiedBy || 'Certified Green Inspector (BRSR Core Auditor)',
        verifiedAt: now,
        digitalCertificateHash: certHash
      };

      deal.impactMetrics = calculateDealImpact({
        material: deal.material,
        materialCategory: deal.materialCategory,
        quantityTons: verifiedTons,
        distanceKm: deal.logistics?.distanceKm || 0,
        agreedPricePerTon: deal.pricePerTon
      });

      deal.timeline.push({
        status: 'DELIVERED_VERIFIED',
        title: updatePayload.title || `Weighbridge Slip ${slipNum} Verified & ESG Hash Sealed`,
        description: updatePayload.notes || `Delivery verified (${verifiedTons} Tons net). Simulated escrow released to supplier. ESG Certificate unlocked.`,
        timestamp: now,
        actor: updatePayload.actor || 'Buyer Receiving QA & Weighbridge'
      });
    } else if (newStatus === 'CANCELLED') {
      deal.timeline.push({
        status: 'CANCELLED',
        title: updatePayload.title || 'Deal Cancelled',
        description: updatePayload.notes || 'Deal was cancelled by mutual consent.',
        timestamp: now,
        actor: updatePayload.actor || 'System'
      });
    }

    return deal;
  }

  simulateEscrowHandshake(id, { escrowAmount, depositReference, notes } = {}) {
    const deal = this.getDealById(id);
    if (!deal) return null;

    const escrowData = {
      status: 'ESCROW_LOCKED',
      amountInr: escrowAmount || deal.totalValue,
      depositReference: depositReference || `ESCROW-SYM-${Math.floor(100000 + Math.random() * 900000)}`,
      releasedOnVerification: true,
      timestamp: new Date()
    };

    return this.advanceDealStatus(id, {
      status: deal.status === 'INITIATED' ? 'IN_NEGOTIATION' : deal.status,
      title: 'Simulated Escrow Locked (100% Protection)',
      notes: notes || `₹${escrowData.amountInr.toLocaleString('en-IN')} locked in simulated escrow. Funds held pending weighbridge confirmation.`,
      actor: 'SymbioLink Smart Escrow Engine',
      metadata: escrowData
    });
  }
}
