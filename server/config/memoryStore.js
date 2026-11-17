const crypto = require('crypto');
const { calculateDealImpact } = require('../utils/esgFormulas');

// Initial Companies (10 Realistic Indian Industrial Conglomerates)
const initialCompanies = [
  {
    _id: 'comp_tata_steel',
    name: 'Tata Steel Jamshedpur Works',
    industry: 'Steel Manufacturing',
    registrationNumber: 'CIN-L27100MH1907PLC000260',
    location: {
      address: 'P.O. Bistupur, Jamshedpur',
      city: 'Jamshedpur',
      state: 'Jharkhand',
      coordinates: { lat: 22.8046, lng: 86.2029 }
    },
    contactPerson: {
      name: 'Dr. Rajesh Verma',
      email: 'rajesh.verma@tatasteel.com',
      phone: '+91 94311 02845'
    },
    esgRating: 'AAA',
    brsrCompliant: true,
    verifiedGreenPartner: true
  },
  {
    _id: 'comp_prism_cement',
    name: 'Prism Green Cement Ltd (Chaibasa)',
    industry: 'Cement & Building Materials',
    registrationNumber: 'CIN-L26940MH1992PLC066452',
    location: {
      address: 'Industrial Growth Centre, Chaibasa',
      city: 'Chaibasa',
      state: 'Jharkhand',
      coordinates: { lat: 22.5539, lng: 85.8087 }
    },
    contactPerson: {
      name: 'Sunita Murmu',
      email: 'procurement@prismcement.in',
      phone: '+91 98351 90214'
    },
    esgRating: 'AA',
    brsrCompliant: true,
    verifiedGreenPartner: true
  },
  {
    _id: 'comp_ntpc_power',
    name: 'NTPC Super Thermal Power (Ramagundam)',
    industry: 'Thermal Power & Energy',
    registrationNumber: 'CIN-L40101DL1975GOI007966',
    location: {
      address: 'Jyothi Nagar, Ramagundam',
      city: 'Ramagundam',
      state: 'Telangana',
      coordinates: { lat: 18.7562, lng: 79.5137 }
    },
    contactPerson: {
      name: 'Ashok Rao',
      email: 'ashok.rao@ntpc.co.in',
      phone: '+91 98490 11233'
    },
    esgRating: 'A+',
    brsrCompliant: true,
    verifiedGreenPartner: true
  },
  {
    _id: 'comp_ultratech',
    name: 'UltraTech Cement (Awarpur Works)',
    industry: 'Cement & Concrete',
    registrationNumber: 'CIN-L26940MH2000PLC128420',
    location: {
      address: 'Awarpur Cement Works, Chandrapur',
      city: 'Chandrapur',
      state: 'Maharashtra',
      coordinates: { lat: 19.8654, lng: 79.3142 }
    },
    contactPerson: {
      name: 'Vikram Joshi',
      email: 'v.joshi@adityabirla.com',
      phone: '+91 94221 55678'
    },
    esgRating: 'AAA',
    brsrCompliant: true,
    verifiedGreenPartner: true
  },
  {
    _id: 'comp_reliance_hazira',
    name: 'Reliance Petrochemicals Complex (Hazira)',
    industry: 'Polymers & Petrochemicals',
    registrationNumber: 'CIN-L17110MH1973PLC019786',
    location: {
      address: 'Hazira Manufacturing Division, Surat',
      city: 'Surat',
      state: 'Gujarat',
      coordinates: { lat: 21.1645, lng: 72.6782 }
    },
    contactPerson: {
      name: 'Ketan Patel',
      email: 'ketan.patel@ril.com',
      phone: '+91 98250 88712'
    },
    esgRating: 'AA',
    brsrCompliant: true,
    verifiedGreenPartner: true
  },
  {
    _id: 'comp_ecoplast_regrind',
    name: 'EcoPlast Circular Recyclers',
    industry: 'Recycled Polymers & Compounders',
    registrationNumber: 'CIN-U25209GJ2018PTC102938',
    location: {
      address: 'GIDC Industrial Estate, Ankleshwar',
      city: 'Ankleshwar',
      state: 'Gujarat',
      coordinates: { lat: 21.6264, lng: 73.0031 }
    },
    contactPerson: {
      name: 'Manoj Shah',
      email: 'mshah@ecoplastcircular.in',
      phone: '+91 97129 44321'
    },
    esgRating: 'A+',
    brsrCompliant: true,
    verifiedGreenPartner: true
  },
  {
    _id: 'comp_aarti_ind',
    name: 'Aarti Industries Dahej SEZ',
    industry: 'Specialty Chemicals & Intermediates',
    registrationNumber: 'CIN-L24110MH1984PLC034685',
    location: {
      address: 'Plot Z/103, Dahej SEZ-II, Bharuch',
      city: 'Bharuch',
      state: 'Gujarat',
      coordinates: { lat: 21.7051, lng: 72.5841 }
    },
    contactPerson: {
      name: 'Dr. Alok Mehta',
      email: 'alok.mehta@aarti-industries.com',
      phone: '+91 98241 33201'
    },
    esgRating: 'A+',
    brsrCompliant: true,
    verifiedGreenPartner: true
  },
  {
    _id: 'comp_dahej_solvent',
    name: 'Gujarat Clean Green Solvents Recovery',
    industry: 'Chemical Resource Reclamation',
    registrationNumber: 'CIN-U24299GJ2015PTC085112',
    location: {
      address: 'GIDC Industrial Area, Dahej',
      city: 'Dahej',
      state: 'Gujarat',
      coordinates: { lat: 21.7122, lng: 72.5934 }
    },
    contactPerson: {
      name: 'Bhavin Desai',
      email: 'bhavin@cleangreensolvents.com',
      phone: '+91 99099 87654'
    },
    esgRating: 'A',
    brsrCompliant: true,
    verifiedGreenPartner: true
  },
  {
    _id: 'comp_vedanta_alumina',
    name: 'Vedanta Alumina Refinery',
    industry: 'Aluminium Smelting & Refining',
    registrationNumber: 'CIN-L13209MH1965PLC291394',
    location: {
      address: 'Lanjigarh, Kalahandi District',
      city: 'Lanjigarh',
      state: 'Odisha',
      coordinates: { lat: 19.7125, lng: 83.3768 }
    },
    contactPerson: {
      name: 'Subrat Mohanty',
      email: 'subrat.m@vedanta.co.in',
      phone: '+91 94370 77621'
    },
    esgRating: 'A',
    brsrCompliant: true,
    verifiedGreenPartner: true
  },
  {
    _id: 'comp_dalmia_cement',
    name: 'Dalmia Bharat Green Cement Works',
    industry: 'Cement & Low-Carbon Binder',
    registrationNumber: 'CIN-L40109DL1939PLC000411',
    location: {
      address: 'Rajgangpur Works, Sundargarh',
      city: 'Rajgangpur',
      state: 'Odisha',
      coordinates: { lat: 22.1951, lng: 84.5824 }
    },
    contactPerson: {
      name: 'Pradeep Panda',
      email: 'panda.p@dalmiacement.com',
      phone: '+91 94371 66543'
    },
    esgRating: 'AAA',
    brsrCompliant: true,
    verifiedGreenPartner: true
  }
];

// Initial Listings
const initialListings = [
  {
    _id: 'L1',
    title: 'Granulated Blast Furnace Slag (Class F)',
    type: 'SUPPLY',
    company: 'comp_tata_steel',
    material: 'Blast Furnace Slag',
    category: 'Industrial Slag',
    subType: 'GGBS Precursor',
    quantity: 500,
    unit: 'Tons',
    frequency: 'CONTINUOUS',
    pricePerTon: 850,
    purityPercentage: 96,
    moisturePercentage: 1.5,
    status: 'AVAILABLE',
    location: {
      city: 'Jamshedpur',
      state: 'Jharkhand',
      coordinates: { lat: 22.8046, lng: 86.2029 }
    },
    description: 'High-amorphous glass content slag, ideal for Portland Slag Cement (PSC) clinker displacement.'
  },
  {
    _id: 'L20',
    title: 'Active Clinker Replacement Raw Material Requirement',
    type: 'DEMAND',
    company: 'comp_prism_cement',
    material: 'Blast Furnace Slag',
    category: 'Industrial Slag',
    subType: 'GGBS Precursor',
    quantity: 500,
    unit: 'Tons',
    frequency: 'MONTHLY',
    pricePerTon: 900,
    purityPercentage: 92,
    status: 'AVAILABLE',
    location: {
      city: 'Chaibasa',
      state: 'Jharkhand',
      coordinates: { lat: 22.5539, lng: 85.8087 }
    },
    description: 'Looking for 500 tonnes of granulated slag for composite green cement line. Must be within 100km radius.'
  },
  {
    _id: 'L2',
    title: 'Electrostatic Precipitator (ESP) Fly Ash Class F',
    type: 'SUPPLY',
    company: 'comp_ntpc_power',
    material: 'Fly Ash Class F',
    category: 'Fly Ash',
    quantity: 450,
    unit: 'Tons',
    frequency: 'CONTINUOUS',
    pricePerTon: 600,
    purityPercentage: 94,
    status: 'EXCHANGED',
    location: {
      city: 'Ramagundam',
      state: 'Telangana',
      coordinates: { lat: 18.7562, lng: 79.5137 }
    }
  },
  {
    _id: 'L3',
    title: 'High-Density Polyethylene Post-Industrial Regrind',
    type: 'SUPPLY',
    company: 'comp_reliance_hazira',
    material: 'Post-Industrial HDPE/PP',
    category: 'Polymers/Scrap',
    quantity: 170.5,
    unit: 'Tons',
    frequency: 'MONTHLY',
    pricePerTon: 45000,
    purityPercentage: 98,
    status: 'EXCHANGED',
    location: {
      city: 'Surat',
      state: 'Gujarat',
      coordinates: { lat: 21.1645, lng: 72.6782 }
    }
  },
  {
    _id: 'L4',
    title: 'Spent Mixed Organic Solvents (IPA & Toluene)',
    type: 'SUPPLY',
    company: 'comp_aarti_ind',
    material: 'Spent Solvent',
    category: 'Chemical Byproduct',
    quantity: 120,
    unit: 'Tons',
    frequency: 'MONTHLY',
    pricePerTon: 8500,
    purityPercentage: 88,
    status: 'MATCHED',
    location: {
      city: 'Bharuch',
      state: 'Gujarat',
      coordinates: { lat: 21.7051, lng: 72.5841 }
    }
  }
];

// Seed Deals with exact verified historical totals matching the Member 2 Contract:
// Total Waste Diverted: 1,420.5 Tons (800 + 450 + 170.5)
// Net CO2 Avoided: 1,184.2 Tons (640 + 360 + 184.2)
// Water Saved: 450,000 Litres
// Economic Savings: ₹28,40,000 (₹28.4 Lakhs)
const initialDeals = [
  {
    _id: 'deal_001_slag',
    dealCode: 'DL-2026-1042',
    sourceListing: 'L1',
    matchedListing: 'L20',
    supplierCompany: 'comp_tata_steel',
    buyerCompany: 'comp_prism_cement',
    material: 'Blast Furnace Slag',
    materialCategory: 'Industrial Slag',
    quantity: 800,
    unit: 'Tons',
    pricePerTon: 850,
    totalValue: 680000,
    status: 'DELIVERED_VERIFIED',
    stageIndex: 3,
    logistics: {
      distanceKm: 42.5,
      transportMode: 'Heavy Duty Green Fleet Tipper',
      pickupLocation: 'Tata Steel Jamshedpur Gate 4',
      deliveryLocation: 'Prism Green Cement Chaibasa Inbound Silo 2',
      transporterName: 'Viksit Green Freight Logistics',
      vehicleNumber: 'JH-05-CD-4421',
      driverName: 'Rameshwar Singh',
      driverPhone: '+91 94312 44510',
      gatePassNumber: 'GP-JAM-2026-8941',
      consignmentManifestCode: 'MNF-SYM-90812',
      dispatchedAt: new Date('2026-01-14T10:00:00Z'),
      deliveredAt: new Date('2026-01-15T16:30:00Z')
    },
    verification: {
      weighbridgeSlipNumber: 'WB-CHAIBASA-8812',
      grossWeightTons: 840,
      tareWeightTons: 40,
      netVerifiedQuantity: 800,
      weighbridgeLocation: 'Inbound Scale #1, Chaibasa',
      qualityInspectionPassed: true,
      verifiedBy: 'Inspector K. Sahu (Quality QA/QC)',
      verifiedAt: new Date('2026-01-15T17:00:00Z'),
      digitalCertificateHash: '7f9c2d1847e33a105fba894112e4c8d1976214f529bb4e9297621fec8812cde1'
    },
    terms: {
      paymentTerms: 'Simulated Escrow Handshake - 100% on Weighbridge Verification',
      packagingType: 'Bulk Tipper Truck',
      pickupWindowDays: 3,
      notes: 'Displacement of Portland Clinker in OPC/PPC production'
    },
    impactMetrics: {
      wasteDivertedTons: 800,
      grossCo2eAvoidedKg: 640000,
      grossCo2eAvoidedTons: 640,
      transportCo2eKg: 2788,
      transportCo2eTons: 2.79,
      netCo2AvoidedKg: 640000,
      netCo2AvoidedTons: 640,
      waterSavedLitres: 120000,
      landfillVolumeSavedM3: 680,
      treesEquivalent: 29398,
      economicSavingsInr: 1600000,
      economicSavingsLakhs: 16.0,
      virginMaterialReplaced: 'Portland Clinker / Limestone'
    },
    timeline: [
      {
        status: 'INITIATED',
        title: 'Synergy Match Identified & Proposed',
        description: 'Tata Steel and Prism Cement matched with 94% synergy compatibility.',
        timestamp: new Date('2026-01-12T09:00:00Z'),
        actor: 'SymbioLink Engine'
      },
      {
        status: 'IN_NEGOTIATION',
        title: 'Commercial Terms Agreed & Escrow Locked',
        description: 'Price agreed at ₹850/ton. Escrow handshake simulated.',
        timestamp: new Date('2026-01-13T14:30:00Z'),
        actor: 'Prism Green Cement'
      },
      {
        status: 'LOGISTICS_DISPATCHED',
        title: 'Gate Pass GP-JAM-2026-8941 Issued',
        description: 'Fleet assigned (JH-05-CD-4421). Digital Consignment Manifest generated.',
        timestamp: new Date('2026-01-14T10:00:00Z'),
        actor: 'Tata Steel Jamshedpur'
      },
      {
        status: 'DELIVERED_VERIFIED',
        title: 'Weighbridge Net 800T Verified & BRSR Stamp Generated',
        description: 'Weighbridge slip WB-CHAIBASA-8812 certified. 640 t CO2e abated.',
        timestamp: new Date('2026-01-15T17:00:00Z'),
        actor: 'Prism Green Cement QA'
      }
    ],
    createdAt: new Date('2026-01-12T09:00:00Z'),
    updatedAt: new Date('2026-01-15T17:00:00Z')
  },
  {
    _id: 'deal_002_flyash',
    dealCode: 'DL-2026-2189',
    sourceListing: 'L2',
    matchedListing: 'L20',
    supplierCompany: 'comp_ntpc_power',
    buyerCompany: 'comp_ultratech',
    material: 'Fly Ash Class F',
    materialCategory: 'Fly Ash',
    quantity: 450,
    unit: 'Tons',
    pricePerTon: 600,
    totalValue: 270000,
    status: 'DELIVERED_VERIFIED',
    stageIndex: 3,
    logistics: {
      distanceKm: 140,
      transportMode: 'Pneumatic Bulk Bulker Tanker',
      pickupLocation: 'NTPC Ramagundam Silo #4',
      deliveryLocation: 'UltraTech Awarpur Fly Ash Grinding Unit',
      transporterName: 'Deccan Energy Logistics',
      vehicleNumber: 'TS-02-EA-9912',
      driverName: 'Sanjay Yadav',
      driverPhone: '+91 98480 33412',
      gatePassNumber: 'GP-NTPC-2026-3021',
      consignmentManifestCode: 'MNF-SYM-44102',
      dispatchedAt: new Date('2026-02-08T08:00:00Z'),
      deliveredAt: new Date('2026-02-09T14:15:00Z')
    },
    verification: {
      weighbridgeSlipNumber: 'WB-AWARPUR-4190',
      grossWeightTons: 475,
      tareWeightTons: 25,
      netVerifiedQuantity: 450,
      weighbridgeLocation: 'Inbound Scale #3, Chandrapur',
      qualityInspectionPassed: true,
      verifiedBy: 'Senior Plant Chemist V. Deshmukh',
      verifiedAt: new Date('2026-02-09T15:00:00Z'),
      digitalCertificateHash: '8e104f7b629d8a113b2814cd1982ea5710294bc17631980ec8294711df8329a4'
    },
    terms: {
      paymentTerms: '100% on Delivery Verification',
      packagingType: 'Pneumatic Bulker',
      pickupWindowDays: 2,
      notes: 'Fly ash displacement in PPC manufacturing'
    },
    impactMetrics: {
      wasteDivertedTons: 450,
      grossCo2eAvoidedKg: 369000,
      grossCo2eAvoidedTons: 369,
      transportCo2eKg: 5166,
      transportCo2eTons: 5.17,
      netCo2AvoidedKg: 360000,
      netCo2AvoidedTons: 360,
      waterSavedLitres: 81000,
      landfillVolumeSavedM3: 427.5,
      treesEquivalent: 16536,
      economicSavingsInr: 900000,
      economicSavingsLakhs: 9.0,
      virginMaterialReplaced: 'Ordinary Portland Cement / Clay'
    },
    timeline: [
      {
        status: 'INITIATED',
        title: 'Byproduct Requisition Initiated',
        description: 'ESP Fly ash requisition matched with UltraTech Cement.',
        timestamp: new Date('2026-02-06T11:00:00Z'),
        actor: 'NTPC Commercial Cell'
      },
      {
        status: 'IN_NEGOTIATION',
        title: 'MoU & Chemical Purity Benchmarks Finalized',
        description: 'Unburned carbon < 2.5% verified.',
        timestamp: new Date('2026-02-07T16:00:00Z'),
        actor: 'UltraTech Procurement'
      },
      {
        status: 'LOGISTICS_DISPATCHED',
        title: 'Gate Pass GP-NTPC-2026-3021 Dispatched',
        description: 'Pneumatic bulker fleet TS-02-EA-9912 departed.',
        timestamp: new Date('2026-02-08T08:00:00Z'),
        actor: 'NTPC Logistics'
      },
      {
        status: 'DELIVERED_VERIFIED',
        title: 'Weighbridge Net 450T Certified',
        description: '360 t CO2 avoided, certified for SEBI BRSR Pillar 6.',
        timestamp: new Date('2026-02-09T15:00:00Z'),
        actor: 'UltraTech Quality QA'
      }
    ],
    createdAt: new Date('2026-02-06T11:00:00Z'),
    updatedAt: new Date('2026-02-09T15:00:00Z')
  },
  {
    _id: 'deal_003_polymer',
    dealCode: 'DL-2026-3394',
    sourceListing: 'L3',
    matchedListing: 'L20',
    supplierCompany: 'comp_reliance_hazira',
    buyerCompany: 'comp_ecoplast_regrind',
    material: 'Post-Industrial HDPE/PP',
    materialCategory: 'Polymers/Scrap',
    quantity: 170.5,
    unit: 'Tons',
    pricePerTon: 45000,
    totalValue: 7672500,
    status: 'DELIVERED_VERIFIED',
    stageIndex: 3,
    logistics: {
      distanceKm: 65,
      transportMode: 'Covered Container Truck',
      pickupLocation: 'Hazira Polymer Gate 2',
      deliveryLocation: 'Ankleshwar GIDC Recycling Hub',
      transporterName: 'Gujarat Express Freight',
      vehicleNumber: 'GJ-05-BZ-7104',
      driverName: 'Dilip Solanki',
      driverPhone: '+91 97234 11890',
      gatePassNumber: 'GP-RIL-2026-5510',
      consignmentManifestCode: 'MNF-SYM-67219',
      dispatchedAt: new Date('2026-03-04T09:30:00Z'),
      deliveredAt: new Date('2026-03-05T13:00:00Z')
    },
    verification: {
      weighbridgeSlipNumber: 'WB-ANK-9932',
      grossWeightTons: 188.5,
      tareWeightTons: 18,
      netVerifiedQuantity: 170.5,
      weighbridgeLocation: 'GIDC Weighbridge Station #2, Ankleshwar',
      qualityInspectionPassed: true,
      verifiedBy: 'Polymer QA Head P. Dave',
      verifiedAt: new Date('2026-03-05T14:00:00Z'),
      digitalCertificateHash: '9a311b5e284a7c9381e0582d91024fb81295bca6120894178bc1059341ef9021'
    },
    terms: {
      paymentTerms: 'Escrow Handshake - Verified Purity Release',
      packagingType: 'Jumbo Palletized Bags',
      pickupWindowDays: 4,
      notes: 'Clean post-industrial trim regrind for closed-loop pipe manufacturing'
    },
    impactMetrics: {
      wasteDivertedTons: 170.5,
      grossCo2eAvoidedKg: 255750,
      grossCo2eAvoidedTons: 255.75,
      transportCo2eKg: 909,
      transportCo2eTons: 0.91,
      netCo2AvoidedKg: 184200,
      netCo2AvoidedTons: 184.2,
      waterSavedLitres: 249000,
      landfillVolumeSavedM3: 281.33,
      treesEquivalent: 8461,
      economicSavingsInr: 340000,
      economicSavingsLakhs: 3.4,
      virginMaterialReplaced: 'Virgin Naphtha-derived Polymer Granules'
    },
    timeline: [
      {
        status: 'INITIATED',
        title: 'Polymer Feedstock Demand Synergized',
        description: 'EcoPlast paired with Reliance Hazira surplus polymer purge.',
        timestamp: new Date('2026-03-02T10:00:00Z'),
        actor: 'SymbioLink Engine'
      },
      {
        status: 'IN_NEGOTIATION',
        title: 'MFI and Tensile Purity Verified',
        description: 'Technical data sheet certified.',
        timestamp: new Date('2026-03-03T15:30:00Z'),
        actor: 'EcoPlast Recyclers'
      },
      {
        status: 'LOGISTICS_DISPATCHED',
        title: 'Gate Pass GP-RIL-2026-5510 Cleared',
        description: 'Dispatched via covered container fleet.',
        timestamp: new Date('2026-03-04T09:30:00Z'),
        actor: 'Reliance Hazira Gate'
      },
      {
        status: 'DELIVERED_VERIFIED',
        title: 'Weighbridge Net 170.5T Accepted',
        description: 'Virgin fossil plastic displaced. 184.2 t CO2 avoided.',
        timestamp: new Date('2026-03-05T14:00:00Z'),
        actor: 'EcoPlast Inbound Quality'
      }
    ],
    createdAt: new Date('2026-03-02T10:00:00Z'),
    updatedAt: new Date('2026-03-05T14:00:00Z')
  },
  {
    _id: 'deal_004_solvent',
    dealCode: 'DL-2026-4512',
    sourceListing: 'L4',
    matchedListing: 'L20',
    supplierCompany: 'comp_aarti_ind',
    buyerCompany: 'comp_dahej_solvent',
    material: 'Spent Solvent',
    materialCategory: 'Chemical Byproduct',
    quantity: 120,
    unit: 'Tons',
    pricePerTon: 8500,
    totalValue: 1020000,
    status: 'LOGISTICS_DISPATCHED',
    stageIndex: 2,
    logistics: {
      distanceKm: 28,
      transportMode: 'Hazchem SS Tanker with GPS Manifest',
      pickupLocation: 'Aarti Dahej SEZ-II Hazchem Bay',
      deliveryLocation: 'Dahej Solvent Distillation Facility',
      transporterName: 'SafeChem Transit India',
      vehicleNumber: 'GJ-16-AX-3301',
      driverName: 'Iqbal Pathan',
      driverPhone: '+91 99245 66781',
      gatePassNumber: 'GP-AARTI-2026-1184',
      consignmentManifestCode: 'MNF-SYM-99801',
      dispatchedAt: new Date('2026-03-10T08:30:00Z')
    },
    verification: {
      weighbridgeSlipNumber: 'WB-PENDING-DISPATCH',
      grossWeightTons: 0,
      tareWeightTons: 0,
      netVerifiedQuantity: 0,
      qualityInspectionPassed: false
    },
    terms: {
      paymentTerms: 'Escrow Handshake - 50% on Manifest, 50% on Distillation QA',
      packagingType: 'Stainless Steel Bulk Tanker',
      pickupWindowDays: 1,
      notes: 'Fractional recovery of technical isopropyl alcohol'
    },
    impactMetrics: {
      wasteDivertedTons: 120,
      grossCo2eAvoidedKg: 78000,
      grossCo2eAvoidedTons: 78,
      transportCo2eKg: 275,
      transportCo2eTons: 0.28,
      netCo2AvoidedKg: 77725,
      netCo2AvoidedTons: 77.73,
      waterSavedLitres: 144000,
      landfillVolumeSavedM3: 126,
      treesEquivalent: 3570,
      economicSavingsInr: 2280000,
      economicSavingsLakhs: 22.8,
      virginMaterialReplaced: 'Virgin Solvents / Industrial Grade Acids'
    },
    timeline: [
      {
        status: 'INITIATED',
        title: 'Chemical Circular Transfer Request',
        description: 'Spent IPA reclamation initiated.',
        timestamp: new Date('2026-03-08T11:00:00Z'),
        actor: 'Aarti Industries Dahej'
      },
      {
        status: 'IN_NEGOTIATION',
        title: 'Safety Data Sheet & Hazchem Terms Cleared',
        description: 'Mutual hazardous waste compliance agreement signed.',
        timestamp: new Date('2026-03-09T16:00:00Z'),
        actor: 'Gujarat Clean Green'
      },
      {
        status: 'LOGISTICS_DISPATCHED',
        title: 'Gate Pass GP-AARTI-2026-1184 Cleared',
        description: 'Tanker GJ-16-AX-3301 en route with digital QR manifest.',
        timestamp: new Date('2026-03-10T08:30:00Z'),
        actor: 'Aarti Dispatch Officer'
      }
    ],
    createdAt: new Date('2026-03-08T11:00:00Z'),
    updatedAt: new Date('2026-03-10T08:30:00Z')
  },
  {
    _id: 'deal_005_redmud',
    dealCode: 'DL-2026-5520',
    sourceListing: 'L1',
    matchedListing: 'L20',
    supplierCompany: 'comp_vedanta_alumina',
    buyerCompany: 'comp_dalmia_cement',
    material: 'Bauxite Residue / Red Mud',
    materialCategory: 'Foundry & Mineral Waste',
    quantity: 300,
    unit: 'Tons',
    pricePerTon: 400,
    totalValue: 120000,
    status: 'IN_NEGOTIATION',
    stageIndex: 1,
    logistics: {
      distanceKm: 185,
      transportMode: 'Railway Freight Rake / Covered Tipper',
      pickupLocation: 'Vedanta Lanjigarh Red Mud Yard',
      deliveryLocation: 'Dalmia Bharat Rajgangpur Raw Mill Silo',
      transporterName: 'East Coast Industrial Rail Logistics',
      vehicleNumber: 'ECOR-RAKE-4091',
      gatePassNumber: '',
      consignmentManifestCode: ''
    },
    verification: {
      weighbridgeSlipNumber: '',
      grossWeightTons: 0,
      tareWeightTons: 0,
      netVerifiedQuantity: 0,
      qualityInspectionPassed: false
    },
    terms: {
      paymentTerms: '30-day corporate credit on weighbridge acceptance',
      packagingType: 'Bulk Covered Tipper',
      pickupWindowDays: 5,
      notes: 'Red mud blended for low-carbon composite cement'
    },
    impactMetrics: {
      wasteDivertedTons: 300,
      grossCo2eAvoidedKg: 135000,
      grossCo2eAvoidedTons: 135,
      transportCo2eKg: 4551,
      transportCo2eTons: 4.55,
      netCo2AvoidedKg: 130449,
      netCo2AvoidedTons: 130.45,
      waterSavedLitres: 90000,
      landfillVolumeSavedM3: 225,
      treesEquivalent: 5992,
      economicSavingsInr: 450000,
      economicSavingsLakhs: 4.5,
      virginMaterialReplaced: 'Virgin River Sand / Silica Aggregate'
    },
    timeline: [
      {
        status: 'INITIATED',
        title: 'Bauxite Residue Utilization Request',
        description: 'Vedanta Alumina proposed 300T Red Mud to Dalmia Bharat.',
        timestamp: new Date('2026-03-12T09:00:00Z'),
        actor: 'Vedanta Sustainability Desk'
      },
      {
        status: 'IN_NEGOTIATION',
        title: 'Alkalinity & Particle Size Tests Under Review',
        description: 'Trial kiln run approval pending laboratory signoff.',
        timestamp: new Date('2026-03-14T11:45:00Z'),
        actor: 'Dalmia Bharat R&D'
      }
    ],
    createdAt: new Date('2026-03-12T09:00:00Z'),
    updatedAt: new Date('2026-03-14T11:45:00Z')
  }
];

class MemoryStore {
  constructor() {
    this.companies = JSON.parse(JSON.stringify(initialCompanies));
    this.listings = JSON.parse(JSON.stringify(initialListings));
    this.deals = JSON.parse(JSON.stringify(initialDeals));
  }

  reset() {
    this.companies = JSON.parse(JSON.stringify(initialCompanies));
    this.listings = JSON.parse(JSON.stringify(initialListings));
    this.deals = JSON.parse(JSON.stringify(initialDeals));
  }

  // --- Company Methods ---
  findCompanies(query = {}) {
    return this.companies.filter(c => {
      for (const key in query) {
        if (c[key] !== query[key]) return false;
      }
      return true;
    });
  }

  findCompanyById(id) {
    return this.companies.find(c => c._id === id || c._id?.toString() === id?.toString()) || null;
  }

  createCompany(data) {
    const doc = {
      _id: data._id || `comp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data
    };
    this.companies.push(doc);
    return doc;
  }

  // --- Listing Methods ---
  findListings(query = {}) {
    return this.listings.filter(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  }

  findListingById(id) {
    const listing = this.listings.find(l => l._id === id || l._id?.toString() === id?.toString());
    if (!listing) return null;
    const populated = { ...listing };
    if (typeof populated.company === 'string') {
      populated.company = this.findCompanyById(populated.company) || populated.company;
    }
    return populated;
  }

  createListing(data) {
    const doc = {
      _id: data._id || `L_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      status: 'AVAILABLE',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data
    };
    this.listings.push(doc);
    return doc;
  }

  // --- Deal Methods ---
  findDeals(filter = {}) {
    let result = this.deals.slice();

    if (filter.status) {
      result = result.filter(d => d.status === filter.status);
    }
    if (filter.materialCategory) {
      result = result.filter(d => d.materialCategory === filter.materialCategory);
    }
    if (filter.companyId) {
      result = result.filter(d => 
        (d.supplierCompany?._id || d.supplierCompany) === filter.companyId ||
        (d.buyerCompany?._id || d.buyerCompany) === filter.companyId
      );
    }

    // Populate companies
    return result.map(d => this.populateDeal(d));
  }

  findDealById(id) {
    const deal = this.deals.find(d => d._id === id || d.dealCode === id || d._id?.toString() === id?.toString());
    if (!deal) return null;
    return this.populateDeal(deal);
  }

  populateDeal(deal) {
    const populated = JSON.parse(JSON.stringify(deal));
    if (typeof populated.supplierCompany === 'string') {
      populated.supplierCompany = this.findCompanyById(populated.supplierCompany) || { _id: populated.supplierCompany, name: populated.supplierCompany };
    }
    if (typeof populated.buyerCompany === 'string') {
      populated.buyerCompany = this.findCompanyById(populated.buyerCompany) || { _id: populated.buyerCompany, name: populated.buyerCompany };
    }
    return populated;
  }

  createDeal(data) {
    const dealCode = data.dealCode || `DL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();

    const supplier = this.findCompanyById(data.supplierCompany) || { _id: data.supplierCompany, name: 'Supplier Enterprise' };
    const buyer = this.findCompanyById(data.buyerCompany) || { _id: data.buyerCompany, name: 'Procuring Enterprise' };

    const quantity = Number(data.quantity) || 100;
    const pricePerTon = Number(data.pricePerTon) || 1000;
    const distanceKm = Number(data.logistics?.distanceKm) || 0;

    const impact = calculateDealImpact({
      material: data.material,
      materialCategory: data.materialCategory,
      quantityTons: quantity,
      distanceKm: distanceKm,
      agreedPricePerTon: pricePerTon
    });

    const newDeal = {
      _id: `deal_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      dealCode,
      sourceListing: data.sourceListing || null,
      matchedListing: data.matchedListing || null,
      supplierCompany: supplier._id || supplier,
      buyerCompany: buyer._id || buyer,
      material: data.material || 'Industrial Byproduct',
      materialCategory: data.materialCategory || 'Industrial Slag',
      quantity,
      unit: data.unit || 'Tons',
      pricePerTon,
      totalValue: Number(data.totalValue) || (quantity * pricePerTon),
      status: data.status || 'INITIATED',
      stageIndex: 0,
      logistics: {
        distanceKm,
        transportMode: data.logistics?.transportMode || 'Heavy Duty Green Fleet Tipper',
        pickupLocation: data.logistics?.pickupLocation || `${supplier.name || 'Supplier'} Facility`,
        deliveryLocation: data.logistics?.deliveryLocation || `${buyer.name || 'Buyer'} Plant`,
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
          _id: `tl_${Date.now()}`,
          status: 'INITIATED',
          title: 'Deal Initiated & Escrow Reserved',
          description: data.notes || `Exchange agreement initialized for ${quantity} Tons of ${data.material}.`,
          timestamp: now,
          actor: data.actor || 'SymbioLink Engine',
          metadata: { initialQuantity: quantity, pricePerTon }
        }
      ],
      createdAt: now,
      updatedAt: now
    };

    this.deals.unshift(newDeal);
    return this.populateDeal(newDeal);
  }

  updateDealStatus(id, updatePayload) {
    const index = this.deals.findIndex(d => d._id === id || d.dealCode === id);
    if (index === -1) return null;

    const deal = this.deals[index];
    const newStatus = updatePayload.status;
    const now = new Date();

    const STAGES = {
      'INITIATED': 0,
      'IN_NEGOTIATION': 1,
      'LOGISTICS_DISPATCHED': 2,
      'DELIVERED_VERIFIED': 3,
      'CANCELLED': -1
    };

    if (STAGES[newStatus] !== undefined) {
      deal.status = newStatus;
      deal.stageIndex = STAGES[newStatus];
    }

    deal.updatedAt = now;

    // Transition-specific auto-population
    if (newStatus === 'IN_NEGOTIATION') {
      if (updatePayload.pricePerTon) deal.pricePerTon = Number(updatePayload.pricePerTon);
      if (updatePayload.quantity) deal.quantity = Number(updatePayload.quantity);
      deal.totalValue = deal.pricePerTon * deal.quantity;

      deal.timeline.push({
        _id: `tl_${Date.now()}`,
        status: 'IN_NEGOTIATION',
        title: updatePayload.title || 'Terms Negotiated & Commercial Lock',
        description: updatePayload.notes || 'Commercial pricing, delivery timeframe and transport responsibility agreed.',
        timestamp: now,
        actor: updatePayload.actor || 'Trading Partner',
        metadata: updatePayload.metadata || {}
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
        _id: `tl_${Date.now()}`,
        status: 'LOGISTICS_DISPATCHED',
        title: updatePayload.title || `Gate Pass ${deal.logistics.gatePassNumber} Cleared & In-Transit`,
        description: updatePayload.notes || `Dispatched via vehicle ${deal.logistics.vehicleNumber}. Digital chain-of-custody manifest active.`,
        timestamp: now,
        actor: updatePayload.actor || 'Supplier Dispatch Gate',
        metadata: {
          gatePassNumber: deal.logistics.gatePassNumber,
          vehicleNumber: deal.logistics.vehicleNumber,
          manifestCode: deal.logistics.consignmentManifestCode
        }
      });
    } else if (newStatus === 'DELIVERED_VERIFIED') {
      const verifiedTons = Number(updatePayload.verifiedTonnage || updatePayload.quantity || deal.quantity);
      const tare = Number(updatePayload.tareWeightTons) || 35;
      const gross = verifiedTons + tare;
      const slipNum = updatePayload.weighbridgeSlipNumber || `WB-CHAIBASA-${Math.floor(1000 + Math.random() * 9000)}`;

      // Generate tamper-proof SHA-256 certificate stamp
      const rawPayload = `${deal.dealCode}:${deal.supplierCompany}:${deal.buyerCompany}:${verifiedTons}:${now.toISOString()}`;
      const certHash = crypto.createHash('sha256').update(rawPayload).digest('hex');

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

      // Recalculate impact based on final verified tonnage
      deal.impactMetrics = calculateDealImpact({
        material: deal.material,
        materialCategory: deal.materialCategory,
        quantityTons: verifiedTons,
        distanceKm: deal.logistics?.distanceKm || 0,
        agreedPricePerTon: deal.pricePerTon
      });

      deal.timeline.push({
        _id: `tl_${Date.now()}`,
        status: 'DELIVERED_VERIFIED',
        title: updatePayload.title || `Weighbridge Slip ${slipNum} Verified & ESG Hash Sealed`,
        description: updatePayload.notes || `Delivery verified (${verifiedTons} Tons net). Simulated escrow released to supplier. ESG Certificate unlocked.`,
        timestamp: now,
        actor: updatePayload.actor || 'Buyer Receiving QA & Weighbridge',
        metadata: {
          netTons: verifiedTons,
          slipNumber: slipNum,
          certificateHash: certHash
        }
      });
    } else if (newStatus === 'CANCELLED') {
      deal.timeline.push({
        _id: `tl_${Date.now()}`,
        status: 'CANCELLED',
        title: updatePayload.title || 'Deal Cancelled',
        description: updatePayload.notes || 'Deal was cancelled by mutual consent.',
        timestamp: now,
        actor: updatePayload.actor || 'System'
      });
    }

    this.deals[index] = deal;
    return this.populateDeal(deal);
  }
}

const memoryStore = new MemoryStore();
module.exports = memoryStore;
