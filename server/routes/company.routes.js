const express = require('express');
const router = express.Router();
const memoryStore = require('../config/memoryStore');
const mongoose = require('mongoose');
const Company = require('../models/company.model');

router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const companies = await Company.find();
      return res.json({ success: true, count: companies.length, companies });
    }
    const companies = memoryStore.findCompanies();
    return res.json({ success: true, count: companies.length, companies });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const company = await Company.findById(req.params.id);
      if (!company) return res.status(404).json({ success: false, error: 'Company not found' });
      return res.json({ success: true, company });
    }
    const company = memoryStore.findCompanyById(req.params.id);
    if (!company) return res.status(404).json({ success: false, error: 'Company not found' });
    return res.json({ success: true, company });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
