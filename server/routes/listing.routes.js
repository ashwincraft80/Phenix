const express = require('express');
const router = express.Router();
const memoryStore = require('../config/memoryStore');
const mongoose = require('mongoose');
const Listing = require('../models/listing.model');

router.get('/', async (req, res) => {
  try {
    const { type, category, companyId } = req.query;

    if (mongoose.connection.readyState === 1) {
      const filter = {};
      if (type) filter.type = type.toUpperCase();
      if (category) filter.category = category;
      if (companyId) filter.company = companyId;

      const listings = await Listing.find(filter).populate('company').sort({ createdAt: -1 });
      return res.json({ success: true, count: listings.length, listings });
    }

    let listings = memoryStore.findListings(type ? { type: type.toUpperCase() } : {});
    if (category) listings = listings.filter(l => l.category === category);
    if (companyId) listings = listings.filter(l => (l.company?._id || l.company) === companyId);

    const populated = listings.map(l => memoryStore.findListingById(l._id));
    return res.json({ success: true, count: populated.length, listings: populated });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const listing = await Listing.findById(req.params.id).populate('company');
      if (!listing) return res.status(404).json({ success: false, error: 'Listing not found' });
      return res.json({ success: true, listing });
    }

    const listing = memoryStore.findListingById(req.params.id);
    if (!listing) return res.status(404).json({ success: false, error: 'Listing not found' });
    return res.json({ success: true, listing });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
