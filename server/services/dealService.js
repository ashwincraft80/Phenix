const mongoose = require('mongoose');
const crypto = require('crypto');
const memoryStore = require('../config/memoryStore');
const DealModel = require('../models/deal.model');
const CompanyModel = require('../models/company.model');
const ListingModel = require('../models/listing.model');
const { calculateDealImpact } = require('../utils/esgFormulas');

const isMongooseActive = () => mongoose.connection.readyState === 1;

/**
 * Deal Service Layer
 * Abstracts database operations between MongoDB (when connected)
 * and High-Speed In-Memory Store (standalone hackathon mode).
 */
class DealService {
  /**
   * List all deals with optional filters
   */
  async getDeals({ status, companyId, materialCategory, limit = 50 }) {
    if (isMongooseActive()) {
      const filter = {};
      if (status) filter.status = status;
      if (materialCategory) filter.materialCategory = materialCategory;
      if (companyId) {
        filter.$or = [
          { supplierCompany: companyId },
          { buyerCompany: companyId }
        ];
      }
      return await DealModel.find(filter)
        .populate('supplierCompany')
        .populate('buyerCompany')
        .sort({ createdAt: -1 })
        .limit(Number(limit));
    } else {
      return memoryStore.findDeals({ status, companyId, materialCategory }).slice(0, Number(limit));
    }
  }

  /**
   * Get single deal by MongoDB _id or dealCode
   */
  async getDealById(id) {
    if (isMongooseActive()) {
      const isObjectId = mongoose.Types.ObjectId.isValid(id);
      const query = isObjectId ? { _id: id } : { dealCode: id };
      return await DealModel.findOne(query)
        .populate('supplierCompany')
        .populate('buyerCompany')
        .populate('sourceListing')
        .populate('matchedListing');
    } else {
      return memoryStore.findDealById(id);
    }
  }

  /**
   * Create a new deal from a match
   */
  async createDeal(data) {
    const quantity = Number(data.quantity) || 100;
    const pricePerTon = Number(data.pricePerTon) || 1000;
    const distanceKm = Number(data.logistics?.distanceKm) || 0;
    const totalValue = Number(data.totalValue) || (quantity * pricePerTon);

    if (isMongooseActive()) {
      const calculatedImpact = calculateDealImpact({
        material: data.material,
        materialCategory: data.materialCategory,
        quantityTons: quantity,
        distanceKm: distanceKm,
        agreedPricePerTon: pricePerTon
      });

      const newDeal = new DealModel({
        dealCode: data.dealCode || `DL-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        sourceListing: data.sourceListing || data.targetListingId,
        matchedListing: data.matchedListing || data.matchedListingId,
        supplierCompany: data.supplierCompany || data.supplierCompanyId,
        buyerCompany: data.buyerCompany || data.buyerCompanyId,
        material: data.material,
        materialCategory: data.materialCategory || 'Industrial Slag',
        quantity,
        unit: data.unit || 'Tons',
        pricePerTon,
        totalValue,
        status: 'INITIATED',
        stageIndex: 0,
        logistics: {
          distanceKm,
          transportMode: data.logistics?.transportMode || 'Heavy Duty Green Fleet Tipper',
          pickupLocation: data.logistics?.pickupLocation || '',
          deliveryLocation: data.logistics?.deliveryLocation || '',
          transporterName: data.logistics?.transporterName || 'National Industrial Logistics Network',
          vehicleNumber: data.logistics?.vehicleNumber || '',
          driverName: data.logistics?.driverName || '',
          driverPhone: data.logistics?.driverPhone || ''
        },
        terms: {
          paymentTerms: 'Simulated Escrow Handshake - 100% on Weighbridge Verification',
          packagingType: data.terms?.packagingType || 'Bulk Tipper Truck',
          pickupWindowDays: data.terms?.pickupWindowDays || 3,
          notes: data.notes || 'Initiated byproduct exchange for circular resource utilization'
        },
        impactMetrics: calculatedImpact,
        timeline: [
          {
            status: 'INITIATED',
            title: 'Synergy Match Initiated',
            description: data.notes || `Exchange agreement initialized for ${quantity} Tons of ${data.material}.`,
            timestamp: new Date(),
            actor: data.actor || 'SymbioLink Engine'
          }
        ]
      });

      const saved = await newDeal.save();
      return await this.getDealById(saved._id);
    } else {
      return memoryStore.createDeal(data);
    }
  }

  /**
   * Advance Deal State Machine:
   * INITIATED -> IN_NEGOTIATION -> LOGISTICS_DISPATCHED -> DELIVERED_VERIFIED
   */
  async advanceDealStatus(id, updateData) {
    const validStatuses = ['INITIATED', 'IN_NEGOTIATION', 'LOGISTICS_DISPATCHED', 'DELIVERED_VERIFIED', 'CANCELLED'];
    const { status, notes, actor, vehicleNumber, transporterName, driverName, driverPhone, verifiedTonnage, weighbridgeSlipNumber, tareWeightTons } = updateData;

    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid deal status '${status}'. Must be one of: ${validStatuses.join(', ')}`);
    }

    if (isMongooseActive()) {
      const deal = await this.getDealById(id);
      if (!deal) return null;

      const STAGES = {
        'INITIATED': 0,
        'IN_NEGOTIATION': 1,
        'LOGISTICS_DISPATCHED': 2,
        'DELIVERED_VERIFIED': 3,
        'CANCELLED': -1
      };

      deal.status = status;
      deal.stageIndex = STAGES[status];

      const now = new Date();

      if (status === 'IN_NEGOTIATION') {
        if (updateData.pricePerTon) deal.pricePerTon = Number(updateData.pricePerTon);
        if (updateData.quantity) deal.quantity = Number(updateData.quantity);
        deal.totalValue = deal.pricePerTon * deal.quantity;

        deal.timeline.push({
          status: 'IN_NEGOTIATION',
          title: updateData.title || 'Terms Negotiated & Commercial Lock',
          description: notes || 'Commercial pricing, delivery timeframe and transport responsibility agreed.',
          timestamp: now,
          actor: actor || 'Trading Partner'
        });
      } else if (status === 'LOGISTICS_DISPATCHED') {
        const codeSuffix = Math.floor(1000 + Math.random() * 9000);
        deal.logistics.gatePassNumber = updateData.gatePassNumber || deal.logistics.gatePassNumber || `GP-${deal.dealCode.replace('DL-', '')}-${codeSuffix}`;
        deal.logistics.consignmentManifestCode = updateData.consignmentManifestCode || deal.logistics.consignmentManifestCode || `MNF-SYM-${codeSuffix}`;
        deal.logistics.vehicleNumber = vehicleNumber || deal.logistics.vehicleNumber || 'JH-05-CD-4421';
        deal.logistics.transporterName = transporterName || deal.logistics.transporterName || 'Viksit Green Freight Logistics';
        deal.logistics.driverName = driverName || deal.logistics.driverName || 'Rameshwar Singh';
        deal.logistics.driverPhone = driverPhone || deal.logistics.driverPhone || '+91 94312 44510';
        deal.logistics.dispatchedAt = now;

        deal.timeline.push({
          status: 'LOGISTICS_DISPATCHED',
          title: updateData.title || `Gate Pass ${deal.logistics.gatePassNumber} Cleared & In-Transit`,
          description: notes || `Dispatched via vehicle ${deal.logistics.vehicleNumber}. Digital chain-of-custody manifest active.`,
          timestamp: now,
          actor: actor || 'Supplier Dispatch Gate'
        });
      } else if (status === 'DELIVERED_VERIFIED') {
        const verifiedTons = Number(verifiedTonnage || updateData.quantity || deal.quantity);
        const tare = Number(tareWeightTons) || 35;
        const gross = verifiedTons + tare;
        const slipNum = weighbridgeSlipNumber || `WB-${Math.floor(1000 + Math.random() * 9000)}`;

        const rawPayload = `${deal.dealCode}:${deal.supplierCompany}:${deal.buyerCompany}:${verifiedTons}:${now.toISOString()}`;
        const certHash = crypto.createHash('sha256').update(rawPayload).digest('hex');

        deal.logistics.deliveredAt = now;
        deal.verification = {
          weighbridgeSlipNumber: slipNum,
          grossWeightTons: gross,
          tareWeightTons: tare,
          netVerifiedQuantity: verifiedTons,
          weighbridgeLocation: updateData.weighbridgeLocation || 'Inbound Automated Weighbridge Scale #1',
          qualityInspectionPassed: true,
          verifiedBy: updateData.verifiedBy || 'Certified Green Inspector (BRSR Core Auditor)',
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
          title: updateData.title || `Weighbridge Slip ${slipNum} Verified & ESG Hash Sealed`,
          description: notes || `Delivery verified (${verifiedTons} Tons net). Simulated escrow released to supplier. ESG Certificate unlocked.`,
          timestamp: now,
          actor: actor || 'Buyer Receiving QA & Weighbridge'
        });
      } else if (status === 'CANCELLED') {
        deal.timeline.push({
          status: 'CANCELLED',
          title: 'Deal Cancelled',
          description: notes || 'Deal was cancelled by mutual consent.',
          timestamp: now,
          actor: actor || 'System'
        });
      }

      await deal.save();
      return await this.getDealById(deal._id);
    } else {
      return memoryStore.updateDealStatus(id, updateData);
    }
  }

  /**
   * Escrow handshake simulation
   */
  async simulateEscrowHandshake(id, { escrowAmount, depositReference, notes }) {
    const deal = await this.getDealById(id);
    if (!deal) return null;

    const escrowData = {
      status: 'ESCROW_LOCKED',
      amountInr: escrowAmount || deal.totalValue,
      depositReference: depositReference || `ESCROW-SYM-${Math.floor(100000 + Math.random() * 900000)}`,
      releasedOnVerification: true,
      timestamp: new Date()
    };

    const updatePayload = {
      status: deal.status === 'INITIATED' ? 'IN_NEGOTIATION' : deal.status,
      title: 'Simulated Escrow Locked (100% Protection)',
      notes: notes || `₹${(escrowData.amountInr).toLocaleString('en-IN')} locked in simulated escrow. Funds held pending weighbridge confirmation.`,
      actor: 'SymbioLink Smart Escrow Engine',
      metadata: escrowData
    };

    return await this.advanceDealStatus(id, updatePayload);
  }
}

module.exports = new DealService();
