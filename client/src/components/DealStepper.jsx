import React from 'react';
import { CheckCircle2, Clock, Truck, ShieldCheck, FileText, ArrowRight, AlertCircle } from 'lucide-react';

const STAGES = [
  {
    key: 'INITIATED',
    label: 'Terms Accepted',
    desc: 'Digital Manifest Drafted',
    icon: FileText
  },
  {
    key: 'IN_NEGOTIATION',
    label: 'Escrow Secured',
    desc: 'Bank Guarantee Locked',
    icon: ShieldCheck
  },
  {
    key: 'LOGISTICS_DISPATCHED',
    label: 'Gate Pass Issued',
    desc: 'Fleet & Weighbridge Outbound',
    icon: Truck
  },
  {
    key: 'DELIVERED_VERIFIED',
    label: 'Weighbridge Audited',
    desc: 'Chain of Custody Complete',
    icon: CheckCircle2
  }
];

export default function DealStepper({ deal, onAdvanceStatus, advancing = false }) {
  const currentStageIndex = deal.statusCode ? deal.statusCode - 1 : 0;

  const getNextStageName = (idx) => {
    if (idx === 0) return 'Lock Escrow & Contracts';
    if (idx === 1) return 'Issue Transport Gate Pass';
    if (idx === 2) return 'Verify Inbound Weighbridge & Mint ESG Certificate';
    return null;
  };

  const getNextStatusCode = (idx) => {
    if (idx === 0) return 'IN_NEGOTIATION';
    if (idx === 1) return 'LOGISTICS_DISPATCHED';
    if (idx === 2) return 'DELIVERED_VERIFIED';
    return null;
  };

  const nextStageName = getNextStageName(currentStageIndex);
  const nextStatusCode = getNextStatusCode(currentStageIndex);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-6">
      
      {/* Header & Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Chain-of-Custody Logistics Tracker
            </h4>
            <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
              {deal.manifestNumber}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-tier transport handshake verification
          </p>
        </div>

        {/* Live Stage Tag */}
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
            deal.status === 'DELIVERED_VERIFIED'
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
              : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
          }`}>
            <span className={`w-2 h-2 rounded-full ${deal.status === 'DELIVERED_VERIFIED' ? 'bg-emerald-400' : 'bg-blue-400 animate-pulse'}`} />
            {STAGES[currentStageIndex]?.label || deal.status}
          </span>
        </div>
      </div>

      {/* 4-Stage Horizontal Stepper */}
      <div className="relative">
        {/* Connector Line behind steps */}
        <div className="absolute top-5 left-6 right-6 h-0.5 bg-slate-800 -z-0 hidden md:block">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700 ease-out"
            style={{ width: `${(currentStageIndex / (STAGES.length - 1)) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx <= currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            const StageIcon = stage.icon;

            return (
              <div
                key={stage.key}
                className={`p-3.5 rounded-xl border transition-all flex md:flex-col items-center md:items-center text-left md:text-center space-x-3 md:space-x-0 ${
                  isCurrent
                    ? 'bg-slate-800/90 border-emerald-500/60 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                    : isCompleted
                    ? 'bg-slate-900/90 border-emerald-500/30'
                    : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                }`}
              >
                {/* Step Icon Badge */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mb-0 md:mb-2 transition-all ${
                    isCurrent
                      ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20 shadow-md font-bold'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <StageIcon className="w-5 h-5" />
                </div>

                {/* Step Titles */}
                <div>
                  <span className="text-[10px] font-mono text-slate-500 block">Stage 0{idx + 1}</span>
                  <p className={`text-xs font-bold leading-tight ${isCurrent ? 'text-emerald-300' : isCompleted ? 'text-slate-200' : 'text-slate-400'}`}>
                    {stage.label}
                  </p>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {stage.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Stage Details & Advance Action */}
      <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Current Phase:</span>
            <span className="font-semibold text-slate-200">
              Stage 0{currentStageIndex + 1}: {STAGES[currentStageIndex]?.label}
            </span>
          </div>

          <p className="text-xs text-slate-400">
            {deal.history && deal.history[currentStageIndex]?.note
              ? deal.history[currentStageIndex].note
              : `Manifest ${deal.manifestNumber} verified across participating industrial nodes.`}
          </p>
        </div>

        {/* Advance Stage Button (for Judge Demo) */}
        {nextStatusCode && (
          <button
            onClick={() => onAdvanceStatus(deal.id, nextStatusCode)}
            disabled={advancing}
            className="py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer shrink-0"
          >
            <span>{advancing ? 'Verifying...' : `Simulate: ${nextStageName}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {!nextStatusCode && (
          <div className="flex items-center space-x-2 text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Exchange 100% Fulfilled & ESG Compliant</span>
          </div>
        )}

      </div>

    </div>
  );
}
