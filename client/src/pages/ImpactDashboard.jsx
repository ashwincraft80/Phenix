import React, { useState } from 'react';
import { Award, Leaf, Droplet, TrendingUp, IndianRupee, ShieldCheck, Download, ArrowUpRight } from 'lucide-react';
import { INITIAL_DEALS } from '../data/mockData';
import EsgCertificate from '../components/EsgCertificate';

export default function ImpactDashboard({ onNavigateToMarketplace }) {
  const [selectedDealForCert, setSelectedDealForCert] = useState(null);

  // Completed or active deals for audit
  const verifiedDeals = INITIAL_DEALS;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Executive Impact Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Executive ESG Impact & Decarbonization Analytics
            </h1>
            <span className="text-xs uppercase font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              BRSR / Scope 3 Audit
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time environmental ledger calculating verified avoided emissions, virgin mineral substitution, and circular savings.
          </p>
        </div>

        <button
          onClick={onNavigateToMarketplace}
          className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 self-start md:self-auto cursor-pointer shadow-lg shadow-emerald-500/20"
        >
          <span>Explore Live Byproducts ➔</span>
        </button>
      </div>

      {/* Top 4 Impact Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Waste Diverted</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-black text-white font-mono mt-3 block">1,420.5 <span className="text-sm font-normal text-slate-400">MT</span></span>
          <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">↑ 100% diverted from municipal / landfill pits</span>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Net CO₂e Abated</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-black text-teal-300 font-mono mt-3 block">1,184.2 <span className="text-sm font-normal text-slate-400">tCO₂e</span></span>
          <span className="text-[11px] text-teal-400 font-semibold mt-1 block">Benchmark: Clinker & Virgin Ore Displacement</span>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Water Conserved</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Droplet className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-black text-cyan-300 font-mono mt-3 block">4,80,000 <span className="text-sm font-normal text-slate-400">Litres</span></span>
          <span className="text-[11px] text-cyan-400 font-semibold mt-1 block">Industrial process freshwater saved</span>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Economic Surplus Created</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-black text-amber-400 font-mono mt-3 block">₹40.0 <span className="text-sm font-normal text-slate-400">Lakhs</span></span>
          <span className="text-[11px] text-amber-400 font-semibold mt-1 block">Procurement cost advantage for buyers</span>
        </div>

      </div>

      {/* Material Breakdown & Certification Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Material Distribution Bars (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <h3 className="text-base font-bold text-white">Byproduct Stream Decarbonization Contribution</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Granulated Blast Furnace Slag (GBFS)</span>
                <span className="font-mono text-emerald-400 font-bold">800 MT (640 tCO₂e avoided)</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '56%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Fly Ash Class F (Thermal Residue)</span>
                <span className="font-mono text-teal-400 font-bold">450 MT (360 tCO₂e avoided)</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div className="bg-teal-400 h-full rounded-full" style={{ width: '31%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Polypropylene (PP) Trim Scrap</span>
                <span className="font-mono text-cyan-400 font-bold">170.5 MT (184.2 tCO₂e avoided)</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div className="bg-cyan-400 h-full rounded-full" style={{ width: '13%' }} />
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-400 space-y-1">
            <span className="text-slate-200 font-semibold block">Regulatory ESG Compliance Readiness:</span>
            <p>
              Calculated using standard IPCC emission displacement coefficients for Indian industrial clusters. Ready for inclusion in SEBI BRSR Core Principal 6 (Environment) disclosures.
            </p>
          </div>
        </div>

        {/* Audit Certificates Ready for Minting (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Verified ESG Exchange Certificates</h3>
          </div>
          <p className="text-xs text-slate-400">
            Generate printable, tamper-evident green compliance certificates with audit hashes for completed B2B transfers.
          </p>

          <div className="space-y-3">
            {verifiedDeals.map((deal) => (
              <div
                key={deal.id}
                className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3"
              >
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">CERT-{deal.id}</span>
                  <h5 className="text-xs font-bold text-slate-200 mt-0.5">{deal.material}</h5>
                  <span className="text-[11px] text-slate-500 block">
                    {deal.supplierCompany} ➔ {deal.buyerCompany}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedDealForCert(deal)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>View Cert</span>
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Certificate Modal */}
      {selectedDealForCert && (
        <EsgCertificate
          isOpen={Boolean(selectedDealForCert)}
          onClose={() => setSelectedDealForCert(null)}
          deal={selectedDealForCert}
        />
      )}

    </div>
  );
}
