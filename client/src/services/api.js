import axios from 'axios';
import { INITIAL_LISTINGS, PRECOMPUTED_MATCHES, INITIAL_DEALS, COMPANIES } from '../data/mockData';

const API_BASE = '/api';

// Create persistent local stores for simulation
const getStoredListings = () => {
  const stored = localStorage.getItem('phenix_listings');
  if (stored) {
    try { return JSON.parse(stored); } catch (e) { /* ignore */ }
  }
  localStorage.setItem('phenix_listings', JSON.stringify(INITIAL_LISTINGS));
  return INITIAL_LISTINGS;
};

const getStoredDeals = () => {
  const stored = localStorage.getItem('phenix_deals');
  if (stored) {
    try { return JSON.parse(stored); } catch (e) { /* ignore */ }
  }
  localStorage.setItem('phenix_deals', JSON.stringify(INITIAL_DEALS));
  return INITIAL_DEALS;
};

// Haversine calculation for dynamic fallback matching
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

export const api = {
  // Fetch all listings with optional filter
  async getListings(type = null) {
    try {
      const response = await axios.get(`${API_BASE}/listings`, { params: type ? { type } : {}, timeout: 2500 });
      return response.data;
    } catch (err) {
      // Local fallback
      let listings = getStoredListings();
      if (type) {
        listings = listings.filter(l => l.type === type);
      }
      return listings;
    }
  },

  // Member 1 API contract: GET /api/match/:listingId
  async getMatches(listingId) {
    try {
      const response = await axios.get(`${API_BASE}/match/${listingId}`, { timeout: 3000 });
      return response.data;
    } catch (err) {
      // Precomputed match fallback
      if (PRECOMPUTED_MATCHES[listingId]) {
        return PRECOMPUTED_MATCHES[listingId];
      }

      // Dynamic local algorithmic matchmaker fallback
      const listings = getStoredListings();
      const target = listings.find(l => l.id === listingId);
      if (!target) return { targetListing: null, matches: [] };

      const oppositeType = target.type === 'SUPPLY' ? 'DEMAND' : 'SUPPLY';
      const candidates = listings.filter(l => l.type === oppositeType && l.id !== target.id);

      const matches = candidates.map(cand => {
        // Material Compatibility (1.0 or 0.6)
        const matScore = (cand.category === target.category) ? 100 : (cand.subType && target.subType && cand.subType === target.subType ? 90 : 30);
        
        // Distance
        const distKm = (target.location && cand.location && target.location.lat && cand.location.lat)
          ? calculateDistanceKm(target.location.lat, target.location.lng, cand.location.lat, cand.location.lng)
          : (cand.location?.distanceKm || 65);
        
        const dMax = 300;
        const distScore = Math.max(0, Math.round((1 - Math.min(distKm, dMax) / dMax) * 100));

        // Volume Compatibility
        const supplyVol = target.type === 'SUPPLY' ? target.quantity : cand.quantity;
        const demandVol = target.type === 'DEMAND' ? target.quantity : cand.quantity;
        const volScore = Math.max(0, Math.round((1 - Math.abs(supplyVol - demandVol) / Math.max(supplyVol, demandVol)) * 100));

        // Weighted algorithm: 0.40 * mat + 0.35 * dist + 0.25 * vol
        const matchScore = Math.round((0.40 * matScore) + (0.35 * distScore) + (0.25 * volScore));

        const matchedQty = Math.min(target.quantity, cand.quantity);
        const co2Factor = target.co2FactorKgPerTon || 800;
        const potentialCo2SavingsKg = Math.round(matchedQty * co2Factor);

        return {
          listingId: cand.id,
          company: {
            id: cand.companyId,
            name: cand.companyName,
            city: cand.location?.city || "Industrial Cluster",
            state: cand.location?.state || "IN",
            distanceKm: distKm
          },
          demandTitle: cand.title,
          matchScore,
          factors: {
            materialCompatibility: matScore,
            distanceScore: distScore,
            volumeScore: volScore
          },
          matchedQuantity: matchedQty,
          unit: target.unit || 'Metric Tonnes',
          unitPriceOffered: cand.pricePerUnit || target.pricePerUnit,
          totalDealValueInr: matchedQty * (cand.pricePerUnit || target.pricePerUnit),
          potentialCo2SavingsKg,
          potentialCo2SavingsTons: (potentialCo2SavingsKg / 1000).toFixed(1),
          waterConservedLitres: matchedQty * (target.waterFactorLPerTon || 400),
          costAdvantagePercent: Math.min(45, Math.max(15, Math.round(distScore * 0.35))),
          economicSavingsInr: Math.round(matchedQty * (cand.pricePerUnit || target.pricePerUnit) * 0.25),
          synergyNote: `High-synergy resource routing displacing virgin raw materials via localized industrial clustering.`
        };
      })
      .filter(m => m.matchScore > 40)
      .sort((a, b) => b.matchScore - a.matchScore);

      return {
        targetListing: target,
        matches
      };
    }
  },

  // Member 2 API contract: POST /api/deals
  async createDeal(dealPayload) {
    try {
      const response = await axios.post(`${API_BASE}/deals`, dealPayload, { timeout: 3000 });
      return response.data;
    } catch (err) {
      // Local deal creation
      const deals = getStoredDeals();
      const newDealId = `DEAL-${Math.floor(1000 + Math.random() * 9000)}`;
      const newDeal = {
        id: newDealId,
        ...dealPayload,
        status: 'INITIATED',
        statusCode: 1,
        manifestNumber: `MNF-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        gatePassNumber: `GP-PENDING-${newDealId}`,
        weighbridgeSlip: `WB-PENDING`,
        createdAt: new Date().toISOString(),
        history: [
          { stage: 'INITIATED', title: 'Terms Accepted & Handshake Generated', timestamp: 'Just now', completed: true, note: 'Match verified and initiated from marketplace.' },
          { stage: 'IN_NEGOTIATION', title: 'Commercials & Digital Escrow', timestamp: 'Pending', completed: false },
          { stage: 'LOGISTICS_DISPATCHED', title: 'Gate Pass & Transport Manifest', timestamp: 'Pending', completed: false },
          { stage: 'DELIVERED_VERIFIED', title: 'Inbound Weighbridge & ESG Verification', timestamp: 'Pending', completed: false }
        ]
      };
      deals.unshift(newDeal);
      localStorage.setItem('phenix_deals', JSON.stringify(deals));
      return newDeal;
    }
  },

  // Member 2 API contract: PATCH /api/deals/:id/status
  async updateDealStatus(dealId, newStatus) {
    try {
      const response = await axios.patch(`${API_BASE}/deals/${dealId}/status`, { status: newStatus }, { timeout: 3000 });
      return response.data;
    } catch (err) {
      const deals = getStoredDeals();
      const deal = deals.find(d => d.id === dealId);
      if (deal) {
        deal.status = newStatus;
        const stageMap = {
          'INITIATED': 1,
          'IN_NEGOTIATION': 2,
          'LOGISTICS_DISPATCHED': 3,
          'DELIVERED_VERIFIED': 4
        };
        deal.statusCode = stageMap[newStatus] || 1;
        
        // Update history entries
        deal.history = deal.history.map((h, idx) => {
          if (idx < deal.statusCode) {
            return { ...h, completed: true, timestamp: h.completed ? h.timestamp : 'Verified just now' };
          }
          return h;
        });

        if (newStatus === 'LOGISTICS_DISPATCHED' && deal.gatePassNumber.includes('PENDING')) {
          deal.gatePassNumber = `GP-${Math.floor(1000 + Math.random() * 9000)}-AUTH`;
        }
        if (newStatus === 'DELIVERED_VERIFIED') {
          deal.weighbridgeSlip = `WB-${Math.floor(1000 + Math.random() * 9000)}-VERIFIED`;
        }

        localStorage.setItem('phenix_deals', JSON.stringify(deals));
        return deal;
      }
      throw new Error('Deal not found');
    }
  },

  // Get all deals
  async getDeals() {
    try {
      const response = await axios.get(`${API_BASE}/deals`, { timeout: 2500 });
      return response.data;
    } catch (err) {
      return getStoredDeals();
    }
  },

  // Reset seed data
  resetDemoData() {
    localStorage.removeItem('phenix_listings');
    localStorage.removeItem('phenix_deals');
    return {
      listings: INITIAL_LISTINGS,
      deals: INITIAL_DEALS,
      companies: COMPANIES
    };
  }
};
