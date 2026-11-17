/**
 * ESG & Environmental Impact Formulas Engine
 * Specialized for Industrial Symbiosis & Circular Economy Byproduct Exchanges.
 * Aligned with SEBI BRSR Core, IPCC GHG Protocol (Scope 3 Category 1 & 4),
 * and Indian industrial emission benchmarks.
 */

// Benchmark emission factors (kg CO2e avoided per metric tonne of virgin raw material displaced)
// and baseline virgin prices (₹ per metric tonne) for economic surplus computation.
const ESG_BENCHMARKS = {
  'Industrial Slag': {
    category: 'Industrial Slag',
    subtypes: ['Blast Furnace Slag', 'GGBS', 'Steel Slag', 'LD Slag'],
    co2eAvoidedPerTon: 800, // 0.8 t CO2e/t displaced Portland Clinker
    waterSavedLitersPerTon: 150,
    landfillDensityM3PerTon: 0.85,
    virginMaterialReplaced: 'Portland Clinker / Limestone',
    virginPricePerTonInr: 4500, // Avg market price of virgin clinker
    byproductDefaultPricePerTonInr: 850
  },
  'Fly Ash': {
    category: 'Fly Ash',
    subtypes: ['Class F Fly Ash', 'Class C Fly Ash', 'Bottom Ash', 'Pond Ash'],
    co2eAvoidedPerTon: 820, // 0.82 t CO2e/t clinker displaced in PPC
    waterSavedLitersPerTon: 180,
    landfillDensityM3PerTon: 0.95,
    virginMaterialReplaced: 'Ordinary Portland Cement / Clay',
    virginPricePerTonInr: 4800,
    byproductDefaultPricePerTonInr: 600
  },
  'Ferrous Scrap': {
    category: 'Ferrous Scrap',
    subtypes: ['Recycled Ferrous Scrap', 'Steel Scrap', 'Iron Scrap', 'Cast Iron Swarf'],
    co2eAvoidedPerTon: 1400, // 1.4 t CO2e/t vs primary blast-furnace virgin iron ore route
    waterSavedLitersPerTon: 1100,
    landfillDensityM3PerTon: 0.45,
    virginMaterialReplaced: 'Virgin Iron Ore Pellet / DRI',
    virginPricePerTonInr: 6500,
    byproductDefaultPricePerTonInr: 3200
  },
  'Polymers/Scrap': {
    category: 'Polymers/Scrap',
    subtypes: ['Post-Industrial HDPE/PP', 'HDPE Regrind', 'PP Granules', 'PET Flakes', 'LDPE Trim'],
    co2eAvoidedPerTon: 1500, // 1.5 t CO2e/t virgin polymer resin avoided
    waterSavedLitersPerTon: 2200,
    landfillDensityM3PerTon: 1.65, // Plastics occupy significantly more landfill volume
    virginMaterialReplaced: 'Virgin Naphtha-derived Polymer Granules',
    virginPricePerTonInr: 92000,
    byproductDefaultPricePerTonInr: 45000
  },
  'Chemical Byproduct': {
    category: 'Chemical Byproduct',
    subtypes: ['Spent Solvent', 'Hydrochloric Acid Waste', 'Spent Caustic', 'Phosphogypsum', 'Spent Acid'],
    co2eAvoidedPerTon: 650, // 0.65 t CO2e/t
    waterSavedLitersPerTon: 1200, // 1,200 L water conserved / tonne
    landfillDensityM3PerTon: 1.05,
    virginMaterialReplaced: 'Virgin Solvents / Industrial Grade Acids',
    virginPricePerTonInr: 28000,
    byproductDefaultPricePerTonInr: 8500
  },
  'Biomass / Agro Residue': {
    category: 'Biomass / Agro Residue',
    subtypes: ['Bagasse', 'Rice Husk Ash', 'Groundnut Shell Residue', 'Pressmud'],
    co2eAvoidedPerTon: 950, // Avoids open burning and replaces coal in boilers
    waterSavedLitersPerTon: 400,
    landfillDensityM3PerTon: 1.80,
    virginMaterialReplaced: 'Thermal Coal (Steam Coal)',
    virginPricePerTonInr: 8000,
    byproductDefaultPricePerTonInr: 2500
  },
  'Foundry & Mineral Waste': {
    category: 'Foundry & Mineral Waste',
    subtypes: ['Spent Foundry Sand', 'Bauxite Residue / Red Mud', 'Silica Fume'],
    co2eAvoidedPerTon: 450,
    waterSavedLitersPerTon: 300,
    landfillDensityM3PerTon: 0.75,
    virginMaterialReplaced: 'Virgin River Sand / Silica Aggregate',
    virginPricePerTonInr: 2400,
    byproductDefaultPricePerTonInr: 400
  }
};

// Default fallback factor for unlisted byproducts
const DEFAULT_FACTOR = {
  category: 'General Industrial Byproduct',
  subtypes: [],
  co2eAvoidedPerTon: 600,
  waterSavedLitersPerTon: 500,
  landfillDensityM3PerTon: 1.0,
  virginMaterialReplaced: 'Virgin Industrial Raw Materials',
  virginPricePerTonInr: 5000,
  byproductDefaultPricePerTonInr: 1200
};

// Freight Transport Emission Factor (Heavy-duty diesel road truck: ~0.082 kg CO2e / ton-km)
const FREIGHT_EMISSION_FACTOR_KG_PER_TON_KM = 0.082;

// Annual carbon absorption of 1 mature tree: ~21.77 kg CO2 / year
const KG_CO2_PER_TREE_YEAR = 21.77;

/**
 * Resolves the benchmark entry based on material name or category string
 */
function resolveBenchmark(categoryOrMaterial) {
  if (!categoryOrMaterial) return DEFAULT_FACTOR;

  const target = categoryOrMaterial.toLowerCase();

  for (const [key, benchmark] of Object.entries(ESG_BENCHMARKS)) {
    if (key.toLowerCase() === target) return benchmark;
    if (benchmark.category.toLowerCase().includes(target) || target.includes(benchmark.category.toLowerCase())) {
      return benchmark;
    }
    const matchedSubtype = benchmark.subtypes.find(s => 
      s.toLowerCase().includes(target) || target.includes(s.toLowerCase())
    );
    if (matchedSubtype) return benchmark;
  }

  // Keywords heuristics
  if (target.includes('slag') || target.includes('clinker')) return ESG_BENCHMARKS['Industrial Slag'];
  if (target.includes('ash')) return ESG_BENCHMARKS['Fly Ash'];
  if (target.includes('steel') || target.includes('iron') || target.includes('ferrous') || target.includes('metal')) return ESG_BENCHMARKS['Ferrous Scrap'];
  if (target.includes('polymer') || target.includes('hdpe') || target.includes('pp') || target.includes('plastic') || target.includes('resin')) return ESG_BENCHMARKS['Polymers/Scrap'];
  if (target.includes('chemical') || target.includes('solvent') || target.includes('acid') || target.includes('caustic')) return ESG_BENCHMARKS['Chemical Byproduct'];
  if (target.includes('biomass') || target.includes('husk') || target.includes('bagasse')) return ESG_BENCHMARKS['Biomass / Agro Residue'];
  if (target.includes('sand') || target.includes('mud') || target.includes('silica')) return ESG_BENCHMARKS['Foundry & Mineral Waste'];

  return DEFAULT_FACTOR;
}

/**
 * Calculates environmental and economic impact metrics for an exchange
 * 
 * @param {Object} params
 * @param {string} params.material - Material name (e.g. "Blast Furnace Slag")
 * @param {string} params.materialCategory - Category (e.g. "Industrial Slag")
 * @param {number} params.quantityTons - Volume in metric tonnes
 * @param {number} [params.distanceKm=0] - Haversine transport distance in km
 * @param {number} [params.agreedPricePerTon] - Actual agreed price / ton
 * @returns {Object} Comprehensive ESG metrics object
 */
function calculateDealImpact({
  material,
  materialCategory,
  quantityTons = 0,
  distanceKm = 0,
  agreedPricePerTon = null
}) {
  const tons = Number(quantityTons) || 0;
  const dist = Number(distanceKm) || 0;
  const benchmark = resolveBenchmark(materialCategory || material);

  // 1. Gross CO2e avoided from displacing virgin extraction/processing (kg and tonnes)
  const grossCo2eAvoidedKg = Math.round(tons * benchmark.co2eAvoidedPerTon);
  const grossCo2eAvoidedTons = Number((grossCo2eAvoidedKg / 1000).toFixed(2));

  // 2. Transport Scope 3 emissions (diesel freight)
  const transportCo2eKg = Math.round(tons * dist * FREIGHT_EMISSION_FACTOR_KG_PER_TON_KM);
  const transportCo2eTons = Number((transportCo2eKg / 1000).toFixed(2));

  // 3. Net CO2e avoided (Gross - Transport emissions)
  const netCo2AvoidedKg = Math.max(0, grossCo2eAvoidedKg - transportCo2eKg);
  const netCo2AvoidedTons = Number((netCo2AvoidedKg / 1000).toFixed(2));

  // 4. Water conserved (Litres)
  const waterSavedLitres = Math.round(tons * benchmark.waterSavedLitersPerTon);

  // 5. Landfill volume diverted (Cubic Metres m³)
  const landfillVolumeSavedM3 = Number((tons * benchmark.landfillDensityM3PerTon).toFixed(2));

  // 6. Tree planting equivalent (annual absorption)
  const treesEquivalent = Math.round(netCo2AvoidedKg / KG_CO2_PER_TREE_YEAR);

  // 7. Economic savings (INR): Virgin Raw Material Procurement Cost - (Byproduct Cost + Transport Freight Cost)
  const virginCostPerTon = benchmark.virginPricePerTonInr;
  const actualByproductPrice = agreedPricePerTon !== null && agreedPricePerTon !== undefined 
    ? Number(agreedPricePerTon) 
    : benchmark.byproductDefaultPricePerTonInr;
  
  // Estimated transport freight cost: approx ₹4.5 per ton-km
  const transportCostPerTon = dist * 4.5;
  const savingsPerTon = Math.max(0, virginCostPerTon - (actualByproductPrice + transportCostPerTon));
  const economicSavingsInr = Math.round(tons * savingsPerTon);
  const economicSavingsLakhs = Number((economicSavingsInr / 100000).toFixed(2));

  return {
    wasteDivertedTons: tons,
    grossCo2eAvoidedKg,
    grossCo2eAvoidedTons,
    transportCo2eKg,
    transportCo2eTons,
    netCo2AvoidedKg,
    netCo2AvoidedTons,
    waterSavedLitres,
    landfillVolumeSavedM3,
    treesEquivalent,
    economicSavingsInr,
    economicSavingsLakhs,
    virginMaterialReplaced: benchmark.virginMaterialReplaced,
    matchedCategory: benchmark.category,
    emissionFactorUsedKgPerTon: benchmark.co2eAvoidedPerTon,
    transportDeductionApplied: dist > 0
  };
}

module.exports = {
  ESG_BENCHMARKS,
  DEFAULT_FACTOR,
  FREIGHT_EMISSION_FACTOR_KG_PER_TON_KM,
  KG_CO2_PER_TREE_YEAR,
  resolveBenchmark,
  calculateDealImpact
};
