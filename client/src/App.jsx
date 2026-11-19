import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Marketplace from './pages/Marketplace';
import DealWorkflow from './pages/DealWorkflow';
import ImpactDashboard from './pages/ImpactDashboard';
import { COMPANIES } from './data/mockData';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('marketplace'); // 'marketplace' | 'deals' | 'impact'
  const [currentCompany, setCurrentCompany] = useState(COMPANIES[0]); // default: Tata Steel
  const [highlightDealId, setHighlightDealId] = useState(null);

  const handleResetSeed = () => {
    api.resetDemoData();
    window.location.reload();
  };

  const handleNavigateToDeals = (createdDeal) => {
    if (createdDeal) {
      setHighlightDealId(createdDeal.id);
    }
    setActiveTab('deals');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Universal Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentCompany={currentCompany}
        setCurrentCompany={setCurrentCompany}
        onResetSeed={handleResetSeed}
      />

      {/* Main Dynamic View Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'marketplace' && (
          <Marketplace
            currentCompany={currentCompany}
            onNavigateToDeals={handleNavigateToDeals}
          />
        )}

        {activeTab === 'deals' && (
          <DealWorkflow
            currentCompany={currentCompany}
            highlightDealId={highlightDealId}
            onNavigateToImpact={() => setActiveTab('impact')}
          />
        )}

        {activeTab === 'impact' && (
          <ImpactDashboard
            onNavigateToMarketplace={() => setActiveTab('marketplace')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-400">PHENIX</span>
            <span>—</span>
            <span>Viksit Bharat 2026 Circular Economy Innovation Challenge</span>
          </div>
          <span>Built for SB_S1: End-to-End Industrial Byproduct Matching</span>
        </div>
      </footer>

    </div>
  );
}
