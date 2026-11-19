import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Sparkles, Factory, ArrowUpDown, Shield, SlidersHorizontal, Layers, CheckCircle } from 'lucide-react';
import ListingCard from '../components/ListingCard';
import MatchModal from '../components/MatchModal';
import { api } from '../services/api';

const CATEGORIES = [
  'All',
  'Industrial Slag',
  'Fly Ash',
  'Polymers/Plastics',
  'Spent Solvents',
  'Metals/Scrap',
  'Mineral Residues'
];

export default function Marketplace({ currentCompany, onNavigateToDeals }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'SUPPLY' | 'DEMAND'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [selectedListingForMatch, setSelectedListingForMatch] = useState(null);
  const [isNewListingModalOpen, setIsNewListingModalOpen] = useState(false);

  // New Listing Form state
  const [newListingForm, setNewListingForm] = useState({
    title: '',
    type: 'SUPPLY',
    category: 'Industrial Slag',
    quantity: 500,
    unit: 'Metric Tonnes',
    pricePerUnit: 2500,
    frequency: 'Continuous (Monthly)',
    purityGrade: 'IS 12089:1987 Certified',
    description: '',
  });

  const loadListings = async () => {
    setLoading(true);
    try {
      const data = await api.getListings();
      setListings(data);
    } catch (err) {
      console.error('Failed to load listings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  // Filter listings
  const filteredListings = listings.filter((item) => {
    // Tab filter
    if (activeTab === 'SUPPLY' && item.type !== 'SUPPLY') return false;
    if (activeTab === 'DEMAND' && item.type !== 'DEMAND') return false;

    // Category filter
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchCompany = item.companyName.toLowerCase().includes(q);
      const matchCity = item.location?.city?.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);
      return matchTitle || matchCompany || matchCity || matchCat;
    }

    return true;
  });

  // Calculate live aggregate stats for the board
  const totalSupplyTons = listings
    .filter(l => l.type === 'SUPPLY')
    .reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);

  const totalDemandTons = listings
    .filter(l => l.type === 'DEMAND')
    .reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);

  const handleCreateListing = (e) => {
    e.preventDefault();
    const newEntry = {
      id: `LIST-${Date.now()}`,
      ...newListingForm,
      companyId: currentCompany.id,
      companyName: currentCompany.name,
      location: currentCompany.location,
      status: 'AVAILABLE',
      createdAt: new Date().toISOString(),
      co2FactorKgPerTon: newListingForm.category === 'Industrial Slag' ? 800 : newListingForm.category === 'Fly Ash' ? 850 : 1400
    };

    const updated = [newEntry, ...listings];
    setListings(updated);
    localStorage.setItem('phenix_listings', JSON.stringify(updated));
    setIsNewListingModalOpen(false);
    // Automatically trigger match modal for user delight
    setSelectedListingForMatch(newEntry);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Hero Banner & Quick KPI Counters */}
      <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-industrial-900 to-slate-900 border border-slate-800 p-6 md:p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Viksit Bharat 2026 Circular Economy Mandate</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Industrial Byproduct Exchange & Algorithmic Symbiosis
            </h1>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Eliminate disposal friction. Connect cross-industry supply residuals—slag, fly ash, spent solvents, and polymers—with nearby manufacturing facilities using deterministic proximity and volume weighting.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-2xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Divertible Supply</span>
              <span className="text-xl font-extrabold text-emerald-400 font-mono">
                {totalSupplyTons.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-400">MT</span>
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Active Byproduct Volume</span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-2xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Raw Feedstock Demand</span>
              <span className="text-xl font-extrabold text-cyan-400 font-mono">
                {totalDemandTons.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-400">MT</span>
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Absorption Deficit</span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-2xl col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">CO₂e Abatement Pool</span>
              <span className="text-xl font-extrabold text-teal-300 font-mono">
                ~2,840 <span className="text-xs font-normal text-slate-400">tCO₂e</span>
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">Calculated ESG Impact</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Tabs, Category Pills, Search, New Listing Button */}
      <div className="space-y-4">
        
        {/* Row 1: Supply/Demand Tabs + Search + Post Button */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Main Tabs */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'ALL'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Listings ({listings.length})
            </button>
            <button
              onClick={() => setActiveTab('SUPPLY')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeTab === 'SUPPLY'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Available Byproducts ({listings.filter(l => l.type === 'SUPPLY').length})
            </button>
            <button
              onClick={() => setActiveTab('DEMAND')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeTab === 'DEMAND'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-cyan-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              Raw Material Demands ({listings.filter(l => l.type === 'DEMAND').length})
            </button>
          </div>

          {/* Search & Post Action */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search slag, ash, resin, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60"
              />
            </div>

            <button
              onClick={() => setIsNewListingModalOpen(true)}
              className="py-2 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 whitespace-nowrap cursor-pointer transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Post Resource</span>
            </button>
          </div>

        </div>

        {/* Row 2: Category Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 pl-1 pr-2 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            Category:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm shadow-emerald-500/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          Loading active circular economy listings...
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="py-20 bg-slate-900/50 rounded-2xl border border-slate-800 text-center space-y-3">
          <Factory className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-300">No resources found matching the criteria</h3>
          <p className="text-xs text-slate-500">Try changing your search term or selecting "All" categories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              currentCompany={currentCompany}
              onFindMatches={(item) => setSelectedListingForMatch(item)}
              isFeatured={listing.id === 'LIST-S101'}
            />
          ))}
        </div>
      )}

      {/* Circular Synergy Matchmaker Modal */}
      {selectedListingForMatch && (
        <MatchModal
          isOpen={Boolean(selectedListingForMatch)}
          onClose={() => setSelectedListingForMatch(null)}
          targetListing={selectedListingForMatch}
          currentCompany={currentCompany}
          onDealInitiated={(deal) => {
            if (onNavigateToDeals) {
              onNavigateToDeals(deal);
            }
          }}
        />
      )}

      {/* Post Byproduct / Demand Modal */}
      {isNewListingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-1">List New Industrial Stream</h3>
            <p className="text-xs text-slate-400 mb-4">
              Posting on behalf of <strong className="text-emerald-400">{currentCompany.name}</strong> ({currentCompany.location.city})
            </p>

            <form onSubmit={handleCreateListing} className="space-y-4 text-xs">
              
              <div>
                <label className="block text-slate-400 font-medium mb-1">Listing Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewListingForm({ ...newListingForm, type: 'SUPPLY' })}
                    className={`py-2 rounded-lg font-bold uppercase transition-all ${
                      newListingForm.type === 'SUPPLY'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Available Surplus (Supply)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewListingForm({ ...newListingForm, type: 'DEMAND' })}
                    className={`py-2 rounded-lg font-bold uppercase transition-all ${
                      newListingForm.type === 'DEMAND'
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Feedstock Need (Demand)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Material Title / Compound Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spent Hydrochloric Acid (18% Aqueous)"
                  value={newListingForm.title}
                  onChange={(e) => setNewListingForm({ ...newListingForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Category</label>
                  <select
                    value={newListingForm.category}
                    onChange={(e) => setNewListingForm({ ...newListingForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {CATEGORIES.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Volume (Metric Tonnes)</label>
                  <input
                    type="number"
                    required
                    value={newListingForm.quantity}
                    onChange={(e) => setNewListingForm({ ...newListingForm, quantity: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Price per MT (₹)</label>
                  <input
                    type="number"
                    required
                    value={newListingForm.pricePerUnit}
                    onChange={(e) => setNewListingForm({ ...newListingForm, pricePerUnit: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Purity / Standard Spec</label>
                  <input
                    type="text"
                    value={newListingForm.purityGrade}
                    onChange={(e) => setNewListingForm({ ...newListingForm, purityGrade: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewListingModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-all cursor-pointer"
                >
                  Publish & Find Synergies
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
