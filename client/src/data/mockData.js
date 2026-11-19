// Pre-seeded Indian Industrial Eco-System Data (Matching Member 1 & Member 2 schemas)

export const COMPANIES = [
  {
    id: "COMP-001",
    name: "Tata Steel Jamshedpur",
    shortName: "Tata Steel",
    location: { city: "Jamshedpur", state: "Jharkhand", lat: 22.8046, lng: 86.2029 },
    industry: "Iron & Steel Metallurgy",
    badge: "Primary Producer",
    avatar: "🏗️",
    activeListingsCount: 4,
    verifiedGst: "20AAACT2727Q1ZX"
  },
  {
    id: "COMP-002",
    name: "Prism Green Cement",
    shortName: "Prism Cement",
    location: { city: "Satna", state: "Madhya Pradesh", lat: 24.5828, lng: 80.8322 },
    industry: "Low-Carbon Cement & RMC",
    badge: "Circular Consumer",
    avatar: "🏢",
    activeListingsCount: 3,
    verifiedGst: "23AABCP8742M1ZB"
  },
  {
    id: "COMP-003",
    name: "UltraTech Cement Works",
    shortName: "UltraTech",
    location: { city: "Kotputli", state: "Rajasthan", lat: 27.7028, lng: 76.2014 },
    industry: "Cementitious Materials",
    badge: "Large Scale Consumer",
    avatar: "🏭",
    activeListingsCount: 5,
    verifiedGst: "08AAACU3491E1Z0"
  },
  {
    id: "COMP-004",
    name: "NTPC Vindhyachal Thermal",
    shortName: "NTPC Thermal",
    location: { city: "Singrauli", state: "Madhya Pradesh", lat: 24.0988, lng: 82.6719 },
    industry: "Power Generation",
    badge: "Byproduct Supplier",
    avatar: "⚡",
    activeListingsCount: 2,
    verifiedGst: "23AAACN0255D1ZQ"
  },
  {
    id: "COMP-005",
    name: "Reliance Polymers Complex",
    shortName: "Reliance Polymers",
    location: { city: "Hazira", state: "Gujarat", lat: 21.1165, lng: 72.6534 },
    industry: "Petrochemicals & Plastics",
    badge: "Polymer Producer",
    avatar: "🧪",
    activeListingsCount: 3,
    verifiedGst: "24AAACR5055K1Z3"
  },
  {
    id: "COMP-006",
    name: "Gujarat Fluorochemicals (Dahej)",
    shortName: "GFL Dahej",
    location: { city: "Dahej", state: "Gujarat", lat: 21.7121, lng: 72.5898 },
    industry: "Specialty Chemicals",
    badge: "Chemical Supplier",
    avatar: "⚗️",
    activeListingsCount: 2,
    verifiedGst: "24AAACG0187B1ZU"
  },
  {
    id: "COMP-007",
    name: "GreenPlas Re-Engineered Resins",
    shortName: "GreenPlas",
    location: { city: "Surat", state: "Gujarat", lat: 21.1702, lng: 72.8311 },
    industry: "Circular Polymer Compounding",
    badge: "Recycler / Converter",
    avatar: "♻️",
    activeListingsCount: 3,
    verifiedGst: "24AABCG9012L1ZP"
  },
  {
    id: "COMP-008",
    name: "Vedanta Alumina Smelter",
    shortName: "Vedanta Alumina",
    location: { city: "Lanjigarh", state: "Odisha", lat: 19.7153, lng: 83.3768 },
    industry: "Non-Ferrous Metallurgy",
    badge: "Primary Producer",
    avatar: "⛏️",
    activeListingsCount: 2,
    verifiedGst: "21AAACV1289P1ZN"
  }
];

export const INITIAL_LISTINGS = [
  {
    id: "LIST-S101",
    type: "SUPPLY",
    title: "Granulated Blast Furnace Slag (GBFS)",
    category: "Industrial Slag",
    subType: "GBFS Grade A",
    companyId: "COMP-001",
    companyName: "Tata Steel Jamshedpur",
    location: { city: "Jamshedpur", state: "Jharkhand", distanceKm: 0 },
    quantity: 500,
    unit: "Metric Tonnes",
    pricePerUnit: 2400,
    frequency: "Continuous (Monthly)",
    purityGrade: "Glass Content > 95%, IS 12089:1987 Compliant",
    co2FactorKgPerTon: 800, // 800 kg CO2e avoided / ton replaced
    waterFactorLPerTon: 450,
    status: "AVAILABLE",
    createdAt: "2026-11-15T09:30:00Z",
    moistureContent: "8.2%",
    heavyMetalsPpm: "< 15 ppm (Trace)",
    description: "Water-quenched hydraulic blast furnace slag ideal for Portland Slag Cement (PSC) or Ground Granulated BF Slag (GGBS) manufacturing. Eliminates limestone calcination."
  },
  {
    id: "LIST-S102",
    type: "SUPPLY",
    title: "Fly Ash Class F (Pulverized Coal Residual)",
    category: "Fly Ash",
    subType: "Class F Dry Silo",
    companyId: "COMP-004",
    companyName: "NTPC Vindhyachal Thermal",
    location: { city: "Singrauli", state: "Madhya Pradesh", distanceKm: 340 },
    quantity: 1200,
    unit: "Metric Tonnes",
    pricePerUnit: 950,
    frequency: "Continuous (Weekly)",
    purityGrade: "SiO2 + Al2O3 + Fe2O3 > 70%, Fineness 320 m²/kg",
    co2FactorKgPerTon: 850,
    waterFactorLPerTon: 300,
    status: "AVAILABLE",
    createdAt: "2026-11-14T11:20:00Z",
    moistureContent: "< 1.0% (Electrostatic Precipitator dry collected)",
    heavyMetalsPpm: "Meets CPCB 2024 norms",
    description: "High pozzolanic activity Class F fly ash. Directly substitute up to 35% Portland clinker in PPC concrete mixes."
  },
  {
    id: "LIST-S103",
    type: "SUPPLY",
    title: "Post-Industrial Polypropylene (PP) Trim Scrap",
    category: "Polymers/Plastics",
    subType: "Homo-polymer PP Granules",
    companyId: "COMP-005",
    companyName: "Reliance Polymers Complex",
    location: { city: "Hazira", state: "Gujarat", distanceKm: 1450 },
    quantity: 150,
    unit: "Metric Tonnes",
    pricePerUnit: 58000,
    frequency: "Weekly Batch",
    purityGrade: "MFI 12 g/10min, Zero Cross-Contamination",
    co2FactorKgPerTon: 1500, // 1500 kg CO2e / ton
    waterFactorLPerTon: 2200,
    status: "AVAILABLE",
    createdAt: "2026-11-16T08:15:00Z",
    moistureContent: "Nil",
    description: "Clean extrusion purge and edge trims from BOPP line. Washed, shredded, and ready for re-compounding."
  },
  {
    id: "LIST-S104",
    type: "SUPPLY",
    title: "Spent Technical Toluene (Distillation Bottoms)",
    category: "Spent Solvents",
    subType: "Industrial Toluene Fraction",
    companyId: "COMP-006",
    companyName: "Gujarat Fluorochemicals (Dahej)",
    location: { city: "Dahej", state: "Gujarat", distanceKm: 1490 },
    quantity: 80,
    unit: "Metric Tonnes",
    pricePerUnit: 34000,
    frequency: "Monthly Lot",
    purityGrade: "Assay 88.4%, Moisture < 0.8%",
    co2FactorKgPerTon: 650,
    waterFactorLPerTon: 1200,
    status: "AVAILABLE",
    createdAt: "2026-11-16T14:40:00Z",
    description: "Secondary solvent stream recovered from fluoropolymer washing. Suitable for industrial paint thinner formulation or secondary chemical extraction."
  },
  {
    id: "LIST-S105",
    type: "SUPPLY",
    title: "Heavy Melting Steel Scrap (HMS 1 & 2)",
    category: "Metals/Scrap",
    subType: "Ferrous Scrap 80:20 Mix",
    companyId: "COMP-001",
    companyName: "Tata Steel Jamshedpur",
    location: { city: "Jamshedpur", state: "Jharkhand", distanceKm: 0 },
    quantity: 350,
    unit: "Metric Tonnes",
    pricePerUnit: 37500,
    frequency: "Continuous (Monthly)",
    purityGrade: "IS 2549:1994, Clean structural cuts",
    co2FactorKgPerTon: 1400,
    waterFactorLPerTon: 1800,
    status: "AVAILABLE",
    createdAt: "2026-11-15T16:00:00Z",
    description: "High-density cropped beam ends and plate cutoffs. Feedstock for induction and electric arc furnace (EAF) mini-mills."
  },
  {
    id: "LIST-S106",
    type: "SUPPLY",
    title: "Neutralized Red Mud / Bauxite Residue",
    category: "Mineral Residues",
    subType: "Calcined Residue Cake",
    companyId: "COMP-008",
    companyName: "Vedanta Alumina Smelter",
    location: { city: "Lanjigarh", state: "Odisha", distanceKm: 310 },
    quantity: 900,
    unit: "Metric Tonnes",
    pricePerUnit: 450,
    frequency: "Continuous (Monthly)",
    purityGrade: "pH neutralized (8.2), Fe2O3 48%, Al2O3 18%",
    co2FactorKgPerTon: 520,
    waterFactorLPerTon: 600,
    status: "AVAILABLE",
    createdAt: "2026-11-13T10:00:00Z",
    description: "Filter-pressed neutralized bauxite residue for geopolymer concrete blocks, brick making, and road base stabilization."
  },

  // DEMAND LISTINGS
  {
    id: "LIST-D201",
    type: "DEMAND",
    title: "Raw Feedstock: Granulated Blast Furnace Slag",
    category: "Industrial Slag",
    subType: "GBFS Grade A",
    companyId: "COMP-002",
    companyName: "Prism Green Cement",
    location: { city: "Satna", state: "Madhya Pradesh", distanceKm: 42.5 },
    quantity: 480,
    unit: "Metric Tonnes",
    pricePerUnit: 2550,
    frequency: "Continuous (Monthly)",
    purityGrade: "Glass Content > 90%",
    status: "MATCHED",
    createdAt: "2026-11-15T10:15:00Z",
    description: "Seeking 450-550 MT monthly GBFS for green composite cement production. Proximity within 150 km preferred."
  },
  {
    id: "LIST-D202",
    type: "DEMAND",
    title: "Pozzolanic Cement Additive: Dry Silo Fly Ash",
    category: "Fly Ash",
    subType: "Class F Dry Silo",
    companyId: "COMP-003",
    companyName: "UltraTech Cement Works",
    location: { city: "Kotputli", state: "Rajasthan", distanceKm: 280 },
    quantity: 1000,
    unit: "Metric Tonnes",
    pricePerUnit: 1100,
    frequency: "Continuous (Weekly)",
    purityGrade: "Blaine Fineness > 300 m²/kg",
    status: "AVAILABLE",
    createdAt: "2026-11-14T15:30:00Z",
    description: "Urgent monthly demand for dry unconditioned Class F fly ash to fulfill BIS 1489 Part 1 Portland Pozzolana Cement batch run."
  },
  {
    id: "LIST-D203",
    type: "DEMAND",
    title: "Industrial Grade Recycled Polypropylene Feedstock",
    category: "Polymers/Plastics",
    subType: "Homo-polymer PP Granules",
    companyId: "COMP-007",
    companyName: "GreenPlas Re-Engineered Resins",
    location: { city: "Surat", state: "Gujarat", distanceKm: 18 },
    quantity: 120,
    unit: "Metric Tonnes",
    pricePerUnit: 60000,
    frequency: "Weekly Batch",
    purityGrade: "MFI 10-15 g/10min, Clean unprinted",
    status: "AVAILABLE",
    createdAt: "2026-11-16T12:00:00Z",
    description: "Looking for post-industrial PP scrap/regrind for automotive component compound formulations."
  },
  {
    id: "LIST-D204",
    type: "DEMAND",
    title: "Heavy Melting Steel Scrap for Induction Furnace",
    category: "Metals/Scrap",
    subType: "Ferrous Scrap 80:20 Mix",
    companyId: "COMP-002",
    companyName: "Prism Green Cement", // Has allied heavy engineering wing
    location: { city: "Satna", state: "Madhya Pradesh", distanceKm: 190 },
    quantity: 300,
    unit: "Metric Tonnes",
    pricePerUnit: 38200,
    frequency: "Continuous (Monthly)",
    purityGrade: "HMS 1/2 Certified",
    status: "AVAILABLE",
    createdAt: "2026-11-15T18:00:00Z",
    description: "Procuring monthly charge for rebar manufacturing rolling mill division."
  }
];

// Pre-computed Match Scenarios for instantaneous 60fps presentation demo
export const PRECOMPUTED_MATCHES = {
  "LIST-S101": {
    targetListing: {
      id: "LIST-S101",
      title: "Granulated Blast Furnace Slag (GBFS)",
      company: "Tata Steel Jamshedpur",
      quantity: 500,
      unit: "Metric Tonnes",
      pricePerUnit: 2400
    },
    matches: [
      {
        listingId: "LIST-D201",
        company: {
          id: "COMP-002",
          name: "Prism Green Cement",
          city: "Satna",
          state: "Madhya Pradesh",
          distanceKm: 42.5,
          lat: 24.5828,
          lng: 80.8322
        },
        demandTitle: "Raw Feedstock: Granulated Blast Furnace Slag",
        matchScore: 94,
        factors: {
          materialCompatibility: 100, // 100% IS 12089 chemistry match
          distanceScore: 92,          // 42.5 km < 300 km cutoff (Haversine)
          volumeScore: 90             // 500 MT supply vs 480 MT demand
        },
        matchedQuantity: 480,
        unit: "Metric Tonnes",
        unitPriceOffered: 2500,
        totalDealValueInr: 1200000,
        potentialCo2SavingsKg: 384000, // 480 MT * 800 kg CO2 avoided
        potentialCo2SavingsTons: 384.0,
        waterConservedLitres: 216000,
        costAdvantagePercent: 32,
        economicSavingsInr: 1840000,
        synergyNote: "Direct replacement for Portland Clinker. Eliminates 0.82t CO2 per tonne of cement produced with zero quality penalty."
      },
      {
        listingId: "LIST-D202-ALT",
        company: {
          id: "COMP-003",
          name: "UltraTech Cement Works",
          city: "Kotputli",
          state: "Rajasthan",
          distanceKm: 278.4,
          lat: 27.7028,
          lng: 76.2014
        },
        demandTitle: "Secondary Clinker Replacement Blend",
        matchScore: 78,
        factors: {
          materialCompatibility: 95,
          distanceScore: 68,
          volumeScore: 85
        },
        matchedQuantity: 500,
        unit: "Metric Tonnes",
        unitPriceOffered: 2420,
        totalDealValueInr: 1210000,
        potentialCo2SavingsKg: 400000,
        potentialCo2SavingsTons: 400.0,
        waterConservedLitres: 225000,
        costAdvantagePercent: 18,
        economicSavingsInr: 950000,
        synergyNote: "Viable bulk rail freight option (Jamshedpur-Kotputli corridor). High volume absorption."
      }
    ]
  },

  "LIST-S103": {
    targetListing: {
      id: "LIST-S103",
      title: "Post-Industrial Polypropylene (PP) Trim Scrap",
      company: "Reliance Polymers Complex",
      quantity: 150,
      unit: "Metric Tonnes",
      pricePerUnit: 58000
    },
    matches: [
      {
        listingId: "LIST-D203",
        company: {
          id: "COMP-007",
          name: "GreenPlas Re-Engineered Resins",
          city: "Surat",
          state: "Gujarat",
          distanceKm: 18.2,
          lat: 21.1702,
          lng: 72.8311
        },
        demandTitle: "Industrial Grade Recycled Polypropylene Feedstock",
        matchScore: 97,
        factors: {
          materialCompatibility: 100,
          distanceScore: 98,
          volumeScore: 92
        },
        matchedQuantity: 120,
        unit: "Metric Tonnes",
        unitPriceOffered: 59500,
        totalDealValueInr: 7140000,
        potentialCo2SavingsKg: 180000, // 120 * 1500 kg
        potentialCo2SavingsTons: 180.0,
        waterConservedLitres: 264000,
        costAdvantagePercent: 28,
        economicSavingsInr: 2160000,
        synergyNote: "Hyper-local symbiosis (Hazira to Surat < 20 km). Diverts unprinted homo-polymer trims directly into automotive tier-1 compounding."
      }
    ]
  },

  "LIST-S105": {
    targetListing: {
      id: "LIST-S105",
      title: "Heavy Melting Steel Scrap (HMS 1 & 2)",
      company: "Tata Steel Jamshedpur",
      quantity: 350,
      unit: "Metric Tonnes",
      pricePerUnit: 37500
    },
    matches: [
      {
        listingId: "LIST-D204",
        company: {
          id: "COMP-002",
          name: "Prism Green Cement (Rolling Mill)",
          city: "Satna",
          state: "Madhya Pradesh",
          distanceKm: 190.5,
          lat: 24.5828,
          lng: 80.8322
        },
        matchScore: 89,
        factors: {
          materialCompatibility: 100,
          distanceScore: 82,
          volumeScore: 94
        },
        matchedQuantity: 300,
        unit: "Metric Tonnes",
        unitPriceOffered: 38000,
        totalDealValueInr: 11400000,
        potentialCo2SavingsKg: 420000,
        potentialCo2SavingsTons: 420.0,
        waterConservedLitres: 540000,
        costAdvantagePercent: 22,
        economicSavingsInr: 2520000,
        synergyNote: "Replaces blast furnace iron ore smelting with scrap induction remelting. Reduces carbon intensity by 1.4t CO2e per tonne steel."
      }
    ]
  }
};

// Initial Seeded B2B Deals Pipeline (for Member 2 state machine demo)
export const INITIAL_DEALS = [
  {
    id: "DEAL-8492",
    supplyListingId: "LIST-S101",
    demandListingId: "LIST-D201",
    supplierCompany: "Tata Steel Jamshedpur",
    supplierCity: "Jamshedpur, JH",
    buyerCompany: "Prism Green Cement",
    buyerCity: "Satna, MP",
    material: "Granulated Blast Furnace Slag (GBFS)",
    quantity: 480,
    unit: "Metric Tonnes",
    ratePerUnit: 2500,
    totalValueInr: 1200000,
    distanceKm: 42.5,
    co2AvoidedTons: 384.0,
    waterSavedLitres: 216000,
    economicSavingsInr: 1840000,
    status: "LOGISTICS_DISPATCHED", // INITIATED -> IN_NEGOTIATION -> LOGISTICS_DISPATCHED -> DELIVERED_VERIFIED
    statusCode: 3, // 1 to 4
    manifestNumber: "MNF-2026-JH-0912",
    gatePassNumber: "GP-8839-TATA",
    weighbridgeSlip: "WB-9941-PENDING",
    trucksDispatched: 16,
    transporterName: "VRL Industrial Bulk Logistics",
    vehicleNumberPrefix: "JH-05-CL",
    createdAt: "2026-11-16T10:00:00Z",
    history: [
      { stage: "INITIATED", title: "Mutual Synergy Terms Agreed", timestamp: "2026-11-16 10:05 AM", completed: true, note: "Match Score 94% accepted by both parties." },
      { stage: "IN_NEGOTIATION", title: "Digital Manifest & Escrow Confirmed", timestamp: "2026-11-16 11:30 AM", completed: true, note: "Bank escrow guarantee ₹12,00,000 locked." },
      { stage: "LOGISTICS_DISPATCHED", title: "Gate Pass Issued & Rake Dispatched", timestamp: "2026-11-16 02:15 PM", completed: true, note: "16 dump trailers cleared outbound weighbridge." },
      { stage: "DELIVERED_VERIFIED", title: "Inbound Weighbridge & Quality Audit", timestamp: "Estimated Nov 17", completed: false, note: "Awaiting final moisture testing at Prism Receiving Bay." }
    ]
  },
  {
    id: "DEAL-8490",
    supplyListingId: "LIST-S103",
    demandListingId: "LIST-D203",
    supplierCompany: "Reliance Polymers Complex",
    supplierCity: "Hazira, GJ",
    buyerCompany: "GreenPlas Re-Engineered Resins",
    buyerCity: "Surat, GJ",
    material: "Post-Industrial Polypropylene (PP) Trim Scrap",
    quantity: 120,
    unit: "Metric Tonnes",
    ratePerUnit: 59500,
    totalValueInr: 7140000,
    distanceKm: 18.2,
    co2AvoidedTons: 180.0,
    waterSavedLitres: 264000,
    economicSavingsInr: 2160000,
    status: "DELIVERED_VERIFIED",
    statusCode: 4,
    manifestNumber: "MNF-2026-GJ-0419",
    gatePassNumber: "GP-3120-RELIANCE",
    weighbridgeSlip: "WB-5502-VERIFIED",
    trucksDispatched: 6,
    transporterName: "Gujarat Circular Express",
    vehicleNumberPrefix: "GJ-05-BX",
    createdAt: "2026-11-15T08:00:00Z",
    history: [
      { stage: "INITIATED", title: "Synergy Matched (97%)", timestamp: "2026-11-15 08:30 AM", completed: true },
      { stage: "IN_NEGOTIATION", title: "Purchase Order Countersigned", timestamp: "2026-11-15 10:15 AM", completed: true },
      { stage: "LOGISTICS_DISPATCHED", title: "Dispatched from Hazira Bay 4", timestamp: "2026-11-15 01:00 PM", completed: true },
      { stage: "DELIVERED_VERIFIED", title: "Weighbridge Tare/Gross Certified & Audited", timestamp: "2026-11-15 04:45 PM", completed: true, note: "100% purity confirmed. Green BRSR Certificate issued." }
    ]
  }
];
