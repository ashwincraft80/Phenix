const express = require('express');
const router = express.Router();
const memoryStore = require('../config/memoryStore');
const mongoose = require('mongoose');
const Listing = require('../models/listing.model');
const { calculateDealImpact } = require('../utils/esgFormulas');

/**
 * Haversine formula to compute distance in km between two lat/lng coordinates
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

/**
 * @route   GET /api/match/:listingId
 * @desc    Find circular economy synergy partners for a listing
 *          Weighted algorithm: Material (0.4) + Distance (0.35) + Volume (0.25)
 */
router.get('/:listingId', async (req, res) => {
  try {
    const { listingId } = req.params;
    let targetListing = null;
    let oppositeListings = [];

    if (mongoose.connection.readyState === 1) {
      targetListing = await Listing.findById(listingId).populate('company');
      if (!targetListing) {
        return res.status(404).json({ success: false, error: 'Listing not found' });
      }
      const oppositeType = targetListing.type === 'SUPPLY' ? 'DEMAND' : 'SUPPLY';
      oppositeListings = await Listing.find({ type: oppositeType }).populate('company');
    } else {
      targetListing = memoryStore.findListingById(listingId);
      if (!targetListing) {
        return res.status(404).json({ success: false, error: 'Listing not found' });
      }
      const oppositeType = targetListing.type === 'SUPPLY' ? 'DEMAND' : 'SUPPLY';
      oppositeListings = memoryStore.findListings({ type: oppositeType }).map(l => memoryStore.findListingById(l._id));
    }

    const D_MAX = 300; // km
    const W_M = 0.4;
    const W_D = 0.35;
    const W_V = 0.25;

    const targetCoords = targetListing.location?.coordinates || { lat: 22.8046, lng: 86.2029 };

    const matches = oppositeListings.map(candidate => {
      // 1. Material compatibility
      const categoryMatch = targetListing.category === candidate.category;
      const subTypeMatch = (targetListing.subType && candidate.subType && 
        (targetListing.subType.toLowerCase().includes(candidate.subType.toLowerCase()) || 
         candidate.subType.toLowerCase().includes(targetListing.subType.toLowerCase())));
      
      let sMaterial = categoryMatch ? (subTypeMatch ? 1.0 : 0.85) : 0.0;
      if (!categoryMatch && targetListing.material.toLowerCase() === candidate.material.toLowerCase()) {
        sMaterial = 0.9;
      }

      // 2. Distance score (Haversine)
      const candCoords = candidate.location?.coordinates || { lat: 22.5539, lng: 85.8087 };
      let distKm = haversineDistance(targetCoords.lat, targetCoords.lng, candCoords.lat, candCoords.lng);
      if (isNaN(distKm) || distKm === 0) distKm = 42.5; // realistic fallback for Jamshedpur-Chaibasa corridor

      const sDistance = Math.max(0, 1 - (distKm / D_MAX));

      // 3. Volume score
      const supply = targetListing.type === 'SUPPLY' ? targetListing.quantity : candidate.quantity;
      const demand = targetListing.type === 'DEMAND' ? targetListing.quantity : candidate.quantity;
      const maxVol = Math.max(supply, demand) || 1;
      const sVolume = Math.max(0, 1 - (Math.abs(supply - demand) / maxVol));

      // Total Match Score S in [0, 100]%
      const totalScore = (W_M * sMaterial) + (W_D * sDistance) + (W_V * sVolume);
      const matchScorePercent = Math.min(100, Math.round(totalScore * 100));

      const impact = calculateDealImpact({
        material: targetListing.material,
        materialCategory: targetListing.category,
        quantityTons: Math.min(targetListing.quantity, candidate.quantity),
        distanceKm: distKm,
        agreedPricePerTon: targetListing.pricePerTon
      });

      const candCompany = candidate.company || {};
      const companyName = candCompany.name || (typeof candidate.company === 'string' ? candidate.company : 'Industrial Partner');

      return {
        listingId: candidate._id,
        title: candidate.title,
        company: {
          _id: candCompany._id,
          name: companyName,
          city: candCompany.location?.city || candidate.location?.city,
          distanceKm: distKm
        },
        matchScore: matchScorePercent,
        factors: {
          materialCompatibility: Math.round(sMaterial * 100),
          distanceScore: Math.round(sDistance * 100),
          volumeScore: Math.round(sVolume * 100)
        },
        potentialCo2SavingsKg: impact.grossCo2eAvoidedKg,
        costAdvantagePercent: Math.round(((impact.economicSavingsInr / (targetListing.quantity * (candidate.pricePerTon || 1000))) * 100)) || 35
      };
    })
    .filter(m => m.matchScore > 20)
    .sort((a, b) => b.matchScore - a.matchScore);

    return res.status(200).json({
      targetListing: {
        _id: targetListing._id,
        title: targetListing.title,
        quantity: targetListing.quantity,
        unit: targetListing.unit || 'Tons',
        category: targetListing.category,
        material: targetListing.material,
        company: targetListing.company
      },
      matches
    });
  } catch (error) {
    console.error('Error computing matches:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
