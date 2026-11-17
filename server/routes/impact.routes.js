const express = require('express');
const router = express.Router();
const impactService = require('../services/impactService');
const { calculateDealImpact, ESG_BENCHMARKS } = require('../utils/esgFormulas');

/**
 * @route   GET /api/impact/aggregate
 * @desc    Aggregate ESG and Circular Economy impact metrics
 *          Exact contract for Member 2 & Member 4 Frontend Dashboard
 */
router.get('/aggregate', async (req, res) => {
  try {
    const { companyId } = req.query;
    const impactData = await impactService.getAggregateImpact({ companyId });
    return res.status(200).json(impactData);
  } catch (error) {
    console.error('Error fetching aggregate impact:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate aggregate impact'
    });
  }
});

/**
 * @route   GET /api/impact/certificate/:dealId
 * @desc    Generate verifiable SEBI BRSR Green Transfer Compliance Certificate
 *          Includes SHA-256 cryptographic stamp, weighbridge audit & Scope 3 ledger
 */
router.get('/certificate/:dealId', async (req, res) => {
  try {
    const certificate = await impactService.generateEsgCertificate(req.params.dealId);
    return res.status(200).json({
      success: true,
      certificate
    });
  } catch (error) {
    console.error(`Error generating ESG certificate for deal ${req.params.dealId}:`, error);
    return res.status(404).json({
      success: false,
      error: error.message || 'Certificate generation failed'
    });
  }
});

/**
 * @route   GET /api/impact/company/:companyId
 * @desc    Company-specific ESG metrics (for company switcher / executive reporting)
 */
router.get('/company/:companyId', async (req, res) => {
  try {
    const impactData = await impactService.getAggregateImpact({ companyId: req.params.companyId });
    return res.status(200).json({
      success: true,
      companyId: req.params.companyId,
      ...impactData
    });
  } catch (error) {
    console.error(`Error fetching company impact ${req.params.companyId}:`, error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch company impact'
    });
  }
});

/**
 * @route   POST /api/impact/calculate-preview
 * @desc    Simulate/preview live ESG savings for a potential match before initiating a deal
 */
router.post('/calculate-preview', (req, res) => {
  try {
    const { material, materialCategory, quantityTons, distanceKm, agreedPricePerTon } = req.body;

    if (!quantityTons || quantityTons <= 0) {
      return res.status(400).json({
        success: false,
        error: 'quantityTons must be a positive number'
      });
    }

    const preview = calculateDealImpact({
      material,
      materialCategory,
      quantityTons: Number(quantityTons),
      distanceKm: Number(distanceKm) || 0,
      agreedPricePerTon: agreedPricePerTon ? Number(agreedPricePerTon) : null
    });

    return res.status(200).json({
      success: true,
      preview
    });
  } catch (error) {
    console.error('Error calculating ESG preview:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to preview calculation'
    });
  }
});

/**
 * @route   GET /api/impact/benchmark-factors
 * @desc    Expose benchmark emission and economic replacement factors
 */
router.get('/benchmark-factors', (req, res) => {
  return res.status(200).json({
    success: true,
    benchmarkEmissionFactors: ESG_BENCHMARKS
  });
});

module.exports = router;
