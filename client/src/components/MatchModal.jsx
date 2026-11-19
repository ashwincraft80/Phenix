import React, { useState, useEffect } from 'react';
import { X, Zap, MapPin, CheckCircle2, ArrowRight, ShieldCheck, Leaf, Droplet, DollarSign, Sparkles, Building2, ChevronRight, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';

// Circular Score Dial Component
function CircularProgress({ score, size = 80, strokeWidth = 7 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = (s) => {
    if (s >= 90) return '#10b981'; // emerald-500
    if (s >= 75) return '#06b6d4'; // cyan-500
    if (s >= 50) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(score)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-lg font-black text-white tracking-tight">{score}%</span>
        <span className="text-[9px] uppercase font-bold text-slate-400 -mt-0.5">Synergy</span>
      </div>
    </div>
  );
}

export default function MatchModal({ isOpen, onClose, targetListing, currentCompany, onDealInitiated }) {
  const [loading, setLoading] = useState(true);
  const [matchData, setMatchData] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isHandshakeModalOpen, setIsHandshakeModalOpen] = useState(false);
  const [submittingDeal, setSubmittingDeal] = useState(false);
  const [createdDeal, setCreatedDeal] = useState(null);

  useEffect(() => {
    if (isOpen && targetListing) {
      setLoading(true);
      setSelectedCandidate(null);
      setIsHandshakeModalOpen(false);
      setCreatedDeal(null);

      api.getMatches(targetListing.id)
        .then((data) => {
          setMatchData(data);
          if (data?.matches?.length > 0) {
            setSelectedCandidate(data.matches[0]);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, targetListing]);

  if (!isOpen || !targetListing) return null;

  const handleInitiateTransfer = async (candidate) => {
    setSubmittingDeal(true);
    try {
      const isSupply = targetListing.type === 'SUPPLY';
      const dealPayload = {
        supplyListingId: isSupply ? targetListing.id : candidate.listingId,
        demandListingId: isSupply ? candidate.listingId : targetListing.id,
        supplierCompany: isSupply ? targetListing.companyName : candidate.company.name,
        supplierCity: isSupply ? `${targetListing.location.city}, ${targetListing.location.state}` : `${candidate.company.city}, ${candidate.company.state}`,
        buyerCompany: isSupply ? candidate.company.name : targetListing.companyName,
        buyerCity: isSupply ? `${candidate.company.city}, ${candidate.company.state}` : `${targetListing.location.city}, ${targetListing.location.state}`,
        material: targetListing.title,
        quantity: candidate.matchedQuantity,
        unit: candidate.unit,
        ratePerUnit: candidate.unitPriceOffered,
        totalValueInr: candidate.totalDealValueInr,
        distanceKm: candidate.company.distanceKm,
        co2AvoidedTons: parseFloat(candidate.potentialCo2SavingsTons || (candidate.potentialCo2SavingsKg / 1000).toFixed(1)),
        waterSavedLitres: candidate.waterConservedLitres,
        economicSavingsInr: candidate.economicSavingsInr,
      };

      const newDeal = await api.createDeal(dealPayload);
      setCreatedDeal(newDeal);
      setIsHandshakeModalOpen(true);

      // Trigger celebratory confetti for hackathon wow factor!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) { /* ignore */ }

    } catch (err) {
      console.error('Failed to create deal:', err);
    } finally {
      setSubmittingDeal(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Zap className="w-5 h-5 fill-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-100">Algorithmic Circular Synergies</h2>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  Weighted Match v2.4
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Target: <strong className="text-slate-200">{targetListing.title}</strong> ({targetListing.quantity} {targetListing.unit}) from <span className="text-emerald-300 font-medium">{targetListing.companyName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-sm text-slate-300 font-medium">Computing Haversine distance & chemical compatibility matrices...</p>
              <span className="text-xs text-slate-500">Checking nearest industrial nodes within 300km</span>
            </div>
          ) : !matchData?.matches || matchData.matches.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-base text-slate-300 font-semibold mb-1">No high-probability matches found yet.</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Try adjusting the search radius or wait for more industrial peers to list compatible demands in the cluster.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Algorithm Summary Banner */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-mono font-semibold">
                    Formula: S = (0.40·S_mat) + (0.35·S_dist) + (0.25·S_vol)
                  </span>
                  <span className="text-slate-400 hidden sm:inline">• Maximum search horizon: 300 km</span>
                </div>
                <span className="text-emerald-400 font-semibold">{matchData.matches.length} Compatible Synergies Found</span>
              </div>

              {/* Match Candidate Cards */}
              <div className="space-y-4">
                {matchData.matches.map((cand, index) => {
                  const isTopMatch = index === 0;

                  return (
                    <div
                      key={cand.listingId}
                      className={`relative rounded-2xl border transition-all p-5 ${
                        isTopMatch
                          ? 'bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 border-emerald-500/50 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/20'
                          : 'bg-slate-900/60 border-slate-800'
                      }`}
                    >
                      {isTopMatch && (
                        <div className="absolute -top-3 right-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-[10px] font-extrabold uppercase px-3 py-0.5 rounded-full shadow-md flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Highest Ranked Circular Synergy</span>
                        </div>
                      )}

                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                        
                        {/* Left: Score & Partner Info */}
                        <div className="flex items-start sm:items-center space-x-4">
                          <CircularProgress score={cand.matchScore} size={84} strokeWidth={8} />

                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="text-base font-bold text-slate-100">{cand.company.name}</h4>
                              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {cand.company.distanceKm} km away
                              </span>
                            </div>

                            <p className="text-xs text-slate-400 mb-2">
                              Demand Match: <span className="text-slate-200 font-medium">{cand.demandTitle || targetListing.title}</span> ({cand.company.city}, {cand.company.state})
                            </p>

                            {/* Synergy Factors Breakdown */}
                            <div className="flex flex-wrap items-center gap-2 text-[11px]">
                              <span className="bg-slate-800/90 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                                Material Match: <strong className="text-emerald-400">{cand.factors.materialCompatibility}%</strong>
                              </span>
                              <span className="bg-slate-800/90 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                                Proximity Fit: <strong className="text-cyan-400">{cand.factors.distanceScore}%</strong>
                              </span>
                              <span className="bg-slate-800/90 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                                Volume Symmetry: <strong className="text-purple-400">{cand.factors.volumeScore}%</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Transfer Button */}
                        <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end justify-center gap-2">
                          <button
                            onClick={() => handleInitiateTransfer(cand)}
                            disabled={submittingDeal}
                            className="px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
                          >
                            <span>Initiate Transfer</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                          <span className="text-[10px] text-slate-400 text-center md:text-right">
                            Simulate Escrow & Gate Pass
                          </span>
                        </div>

                      </div>

                      {/* Environmental & Commercial Impact Bar */}
                      <div className="mt-4 pt-3.5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/40 p-3 rounded-xl">
                        
                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider flex items-center gap-1">
                            <Leaf className="w-3 h-3 text-emerald-400" />
                            <span>CO₂e Avoided</span>
                          </span>
                          <span className="text-sm font-bold text-emerald-400">
                            {cand.potentialCo2SavingsTons || (cand.potentialCo2SavingsKg / 1000).toFixed(1)} MT
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider flex items-center gap-1">
                            <Droplet className="w-3 h-3 text-cyan-400" />
                            <span>Water Saved</span>
                          </span>
                          <span className="text-sm font-bold text-cyan-300 font-mono">
                            {(cand.waterConservedLitres / 1000).toLocaleString('en-IN')} kL
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-amber-400" />
                            <span>Cost Advantage</span>
                          </span>
                          <span className="text-sm font-bold text-amber-400">
                            +{cand.costAdvantagePercent}% Savings
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
                            Exchange Value
                          </span>
                          <span className="text-sm font-bold text-slate-200 font-mono">
                            ₹{(cand.totalDealValueInr / 100000).toFixed(2)} Lakhs
                          </span>
                        </div>

                      </div>

                      {/* Symbiosis Narrative Note */}
                      {cand.synergyNote && (
                        <p className="mt-3 text-xs text-slate-400 italic bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                          💡 <strong className="text-slate-300 font-medium">Symbiosis Chemistry:</strong> {cand.synergyNote}
                        </p>
                      )}

                    </div>
                  );
                })}
              </div>

            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <span>Targeting Indian Industrial Symbiosis Clusters (Jamshedpur, Dahej, Hazira, Satna)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
          >
            Close
          </button>
        </div>

      </div>

      {/* Handshake & Escrow Confirmation Modal */}
      {isHandshakeModalOpen && createdDeal && (
        <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-emerald-500/50 rounded-2xl shadow-2xl p-6 text-center space-y-4">
            
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Deal Initiated: {createdDeal.id}
              </span>
              <h3 className="text-xl font-bold text-white mt-1">Escrow & Transport Handshake Locked!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Mutual agreement recorded between <strong className="text-slate-200">{createdDeal.supplierCompany}</strong> and <strong className="text-slate-200">{createdDeal.buyerCompany}</strong>.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Resource Lot:</span>
                <span className="font-semibold text-slate-200">{createdDeal.material}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Agreed Quantity:</span>
                <span className="font-semibold text-emerald-400">{createdDeal.quantity} {createdDeal.unit}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Escrow Value:</span>
                <span className="font-semibold text-slate-200 font-mono">₹{createdDeal.totalValueInr.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Digital Manifest Number:</span>
                <span className="font-mono text-cyan-400 font-bold">{createdDeal.manifestNumber}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  setIsHandshakeModalOpen(false);
                  onClose();
                  if (onDealInitiated) onDealInitiated(createdDeal);
                }}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
              >
                Track in Deal Logistics ➔
              </button>
              <button
                onClick={() => {
                  setIsHandshakeModalOpen(false);
                  onClose();
                }}
                className="py-3 px-4 rounded-xl font-semibold text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Continue Browsing
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
