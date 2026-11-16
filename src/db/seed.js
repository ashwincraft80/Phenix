/**
 * Phenix / Project ReguFlow - Industrial Symbiosis Seed Data Generator
 * Native Node.js v24 SQLite DatabaseSync Implementation
 *
 * Populates realistic industrial data across 4 major Indian industrial corridors:
 * 1. Gujarat Chemical Corridor (Dahej, Bharuch, Ankleshwar, Vadodara)
 * 2. Maharashtra Automotive & Bio Belt (Chakan, Pimpri-Chinchwad, Talegaon, Pune)
 * 3. Tamil Nadu Manufacturing Hub (Coimbatore, Tirupur, Sriperumbudur)
 * 4. Eastern Mineral & Metallurgy Cluster (Jamshedpur, Rourkela, Chaibasa)
 *
 * Covering 6 authentic industrial byproduct pairs plus fly ash & recovered solvents:
 * - Spent Sulfuric Acid -> Fertilizer Production
 * - Phosphogypsum -> Cement Manufacturing
 * - Blast Furnace Slag (GGBS) -> Green Cement & Concrete
 * - Reclaimed Foundry Sand -> Eco-Paver Blocks & Infrastructure
 * - Sugarcane Bagasse -> Bio-Polymers & Compostable Packaging
 * - Textile CETP Sludge -> Cement Kiln Thermal Co-Processing
 * - Captive Thermal Fly Ash -> Pozzolanic Concrete
 * - Recovered Solvents -> Agrochemical Intermediate Synthesis
 */

import { getDatabase, initSchema } from './database.js';
import { validateOrganization } from '../models/organization.js';
import { validateFacility } from '../models/facility.js';
import { validateMaterial } from '../models/material.js';
import { validateListing } from '../models/listing.js';
import { validateDemand } from '../models/demand.js';
import { validateMatch } from '../models/match.js';
import { validateTransaction } from '../models/transaction.js';
import { validateMetrics } from '../models/metrics.js';
import { haversineDistance, calculateLogistics } from '../services/geolocation.js';
import { calculateMatchScore } from '../services/matchmaking.js';

/* -------------------------------------------------------------------------
 * 1. Raw Master Entity Definitions: ORGANIZATIONS (>= 12)
 * ------------------------------------------------------------------------- */
const RAW_ORGANIZATIONS = [
  {
    organization_id: 1,
    registration_number: 'L24110GJ1973PLC002247',
    legal_name: 'Gujarat Alkalies and Chemicals Limited',
    trade_name: 'GACL Dahej Complex',
    industrial_sector: 'Petrochemicals & Specialty Chemicals',
    verification_status: 'VERIFIED',
    contact_email: 'sustainability@gacl.co.in',
    contact_phone: '+91-265-2232701',
    esg_score: 84.5,
    reliability_rating: 4.8
  },
  {
    organization_id: 2,
    registration_number: 'U24120GJ2001PLC039247',
    legal_name: 'Narmada Bio-chem Limited',
    trade_name: 'Narmada Fertilizers Bharuch',
    industrial_sector: 'Fertilizers & Agro-Inputs',
    verification_status: 'VERIFIED',
    contact_email: 'procurement@narmadabiochem.com',
    contact_phone: '+91-2642-246100',
    esg_score: 79.0,
    reliability_rating: 4.5
  },
  {
    organization_id: 3,
    registration_number: 'L99999GJ1962PLC001121',
    legal_name: 'Gujarat State Fertilizers & Chemicals Limited',
    trade_name: 'GSFC Vadodara',
    industrial_sector: 'Petrochemicals & Specialty Chemicals',
    verification_status: 'VERIFIED',
    contact_email: 'esg@gsfcltd.com',
    contact_phone: '+91-265-2240151',
    esg_score: 82.0,
    reliability_rating: 4.7
  },
  {
    organization_id: 4,
    registration_number: 'L24219GJ1985PLC025132',
    legal_name: 'UPL Limited',
    trade_name: 'UPL Ankleshwar Chemical Works',
    industrial_sector: 'Agrochemicals & Industrial Intermediates',
    verification_status: 'VERIFIED',
    contact_email: 'circularity@upl-ltd.com',
    contact_phone: '+91-2646-251201',
    esg_score: 86.5,
    reliability_rating: 4.9
  },
  {
    organization_id: 5,
    registration_number: 'U24100GJ2015PTC084122',
    legal_name: 'Dahej Eco-Solvent Distillers Private Limited',
    trade_name: 'Dahej Solvent Recovery Services',
    industrial_sector: 'Specialty Chemicals & Resource Recovery',
    verification_status: 'VERIFIED',
    contact_email: 'operations@dahejecosolvent.in',
    contact_phone: '+91-2641-256789',
    esg_score: 76.5,
    reliability_rating: 4.3
  },
  {
    organization_id: 6,
    registration_number: 'L28920MH1945PLC004520',
    legal_name: 'Tata Motors Limited',
    trade_name: 'Tata Motors Commercial Vehicles Pune',
    industrial_sector: 'Automotive Manufacturing & Casting',
    verification_status: 'VERIFIED',
    contact_email: 'circular.economy@tatamotors.com',
    contact_phone: '+91-20-66131111',
    esg_score: 91.0,
    reliability_rating: 4.9
  },
  {
    organization_id: 7,
    registration_number: 'L25209MH1961PLC012041',
    legal_name: 'Bharat Forge Limited',
    trade_name: 'Bharat Forge Casting & Forging Division',
    industrial_sector: 'Automotive Manufacturing & Casting',
    verification_status: 'VERIFIED',
    contact_email: 'foundry.materials@bharatforge.com',
    contact_phone: '+91-20-67042777',
    esg_score: 88.0,
    reliability_rating: 4.8
  },
  {
    organization_id: 8,
    registration_number: 'U26999MH2018PTC312456',
    legal_name: 'EcoBricks Precast & Infra Solutions Private Limited',
    trade_name: 'EcoBricks Talegaon',
    industrial_sector: 'Infrastructure & Construction Materials',
    verification_status: 'VERIFIED',
    contact_email: 'procurement@ecobricks.in',
    contact_phone: '+91-2114-287123',
    esg_score: 81.5,
    reliability_rating: 4.4
  },
  {
    organization_id: 9,
    registration_number: 'L27101MH1985PLC038031',
    legal_name: 'Praj Industries Limited',
    trade_name: 'Praj Bio-Energy & Agri-Renewables',
    industrial_sector: 'Sugar & Bio-Renewables',
    verification_status: 'VERIFIED',
    contact_email: 'sustainability@praj.net',
    contact_phone: '+91-20-22941000',
    esg_score: 89.5,
    reliability_rating: 4.7
  },
  {
    organization_id: 10,
    registration_number: 'U25200MH2020PTC345678',
    legal_name: 'Chakan Green Bio-Polymers Private Limited',
    trade_name: 'Chakan Compostable Packaging',
    industrial_sector: 'Packaging & Biopolymers',
    verification_status: 'VERIFIED',
    contact_email: 'materials@chakangreenpoly.com',
    contact_phone: '+91-2135-612345',
    esg_score: 78.0,
    reliability_rating: 4.2
  },
  {
    organization_id: 11,
    registration_number: 'L27101TZ1962PLC000463',
    legal_name: 'Lakshmi Machine Works Limited',
    trade_name: 'LMW Foundry Division Coimbatore',
    industrial_sector: 'Industrial Machinery & Precision Castings',
    verification_status: 'VERIFIED',
    contact_email: 'foundry.supply@lmw.co.in',
    contact_phone: '+91-422-3033555',
    esg_score: 85.0,
    reliability_rating: 4.6
  },
  {
    organization_id: 12,
    registration_number: '33AAACT1234K1Z5',
    legal_name: 'Tirupur Eco-Friendly Dyeing & Effluent Processing Consortium',
    trade_name: 'Tirupur CETP Consortium',
    industrial_sector: 'Textile Processing & Dyeing',
    verification_status: 'VERIFIED',
    contact_email: 'cetp.waste@tirupureco.org',
    contact_phone: '+91-421-2244550',
    esg_score: 75.0,
    reliability_rating: 4.1
  },
  {
    organization_id: 13,
    registration_number: 'L26940MH2000PLC128420',
    legal_name: 'UltraTech Cement Limited',
    trade_name: 'UltraTech Tamil Nadu Grinding Unit',
    industrial_sector: 'Cement & Building Materials',
    verification_status: 'VERIFIED',
    contact_email: 'circularmaterials@ultratech.adityabirla.com',
    contact_phone: '+91-44-27156100',
    esg_score: 90.0,
    reliability_rating: 4.9
  },
  {
    organization_id: 14,
    registration_number: 'U26942TZ2016PTC027891',
    legal_name: 'Coimbatore Eco-Thermal Cement & Co-Processing Private Limited',
    trade_name: 'Coimbatore Eco-Thermal Kilns',
    industrial_sector: 'Cement & Building Materials',
    verification_status: 'VERIFIED',
    contact_email: 'coprocessing@cbe-ecothermal.in',
    contact_phone: '+91-422-2689012',
    esg_score: 77.5,
    reliability_rating: 4.3
  },
  {
    organization_id: 15,
    registration_number: 'L27100MH1907PLC000260',
    legal_name: 'Tata Steel Limited',
    trade_name: 'Tata Steel Jamshedpur Works',
    industrial_sector: 'Metallurgy & Steel',
    verification_status: 'VERIFIED',
    contact_email: 'byproducts@tatasteel.com',
    contact_phone: '+91-657-2426821',
    esg_score: 92.5,
    reliability_rating: 5.0
  },
  {
    organization_id: 16,
    registration_number: 'L27109DL1973GOI006454',
    legal_name: 'Steel Authority of India Limited',
    trade_name: 'SAIL Rourkela Steel Plant',
    industrial_sector: 'Metallurgy & Steel',
    verification_status: 'VERIFIED',
    contact_email: 'slag.utilization@sail-rsp.co.in',
    contact_phone: '+91-661-2510018',
    esg_score: 87.0,
    reliability_rating: 4.6
  },
  {
    organization_id: 17,
    registration_number: 'L26940MH1936PLC002515',
    legal_name: 'ACC Limited',
    trade_name: 'ACC Chaibasa Cement Works',
    industrial_sector: 'Cement & Mineral Processing',
    verification_status: 'VERIFIED',
    contact_email: 'green.feedstock@acclimited.com',
    contact_phone: '+91-6582-252221',
    esg_score: 88.5,
    reliability_rating: 4.8
  },
  {
    organization_id: 18,
    registration_number: 'U26950OR2017PTC026789',
    legal_name: 'Rourkela Slag Processing & Eco-Pavers Private Limited',
    trade_name: 'Rourkela Slag Works',
    industrial_sector: 'Infrastructure & Construction Materials',
    verification_status: 'VERIFIED',
    contact_email: 'procurement@rourkelaslag.in',
    contact_phone: '+91-661-2480123',
    esg_score: 75.5,
    reliability_rating: 4.2
  }
];

/* -------------------------------------------------------------------------
 * 2. Raw Master Entity Definitions: FACILITIES (>= 16 across 4 Corridors)
 * ------------------------------------------------------------------------- */
const RAW_FACILITIES = [
  // Corridor 1: Gujarat Chemical Corridor
  {
    facility_id: 1,
    organization_id: 1,
    facility_code: 'FAC-GACL-DHJ',
    facility_name: 'GACL Dahej Chlor-Alkali & Phosphoric Plant',
    cluster_name: 'Dahej PCPIR',
    latitude: 21.7122,
    longitude: 72.5873,
    address: 'Plot No. D-II/1, Dahej PCPIR, Vagra Taluka',
    state: 'Gujarat',
    pincode: '392130'
  },
  {
    facility_id: 2,
    organization_id: 2,
    facility_code: 'FAC-NARM-BHU',
    facility_name: 'Narmada Bio-Chem SSP Fertilizer Works',
    cluster_name: 'Bharuch Industrial Estate',
    latitude: 21.7051,
    longitude: 72.9959,
    address: 'GIDC Industrial Estate, Phase II, Narmadanagar, Bharuch',
    state: 'Gujarat',
    pincode: '392001'
  },
  {
    facility_id: 3,
    organization_id: 4,
    facility_code: 'FAC-UPL-ANK',
    facility_name: 'UPL Agrochemical & Intermediates Unit',
    cluster_name: 'Ankleshwar GIDC',
    latitude: 21.6264,
    longitude: 73.0152,
    address: 'Plot 3102/560, GIDC Estate, Ankleshwar',
    state: 'Gujarat',
    pincode: '393002'
  },
  {
    facility_id: 4,
    organization_id: 3,
    facility_code: 'FAC-GSFC-VAD',
    facility_name: 'GSFC Vadodara Petrochemical Complex',
    cluster_name: 'Vadodara Petrochemical Complex',
    latitude: 22.3072,
    longitude: 73.1812,
    address: 'P.O. Fertilizernagar, Vadodara Petrochemical Complex',
    state: 'Gujarat',
    pincode: '391750'
  },
  {
    facility_id: 5,
    organization_id: 5,
    facility_code: 'FAC-DHJ-SOLV',
    facility_name: 'Dahej Eco-Solvent Recovery Terminal',
    cluster_name: 'Dahej PCPIR',
    latitude: 21.7150,
    longitude: 72.5920,
    address: 'Plot No. C-18, Dahej PCPIR Zone 2',
    state: 'Gujarat',
    pincode: '392130'
  },

  // Corridor 2: Maharashtra Automotive & Bio Belt
  {
    facility_id: 6,
    organization_id: 6,
    facility_code: 'FAC-TATA-CHK',
    facility_name: 'Tata Motors Heavy Commercial Vehicles Plant',
    cluster_name: 'Pune - Chakan MIDC',
    latitude: 18.7606,
    longitude: 73.8636,
    address: 'Plot No. A-1, Phase II, Chakan MIDC Industrial Area, Pune',
    state: 'Maharashtra',
    pincode: '410501'
  },
  {
    facility_id: 7,
    organization_id: 7,
    facility_code: 'FAC-BFORGE-PMP',
    facility_name: 'Bharat Forge Foundry & Casting Division',
    cluster_name: 'Pimpri-Chinchwad Industrial Area',
    latitude: 18.6298,
    longitude: 73.7997,
    address: 'Mundhwa-Pimpri Works, Industrial Sector, Pune',
    state: 'Maharashtra',
    pincode: '411018'
  },
  {
    facility_id: 8,
    organization_id: 8,
    facility_code: 'FAC-ECOB-TAL',
    facility_name: 'EcoBricks Precast & Pavers Facility',
    cluster_name: 'Talegaon MIDC',
    latitude: 18.7297,
    longitude: 73.6828,
    address: 'Plot 45, Talegaon Floriculture & Industrial Park, MIDC',
    state: 'Maharashtra',
    pincode: '410507'
  },
  {
    facility_id: 9,
    organization_id: 9,
    facility_code: 'FAC-PRAJ-PUN',
    facility_name: 'Praj Agro-Biomass & Bio-Refinery Center',
    cluster_name: 'Pune Industrial Area',
    latitude: 18.5204,
    longitude: 73.8567,
    address: 'Matrix Complex, Sanaswadi-Shirur Agro Corridor, Pune',
    state: 'Maharashtra',
    pincode: '411005'
  },
  {
    facility_id: 10,
    organization_id: 10,
    facility_code: 'FAC-CHAK-POLY',
    facility_name: 'Chakan Green Compostable Polymer Unit',
    cluster_name: 'Pune - Chakan MIDC',
    latitude: 18.7750,
    longitude: 73.8710,
    address: 'Plot No. E-22, Phase III, Chakan Industrial Area',
    state: 'Maharashtra',
    pincode: '410501'
  },

  // Corridor 3: Tamil Nadu Manufacturing Hub
  {
    facility_id: 11,
    organization_id: 11,
    facility_code: 'FAC-LMW-CBE',
    facility_name: 'LMW Foundries & Precision Castings Unit',
    cluster_name: 'Coimbatore Foundry & Pump Hub',
    latitude: 11.0168,
    longitude: 76.9558,
    address: 'Periyanaickenpalayam, Coimbatore Foundry Cluster',
    state: 'Tamil Nadu',
    pincode: '641020'
  },
  {
    facility_id: 12,
    organization_id: 12,
    facility_code: 'FAC-TRPR-CETP',
    facility_name: 'Tirupur Central Effluent Treatment Plant (CETP)',
    cluster_name: 'Tirupur Textile Processing Cluster',
    latitude: 11.1085,
    longitude: 77.3411,
    address: 'Kunnangalpalayam CETP, Arulpuram Post, Tirupur',
    state: 'Tamil Nadu',
    pincode: '641604'
  },
  {
    facility_id: 13,
    organization_id: 13,
    facility_code: 'FAC-ULTR-SRP',
    facility_name: 'UltraTech Sriperumbudur Grinding Plant',
    cluster_name: 'Sriperumbudur Industrial Corridor',
    latitude: 12.9675,
    longitude: 79.9482,
    address: 'SIPCOT Industrial Park, Sriperumbudur-Oragadam Corridor',
    state: 'Tamil Nadu',
    pincode: '602105'
  },
  {
    facility_id: 14,
    organization_id: 14,
    facility_code: 'FAC-CBE-ECO',
    facility_name: 'Coimbatore Eco-Thermal Kilns & Grinding Unit',
    cluster_name: 'Coimbatore Foundry & Pump Hub',
    latitude: 10.9850,
    longitude: 76.9720,
    address: 'Madukkarai Industrial Belt, Coimbatore',
    state: 'Tamil Nadu',
    pincode: '641008'
  },

  // Corridor 4: Eastern Mineral & Metallurgy Cluster
  {
    facility_id: 15,
    organization_id: 15,
    facility_code: 'FAC-TATA-JAM',
    facility_name: 'Tata Steel Jamshedpur Works (Blast Furnace Unit)',
    cluster_name: 'Jamshedpur Steel Zone',
    latitude: 22.8046,
    longitude: 86.2029,
    address: 'Tata Main Works, Bistupur, Jamshedpur',
    state: 'Jharkhand',
    pincode: '831001'
  },
  {
    facility_id: 16,
    organization_id: 16,
    facility_code: 'FAC-SAIL-ROU',
    facility_name: 'SAIL Rourkela Integrated Steel Plant',
    cluster_name: 'Rourkela Steel Corridor',
    latitude: 22.2604,
    longitude: 84.8536,
    address: 'Rourkela Steel Plant Premises, Rourkela',
    state: 'Odisha',
    pincode: '769011'
  },
  {
    facility_id: 17,
    organization_id: 17,
    facility_code: 'FAC-ACC-CHB',
    facility_name: 'ACC Chaibasa Cement Works',
    cluster_name: 'Chaibasa Cement / Mineral Zone',
    latitude: 22.5532,
    longitude: 85.8086,
    address: 'Jhinkpani Works, Chaibasa Mining & Industrial Area',
    state: 'Jharkhand',
    pincode: '833201'
  },
  {
    facility_id: 18,
    organization_id: 18,
    facility_code: 'FAC-ROU-SLAG',
    facility_name: 'Rourkela Slag Processing & Concrete Unit',
    cluster_name: 'Rourkela Steel Corridor',
    latitude: 22.2450,
    longitude: 84.8700,
    address: 'Kalunga Industrial Estate, Rourkela',
    state: 'Odisha',
    pincode: '769004'
  }
];

/* -------------------------------------------------------------------------
 * 3. Raw Master Entity Definitions: MATERIAL_CATALOG (>= 8 Items)
 * ------------------------------------------------------------------------- */
const RAW_MATERIALS = [
  {
    material_id: 1,
    material_code: 'MAT-SULF-ACID',
    material_name: 'Spent Sulfuric Acid',
    primary_category: 'CHEMICAL_SPENT_ACID',
    physical_state: 'LIQUID',
    default_hazard_tier: 'HAZARDOUS_CLASS_A',
    carbon_offset_factor_kg_per_unit: 285.50,
    landfill_diversion_factor_tons_per_unit: 1.00,
    standard_unit: 'MT'
  },
  {
    material_id: 2,
    material_code: 'MAT-PHOSPHO-GYP',
    material_name: 'Phosphogypsum (Chemical Grade CaSO4·2H2O)',
    primary_category: 'MINERAL_RESIDUE',
    physical_state: 'SOLID',
    default_hazard_tier: 'NON_HAZARDOUS',
    carbon_offset_factor_kg_per_unit: 140.20,
    landfill_diversion_factor_tons_per_unit: 1.00,
    standard_unit: 'MT'
  },
  {
    material_id: 3,
    material_code: 'MAT-SLAG-GGBS',
    material_name: 'Blast Furnace Slag (GGBS Grade)',
    primary_category: 'METALLURGICAL_BYPRODUCT',
    physical_state: 'SOLID',
    default_hazard_tier: 'NON_HAZARDOUS',
    carbon_offset_factor_kg_per_unit: 780.00,
    landfill_diversion_factor_tons_per_unit: 1.00,
    standard_unit: 'MT'
  },
  {
    material_id: 4,
    material_code: 'MAT-FOUNDRY-SAND',
    material_name: 'Spent Foundry Silica Sand',
    primary_category: 'MINERAL_RESIDUE',
    physical_state: 'SOLID',
    default_hazard_tier: 'NON_HAZARDOUS',
    carbon_offset_factor_kg_per_unit: 55.40,
    landfill_diversion_factor_tons_per_unit: 1.00,
    standard_unit: 'MT'
  },
  {
    material_id: 5,
    material_code: 'MAT-SUGAR-BAGASSE',
    material_name: 'Sugarcane Bagasse Cellulose Biomass',
    primary_category: 'ORGANIC_BIOMASS',
    physical_state: 'SOLID',
    default_hazard_tier: 'NON_HAZARDOUS',
    carbon_offset_factor_kg_per_unit: 420.00,
    landfill_diversion_factor_tons_per_unit: 0.95,
    standard_unit: 'MT'
  },
  {
    material_id: 6,
    material_code: 'MAT-TEXTILE-SLUDGE',
    material_name: 'De-watered Textile Effluent Treatment Sludge',
    primary_category: 'INDUSTRIAL_SLUDGE',
    physical_state: 'SOLID',
    default_hazard_tier: 'NON_HAZARDOUS',
    carbon_offset_factor_kg_per_unit: 195.00,
    landfill_diversion_factor_tons_per_unit: 1.00,
    standard_unit: 'MT'
  },
  {
    material_id: 7,
    material_code: 'MAT-FLY-ASH',
    material_name: 'Class F Pulverized Fuel Fly Ash',
    primary_category: 'MINERAL_RESIDUE',
    physical_state: 'SOLID',
    default_hazard_tier: 'NON_HAZARDOUS',
    carbon_offset_factor_kg_per_unit: 820.00,
    landfill_diversion_factor_tons_per_unit: 1.00,
    standard_unit: 'MT'
  },
  {
    material_id: 8,
    material_code: 'MAT-RECOV-SOLVENT',
    material_name: 'Recovered Mixed Industrial Solvents',
    primary_category: 'RECOVERED_ORGANICS',
    physical_state: 'LIQUID',
    default_hazard_tier: 'HAZARDOUS_CLASS_B',
    carbon_offset_factor_kg_per_unit: 610.00,
    landfill_diversion_factor_tons_per_unit: 1.00,
    standard_unit: 'MT'
  }
];

/* -------------------------------------------------------------------------
 * 4. Raw Operational Definitions: BYPRODUCT_LISTINGS (>= 12 Supply Listings)
 * ------------------------------------------------------------------------- */
const RAW_LISTINGS = [
  {
    listing_id: 1,
    facility_id: 1, // GACL Dahej
    material_id: 1, // Spent Sulfuric Acid
    listing_code: 'LST-GACL-SA-01',
    title: 'Dahej Spent Sulfuric Acid (82% H2SO4)',
    description: 'Concentrated industrial spent acid stream from chlorine drying and sulfonation operations, ready for fertilizer neutralization.',
    physical_state: 'LIQUID',
    hazard_tier: 'HAZARDOUS_CLASS_A',
    chemical_composition: JSON.stringify({ H2SO4: 82.5, H2O: 16.2, trace_organics: 0.8, heavy_metals_ppm: 45 }),
    purity_percentage: 82.5,
    total_quantity: 1500.0,
    available_quantity: 1200.0,
    quantity_unit: 'MT',
    price_per_unit_inr: 1800.0,
    minimum_order_quantity: 25.0,
    available_from: '2026-01-01',
    available_until: '2026-12-31',
    status: 'ACTIVE'
  },
  {
    listing_id: 2,
    facility_id: 1, // GACL Dahej
    material_id: 2, // Phosphogypsum
    listing_code: 'LST-GACL-PG-01',
    title: 'Dahej Phosphogypsum Byproduct',
    description: 'High-purity calcium sulfate dihydrate cake generated from phosphoric acid manufacturing, ideal for Portland Pozzolana cement.',
    physical_state: 'SOLID',
    hazard_tier: 'NON_HAZARDOUS',
    chemical_composition: JSON.stringify({ CaSO4_2H2O: 92.0, SiO2: 2.8, P2O5: 0.9, moisture: 4.3 }),
    purity_percentage: 92.0,
    total_quantity: 5000.0,
    available_quantity: 4500.0,
    quantity_unit: 'MT',
    price_per_unit_inr: 450.0,
    minimum_order_quantity: 100.0,
    available_from: '2026-01-01',
    available_until: '2026-12-31',
    status: 'ACTIVE'
  },
  {
    listing_id: 3,
    facility_id: 15, // Tata Steel Jamshedpur
    material_id: 3, // GGBS Slag
    listing_code: 'LST-TATAS-SLAG-01',
    title: 'Jamshedpur Granulated Blast Furnace Slag',
    description: 'Rapidly water-quenched glassy granulated blast furnace slag for high-durability slag cement and ready-mix concrete.',
    physical_state: 'SOLID',
    hazard_tier: 'NON_HAZARDOUS',
    chemical_composition: JSON.stringify({ CaO: 41.5, SiO2: 35.2, Al2O3: 14.1, MgO: 7.2, Fe2O3: 0.8 }),
    purity_percentage: 96.0,
    total_quantity: 12000.0,
    available_quantity: 10000.0,
    quantity_unit: 'MT',
    price_per_unit_inr: 1250.0,
    minimum_order_quantity: 200.0,
    available_from: '2026-01-01',
    available_until: '2026-12-31',
    status: 'ACTIVE'
  },
  {
    listing_id: 4,
    facility_id: 7, // Bharat Forge Pimpri
    material_id: 4, // Foundry Sand
    listing_code: 'LST-BFORGE-FS-01',
    title: 'Chakan Reclaimed Foundry Silica Sand',
    description: 'Thermal and mechanically reclaimed casting foundry sand suitable for concrete blocks, paving bricks, and geotechnical fill.',
    physical_state: 'SOLID',
    hazard_tier: 'NON_HAZARDOUS',
    chemical_composition: JSON.stringify({ SiO2: 94.2, Al2O3: 2.1, Fe2O3: 1.2, clay_content: 1.5, loss_on_ignition: 1.0 }),
    purity_percentage: 94.2,
    total_quantity: 2500.0,
    available_quantity: 2200.0,
    quantity_unit: 'MT',
    price_per_unit_inr: 650.0,
    minimum_order_quantity: 30.0,
    available_from: '2026-01-01',
    available_until: '2026-12-31',
    status: 'ACTIVE'
  },
  {
    listing_id: 5,
    facility_id: 9, // Praj Pune
    material_id: 5, // Bagasse
    listing_code: 'LST-PRAJ-BAG-01',
    title: 'Pune Processed Sugarcane Bagasse Biomass',
    description: 'Depithed, sun-dried high-cellulose sugarcane bagasse fiber bale for biodegradable tableware and biocomposite moulding.',
    physical_state: 'SOLID',
    hazard_tier: 'NON_HAZARDOUS',
    chemical_composition: JSON.stringify({ cellulose: 45.0, hemicellulose: 26.0, lignin: 20.0, ash: 3.0, moisture: 6.0 }),
    purity_percentage: 88.0,
    total_quantity: 4000.0,
    available_quantity: 3500.0,
    quantity_unit: 'MT',
    price_per_unit_inr: 2100.0,
    minimum_order_quantity: 50.0,
    available_from: '2026-01-01',
    available_until: '2026-12-31',
    status: 'ACTIVE'
  },
  {
    listing_id: 6,
    facility_id: 12, // Tirupur CETP
    material_id: 6, // Textile Sludge
    listing_code: 'LST-TRPR-SLUDGE-01',
    title: 'Tirupur CETP Neutralized Textile Sludge',
    description: 'Solar-dried and filter-pressed industrial textile wastewater sludge, tested non-hazardous, suitable as calorific cement kiln feedstock.',
    physical_state: 'SOLID',
    hazard_tier: 'NON_HAZARDOUS',
    chemical_composition: JSON.stringify({ calcium_carbonate: 52.0, organic_carbon: 22.0, silicates: 14.0, moisture: 12.0 }),
    purity_percentage: 85.0,
    total_quantity: 1800.0,
    available_quantity: 1400.0,
    quantity_unit: 'MT',
    price_per_unit_inr: 300.0,
    minimum_order_quantity: 20.0,
    available_from: '2026-01-01',
    available_until: '2026-12-31',
    status: 'ACTIVE'
  },
  {
    listing_id: 7,
    facility_id: 3, // UPL Ankleshwar
    material_id: 8, // Recovered Solvents
    listing_code: 'LST-UPL-SOLV-01',
    title: 'Ankleshwar Recovered Mixed Organic Solvent',
    description: 'Fractionally distilled aromatic and aliphatic solvent blend suitable for cleaning, coatings, and secondary resin formulations.',
    physical_state: 'LIQUID',
    hazard_tier: 'HAZARDOUS_CLASS_B',
    chemical_composition: JSON.stringify({ toluene: 48.0, xylene: 32.0, isopropanol: 11.5, moisture: 8.5 }),
    purity_percentage: 91.5,
    total_quantity: 800.0,
    available_quantity: 650.0,
    quantity_unit: 'MT',
    price_per_unit_inr: 14500.0,
    minimum_order_quantity: 15.0,
    available_from: '2026-01-01',
    available_until: '2026-12-31',
    status: 'ACTIVE'
  },
  {
    listing_id: 8,
    facility_id: 16, // SAIL Rourkela
    material_id: 3, // GGBS Slag
    listing_code: 'LST-SAIL-SLAG-01',
    title: 'Rourkela Granulated Blast Furnace Slag',
    description: 'Ironmaking blast furnace slag granulated with high-pressure water jets, compliant with IS 12089 specifications for cement manufacture.',
    physical_state: 'SOLID',
    hazard_tier: 'NON_HAZARDOUS',
    chemical_composition: JSON.stringify({ CaO: 40.2, SiO2: 36.1, Al2O3: 13.8, MgO: 7.9, Fe2O3: 1.1 }),
    purity_percentage: 94.8,
    total_quantity: 8500.0,
    available_quantity: 7200.0,
    quantity_unit: 'MT',
    price_per_unit_inr: 1180.0,
    minimum_order_quantity: 150.0,
    available_from: '2026-01-01',
    available_until: '2026-12-31',
    status: 'ACTIVE'
  },
  {
    listing_id: 9,
    facility_id: 4, // GSFC Vadodara
    material_id: 1, // Spent Sulfuric Acid
    listing_code: 'LST-GSFC-SA-01',
    title: 'Vadodara Concentrated Spent Acid Byproduct',
    description: 'Spent acid stream from caprolactam and polymer synthesis facilities with uniform acidity for fertilizer manufacturing.',
    physical_state: 'LIQUID',
    hazard_tier: 'HAZARDOUS_CLASS_A',
    chemical_composition: JSON.stringify({ H2SO4: 79.0, H2O: 19.5, trace_metals: 1.5 }),
    purity_percentage: 79.0,
    total_quantity: 2000.0,
    available_quantity: 1600.0,
    quantity_unit: 'MT',
    price_per_unit_inr: 1650.0,
    minimum_order_quantity: 30.0,
    available_from: '2026-01-01',
    available_until: '2026-12-31',
    status: 'ACTIVE'
  },
  {
    listing_id: 10,
    facility_id: 11, // LMW Coimbatore
    material_id: 4, // Foundry Sand
    listing_code: 'LST-LMW-SAND-01',
    title: 'Coimbatore Reclaimed Cast Foundry Silica Sand',
    description: 'High-silica recovered foundry sand from cast-iron casting processes, washed and sieved for ready-mix infrastructure applications.',
    physical_state: 'SOLID',
    hazard_tier: 'NON_HAZARDOUS',
    chemical_composition: JSON.stringify({ SiO2: 93.5, Al2O3: 2.8, Fe2O3: 1.4, moisture: 1.2, binder_burnout: 1.1 }),
    purity_percentage: 93.5,
    total_quantity: 3200.0,
    available_quantity: 2800.0,
    quantity_unit: 'MT',
    price_per_unit_inr: 620.0,
    minimum_order_quantity: 40.0,
    available_from: '2026-01-01',
    available_until: '2026-12-31',
    status: 'ACTIVE'
  },
  {
    listing_id: 11,
    facility_id: 15, // Tata Steel Jamshedpur
    material_id: 7, // Fly Ash
    listing_code: 'LST-TATA-FA-01',
    title: 'Jamshedpur Captive Thermal Fly Ash (Class F)',
    description: 'Dry electrostatically precipitated Class F siliceous fly ash from captive power generation, conforming to IS 3812 Part 1 standards.',
    physical_state: 'SOLID',
    hazard_tier: 'NON_HAZARDOUS',
    chemical_composition: JSON.stringify({ SiO2: 58.2, Al2O3: 24.5, Fe2O3: 6.8, CaO: 3.5, unburnt_carbon: 2.2 }),
    purity_percentage: 95.0,
    total_quantity: 15000.0,
    available_quantity: 13500.0,
    quantity_unit: 'MT',
    price_per_unit_inr: 350.0,
    minimum_order_quantity: 250.0,
    available_from: '2026-01-01',
    available_until: '2026-12-31',
    status: 'ACTIVE'
  },
  {
    listing_id: 12,
    facility_id: 5, // Dahej Solvent Recovery
    material_id: 8, // Recovered Solvents
    listing_code: 'LST-DAHEJ-SOLV-01',
    title: 'Dahej Distilled Recovered Solvents',
    description: 'High-purity secondary recovered ethyl acetate and acetone distillation fractions for industrial degreasing and formulations.',
    physical_state: 'LIQUID',
    hazard_tier: 'HAZARDOUS_CLASS_B',
    chemical_composition: JSON.stringify({ acetone: 42.0, ethyl_acetate: 38.0, ethanol: 13.0, water: 7.0 }),
    purity_percentage: 93.0,
    total_quantity: 600.0,
    available_quantity: 500.0,
    quantity_unit: 'MT',
    price_per_unit_inr: 15800.0,
    minimum_order_quantity: 10.0,
    available_from: '2026-01-01',
    available_until: '2026-12-31',
    status: 'ACTIVE'
  },
  {
    listing_id: 13,
    facility_id: 10, // Chakan Green Polymer
    material_id: 5, // Bagasse
    listing_code: 'LST-CHAKAN-POLY-01',
    title: 'Chakan Refined Sugarcane Fiber Biomass',
    description: 'Micro-ground cellulose rich byproduct fiber flour suitable for thermoplastic compounding and organic filler applications.',
    physical_state: 'SOLID',
    hazard_tier: 'NON_HAZARDOUS',
    chemical_composition: JSON.stringify({ cellulose: 48.0, hemicellulose: 28.0, lignin: 18.0, ash: 2.5, moisture: 3.5 }),
    purity_percentage: 90.0,
    total_quantity: 1200.0,
    available_quantity: 950.0,
    quantity_unit: 'MT',
    price_per_unit_inr: 2350.0,
    minimum_order_quantity: 25.0,
    available_from: '2026-01-01',
    available_until: '2026-12-31',
    status: 'ACTIVE'
  },
  {
    listing_id: 14,
    facility_id: 4, // GSFC Vadodara
    material_id: 7, // Fly Ash
    listing_code: 'LST-VADOD-FA-01',
    title: 'Vadodara Industrial Utility Fly Ash',
    description: 'Coarse and fine blended thermal fly ash for ready-mix highway sub-base stabilization and interlocking paver bricks.',
    physical_state: 'SOLID',
    hazard_tier: 'NON_HAZARDOUS',
    chemical_composition: JSON.stringify({ SiO2: 54.0, Al2O3: 26.0, Fe2O3: 7.5, CaO: 4.1, unburnt_carbon: 3.4 }),
    purity_percentage: 91.0,
    total_quantity: 6000.0,
    available_quantity: 5000.0,
    quantity_unit: 'MT',
    price_per_unit_inr: 380.0,
    minimum_order_quantity: 100.0,
    available_from: '2026-01-01',
    available_until: '2026-12-31',
    status: 'ACTIVE'
  }
];

/* -------------------------------------------------------------------------
 * 5. Raw Operational Definitions: DEMAND_REQUIREMENTS (>= 10 Demands)
 * ------------------------------------------------------------------------- */
const RAW_DEMANDS = [
  {
    demand_id: 1,
    facility_id: 2, // Narmada Bio-Chem Bharuch
    material_id: 1, // Spent Sulfuric Acid
    demand_code: 'DMD-NARM-SA-01',
    title: 'Bharuch SSP Fertilizer Spent Sulfuric Acid Offtake',
    required_physical_state: 'LIQUID',
    minimum_purity_percentage: 75.0,
    acceptable_hazard_tiers: JSON.stringify(['HAZARDOUS_CLASS_A', 'HAZARDOUS_CLASS_B', 'NON_HAZARDOUS']),
    required_quantity: 1000.0,
    quantity_unit: 'MT',
    max_price_per_unit_inr: 2200.0,
    frequency: 'MONTHLY',
    max_logistics_distance_km: 150.0,
    status: 'OPEN'
  },
  {
    demand_id: 2,
    facility_id: 17, // ACC Chaibasa
    material_id: 2, // Phosphogypsum
    demand_code: 'DMD-ACC-PG-01',
    title: 'Chaibasa Cement Pozzolana Gypsum Offtake',
    required_physical_state: 'SOLID',
    minimum_purity_percentage: 85.0,
    acceptable_hazard_tiers: JSON.stringify(['NON_HAZARDOUS']),
    required_quantity: 3000.0,
    quantity_unit: 'MT',
    max_price_per_unit_inr: 600.0,
    frequency: 'MONTHLY',
    max_logistics_distance_km: 1400.0,
    status: 'OPEN'
  },
  {
    demand_id: 3,
    facility_id: 17, // ACC Chaibasa
    material_id: 3, // GGBS Slag
    demand_code: 'DMD-ACC-GGBS-01',
    title: 'Chaibasa Slag Cement Grinding Feedstock Offtake',
    required_physical_state: 'SOLID',
    minimum_purity_percentage: 90.0,
    acceptable_hazard_tiers: JSON.stringify(['NON_HAZARDOUS']),
    required_quantity: 8000.0,
    quantity_unit: 'MT',
    max_price_per_unit_inr: 1400.0,
    frequency: 'CONTINUOUS',
    max_logistics_distance_km: 120.0,
    status: 'OPEN'
  },
  {
    demand_id: 4,
    facility_id: 8, // EcoBricks Talegaon
    material_id: 4, // Foundry Sand
    demand_code: 'DMD-ECOB-FS-01',
    title: 'Talegaon Precast Paver Sand Requirement',
    required_physical_state: 'SOLID',
    minimum_purity_percentage: 88.0,
    acceptable_hazard_tiers: JSON.stringify(['NON_HAZARDOUS']),
    required_quantity: 1500.0,
    quantity_unit: 'MT',
    max_price_per_unit_inr: 750.0,
    frequency: 'MONTHLY',
    max_logistics_distance_km: 80.0,
    status: 'OPEN'
  },
  {
    demand_id: 5,
    facility_id: 10, // Chakan Green Polymer
    material_id: 5, // Bagasse
    demand_code: 'DMD-CHAK-BAG-01',
    title: 'Chakan Bio-Compostable Packaging Fiber Feedstock',
    required_physical_state: 'SOLID',
    minimum_purity_percentage: 80.0,
    acceptable_hazard_tiers: JSON.stringify(['NON_HAZARDOUS']),
    required_quantity: 2000.0,
    quantity_unit: 'MT',
    max_price_per_unit_inr: 2500.0,
    frequency: 'MONTHLY',
    max_logistics_distance_km: 150.0,
    status: 'OPEN'
  },
  {
    demand_id: 6,
    facility_id: 14, // Coimbatore Eco-Thermal
    material_id: 6, // Textile Sludge
    demand_code: 'DMD-CBE-SLUDGE-01',
    title: 'Coimbatore Cement Kiln Co-Processing Alternative Fuel',
    required_physical_state: 'SOLID',
    minimum_purity_percentage: 75.0,
    acceptable_hazard_tiers: JSON.stringify(['NON_HAZARDOUS', 'HAZARDOUS_CLASS_B']),
    required_quantity: 1200.0,
    quantity_unit: 'MT',
    max_price_per_unit_inr: 450.0,
    frequency: 'MONTHLY',
    max_logistics_distance_km: 100.0,
    status: 'OPEN'
  },
  {
    demand_id: 7,
    facility_id: 13, // UltraTech Sriperumbudur
    material_id: 7, // Fly Ash
    demand_code: 'DMD-ULTRAT-FA-01',
    title: 'Sriperumbudur Pozzolanic Fly Ash Ingestion',
    required_physical_state: 'SOLID',
    minimum_purity_percentage: 88.0,
    acceptable_hazard_tiers: JSON.stringify(['NON_HAZARDOUS']),
    required_quantity: 5000.0,
    quantity_unit: 'MT',
    max_price_per_unit_inr: 550.0,
    frequency: 'MONTHLY',
    max_logistics_distance_km: 600.0,
    status: 'OPEN'
  },
  {
    demand_id: 8,
    facility_id: 3, // UPL Ankleshwar
    material_id: 8, // Recovered Solvents
    demand_code: 'DMD-UPL-SOLV-01',
    title: 'Ankleshwar Distilled Solvent Feedstock Offtake',
    required_physical_state: 'LIQUID',
    minimum_purity_percentage: 88.0,
    acceptable_hazard_tiers: JSON.stringify(['HAZARDOUS_CLASS_B', 'NON_HAZARDOUS']),
    required_quantity: 400.0,
    quantity_unit: 'MT',
    max_price_per_unit_inr: 17000.0,
    frequency: 'MONTHLY',
    max_logistics_distance_km: 100.0,
    status: 'OPEN'
  },
  {
    demand_id: 9,
    facility_id: 18, // Rourkela Slag Works
    material_id: 3, // GGBS Slag
    demand_code: 'DMD-ROUR-GGBS-01',
    title: 'Rourkela Slag Precast & Concrete Feedstock',
    required_physical_state: 'SOLID',
    minimum_purity_percentage: 92.0,
    acceptable_hazard_tiers: JSON.stringify(['NON_HAZARDOUS']),
    required_quantity: 6000.0,
    quantity_unit: 'MT',
    max_price_per_unit_inr: 1300.0,
    frequency: 'CONTINUOUS',
    max_logistics_distance_km: 60.0,
    status: 'OPEN'
  },
  {
    demand_id: 10,
    facility_id: 2, // Narmada Bio-Chem Bharuch
    material_id: 1, // Spent Sulfuric Acid
    demand_code: 'DMD-NARM-SA-02',
    title: 'Bharuch Secondary Alum & Acid Requirement',
    required_physical_state: 'LIQUID',
    minimum_purity_percentage: 78.0,
    acceptable_hazard_tiers: JSON.stringify(['HAZARDOUS_CLASS_A', 'HAZARDOUS_CLASS_B']),
    required_quantity: 800.0,
    quantity_unit: 'MT',
    max_price_per_unit_inr: 2000.0,
    frequency: 'MONTHLY',
    max_logistics_distance_km: 120.0,
    status: 'OPEN'
  },
  {
    demand_id: 11,
    facility_id: 8, // EcoBricks Talegaon
    material_id: 4, // Foundry Sand
    demand_code: 'DMD-ECOB-SAND-02',
    title: 'Talegaon High-Purity Silica Paver Grade Requirement',
    required_physical_state: 'SOLID',
    minimum_purity_percentage: 90.0,
    acceptable_hazard_tiers: JSON.stringify(['NON_HAZARDOUS']),
    required_quantity: 1000.0,
    quantity_unit: 'MT',
    max_price_per_unit_inr: 720.0,
    frequency: 'MONTHLY',
    max_logistics_distance_km: 200.0,
    status: 'OPEN'
  },
  {
    demand_id: 12,
    facility_id: 17, // ACC Chaibasa
    material_id: 7, // Fly Ash
    demand_code: 'DMD-ACC-FA-01',
    title: 'Chaibasa Blended Cement Fly Ash Offtake',
    required_physical_state: 'SOLID',
    minimum_purity_percentage: 90.0,
    acceptable_hazard_tiers: JSON.stringify(['NON_HAZARDOUS']),
    required_quantity: 10000.0,
    quantity_unit: 'MT',
    max_price_per_unit_inr: 450.0,
    frequency: 'CONTINUOUS',
    max_logistics_distance_km: 150.0,
    status: 'OPEN'
  }
];

/* -------------------------------------------------------------------------
 * 6. Generate Pre-Validated Seed Entities
 * ------------------------------------------------------------------------- */

// Pre-validate Organizations
export const ORGANIZATIONS = Object.freeze(RAW_ORGANIZATIONS.map(org => validateOrganization(org)));

// Pre-validate Facilities
export const FACILITIES = Object.freeze(RAW_FACILITIES.map(fac => validateFacility(fac)));

// Pre-validate Materials
export const MATERIALS = Object.freeze(RAW_MATERIALS.map(mat => validateMaterial(mat)));

// Pre-validate Listings
export const LISTINGS = Object.freeze(RAW_LISTINGS.map(lst => validateListing(lst)));

// Pre-validate Demands
export const DEMANDS = Object.freeze(RAW_DEMANDS.map(dmd => validateDemand(dmd)));

// Helper maps for relational lookup
const FACILITY_MAP = new Map(FACILITIES.map(f => [f.facility_id, f]));
const ORG_MAP = new Map(ORGANIZATIONS.map(o => [o.organization_id, o]));
const LISTING_MAP = new Map(LISTINGS.map(l => [l.listing_id, l]));
const DEMAND_MAP = new Map(DEMANDS.map(d => [d.demand_id, d]));
const MATERIAL_MAP = new Map(MATERIALS.map(m => [m.material_id, m]));

// Match pairings definition
const MATCH_PAIR_CONFIGS = [
  { match_id: 1, supply_id: 1, demand_id: 1, status: 'MUTUALLY_ACCEPTED' },   // GACL Acid -> Narmada Bio-Chem
  { match_id: 2, supply_id: 2, demand_id: 2, status: 'PROPOSED' },            // GACL Phosphogypsum -> ACC Chaibasa
  { match_id: 3, supply_id: 3, demand_id: 3, status: 'MUTUALLY_ACCEPTED' },   // Tata Steel GGBS -> ACC Chaibasa
  { match_id: 4, supply_id: 4, demand_id: 4, status: 'MUTUALLY_ACCEPTED' },   // Bharat Forge Sand -> EcoBricks Talegaon
  { match_id: 5, supply_id: 5, demand_id: 5, status: 'MUTUALLY_ACCEPTED' },   // Praj Bagasse -> Chakan Green Polymer
  { match_id: 6, supply_id: 6, demand_id: 6, status: 'MUTUALLY_ACCEPTED' },   // Tirupur Sludge -> Coimbatore Eco-Thermal
  { match_id: 7, supply_id: 11, demand_id: 12, status: 'ACCEPTED_SUPPLIER' }, // Tata Steel Fly Ash -> ACC Chaibasa
  { match_id: 8, supply_id: 12, demand_id: 8, status: 'MUTUALLY_ACCEPTED' },  // Dahej Solvent -> UPL Ankleshwar
  { match_id: 9, supply_id: 8, demand_id: 9, status: 'ACCEPTED_BUYER' },      // SAIL Rourkela GGBS -> Rourkela Slag
  { match_id: 10, supply_id: 9, demand_id: 10, status: 'PROPOSED' }           // GSFC Acid -> Narmada Bio-Chem
];

const RAW_MATCHES = MATCH_PAIR_CONFIGS.map(cfg => {
  const supply = LISTING_MAP.get(cfg.supply_id);
  const demand = DEMAND_MAP.get(cfg.demand_id);
  const facSupply = FACILITY_MAP.get(supply.facility_id);
  const facDemand = FACILITY_MAP.get(demand.facility_id);
  const orgSupply = ORG_MAP.get(facSupply.organization_id);
  const orgDemand = ORG_MAP.get(facDemand.organization_id);

  const distanceKm = haversineDistance(
    facSupply.latitude,
    facSupply.longitude,
    facDemand.latitude,
    facDemand.longitude
  );

  const scoreResult = calculateMatchScore(
    supply,
    demand,
    distanceKm,
    orgSupply,
    orgDemand
  );

  const matchedQuantity = Math.min(supply.available_quantity, demand.required_quantity);
  const logistics = calculateLogistics(distanceKm, matchedQuantity, supply.hazard_tier);

  return {
    match_id: cfg.match_id,
    supply_listing_id: cfg.supply_id,
    demand_requirement_id: cfg.demand_id,
    match_score: scoreResult.netScore,
    score_material_compat: scoreResult.breakdown.materialScore,
    score_quantity_compat: scoreResult.breakdown.quantityScore,
    score_proximity: scoreResult.breakdown.proximityScore,
    score_esg_reliability: scoreResult.breakdown.esgScore,
    distance_km: distanceKm,
    estimated_transit_cost_inr: logistics.estimatedCostINR,
    estimated_transit_hours: logistics.transitDurationHours,
    status: cfg.status,
    rejection_reason: null,
    proposed_at: '2026-02-01T08:00:00Z',
    expires_at: '2026-06-30T23:59:59Z'
  };
});

// Pre-validate Matches (>= 8)
export const MATCHES = Object.freeze(RAW_MATCHES.map(m => validateMatch(m)));

// Raw Transactions (>= 4)
const RAW_TRANSACTIONS = [
  {
    transaction_id: 1,
    match_id: 1, // Sulfuric Acid (GACL -> Narmada)
    contract_reference: 'CTR-2026-H2SO4-001',
    agreed_quantity: 1000.0,
    agreed_price_per_unit_inr: 1750.0,
    total_transaction_value_inr: 1750000.0,
    delivery_terms: 'DAP',
    logistics_provider: 'Container Corporation of India (CONCOR) Liquid Logistics',
    status: 'SETTLED',
    created_at: '2026-02-05T10:30:00Z',
    settled_at: '2026-02-28T16:00:00Z'
  },
  {
    transaction_id: 2,
    match_id: 3, // GGBS Slag (Tata Steel -> ACC Chaibasa)
    contract_reference: 'CTR-2026-GGBS-002',
    agreed_quantity: 8000.0,
    agreed_price_per_unit_inr: 1200.0,
    total_transaction_value_inr: 9600000.0,
    delivery_terms: 'FOB',
    logistics_provider: 'TCI Freight Heavy Bulk Mineral Division',
    status: 'SETTLED',
    created_at: '2026-02-10T11:00:00Z',
    settled_at: '2026-03-05T17:30:00Z'
  },
  {
    transaction_id: 3,
    match_id: 4, // Foundry Sand (Bharat Forge -> EcoBricks)
    contract_reference: 'CTR-2026-SAND-003',
    agreed_quantity: 1500.0,
    agreed_price_per_unit_inr: 640.0,
    total_transaction_value_inr: 960000.0,
    delivery_terms: 'DAP',
    logistics_provider: 'Mahindra Logistics Industrial Fleet',
    status: 'SETTLED',
    created_at: '2026-02-15T09:15:00Z',
    settled_at: '2026-03-02T14:45:00Z'
  },
  {
    transaction_id: 4,
    match_id: 5, // Sugarcane Bagasse (Praj -> Chakan Green Polymer)
    contract_reference: 'CTR-2026-BAGASSE-004',
    agreed_quantity: 2000.0,
    agreed_price_per_unit_inr: 2050.0,
    total_transaction_value_inr: 4100000.0,
    delivery_terms: 'EXW',
    logistics_provider: 'Western Agri-Logistics Transporters',
    status: 'INSPECTED_ACCEPTED',
    created_at: '2026-02-20T14:00:00Z',
    settled_at: null
  },
  {
    transaction_id: 5,
    match_id: 6, // Textile Sludge (Tirupur -> Coimbatore Eco-Thermal)
    contract_reference: 'CTR-2026-SLUDGE-005',
    agreed_quantity: 1200.0,
    agreed_price_per_unit_inr: 280.0,
    total_transaction_value_inr: 336000.0,
    delivery_terms: 'DAP',
    logistics_provider: 'Tamil Nadu Eco-Trans Waste Fleet',
    status: 'DELIVERED',
    created_at: '2026-02-22T13:45:00Z',
    settled_at: null
  }
];

// Pre-validate Transactions (>= 4)
export const TRANSACTIONS = Object.freeze(RAW_TRANSACTIONS.map(t => validateTransaction(t)));

// Raw Sustainability Metrics (>= 4)
const RAW_METRICS = [
  {
    metric_id: 1,
    transaction_id: 1, // Sulfuric Acid (1000 MT)
    embodied_carbon_offset_kg: 285500.0, // 1000 MT * 285.5 kg/MT
    landfill_diversion_tons: 1000.0,
    circularity_coefficient: 0.88,
    water_saved_kl: 4200.0,
    recorded_at: '2026-02-28T16:30:00Z'
  },
  {
    metric_id: 2,
    transaction_id: 2, // GGBS Slag (8000 MT replacing clinker)
    embodied_carbon_offset_kg: 6240000.0, // 8000 MT * 780.0 kg/MT
    landfill_diversion_tons: 8000.0,
    circularity_coefficient: 0.94,
    water_saved_kl: 12500.0,
    recorded_at: '2026-03-05T18:00:00Z'
  },
  {
    metric_id: 3,
    transaction_id: 3, // Foundry Sand (1500 MT replacing virgin sand)
    embodied_carbon_offset_kg: 83100.0, // 1500 MT * 55.4 kg/MT
    landfill_diversion_tons: 1500.0,
    circularity_coefficient: 0.91,
    water_saved_kl: 600.0,
    recorded_at: '2026-03-02T15:00:00Z'
  },
  {
    metric_id: 4,
    transaction_id: 4, // Sugarcane Bagasse (2000 MT)
    embodied_carbon_offset_kg: 840000.0, // 2000 MT * 420.0 kg/MT
    landfill_diversion_tons: 1900.0,
    circularity_coefficient: 0.86,
    water_saved_kl: 18000.0,
    recorded_at: '2026-02-25T11:20:00Z'
  },
  {
    metric_id: 5,
    transaction_id: 5, // Textile Sludge (1200 MT)
    embodied_carbon_offset_kg: 234000.0, // 1200 MT * 195.0 kg/MT
    landfill_diversion_tons: 1200.0,
    circularity_coefficient: 0.79,
    water_saved_kl: 850.0,
    recorded_at: '2026-02-26T17:15:00Z'
  }
];

// Pre-validate Sustainability Metrics (>= 4)
export const METRICS = Object.freeze(RAW_METRICS.map(m => validateMetrics(m)));

/* -------------------------------------------------------------------------
 * 7. Database Population Engine
 * ------------------------------------------------------------------------- */

/**
 * Seeds the provided SQLite DatabaseSync instance with authentic industrial dataset.
 *
 * @param {import('node:sqlite').DatabaseSync} [db] Node.js v24 DatabaseSync instance
 * @param {object} [options] Seeding options
 * @param {boolean} [options.clean=false] If true, truncates/cleans tables before seeding
 * @param {boolean} [options.initSchema=true] If true, initializes DDL schema first
 * @param {boolean} [options.verbose=false] If true, logs step progress
 * @returns {{
 *   organizations: object[],
 *   facilities: object[],
 *   materials: object[],
 *   listings: object[],
 *   demands: object[],
 *   matches: object[],
 *   transactions: object[],
 *   metrics: object[],
 *   summary: {
 *     organizations: number,
 *     facilities: number,
 *     materials: number,
 *     listings: number,
 *     demands: number,
 *     matches: number,
 *     transactions: number,
 *     metrics: number,
 *     totalRecords: number
 *   }
 * }}
 */
export function seedDatabase(db = null, options = {}) {
  const activeDb = db ?? getDatabase(options.dbPath || ':memory:');

  if (options.initSchema !== false) {
    initSchema(activeDb);
  }

  // Idempotent seeding: clean existing tables in reverse dependency order by default
  const shouldClean = options.clean !== false;
  if (shouldClean) {
    if (options.verbose) {
      console.log('[Seed] Purging existing tables for clean idempotent seed...');
    }
    activeDb.exec(`
      DELETE FROM sustainability_metrics;
      DELETE FROM exchange_transactions;
      DELETE FROM match_proposals;
      DELETE FROM demand_requirements;
      DELETE FROM byproduct_listings;
      DELETE FROM material_catalog;
      DELETE FROM facilities;
      DELETE FROM organizations;
    `);
  }

  // Execute entire insertion within a single atomic transaction
  activeDb.exec('BEGIN TRANSACTION;');

  try {
    // 1. Insert Organizations
    const insertOrgStmt = activeDb.prepare(`
      INSERT INTO organizations (
        organization_id, registration_number, legal_name, trade_name,
        industrial_sector, verification_status, contact_email,
        contact_phone, esg_score, reliability_rating, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const org of ORGANIZATIONS) {
      insertOrgStmt.run(
        org.organization_id,
        org.registration_number,
        org.legal_name,
        org.trade_name,
        org.industrial_sector,
        org.verification_status,
        org.contact_email,
        org.contact_phone,
        org.esg_score,
        org.reliability_rating,
        org.created_at,
        org.updated_at
      );
    }

    // 2. Insert Facilities
    const insertFacStmt = activeDb.prepare(`
      INSERT INTO facilities (
        facility_id, organization_id, facility_code, facility_name,
        cluster_name, latitude, longitude, address, state, pincode, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const fac of FACILITIES) {
      insertFacStmt.run(
        fac.facility_id,
        fac.organization_id,
        fac.facility_code,
        fac.facility_name,
        fac.cluster_name,
        fac.latitude,
        fac.longitude,
        fac.address,
        fac.state,
        fac.pincode,
        fac.created_at
      );
    }

    // 3. Insert Material Catalog
    const insertMatStmt = activeDb.prepare(`
      INSERT INTO material_catalog (
        material_id, material_code, material_name, primary_category,
        physical_state, default_hazard_tier, carbon_offset_factor_kg_per_unit,
        landfill_diversion_factor_tons_per_unit, standard_unit
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const mat of MATERIALS) {
      insertMatStmt.run(
        mat.material_id,
        mat.material_code,
        mat.material_name,
        mat.primary_category,
        mat.physical_state,
        mat.default_hazard_tier,
        mat.carbon_offset_factor_kg_per_unit,
        mat.landfill_diversion_factor_tons_per_unit,
        mat.standard_unit
      );
    }

    // 4. Insert Byproduct Listings
    const insertLstStmt = activeDb.prepare(`
      INSERT INTO byproduct_listings (
        listing_id, facility_id, material_id, listing_code, title,
        description, physical_state, hazard_tier, chemical_composition,
        purity_percentage, total_quantity, available_quantity, quantity_unit,
        price_per_unit_inr, minimum_order_quantity, available_from,
        available_until, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const lst of LISTINGS) {
      insertLstStmt.run(
        lst.listing_id,
        lst.facility_id,
        lst.material_id,
        lst.listing_code,
        lst.title,
        lst.description,
        lst.physical_state,
        lst.hazard_tier,
        lst.chemical_composition,
        lst.purity_percentage,
        lst.total_quantity,
        lst.available_quantity,
        lst.quantity_unit,
        lst.price_per_unit_inr,
        lst.minimum_order_quantity,
        lst.available_from,
        lst.available_until,
        lst.status,
        lst.created_at,
        lst.updated_at
      );
    }

    // 5. Insert Demand Requirements
    const insertDmdStmt = activeDb.prepare(`
      INSERT INTO demand_requirements (
        demand_id, facility_id, material_id, demand_code, title,
        required_physical_state, minimum_purity_percentage, acceptable_hazard_tiers,
        required_quantity, quantity_unit, max_price_per_unit_inr, frequency,
        max_logistics_distance_km, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const dmd of DEMANDS) {
      insertDmdStmt.run(
        dmd.demand_id,
        dmd.facility_id,
        dmd.material_id,
        dmd.demand_code,
        dmd.title,
        dmd.required_physical_state,
        dmd.minimum_purity_percentage,
        dmd.acceptable_hazard_tiers,
        dmd.required_quantity,
        dmd.quantity_unit,
        dmd.max_price_per_unit_inr,
        dmd.frequency,
        dmd.max_logistics_distance_km,
        dmd.status,
        dmd.created_at,
        dmd.updated_at
      );
    }

    // 6. Insert Match Proposals
    const insertMtchStmt = activeDb.prepare(`
      INSERT INTO match_proposals (
        match_id, supply_listing_id, demand_requirement_id, match_score,
        score_material_compat, score_quantity_compat, score_proximity,
        score_esg_reliability, distance_km, estimated_transit_cost_inr,
        estimated_transit_hours, status, rejection_reason, proposed_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const mtch of MATCHES) {
      insertMtchStmt.run(
        mtch.match_id,
        mtch.supply_listing_id,
        mtch.demand_requirement_id,
        mtch.match_score,
        mtch.score_material_compat,
        mtch.score_quantity_compat,
        mtch.score_proximity,
        mtch.score_esg_reliability,
        mtch.distance_km,
        mtch.estimated_transit_cost_inr,
        mtch.estimated_transit_hours,
        mtch.status,
        mtch.rejection_reason,
        mtch.proposed_at,
        mtch.expires_at
      );
    }

    // 7. Insert Exchange Transactions
    const insertTxStmt = activeDb.prepare(`
      INSERT INTO exchange_transactions (
        transaction_id, match_id, contract_reference, agreed_quantity,
        agreed_price_per_unit_inr, total_transaction_value_inr, delivery_terms,
        logistics_provider, status, created_at, settled_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const tx of TRANSACTIONS) {
      insertTxStmt.run(
        tx.transaction_id,
        tx.match_id,
        tx.contract_reference,
        tx.agreed_quantity,
        tx.agreed_price_per_unit_inr,
        tx.total_transaction_value_inr,
        tx.delivery_terms,
        tx.logistics_provider,
        tx.status,
        tx.created_at,
        tx.settled_at
      );
    }

    // 8. Insert Sustainability Metrics
    const insertMetStmt = activeDb.prepare(`
      INSERT INTO sustainability_metrics (
        metric_id, transaction_id, embodied_carbon_offset_kg,
        landfill_diversion_tons, circularity_coefficient, water_saved_kl, recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const met of METRICS) {
      insertMetStmt.run(
        met.metric_id,
        met.transaction_id,
        met.embodied_carbon_offset_kg,
        met.landfill_diversion_tons,
        met.circularity_coefficient,
        met.water_saved_kl,
        met.recorded_at
      );
    }

    activeDb.exec('COMMIT;');
  } catch (err) {
    try {
      activeDb.exec('ROLLBACK;');
    } catch (_) {
      // Ignore rollback errors if transaction was not active
    }
    throw err;
  }

  const summary = {
    organizations: ORGANIZATIONS.length,
    facilities: FACILITIES.length,
    materials: MATERIALS.length,
    listings: LISTINGS.length,
    demands: DEMANDS.length,
    matches: MATCHES.length,
    transactions: TRANSACTIONS.length,
    metrics: METRICS.length,
    totalRecords:
      ORGANIZATIONS.length +
      FACILITIES.length +
      MATERIALS.length +
      LISTINGS.length +
      DEMANDS.length +
      MATCHES.length +
      TRANSACTIONS.length +
      METRICS.length
  };

  return {
    organizations: ORGANIZATIONS,
    facilities: FACILITIES,
    materials: MATERIALS,
    listings: LISTINGS,
    demands: DEMANDS,
    matches: MATCHES,
    transactions: TRANSACTIONS,
    metrics: METRICS,
    summary
  };
}
