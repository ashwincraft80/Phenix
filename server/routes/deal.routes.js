const express = require('express');
const router = express.Router();
const dealService = require('../services/dealService');

/**
 * @route   GET /api/deals
 * @desc    Fetch all B2B resource exchange deals with optional filtering
 * @query   status, companyId, materialCategory, limit
 */
router.get('/', async (req, res) => {
  try {
    const { status, companyId, materialCategory, limit } = req.query;
    const deals = await dealService.getDeals({ status, companyId, materialCategory, limit });
    return res.status(200).json({
      success: true,
      count: deals.length,
      deals
    });
  } catch (error) {
    console.error('Error fetching deals:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch deals'
    });
  }
});

/**
 * @route   GET /api/deals/:id
 * @desc    Fetch a single deal by MongoDB _id or dealCode
 */
router.get('/:id', async (req, res) => {
  try {
    const deal = await dealService.getDealById(req.params.id);
    if (!deal) {
      return res.status(404).json({
        success: false,
        error: `Deal with ID/Code '${req.params.id}' not found`
      });
    }
    return res.status(200).json({
      success: true,
      deal
    });
  } catch (error) {
    console.error(`Error fetching deal ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch deal details'
    });
  }
});

/**
 * @route   POST /api/deals
 * @desc    Create a new B2B exchange deal from a matched synergy
 */
router.post('/', async (req, res) => {
  try {
    const {
      targetListingId,
      matchedListingId,
      supplierCompanyId,
      supplierCompany,
      buyerCompanyId,
      buyerCompany,
      material,
      materialCategory,
      quantity,
      unit,
      pricePerTon,
      totalValue,
      logistics,
      terms,
      notes,
      actor
    } = req.body;

    if (!material) {
      return res.status(400).json({
        success: false,
        error: 'Field "material" is required to initiate a deal'
      });
    }

    const payload = {
      sourceListing: targetListingId,
      matchedListing: matchedListingId,
      supplierCompany: supplierCompanyId || supplierCompany || 'comp_tata_steel',
      buyerCompany: buyerCompanyId || buyerCompany || 'comp_prism_cement',
      material,
      materialCategory: materialCategory || 'Industrial Slag',
      quantity: Number(quantity) || 100,
      unit: unit || 'Tons',
      pricePerTon: Number(pricePerTon) || 850,
      totalValue: Number(totalValue) || ((Number(quantity) || 100) * (Number(pricePerTon) || 850)),
      logistics: logistics || {},
      terms: terms || {},
      notes: notes || 'Initiated byproduct exchange for circular resource utilization',
      actor: actor || 'SymbioLink Engine'
    };

    const createdDeal = await dealService.createDeal(payload);
    return res.status(201).json({
      success: true,
      message: 'Deal initiated successfully',
      deal: createdDeal
    });
  } catch (error) {
    console.error('Error creating deal:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create deal'
    });
  }
});

/**
 * @route   PATCH /api/deals/:id/status
 * @desc    Advance deal stage in state machine:
 *          INITIATED -> IN_NEGOTIATION -> LOGISTICS_DISPATCHED -> DELIVERED_VERIFIED
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      notes,
      actor,
      title,
      vehicleNumber,
      transporterName,
      driverName,
      driverPhone,
      gatePassNumber,
      consignmentManifestCode,
      verifiedTonnage,
      tareWeightTons,
      weighbridgeSlipNumber,
      weighbridgeLocation,
      verifiedBy,
      pricePerTon,
      quantity
    } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: "status"'
      });
    }

    const updatedDeal = await dealService.advanceDealStatus(id, {
      status,
      notes,
      actor,
      title,
      vehicleNumber,
      transporterName,
      driverName,
      driverPhone,
      gatePassNumber,
      consignmentManifestCode,
      verifiedTonnage,
      tareWeightTons,
      weighbridgeSlipNumber,
      weighbridgeLocation,
      verifiedBy,
      pricePerTon,
      quantity
    });

    if (!updatedDeal) {
      return res.status(404).json({
        success: false,
        error: `Deal '${id}' not found`
      });
    }

    return res.status(200).json({
      success: true,
      message: `Deal status updated to ${status}`,
      deal: updatedDeal
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to update deal status'
    });
  }
});

/**
 * @route   PATCH /api/deals/:id/terms
 * @desc    Update negotiated commercial terms (price, quantity, packaging)
 */
router.patch('/:id/terms', async (req, res) => {
  try {
    const { id } = req.params;
    const { pricePerTon, quantity, packagingType, notes, actor } = req.body;

    const updatedDeal = await dealService.advanceDealStatus(id, {
      status: 'IN_NEGOTIATION',
      pricePerTon,
      quantity,
      notes: notes || `Terms updated: Agreed ₹${pricePerTon}/ton for ${quantity} tons.`,
      actor: actor || 'Trading Counterparty',
      title: 'Counter-Offer / Commercial Terms Updated'
    });

    if (!updatedDeal) {
      return res.status(404).json({
        success: false,
        error: `Deal '${id}' not found`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Commercial terms updated',
      deal: updatedDeal
    });
  } catch (error) {
    console.error(`Error updating deal terms ${req.params.id}:`, error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to update terms'
    });
  }
});

/**
 * @route   POST /api/deals/:id/simulate-escrow
 * @desc    Simulate Escrow Handshake modal action (100% funds locked pending weighbridge)
 */
router.post('/:id/simulate-escrow', async (req, res) => {
  try {
    const { id } = req.params;
    const { escrowAmount, depositReference, notes } = req.body;

    const updatedDeal = await dealService.simulateEscrowHandshake(id, {
      escrowAmount,
      depositReference,
      notes
    });

    if (!updatedDeal) {
      return res.status(404).json({
        success: false,
        error: `Deal '${id}' not found`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Escrow Handshake completed successfully',
      escrowStatus: 'LOCKED',
      deal: updatedDeal
    });
  } catch (error) {
    console.error(`Error simulating escrow for deal ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to simulate escrow'
    });
  }
});

module.exports = router;
