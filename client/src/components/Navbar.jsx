import React from 'react';
import { RefreshCw, Factory, Recycle, ShieldCheck, ArrowRightLeft, Sparkles, TrendingUp } from 'lucide-react';
import { COMPANIES } from '../data/mockData';

export default function Navbar({ activeTab, setActiveTab, currentCompany, setCurrentCompany, onResetSeed }) {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/30">
              <Recycle className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  PHENIX
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  SB_S1 Viksit Bharat
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">B2B Circular Symbiosis & Material Matchmaking</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('marketplace')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'marketplace'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Factory className="w-4 h-4" />
              <span>Marketplace</span>
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 rounded">
                Live
              </span>
            </button>

            <button
              onClick={() => setActiveTab('deals')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'deals'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Deal Logistics & Escrow</span>
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-semibold bg-blue-500/20 text-blue-300 rounded">
                Chain-of-Custody
              </span>
            </button>

            <button
              onClick={() => setActiveTab('impact')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'impact'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>ESG Impact</span>
            </button>
          </nav>

          {/* Quick Company Switcher & Reset */}
          <div className="flex items-center space-x-3">
            {/* Persona Switcher for Quick Demo */}
            <div className="flex items-center bg-slate-800/80 rounded-lg p-1 border border-slate-700/60">
              <span className="text-[11px] font-medium text-slate-400 pl-2 pr-1 hidden lg:inline">Viewing as:</span>
              <select
                value={currentCompany.id}
                onChange={(e) => {
                  const comp = COMPANIES.find(c => c.id === e.target.value);
                  if (comp) setCurrentCompany(comp);
                }}
                className="bg-slate-900 text-xs font-semibold text-emerald-300 border-none rounded-md px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-400 cursor-pointer"
              >
                {COMPANIES.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.avatar} {c.shortName} ({c.location.city})
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Demo Seed Button */}
            <button
              onClick={onResetSeed}
              title="1-Click Seed Demo Data"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Seed Data</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
