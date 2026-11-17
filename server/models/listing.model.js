const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['SUPPLY', 'DEMAND'],
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  material: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: [
      'Industrial Slag',
      'Fly Ash',
      'Ferrous Scrap',
      'Polymers/Scrap',
      'Chemical Byproduct',
      'Biomass / Agro Residue',
      'Foundry & Mineral Waste',
      'Other'
    ],
    required: true
  },
  subType: {
    type: String,
    default: ''
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    default: 'Tons'
  },
  frequency: {
    type: String,
    enum: ['ONE_TIME', 'WEEKLY', 'MONTHLY', 'CONTINUOUS'],
    default: 'MONTHLY'
  },
  pricePerTon: {
    type: Number,
    required: true
  },
  purityPercentage: {
    type: Number,
    default: 95,
    min: 0,
    max: 100
  },
  moisturePercentage: {
    type: Number,
    default: 2,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'MATCHED', 'EXCHANGED', 'RESERVED', 'CLOSED'],
    default: 'AVAILABLE'
  },
  location: {
    city: String,
    state: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  description: {
    type: String,
    default: ''
  },
  certifications: [{
    type: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Listing', listingSchema);
