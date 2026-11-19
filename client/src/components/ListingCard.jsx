import React from 'react';
import { MapPin, Zap, ArrowUpRight, ShieldCheck, Scale, Leaf, Clock, ChevronRight } from 'lucide-react';

export default function ListingCard({ listing, currentCompany, onFindMatches, isFeatured = false }) {
  const isSupply = listing.type === 'SUPPLY';
  const isMyCompany = listing.companyId === currentCompany.id;

  return (
    <div
      className={`group relative rounded-2xl transition-all duration-300 border flex flex-col justify-between overflow-hidden ${
        isFeatured
          ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-emerald-500/40 shadow-xl shadow-emerald-950/30'
          : 'bg-slate-900/70 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-md'
      }`}
    >
      {/* Top Accent Line */}
      <div
        className={`h-1.5 w-full ${
          isSupply ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
        }`}
      />

      <div className="p-5 flex-1 flex flex-col">
        {/* Header Tags */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1 ${
                isSupply
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isSupply ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`} />
              {isSupply ? 'Surplus Byproduct' : 'Material Demand'}
            </span>
            <span className="text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">
              {listing.category}
            </span>
          </div>

          {isMyCompany && (
            <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              Your Entity
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors line-clamp-2 mb-1.5">
          {listing.title}
        </h3>

        {/* Company & Location Info */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="font-medium text-slate-300 truncate">{listing.companyName}</span>
          <span className="text-slate-600">•</span>
          <span className="shrink-0">{listing.location.city}, {listing.location.state}</span>
        </div>

        {/* Purity Grade / Spec Badge */}
        {listing.purityGrade && (
          <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800/80 mb-3.5 text-xs font-mono text-slate-300 flex items-start gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2 text-[11px] leading-relaxed">{listing.purityGrade}</span>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800/60">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">Available Vol</span>
            <span className="text-sm font-bold text-slate-100">
              {listing.quantity.toLocaleString('en-IN')}{' '}
              <span className="text-xs font-normal text-slate-400">{listing.unit}</span>
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">Target Price</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              ₹{listing.pricePerUnit.toLocaleString('en-IN')}{' '}
              <span className="text-[10px] font-normal text-slate-400">/ MT</span>
            </span>
          </div>
        </div>

        {/* Environmental Factor Footnote */}
        {listing.co2FactorKgPerTon && (
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/90 mb-4 bg-emerald-950/30 px-2.5 py-1.5 rounded-lg border border-emerald-800/40">
            <Leaf className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Avoids <strong>~{listing.co2FactorKgPerTon} kg CO₂e</strong> / MT virgin raw displaced</span>
          </div>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="p-4 pt-0">
        <button
          onClick={() => onFindMatches(listing)}
          className="w-full py-2.5 px-4 rounded-xl font-medium text-xs tracking-wide transition-all duration-200 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-semibold shadow-lg shadow-emerald-900/30 hover:shadow-emerald-600/30 active:scale-[0.98]"
        >
          <Zap className="w-4 h-4 fill-slate-950 text-slate-950" />
          <span>⚡ Find Circular Matches</span>
        </button>
      </div>
    </div>
  );
}
