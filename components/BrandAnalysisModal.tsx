import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { NewsItem, NewsType } from '../types';
import { NEWS_TYPE_LABELS } from '../constants';

interface BrandAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand: string;
  allNews: NewsItem[];
}

// Precise time slices
type TimePeriod = 'MTD' | 'QTD' | 'YTD' | 'ALL';

const TYPE_COLORS: Record<string, string> = {
  [NewsType.LAUNCH]: '#3b82f6', // Blue
  [NewsType.POLICY]: '#ef4444', // Red
  [NewsType.SALES]: '#10b981',  // Emerald
  [NewsType.PERSONNEL]: '#f59e0b', // Amber
  [NewsType.COMPETITOR]: '#8b5cf6', // Purple
  [NewsType.OTHER]: '#64748b'    // Slate
};

const BrandAnalysisModal: React.FC<BrandAnalysisModalProps> = ({ isOpen, onClose, brand, allNews }) => {
  const [period, setPeriod] = useState<TimePeriod>('YTD');

  // --- Date Calculation Logic ---
  const dateRange = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    let startDate = new Date(1970, 0, 1); // Default ALL
    
    if (period === 'MTD') {
        startDate = new Date(currentYear, currentMonth, 1);
    } else if (period === 'QTD') {
        const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
        startDate = new Date(currentYear, quarterStartMonth, 1);
    } else if (period === 'YTD') {
        startDate = new Date(currentYear, 0, 1);
    }

    return startDate.toISOString().split('T')[0];
  }, [period]);

  // --- Filter News ---
  const brandNews = useMemo(() => {
    return allNews.filter(item => 
      item.brand === brand && item.date >= dateRange
    ).sort((a, b) => a.date.localeCompare(b.date)); // Sort ASC for timeline
  }, [allNews, brand, dateRange]);

  // --- KPI Calculation ---
  const kpiData = useMemo(() => {
      if (brandNews.length === 0) return { total: 0, focus: 'N/A', sentiment: 0 };
      
      const total = brandNews.length;
      
      // Calculate Focus
      const typeCounts: Record<string, number> = {};
      brandNews.forEach(n => typeCounts[n.type] = (typeCounts[n.type] || 0) + 1);
      const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
      
      // Calculate Sentiment Ratio
      const positiveCount = brandNews.filter(n => n.sentiment === 'positive').length;
      const sentiment = Math.round((positiveCount / total) * 100);

      return {
          total,
          focus: topType ? NEWS_TYPE_LABELS[topType[0] as NewsType] : 'N/A',
          sentiment
      };
  }, [brandNews]);

  // --- Metric 1: Strategy Focus (Radar Chart) ---
  const strategyData = useMemo(() => {
     const counts: Record<string, number> = {};
     Object.values(NewsType).forEach(t => counts[t] = 0);
     brandNews.forEach(n => counts[n.type] = (counts[n.type] || 0) + 1);
     
     // Normalize to max 100 for radar shape visibility
     const maxVal = Math.max(...Object.values(counts), 1);
     
     return Object.keys(counts).map(key => ({
         subject: NEWS_TYPE_LABELS[key as NewsType],
         A: counts[key],
         fullMark: maxVal,
         color: TYPE_COLORS[key]
     }));
  }, [brandNews]);

  // --- Metric 2: Type Breakdown (Pie Chart) ---
  const typeData = useMemo(() => {
      const counts: Record<string, number> = {};
      brandNews.forEach(n => counts[n.type] = (counts[n.type] || 0) + 1);
      return Object.entries(counts).map(([key, val]) => ({
          name: NEWS_TYPE_LABELS[key as NewsType],
          value: val,
          key: key
      }));
  }, [brandNews]);

  // --- Timeline Milestones (Major Events Only) ---
  const milestones = useMemo(() => {
      // Filter for major events: Launch, Policy, Sales
      return brandNews.filter(n => 
          n.type === NewsType.LAUNCH || 
          n.type === NewsType.POLICY || 
          n.type === NewsType.SALES
      ).slice(-6); // Last 6 items
  }, [brandNews]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-8 py-5 flex justify-between items-center shrink-0">
           <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                 {brand} 
                 <span className="text-lg font-light text-slate-400">|</span>
                 <span className="text-lg text-slate-600">品牌数据看板 (Data Dashboard)</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-mono uppercase tracking-wider">
                 Intelligence Center • Generated {new Date().toLocaleDateString()}
              </p>
           </div>
           
           <div className="flex items-center gap-4">
               {/* Time Slices */}
               <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                   {(['MTD', 'QTD', 'YTD', 'ALL'] as TimePeriod[]).map(t => (
                       <button
                         key={t}
                         onClick={() => setPeriod(t)}
                         className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                             period === t 
                             ? 'bg-slate-900 text-white shadow-md' 
                             : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                         }`}
                       >
                           {t === 'MTD' ? '本月' : t === 'QTD' ? '本季' : t === 'YTD' ? '本年' : '全部'}
                       </button>
                   ))}
               </div>
               <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
           </div>
        </div>

        {/* Main Content Area - Full Width */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8 space-y-6">
            
            {/* 1. KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <div className="text-3xl font-bold text-slate-900">{kpiData.total}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase mt-1">累计情报数 (Total Count)</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xl">📊</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <div className="text-xl font-bold text-slate-900 truncate max-w-[150px]" title={kpiData.focus}>{kpiData.focus}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase mt-1">主攻方向 (Primary Focus)</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-xl">🎯</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <div>
                        <div className="text-3xl font-bold text-green-600">{kpiData.sentiment}%</div>
                        <div className="text-xs font-bold text-slate-400 uppercase mt-1">正面舆情占比 (Positive Sentiment)</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-xl">😊</div>
                </div>
            </div>

            {/* 2. Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[350px]">
                
                {/* Radar Chart: Strategic Focus */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="text-sm font-bold text-slate-800 border-l-4 border-slate-900 pl-3 mb-4">战略重心分布 (Strategy Radar)</h3>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                           <RadarChart cx="50%" cy="50%" outerRadius="70%" data={strategyData}>
                               <PolarGrid stroke="#e2e8f0" />
                               <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                               <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                               <Radar name="Activity" dataKey="A" stroke="#2563eb" strokeWidth={2} fill="#3b82f6" fillOpacity={0.2} />
                               <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                           </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Donut Chart: Type Breakdown */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
                    <h3 className="text-sm font-bold text-slate-800 border-l-4 border-slate-900 pl-3 mb-4">具体类型占比 (Type Breakdown)</h3>
                    <div className="flex-1 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={typeData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {typeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={TYPE_COLORS[entry.key] || '#94a3b8'} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Legend */}
                    <div className="flex flex-wrap justify-center gap-3 mt-2">
                        {typeData.map(item => (
                            <div key={item.key} className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: TYPE_COLORS[item.key]}}></div>
                                <span className="text-xs text-slate-600 font-medium">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 3. Key Milestones Timeline */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 border-l-4 border-slate-900 pl-3 mb-6">关键事件轴 (Key Milestones)</h3>
                
                {milestones.length > 0 ? (
                    <div className="relative border-l-2 border-slate-100 ml-4 space-y-8 py-2">
                        {milestones.map((item) => (
                            <div key={item.id} className="relative pl-8 group">
                                {/* Dot */}
                                <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 transition-transform group-hover:scale-125 ${
                                    item.type === NewsType.LAUNCH ? 'bg-blue-500' : 
                                    item.type === NewsType.POLICY ? 'bg-red-500' : 'bg-emerald-500'
                                }`}></div>
                                
                                {/* Content */}
                                <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-1">
                                    <span className="font-mono text-sm font-bold text-slate-400 group-hover:text-slate-600 transition-colors">{item.date}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                        item.type === NewsType.LAUNCH ? 'bg-blue-50 text-blue-600' : 
                                        item.type === NewsType.POLICY ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                                    }`}>
                                        {NEWS_TYPE_LABELS[item.type]}
                                    </span>
                                </div>
                                <h4 className="text-base font-bold text-slate-800">{item.title}</h4>
                                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.summary}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-10 text-center text-slate-400 italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        当前时间段内无重大关键事件 (No major milestones)
                    </div>
                )}
            </div>

        </div>
      </div>
    </div>
  );
};

export default BrandAnalysisModal;