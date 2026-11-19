import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, FileText, Truck, ShieldCheck, CheckCircle2, ChevronRight, AlertCircle, ArrowUpRight, Scale, Leaf, MapPin, Building, Calendar, Download } from 'lucide-react';
import DealStepper from '../components/DealStepper';
import { api } from '../services/api';

export default function DealWorkflow({ currentCompany, highlightDealId, onNavigateToImpact }) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [advancing, setAdvancing] = useState(false);

  const loadDeals = async () => {
    setLoading(true);
    try {
      const data = await api.getDeals();
      setDeals(data);
      if (data && data.length > 0) {
        if (highlightDealId) {
          const match = data.find(d => d.id === highlightDealId);
          setSelectedDeal(match || data[0]);
        } else {
          setSelectedDeal(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load deals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, [highlightDealId]);

  const handleAdvanceStatus = async (dealId, nextStatus) => {
    setAdvancing(true);
    try {
      const updatedDeal = await api.updateDealStatus(dealId, nextStatus);
      // update list
      setDeals(prev => prev.map(d => d.id === dealId ? updatedDeal : d));
      setSelectedDeal(updatedDeal);
    } catch (err) {
      console.error('Failed to advance deal status', err);
    } finally {
      setAdvancing(false);
    }
  };

  // Pipeline Metrics
  const activeExchangesCount = deals.filter(d => d.status !== 'DELIVERED_VERIFIED').length;
  const totalDivertedTons = deals.reduce((acc, d) => acc + (d.quantity || 0), 0);
  const totalEscrowInr = deals.reduce((acc, d) => acc + (d.totalValueInr || 0), 0);
  const totalCo2AvoidedTons = deals.reduce((acc, d) => acc + (d.co2AvoidedTons || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              B2B Resource Exchange Logistics
            </h1>
            <span className="text-xs uppercase font-mono px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Chain of Custody
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            End-to-end multi-party manifest management, escrow guarantees, and inbound weighbridge verification.
          </p>
        </div>

        {/* Quick ESG Link */}
        <button
          onClick={onNavigateToImpact}
          className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 flex items-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <Leaf className="w-3.5 h-3.5" />
          <span>View ESG Audit Dashboard ➔</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Exchanges in Pipeline</span>
          <span className="text-2xl font-black text-white font-mono mt-1 block">
            {deals.length} <span className="text-xs font-normal text-slate-400">({activeExchangesCount} in transit)</span>
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">Active industrial transfers</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Byproduct Diverted</span>
          <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
            {totalDivertedTons.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-400">MT</span>
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">Prevented landfill dumping</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Cumulative CO₂e Abatement</span>
          <span className="text-2xl font-black text-teal-300 font-mono mt-1 block">
            {totalCo2AvoidedTons.toFixed(1)} <span className="text-xs font-normal text-slate-400">tCO₂e</span>
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">Virgin extraction avoided</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Exchange Escrow Value</span>
          <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">
            ₹{(totalEscrowInr / 100000).toFixed(2)} <span className="text-xs font-normal text-slate-400">Lakhs</span>
          </span>
          <span className="text-[10px] text-slate-500 block mt-1">Secured transaction volume</span>
        </div>

      </div>

      {/* Main 2-Column Split: Deals Sidebar + Deal Stage Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Deal List (4 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Industrial Transfers</h3>
            <span className="text-xs text-slate-500">{deals.length} recorded</span>
          </div>

          <div className="space-y-3">
            {deals.map((deal) => {
              const isSelected = selectedDeal?.id === deal.id;
              const isDelivered = deal.status === 'DELIVERED_VERIFIED';

              return (
                <div
                  key={deal.id}
                  onClick={() => setSelectedDeal(deal)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-emerald-500/70 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/20'
                      : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {deal.id}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isDelivered
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                    }`}>
                      {isDelivered ? 'Verified & Complete' : 'In Logistics Pipeline'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-100 line-clamp-1">{deal.material}</h4>

                  <div className="mt-2 text-xs text-slate-400 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 truncate">From: <strong className="text-slate-300">{deal.supplierCompany}</strong></span>
                      <span className="text-emerald-400 font-bold shrink-0">{deal.quantity} {deal.unit}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 truncate">To: <strong className="text-slate-300">{deal.buyerCompany}</strong></span>
                      <span className="text-slate-300 font-mono font-semibold shrink-0">₹{(deal.totalValueInr / 100000).toFixed(2)}L</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Manifest: {deal.manifestNumber}</span>
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      🌱 {deal.co2AvoidedTons} tCO₂e
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed View & Stepper (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedDeal ? (
            <div className="space-y-6">
              
              {/* Stepper Component */}
              <DealStepper
                deal={selectedDeal}
                onAdvanceStatus={handleAdvanceStatus}
                advancing={advancing}
              />

              {/* Digital Manifest & Gate Pass Document Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                      Standard Circular Manifest (CPCB / BRSR)
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">
                      Digital Chain-of-Custody Manifest #{selectedDeal.manifestNumber}
                    </h3>
                  </div>

                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(selectedDeal.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                {/* Company Handshake Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                  
                  {/* Origin */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Originating Generator</span>
                    <h5 className="text-sm font-bold text-slate-200">{selectedDeal.supplierCompany}</h5>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{selectedDeal.supplierCity}</span>
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="space-y-1 sm:border-l sm:border-slate-800 sm:pl-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Receiving Facility</span>
                    <h5 className="text-sm font-bold text-slate-200">{selectedDeal.buyerCompany}</h5>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{selectedDeal.buyerCity} ({selectedDeal.distanceKm} km route)</span>
                    </div>
                  </div>

                </div>

                {/* Logistics & Transit Audit */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/70">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Authorized Gate Pass</span>
                    <span className="font-mono font-bold text-emerald-400 text-xs">
                      {selectedDeal.gatePassNumber}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/70">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Weighbridge Slip</span>
                    <span className="font-mono font-bold text-cyan-400 text-xs">
                      {selectedDeal.weighbridgeSlip}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/70 col-span-2 sm:col-span-1">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Fleet Allocation</span>
                    <span className="font-bold text-slate-200 text-xs">
                      {selectedDeal.trucksDispatched || 16} Heavy Multi-Axle Trucks
                    </span>
                  </div>

                </div>

                {/* Live History Log */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Audit Trail & Chain of Custody</h5>
                  <div className="space-y-2">
                    {selectedDeal.history && selectedDeal.history.map((h, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${h.completed ? 'text-emerald-400' : 'text-slate-700'}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${h.completed ? 'text-slate-200' : 'text-slate-500'}`}>
                              {h.title}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">[{h.timestamp}]</span>
                          </div>
                          {h.note && (
                            <p className="text-[11px] text-slate-400 mt-0.5">{h.note}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              Select an exchange from the list to view its logistics chain.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
