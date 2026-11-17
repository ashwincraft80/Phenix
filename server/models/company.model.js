const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  industry: {
    type: String,
    required: true
  },
  registrationNumber: {
    type: String,
    default: () => `CIN-U${Math.floor(10000 + Math.random() * 90000)}JH2020PTC${Math.floor(100000 + Math.random() * 900000)}`
  },
  location: {
    address: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    }
  },
  contactPerson: {
    name: { type: String, default: 'Industrial Liaison Officer' },
    email: { type: String, default: 'operations@symbiolink.internal' },
    phone: { type: String, default: '+91 98765 43210' }
  },
  esgRating: {
    type: String,
    enum: ['AAA', 'AA', 'A+', 'A', 'B+'],
    default: 'A+'
  },
  brsrCompliant: {
    type: Boolean,
    default: true
  },
  verifiedGreenPartner: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Company', companySchema);
