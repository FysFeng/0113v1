import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import NewsCard from './components/NewsCard';
import EntryForm from './components/EntryForm';
import WeeklyReportModal from './components/WeeklyReportModal';
import BrandAnalysisModal from './components/BrandAnalysisModal';
import Dashboard from './components/Dashboard';

import { NEWS_TYPES_LIST, INITIAL_NEWS, DEFAULT_BRANDS } from './constants';
import { NewsItem, FilterState } from './types';

// 定义视图类型
type ViewType = 'dashboard' | 'feed' | 'workbench';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [analyzingBrand, setAnalyzingBrand] = useState<string | null>(null);

  // --- 1. 核心视图状态 ---
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');

  // Data States
  const [news, setNews] = useState<NewsItem[]>([]);
  const [customBrands, setCustomBrands] = useState<string[]>([]);

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const newsRes = await fetch(`/api/news?_t=${Date.now()}`, { cache: 'no-store' });
        if (!newsRes.ok) throw new Error("无法连接云端数据库");
        const newsData = await newsRes.json();
        setNews(newsData.length > 0 ? newsData : INITIAL_NEWS);

        const brandsRes = await fetch(`/api/brands?_t=${Date.now()}`, { cache: 'no-store' });
        const brandsData = await brandsRes.json();
        setCustomBrands(brandsData.length > 0 ? brandsData : DEFAULT_BRANDS);
      } catch (error) {
        console.error("Cloud data error:", error);
        setDbError("离线模式：无法连接云端数据库");
        setNews(INITIAL_NEWS);
        setCustomBrands(DEFAULT_BRANDS);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  
  // Filters State (Global)
  const defaultEndDate = new Date().toISOString().split('T')[0];
  const [filters, setFilters] = useState<FilterState>({
    startDate: '', 
    endDate: defaultEndDate,
    selectedBrands: [], // 默认为空，表示全选
    selectedTypes: NEWS_TYPES_LIST,
    searchQuery: ''
  });

  // Filter Logic
  const filteredNews = useMemo(() => {
    return news.filter(item => {
      const startMatch = !filters.startDate || item.date >= filters.startDate;
      const endMatch = !filters.endDate || item.date <= filters.endDate;
      const brandMatch = filters.selectedBrands.length === 0 || filters.selectedBrands.includes(item.brand);
      const typeMatch = filters.selectedTypes.length === 0 || filters.selectedTypes.includes(item.type);
      const searchLower = filters.searchQuery.toLowerCase();
      const searchMatch = !filters.searchQuery || 
                          item.title.toLowerCase().includes(searchLower) || 
                          item.summary.toLowerCase().includes(searchLower) ||
                          (item.tags && item.tags.some(t => t.toLowerCase().includes(searchLower)));

      return startMatch && endMatch && brandMatch && typeMatch && searchMatch;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
  }, [news, filters]);

  // Calculate Time Label for Dashboard (e.g. "7 Day", "Total")
  const timeLabel = useMemo(() => {
      if (!filters.startDate) return "Total History";
      
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

      if (diffDays <= 7) return "7 Day";
      if (diffDays <= 31) return "30 Day";
      if (diffDays <= 92) return "Quarterly";
      return `${diffDays} Day`;
  }, [filters.startDate, filters.endDate]);

  // Cloud Save Helpers
  const saveNewsToCloud = async (updatedNews: NewsItem[]) => {
    setIsSaving(true);
    try {
      await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedNews)
      });
    } catch (e) {
      alert("保存失败");
    } finally {
      setIsSaving(false);
    }
  };

  const saveBrandsToCloud = async (updatedBrands: string[]) => {
      try {
          await fetch('/api/brands', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updatedBrands)
          });
      } catch (e) {
          console.error("Failed to save brands", e);
      }
  };

  // Actions
  const handleAddNews = (item: Omit<NewsItem, 'id'>) => {
    const newItem = { ...item, id: Math.random().toString(36).substring(2, 15) };
    const updated = [newItem, ...news];
    setNews(updated);
    saveNewsToCloud(updated);
    // 录入后跳转回列表看结果
    setCurrentView('feed');
  };

  const handleDeleteNews = (id: string) => {
    if (confirm("确定删除吗？")) {
      const updated = news.filter(item => item.id !== id);
      setNews(updated);
      saveNewsToCloud(updated);
    }
  };

  const handleUpdateBrands = (newBrands: string[]) => {
      setCustomBrands(newBrands);
      saveBrandsToCloud(newBrands);
  };

  // Dashboard Drill Down
  const handleDashboardDrillDown = (brand?: string) => {
    if (brand) {
        setFilters(prev => ({ ...prev, selectedBrands: [brand] }));
        // 自动打开品牌分析模态框
        setAnalyzingBrand(brand);
    } else {
        setFilters(prev => ({ ...prev, selectedBrands: [] }));
        setCurrentView('feed');
    }
  };

  if (isLoading && news.length === 0) {
      return (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
              <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                  <p className="text-slate-500 text-xs">System Initializing...</p>
              </div>
          </div>
      );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <WeeklyReportModal 
         isOpen={isReportModalOpen} 
         onClose={() => setIsReportModalOpen(false)} 
         allNews={news} 
      />
      
      {analyzingBrand && (
         <BrandAnalysisModal 
            isOpen={!!analyzingBrand} 
            onClose={() => setAnalyzingBrand(null)} 
            brand={analyzingBrand}
            allNews={news}
         />
      )}

      {/* 1. Left Navigation Sidebar */}
      <Sidebar 
        currentView={currentView}
        onChangeView={setCurrentView}
        filters={filters} 
        setFilters={setFilters} 
        availableBrands={customBrands}
        onUpdateBrands={handleUpdateBrands} // Passed handler
      />

      {/* 2. Main Content Area */}
      <main className="flex-1 ml-64 relative min-h-screen transition-all">
        
        {/* VIEW: DASHBOARD */}
        {currentView === 'dashboard' && (
           <Dashboard 
             news={filteredNews} 
             availableBrands={customBrands}
             onDrillDown={handleDashboardDrillDown}
             timeLabel={timeLabel} 
           />
        )}

        {/* VIEW: FEED (LIST) */}
        {currentView === 'feed' && (
           <div className="p-8 lg:p-12 max-w-6xl mx-auto animate-fadeIn">
              <header className="flex justify-between items-center mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">情报列表</h2>
                    <p className="text-slate-500 text-sm mt-1">
                       筛选结果: {filteredNews.length} 条资讯
                    </p>
                  </div>
                  <div className="flex gap-3">
                     <input 
                        type="text" 
                        placeholder="搜索标题或内容..." 
                        className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm w-64 focus:ring-2 focus:ring-red-500 outline-none"
                        value={filters.searchQuery}
                        onChange={(e) => setFilters(prev => ({...prev, searchQuery: e.target.value}))}
                     />
                     <button 
                        onClick={() => setIsReportModalOpen(true)}
                        className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2"
                     >
                        📊 生成周报
                     </button>
                  </div>
              </header>

              <div className="space-y-6 pb-20">
                 {filteredNews.length > 0 ? (
                    filteredNews.map(item => (
                      <NewsCard key={item.id} item={item} onDelete={handleDeleteNews} />
                    ))
                 ) : (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                      <p className="text-slate-400">当前筛选条件下暂无数据</p>
                      <button onClick={() => setFilters(prev => ({...prev, selectedBrands: [], searchQuery: ''}))} className="text-blue-500 text-sm mt-2 hover:underline">清除筛选</button>
                    </div>
                 )}
              </div>
           </div>
        )}

        {/* VIEW: WORKBENCH (ENTRY) */}
        {currentView === 'workbench' && (
           <div className="p-8 lg:p-12 max-w-4xl mx-auto animate-fadeIn">
              <div className="mb-8">
                 <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    🛠️ 数据中心 <span className="text-xs bg-slate-200 text-slate-500 px-2 py-1 rounded">Admin Only</span>
                 </h2>
                 <p className="text-slate-500 text-sm mt-1">
                    在此处理网络爬虫抓取的原始数据，或人工录入新情报。所有操作将实时同步至云端。
                 </p>
              </div>
              
              <EntryForm onAdd={handleAddNews} availableBrands={customBrands} />
           </div>
        )}

      </main>
    </div>
  );
}

export default App;