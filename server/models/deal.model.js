const mongoose = require('mongoose');
const crypto = require('crypto');
const { calculateDealImpact } = require('../utils/esgFormulas');

const dealTimelineSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  actor: {
    type: String,
    default: 'System'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { _id: true });

const dealSchema = new mongoose.Schema({
  dealCode: {
    type: String,
    unique: true,
    index: true
  },
  sourceListing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing'
  },
  matchedListing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing'
  },
  supplierCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  buyerCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  material: {
    type: String,
    required: true
  },
  materialCategory: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0.1
  },
  unit: {
    type: String,
    default: 'Tons'
  },
  pricePerTon: {
    type: Number,
    required: true
  },
  totalValue: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['INITIATED', 'IN_NEGOTIATION', 'LOGISTICS_DISPATCHED', 'DELIVERED_VERIFIED', 'CANCELLED'],
    default: 'INITIATED',
    index: true
  },
  stageIndex: {
    type: Number,
    default: 0 // 0: INITIATED, 1: IN_NEGOTIATION, 2: LOGISTICS_DISPATCHED, 3: DELIVERED_VERIFIED
  },
  logistics: {
    distanceKm: { type: Number, default: 0 },
    transportMode: { type: String, default: 'Heavy Duty Green Fleet Tipper' },
    pickupLocation: { type: String, default: '' },
    deliveryLocation: { type: String, default: '' },
    transporterName: { type: String, default: '' },
    vehicleNumber: { type: String, default: '' },
    driverName: { type: String, default: '' },
    driverPhone: { type: String, default: '' },
    gatePassNumber: { type: String, default: '' },
    consignmentManifestCode: { type: String, default: '' },
    dispatchedAt: { type: Date },
    deliveredAt: { type: Date }
  },
  verification: {
    weighbridgeSlipNumber: { type: String, default: '' },
    grossWeightTons: { type: Number, default: 0 },
    tareWeightTons: { type: Number, default: 0 },
    netVerifiedQuantity: { type: Number, default: 0 },
    weighbridgeLocation: { type: String, default: '' },
    qualityInspectionPassed: { type: Boolean, default: false },
    verifiedBy: { type: String, default: '' },
    verifiedAt: { type: Date },
    digitalCertificateHash: { type: String, default: '' }
  },
  terms: {
    paymentTerms: { type: String, default: 'Simulated Escrow Handshake - 100% on Weighbridge Verification' },
    packagingType: { type: String, default: 'Bulk Tipper Truck' },
    pickupWindowDays: { type: Number, default: 3 },
    notes: { type: String, default: '' }
  },
  impactMetrics: {
    wasteDivertedTons: { type: Number, default: 0 },
    grossCo2eAvoidedKg: { type: Number, default: 0 },
    grossCo2eAvoidedTons: { type: Number, default: 0 },
    transportCo2eKg: { type: Number, default: 0 },
    transportCo2eTons: { type: Number, default: 0 },
    netCo2AvoidedKg: { type: Number, default: 0 },
    netCo2AvoidedTons: { type: Number, default: 0 },
    waterSavedLitres: { type: Number, default: 0 },
    landfillVolumeSavedM3: { type: Number, default: 0 },
    treesEquivalent: { type: Number, default: 0 },
    economicSavingsInr: { type: Number, default: 0 },
    economicSavingsLakhs: { type: Number, default: 0 },
    virginMaterialReplaced: { type: String, default: '' }
  },
  timeline: [dealTimelineSchema]
}, {
  timestamps: true
});

// Pre-save hook to populate dealCode and calculate impact metrics
dealSchema.pre('save', function(next) {
  if (!this.dealCode) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    this.dealCode = `DL-2026-${randomSuffix}`;
  }

  // Calculate or recalculate ESG impact
  const calculated = calculateDealImpact({
    material: this.material,
    materialCategory: this.materialCategory,
    quantityTons: this.verification?.netVerifiedQuantity > 0 ? this.verification.netVerifiedQuantity : this.quantity,
    distanceKm: this.logistics?.distanceKm || 0,
    agreedPricePerTon: this.pricePerTon
  });

  this.impactMetrics = calculated;

  if (this.status === 'DELIVERED_VERIFIED' && !this.verification.digitalCertificateHash) {
    const rawStamp = `${this.dealCode}:${this.supplierCompany}:${this.buyerCompany}:${this.quantity}:${this.status}:${Date.now()}`;
    this.verification.digitalCertificateHash = crypto.createHash('sha256').update(rawStamp).digest('hex');
  }

  next();
});

module.exports = mongoose.model('Deal', dealSchema);
