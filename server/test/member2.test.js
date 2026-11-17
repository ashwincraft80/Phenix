const assert = require('assert');
const http = require('http');
const { app } = require('../server');
const {
  ESG_BENCHMARKS,
  resolveBenchmark,
  calculateDealImpact
} = require('../utils/esgFormulas');
const dealService = require('../services/dealService');
const impactService = require('../services/impactService');

// Helper to make local HTTP requests to Express app without listening on public port
function makeRequest(server, { method, path, body = null }) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const postData = body ? JSON.stringify(body) : '';

    const req = http.request({
      hostname: '127.0.0.1',
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, body: data, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n=============================================================');
  console.log('🧪 [Member 2 Test Suite] Backend Logistics & ESG Impact Engine');
  console.log('=============================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  async function asyncTest(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  }

  // --- UNIT TESTS: ESG Formulas ---
  console.log('--- 1. ESG & Environmental Formulas Unit Tests ---');

  test('resolveBenchmark resolves Blast Furnace Slag correctly', () => {
    const res = resolveBenchmark('Blast Furnace Slag');
    assert.strictEqual(res.category, 'Industrial Slag');
    assert.strictEqual(res.co2eAvoidedPerTon, 800);
  });

  test('resolveBenchmark resolves Fly Ash Class F correctly', () => {
    const res = resolveBenchmark('Fly Ash Class F');
    assert.strictEqual(res.category, 'Fly Ash');
    assert.strictEqual(res.co2eAvoidedPerTon, 820);
  });

  test('resolveBenchmark resolves Post-Industrial Polymers correctly', () => {
    const res = resolveBenchmark('Post-Industrial HDPE/PP');
    assert.strictEqual(res.category, 'Polymers/Scrap');
    assert.strictEqual(res.co2eAvoidedPerTon, 1500);
  });

  test('calculateDealImpact computes 500 Tons Slag with 42.5 km distance accurately', () => {
    const res = calculateDealImpact({
      material: 'Blast Furnace Slag',
      materialCategory: 'Industrial Slag',
      quantityTons: 500,
      distanceKm: 42.5,
      agreedPricePerTon: 850
    });

    // 500 * 800 kg = 400,000 kg (400 tonnes) gross CO2 avoided
    assert.strictEqual(res.grossCo2eAvoidedKg, 400000);
    assert.strictEqual(res.grossCo2eAvoidedTons, 400);

    // Transport deduction: 500 * 42.5 * 0.082 = 1742.5 kg (~1.74 tonnes)
    assert.strictEqual(res.transportCo2eKg, 1743);
    assert.strictEqual(res.netCo2AvoidedKg, 398257);
    assert.strictEqual(res.netCo2AvoidedTons, 398.26);

    // Water: 500 * 150 = 75,000 L
    assert.strictEqual(res.waterSavedLitres, 75000);

    // Landfill: 500 * 0.85 = 425 m³
    assert.strictEqual(res.landfillVolumeSavedM3, 425);

    // Economic savings: ~₹17.3 Lakhs
    assert.ok(res.economicSavingsInr > 1500000, `Expected savings > 15 Lakhs, got ${res.economicSavingsInr}`);
    assert.strictEqual(res.virginMaterialReplaced, 'Portland Clinker / Limestone');
  });

  // Start temporary local server for API integration tests
  const testServer = await new Promise(resolve => {
    const s = app.listen(0, () => resolve(s));
  });

  try {
    console.log('\n--- 2. REST API Integration Tests: Deal State Machine ---');

    let createdDealId = null;
    let initialDealCode = null;

    await asyncTest('GET /api/deals returns seeded deals list', async () => {
      const res = await makeRequest(testServer, { method: 'GET', path: '/api/deals' });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.count >= 4, `Expected at least 4 deals, got ${res.body.count}`);
    });

    await asyncTest('POST /api/deals creates a new deal in INITIATED stage', async () => {
      const payload = {
        targetListingId: 'L1',
        matchedListingId: 'L20',
        supplierCompanyId: 'comp_tata_steel',
        buyerCompanyId: 'comp_prism_cement',
        material: 'Granulated Blast Furnace Slag',
        materialCategory: 'Industrial Slag',
        quantity: 500,
        unit: 'Tons',
        pricePerTon: 850,
        totalValue: 425000,
        logistics: {
          distanceKm: 42.5,
          transportMode: 'Heavy Duty Green Fleet Tipper'
        },
        notes: 'Demo test byproduct transfer for clinker replacement'
      };

      const res = await makeRequest(testServer, { method: 'POST', path: '/api/deals', body: payload });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.deal._id);
      assert.ok(res.body.deal.dealCode.startsWith('DL-2026-'));
      assert.strictEqual(res.body.deal.status, 'INITIATED');
      assert.strictEqual(res.body.deal.stageIndex, 0);
      assert.strictEqual(res.body.deal.quantity, 500);

      createdDealId = res.body.deal._id;
      initialDealCode = res.body.deal.dealCode;
    });

    await asyncTest('GET /api/deals/:id retrieves created deal details', async () => {
      const res = await makeRequest(testServer, { method: 'GET', path: `/api/deals/${createdDealId}` });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.deal.dealCode, initialDealCode);
      assert.ok(res.body.deal.supplierCompany);
      assert.ok(res.body.deal.buyerCompany);
    });

    await asyncTest('PATCH /api/deals/:id/status transitions to IN_NEGOTIATION', async () => {
      const payload = {
        status: 'IN_NEGOTIATION',
        notes: 'Terms agreed: ₹850/ton, delivery via heavy duty green tipper fleet.',
        actor: 'Prism Green Cement Procurement'
      };

      const res = await makeRequest(testServer, { method: 'PATCH', path: `/api/deals/${createdDealId}/status`, body: payload });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.deal.status, 'IN_NEGOTIATION');
      assert.strictEqual(res.body.deal.stageIndex, 1);
      assert.strictEqual(res.body.deal.timeline.length, 2);
    });

    await asyncTest('POST /api/deals/:id/simulate-escrow executes escrow handshake', async () => {
      const payload = {
        escrowAmount: 425000,
        notes: 'Simulated escrow deposit locked until weighbridge verification.'
      };

      const res = await makeRequest(testServer, { method: 'POST', path: `/api/deals/${createdDealId}/simulate-escrow`, body: payload });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.escrowStatus, 'LOCKED');
    });

    await asyncTest('PATCH /api/deals/:id/status transitions to LOGISTICS_DISPATCHED and assigns gate pass', async () => {
      const payload = {
        status: 'LOGISTICS_DISPATCHED',
        vehicleNumber: 'JH-05-CD-4421',
        transporterName: 'Viksit Green Freight Logistics',
        driverName: 'Rameshwar Singh',
        notes: 'Gate pass generated. Dispatch manifest active with live GPS tracking.'
      };

      const res = await makeRequest(testServer, { method: 'PATCH', path: `/api/deals/${createdDealId}/status`, body: payload });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.deal.status, 'LOGISTICS_DISPATCHED');
      assert.strictEqual(res.body.deal.stageIndex, 2);
      assert.ok(res.body.deal.logistics.gatePassNumber.startsWith('GP-'));
      assert.ok(res.body.deal.logistics.consignmentManifestCode.startsWith('MNF-SYM-'));
      assert.strictEqual(res.body.deal.logistics.vehicleNumber, 'JH-05-CD-4421');
    });

    await asyncTest('PATCH /api/deals/:id/status transitions to DELIVERED_VERIFIED and generates ESG hash', async () => {
      const payload = {
        status: 'DELIVERED_VERIFIED',
        verifiedTonnage: 500,
        tareWeightTons: 35,
        weighbridgeSlipNumber: 'WB-CHAIBASA-8812',
        weighbridgeLocation: 'Inbound Scale #1, Chaibasa',
        verifiedBy: 'Inspector K. Sahu (Quality QA/QC)',
        notes: 'Weighbridge handshake verified 500T net. Escrow released. Tamper-proof ESG hash generated.'
      };

      const res = await makeRequest(testServer, { method: 'PATCH', path: `/api/deals/${createdDealId}/status`, body: payload });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.deal.status, 'DELIVERED_VERIFIED');
      assert.strictEqual(res.body.deal.stageIndex, 3);
      assert.strictEqual(res.body.deal.verification.netVerifiedQuantity, 500);
      assert.strictEqual(res.body.deal.verification.grossWeightTons, 535);
      assert.ok(res.body.deal.verification.digitalCertificateHash.length === 64, 'Must be valid SHA-256 hash');
      assert.strictEqual(res.body.deal.impactMetrics.grossCo2eAvoidedTons, 400);
    });

    await asyncTest('PATCH /api/deals/:id/status rejects invalid status transition', async () => {
      const payload = { status: 'INVALID_STAGE_XYZ' };
      const res = await makeRequest(testServer, { method: 'PATCH', path: `/api/deals/${createdDealId}/status`, body: payload });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    console.log('\n--- 3. REST API Integration Tests: ESG & Impact Analytics ---');

    await asyncTest('GET /api/impact/aggregate conforms to Member 2 contract', async () => {
      const res = await makeRequest(testServer, { method: 'GET', path: '/api/impact/aggregate' });
      assert.strictEqual(res.status, 200);

      // Verify contract fields
      assert.ok(typeof res.body.totalWasteDivertedTons === 'number');
      assert.ok(typeof res.body.netCo2AvoidedTons === 'number');
      assert.ok(typeof res.body.waterSavedLitres === 'number');
      assert.ok(typeof res.body.economicSavingsInr === 'number');
      assert.ok(Array.isArray(res.body.materialBreakdown));
      assert.ok(Array.isArray(res.body.timeline));

      console.log(`     Aggregated Stats -> Waste: ${res.body.totalWasteDivertedTons} T | CO2 Avoided: ${res.body.netCo2AvoidedTons} T | Water: ${res.body.waterSavedLitres} L | Savings: ₹${res.body.economicSavingsInr.toLocaleString('en-IN')}`);

      // Verify material breakdown entries
      assert.ok(res.body.materialBreakdown.some(m => m.category === 'Industrial Slag'));
      assert.ok(res.body.materialBreakdown.some(m => m.category === 'Fly Ash'));
    });

    await asyncTest('GET /api/impact/certificate/:dealId generates authentic SEBI BRSR certificate', async () => {
      const res = await makeRequest(testServer, { method: 'GET', path: `/api/impact/certificate/${createdDealId}` });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);

      const cert = res.body.certificate;
      assert.ok(cert.certificateId.startsWith('BRSR-'));
      assert.strictEqual(cert.isVerified, true);
      assert.strictEqual(cert.parties.supplier.name, 'Tata Steel Jamshedpur Works');
      assert.strictEqual(cert.parties.buyer.name, 'Prism Green Cement Ltd (Chaibasa)');
      assert.strictEqual(cert.exchangeSummary.material, 'Granulated Blast Furnace Slag');
      assert.strictEqual(cert.exchangeSummary.virginMaterialDisplaced, 'Portland Clinker / Limestone');
      assert.strictEqual(cert.exchangeSummary.verifiedTonnage, 500);
      assert.ok(cert.regulatoryFrameworkAlignment.sebiBrsrCore);
      assert.ok(cert.digitalVerificationProof.digitalCertificateHash.length === 64);

      console.log(`     Generated Certificate ID: ${cert.certificateId} | QR Hash: ${cert.digitalVerificationProof.digitalCertificateHash.substring(0, 16)}...`);
    });

    await asyncTest('GET /api/impact/benchmark-factors returns transparent ESG metrics', async () => {
      const res = await makeRequest(testServer, { method: 'GET', path: '/api/impact/benchmark-factors' });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.benchmarkEmissionFactors['Industrial Slag']);
      assert.strictEqual(res.body.benchmarkEmissionFactors['Industrial Slag'].co2eAvoidedPerTon, 800);
    });

    await asyncTest('POST /api/impact/calculate-preview returns instant preview', async () => {
      const payload = {
        material: 'Class F Fly Ash',
        materialCategory: 'Fly Ash',
        quantityTons: 1000,
        distanceKm: 50
      };
      const res = await makeRequest(testServer, { method: 'POST', path: '/api/impact/calculate-preview', body: payload });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.preview.grossCo2eAvoidedTons, 820);
    });

    console.log('\n--- 4. Full Hackathon 3-Minute Demo Walkthrough Simulation ---');

    await asyncTest('Simulate complete 3-minute hackathon demo script', async () => {
      // Step 1: Initial state check
      const initialImpact = await makeRequest(testServer, { method: 'GET', path: '/api/impact/aggregate' });
      const initialDiverted = initialImpact.body.totalWasteDivertedTons;

      // Step 2: Algorithmic Matchmaker discovers Prism Cement for Tata Steel Slag (94% score)
      const matchRes = await makeRequest(testServer, { method: 'GET', path: '/api/match/L1' });
      assert.strictEqual(matchRes.status, 200);
      const topMatch = matchRes.body.matches[0];
      assert.ok(topMatch.matchScore >= 90, `Expected matchScore >= 90, got ${topMatch.matchScore}`);
      assert.ok(topMatch.company.distanceKm > 40 && topMatch.company.distanceKm < 55, `Expected distance around ~42-49km, got ${topMatch.company.distanceKm}`);

      // Step 3: Initiate Transfer from match
      const dealRes = await makeRequest(testServer, {
        method: 'POST',
        path: '/api/deals',
        body: {
          targetListingId: 'L1',
          matchedListingId: topMatch.listingId,
          supplierCompanyId: 'comp_tata_steel',
          buyerCompanyId: topMatch.company._id || 'comp_prism_cement',
          material: 'Blast Furnace Slag',
          materialCategory: 'Industrial Slag',
          quantity: 500,
          pricePerTon: 850,
          logistics: { distanceKm: topMatch.company.distanceKm }
        }
      });
      const demoDealId = dealRes.body.deal._id;

      // Step 4: Advance Deal from Initiated -> In Negotiation -> Dispatched -> Verified
      await makeRequest(testServer, {
        method: 'PATCH',
        path: `/api/deals/${demoDealId}/status`,
        body: { status: 'IN_NEGOTIATION', notes: 'Commercial lock & simulated escrow agreed.' }
      });

      await makeRequest(testServer, {
        method: 'PATCH',
        path: `/api/deals/${demoDealId}/status`,
        body: {
          status: 'LOGISTICS_DISPATCHED',
          vehicleNumber: 'JH-05-CD-4421',
          notes: 'Gate pass generated. Dispatch manifest active.'
        }
      });

      await makeRequest(testServer, {
        method: 'PATCH',
        path: `/api/deals/${demoDealId}/status`,
        body: {
          status: 'DELIVERED_VERIFIED',
          verifiedTonnage: 500,
          weighbridgeSlipNumber: 'WB-DEMO-8812',
          notes: 'Weighbridge handshake completed. 500 tons verified.'
        }
      });

      // Step 5: Check Impact Dashboard updated in real-time!
      const finalImpact = await makeRequest(testServer, { method: 'GET', path: '/api/impact/aggregate' });
      const addedDiverted = finalImpact.body.totalWasteDivertedTons - initialDiverted;
      assert.strictEqual(addedDiverted, 500, `Expected +500 tonnes diverted in live counter, got ${addedDiverted}`);

      // Step 6: Generate SEBI BRSR Green Transfer Certificate
      const certRes = await makeRequest(testServer, { method: 'GET', path: `/api/impact/certificate/${demoDealId}` });
      assert.strictEqual(certRes.status, 200);
      assert.ok(certRes.body.certificate.digitalVerificationProof.digitalCertificateHash);
    });

  } finally {
    testServer.close();
  }

  console.log('\n=============================================================');
  console.log(`🏁 TEST SUMMARY: ${passed} Passed | ${failed} Failed`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL MEMBER 2 LOGISTICS & IMPACT ANALYTICS TESTS PASSED 100%!');
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
