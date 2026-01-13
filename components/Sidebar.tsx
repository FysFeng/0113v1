import React, { useState } from 'react';
import { FilterState, NewsType } from '../types';
import { NEWS_TYPES_LIST, NEWS_TYPE_LABELS } from '../constants';

interface SidebarProps {
  currentView: 'dashboard' | 'feed' | 'workbench';
  onChangeView: (view: 'dashboard' | 'feed' | 'workbench') => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  availableBrands: string[];
  onUpdateBrands: (brands: string[]) => void; // Added for brand management
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onChangeView, 
  filters, 
  setFilters, 
  availableBrands,
  onUpdateBrands
}) => {
  const [isEditingBrands, setIsEditingBrands] = useState(false);
  
  // Navigation Item
  const NavItem = ({ view, icon, label }: { view: 'dashboard' | 'feed' | 'workbench', icon: string, label: string }) => (
    <button
      onClick={() => onChangeView(view)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        currentView === view 
          ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-900/40 font-bold' 
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
      }`}
    >
      <span className={`text-xl transition-transform group-hover:scale-110 ${currentView === view ? 'scale-110' : ''}`}>{icon}</span>
      <span className="text-sm tracking-wide">{label}</span>
    </button>
  );

  // --- Brand Logic ---
  const isAllBrands = filters.selectedBrands.length === 0;

  const handleBrandAll = () => {
    setFilters(prev => ({ ...prev, selectedBrands: [] }));
  };

  const handleBrandToggle = (brand: string) => {
    if (isEditingBrands) return; // Prevent filtering while editing
    setFilters(prev => {
      const exists = prev.selectedBrands.includes(brand);
      return {
        ...prev,
        selectedBrands: exists
          ? prev.selectedBrands.filter(b => b !== brand)
          : [...prev.selectedBrands, brand]
      };
    });
  };

  const handleAddBrand = () => {
      const newBrand = prompt("请输入新品牌名称 (e.g. Audi):");
      if (newBrand && !availableBrands.includes(newBrand)) {
          onUpdateBrands([...availableBrands, newBrand]);
      }
  };

  const handleDeleteBrand = (brandToDelete: string) => {
      if (confirm(`确定要删除品牌 "${brandToDelete}" 吗?`)) {
          const newList = availableBrands.filter(b => b !== brandToDelete);
          onUpdateBrands(newList);
          // Also remove from filters if selected
          setFilters(prev => ({
              ...prev,
              selectedBrands: prev.selectedBrands.filter(b => b !== brandToDelete)
          }));
      }
  };

  // --- Type Logic ---
  const isAllTypes = filters.selectedTypes.length === 0 || filters.selectedTypes.length === NEWS_TYPES_LIST.length;

  const handleTypeAll = () => {
    setFilters(prev => ({ ...prev, selectedTypes: NEWS_TYPES_LIST }));
  };

  const handleTypeToggle = (type: NewsType) => {
    setFilters(prev => {
      const exists = prev.selectedTypes.includes(type);
      if (exists && prev.selectedTypes.length === 1) {
         return { ...prev, selectedTypes: prev.selectedTypes.filter(t => t !== type) };
      }
      return {
        ...prev,
        selectedTypes: exists
          ? prev.selectedTypes.filter(t => t !== type)
          : [...prev.selectedTypes, type]
      };
    });
  };

  // --- Date Logic ---
  const setDateRange = (days: number | 'all') => {
      if (days === 'all') {
          setFilters(prev => ({
              ...prev,
              startDate: '',
              endDate: new Date().toISOString().split('T')[0]
          }));
          return;
      }

      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - days);
      setFilters(prev => ({
          ...prev,
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
      }));
  };

  // Helper to check if a preset is active
  const isDateActive = (days: number | 'all') => {
      if (days === 'all') return filters.startDate === '';
      
      const end = new Date().toISOString().split('T')[0];
      const start = new Date();
      start.setDate(new Date().getDate() - days);
      const startStr = start.toISOString().split('T')[0];
      
      return filters.startDate === startStr && filters.endDate >= end; // Simple check
  };

  const getTypeColor = (type: NewsType, isSelected: boolean) => {
      if (!isSelected) return 'bg-slate-800/40 text-slate-500 border-slate-700/50 hover:border-slate-600 opacity-60';
      switch(type) {
          case NewsType.LAUNCH: return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
          case NewsType.POLICY: return 'bg-red-500/20 text-red-400 border-red-500/50';
          case NewsType.SALES: return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
          default: return 'bg-slate-100/10 text-white border-slate-400/50';
      }
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0b1120] text-slate-100 flex flex-col z-50 shadow-[4px_0_24px_rgba(0,0,0,0.4)]">
      {/* 1. Logo Area */}
      <div className="p-6 pb-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-red-900/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">
                Auto Insight
            </h1>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">UAE Intelligence</p>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation */}
      <div className="px-4 py-6 space-y-2 border-b border-slate-800/50">
        <NavItem view="dashboard" icon="📊" label="驾驶舱 Dashboard" />
        <NavItem view="feed" icon="⚡" label="情报流 Feed" />
      </div>

      {/* 3. Command Center (Filters) */}
      <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar space-y-8">
        
        {/* Time Control */}
        <div>
            <div className="flex items-center gap-2 mb-3 px-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Time Range</span>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-2">
                 <button 
                    onClick={() => setDateRange('all')}
                    className={`text-xs py-1.5 rounded-lg transition-colors border ${
                        isDateActive('all') 
                        ? 'bg-slate-100 text-slate-900 border-white font-bold' 
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                    }`}
                >
                    All
                </button>
                <button 
                    onClick={() => setDateRange(7)}
                    className={`text-xs py-1.5 rounded-lg transition-colors border ${
                        isDateActive(7) 
                        ? 'bg-slate-100 text-slate-900 border-white font-bold' 
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                    }`}
                >
                    7 Days
                </button>
                <button 
                    onClick={() => setDateRange(30)}
                    className={`text-xs py-1.5 rounded-lg transition-colors border ${
                        isDateActive(30) 
                        ? 'bg-slate-100 text-slate-900 border-white font-bold' 
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                    }`}
                >
                    30 Days
                </button>
            </div>
            {/* Custom Range Trigger */}
             <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500">Custom:</span>
                <input 
                    type="date" 
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({...prev, startDate: e.target.value}))}
                    className="bg-transparent text-[10px] text-slate-300 w-20 outline-none cursor-pointer hover:text-white"
                />
                <span className="text-slate-600">-</span>
                <input 
                    type="date" 
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({...prev, endDate: e.target.value}))}
                    className="bg-transparent text-[10px] text-slate-300 w-20 outline-none cursor-pointer hover:text-white"
                />
             </div>
        </div>

        {/* Type Matrix */}
        <div>
           <div className="flex items-center gap-2 mb-3 px-1 justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Data Layers</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {/* ALL BUTTON */}
                <button
                    onClick={handleTypeAll}
                    className={`px-2 py-2 rounded-lg border text-[10px] font-bold transition-all duration-200 flex items-center justify-center text-center ${
                       isAllTypes 
                       ? 'bg-slate-100 text-slate-900 border-white shadow-[0_0_10px_rgba(255,255,255,0.2)]'
                       : 'bg-slate-800/40 text-slate-500 border-slate-700/50 hover:border-slate-600'
                    }`}
                >
                    ALL
                </button>

                {NEWS_TYPES_LIST.map(type => {
                    const isSelected = filters.selectedTypes.includes(type);
                    return (
                        <button
                            key={type}
                            onClick={() => handleTypeToggle(type)}
                            className={`px-2 py-2 rounded-lg border text-[10px] font-medium transition-all duration-200 flex items-center justify-center text-center ${getTypeColor(type, isSelected)}`}
                        >
                            {NEWS_TYPE_LABELS[type]}
                        </button>
                    )
                })}
            </div>
        </div>

        {/* Brand Matrix (With Management) */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-3 px-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Targets</span>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-600">
                        {isEditingBrands ? 'Editing...' : `${isAllBrands ? 'All' : filters.selectedBrands.length} Selected`}
                    </span>
                    <button 
                        onClick={() => setIsEditingBrands(!isEditingBrands)}
                        className={`text-xs p-1 rounded hover:bg-slate-800 transition-colors ${isEditingBrands ? 'text-red-500 bg-red-500/10' : 'text-slate-500'}`}
                        title="Manage Brands"
                    >
                        ⚙️
                    </button>
                </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {/* ALL BUTTON (Hidden in edit mode) */}
            {!isEditingBrands && (
                <button
                    onClick={handleBrandAll}
                    className={`px-3 py-1 text-[10px] rounded-md border transition-all font-bold ${
                        isAllBrands
                        ? 'bg-slate-100 text-slate-900 border-white shadow-[0_0_10px_rgba(255,255,255,0.2)]'
                        : 'bg-slate-800/30 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
                    }`}
                >
                    ALL
                </button>
            )}

            {availableBrands.map(brand => {
              const isSelected = filters.selectedBrands.includes(brand);
              return (
                <button
                  key={brand}
                  onClick={() => isEditingBrands ? handleDeleteBrand(brand) : handleBrandToggle(brand)}
                  className={`px-2 py-1 text-[10px] rounded-md border transition-all flex items-center gap-1 ${
                    isEditingBrands 
                        ? 'bg-slate-800 border-red-900/50 text-slate-400 hover:border-red-500 hover:text-red-400 cursor-pointer'
                        : isSelected
                            ? 'bg-red-600 text-white border-red-500 font-bold shadow-md'
                            : 'bg-slate-800/30 border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
                  }`}
                >
                  {brand}
                  {isEditingBrands && <span className="text-[8px] opacity-50 ml-1">✕</span>}
                </button>
              );
            })}

            {/* Add Button (Only in edit mode) */}
            {isEditingBrands && (
                <button
                    onClick={handleAddBrand}
                    className="px-2 py-1 text-[10px] rounded-md border border-dashed border-slate-600 text-slate-500 hover:text-white hover:border-slate-400 hover:bg-slate-800 transition-all"
                >
                    + Add
                </button>
            )}
          </div>
        </div>

      </div>

      {/* 4. Workbench Entry */}
      <div className="p-4 border-t border-slate-800/50 bg-[#0b1120]">
         <button 
           onClick={() => onChangeView('workbench')}
           className={`w-full py-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 group ${
             currentView === 'workbench' 
                ? 'bg-slate-800 border-slate-600 text-white' 
                : 'border-dashed border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
           }`}
         >
           <span className="group-hover:rotate-90 transition-transform">⚙️</span> 
           Data Center
         </button>
      </div>
    </aside>
  );
};

export default Sidebar;