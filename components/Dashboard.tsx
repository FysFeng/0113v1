import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, Cell, LabelList,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { NewsItem, NewsType } from '../types';
import { NEWS_TYPE_LABELS } from '../constants';

interface DashboardProps {
  news: NewsItem[];
  availableBrands: string[];
  onDrillDown: (brand?: string) => void;
  timeLabel: string;
}

// Color mapping
const TYPE_COLORS: Record<string, string> = {
  [NewsType.LAUNCH]: '#3b82f6', // Blue
  [NewsType.POLICY]: '#ef4444', // Red
  [NewsType.SALES]: '#10b981',  // Green
  [NewsType.PERSONNEL]: '#f59e0b', // Amber
  [NewsType.COMPETITOR]: '#8b5cf6', // Purple
  [NewsType.OTHER]: '#64748b'    // Slate
};

// --- 1. SVG MAP COMPONENT (With Hover Intel Card) ---
const UaeTechMap = ({ data, news }: { data: { location: string; count: number }[], news: NewsItem[] }) => {
  const [hoveredLoc, setHoveredLoc] = useState<string | null>(null);

  // Calculate top keywords for the hovered location
  const locationIntel = useMemo(() => {
    if (!hoveredLoc) return [];
    
    // Filter news for this location
    const locNews = news.filter(n => {
        const text = (n.title + n.summary + n.source).toLowerCase();
        return text.includes(hoveredLoc.toLowerCase()) || 
               (hoveredLoc === 'Abu Dhabi' && text.includes('capital')) ||
               (hoveredLoc === 'Ras Al Khaimah' && text.includes('rak')) ||
               (hoveredLoc === 'Umm Al Quwain' && text.includes('uaq'));
    });

    // Count tags
    const tagCounts: Record<string, number> = {};
    locNews.forEach(n => {
        n.tags?.forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1);
    });

    return Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([tag]) => tag);
  }, [hoveredLoc, news]);

  const locations: Record<string, { x: number; y: number; label: string }> = {
    'Abu Dhabi': { x: 30, y: 75, label: 'ABU DHABI' },
    'Dubai': { x: 78, y: 38, label: 'DUBAI' },
    'Sharjah': { x: 84, y: 32, label: 'SHJ' },
    'Ajman': { x: 88, y: 28, label: 'AJM' },
    'Umm Al Quwain': { x: 92, y: 24, label: 'UAQ' },
    'Ras Al Khaimah': { x: 96, y: 16, label: 'RAK' },
    'Fujairah': { x: 105, y: 40, label: 'FUJ' },
  };

  const getBubbleSize = (loc: string) => {
    const item = data.find(d => d.location === loc);
    return item ? Math.min(18, 4 + item.count * 3) : 4;
  };

  const getBubbleColor = (loc: string) => {
      if (loc === 'Abu Dhabi') return '#ef4444'; 
      if (loc === 'Dubai') return '#3b82f6';
      return '#10b981';
  };

  return (
    <div className="w-full h-full relative bg-slate-800/30 rounded-lg overflow-hidden flex items-center justify-center group">
      
      {/* Map SVG */}
      <svg viewBox="0 0 140 100" className="w-full h-full drop-shadow-2xl">
        <path 
          d="M 20 85 L 10 70 L 15 60 L 50 50 L 70 40 L 85 35 L 95 10 L 110 15 L 115 40 L 100 50 L 90 45 L 75 55 L 60 75 L 40 90 Z" 
          fill="#1e293b" stroke="#334155" strokeWidth="1" opacity="0.8"
        />
        {/* Connection Lines */}
        <line x1="30" y1="75" x2="78" y2="38" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />
        <line x1="78" y1="38" x2="105" y2="40" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />

        {Object.keys(locations).map(loc => (
          <g 
            key={loc} 
            className="cursor-pointer transition-opacity"
            onMouseEnter={() => setHoveredLoc(loc)}
            onMouseLeave={() => setHoveredLoc(null)}
          >
             {(data.find(d => d.location === loc)?.count || 0) > 0 && (
                 <circle cx={locations[loc].x} cy={locations[loc].y} r={getBubbleSize(loc) + 4} fill={getBubbleColor(loc)} opacity="0.2" className="animate-ping origin-center" style={{ animationDuration: '3s' }} />
             )}
             <circle cx={locations[loc].x} cy={locations[loc].y} r={getBubbleSize(loc)} fill={getBubbleColor(loc)} opacity={hoveredLoc === loc ? 1 : 0.8} stroke="#0f172a" strokeWidth={hoveredLoc === loc ? 1.5 : 0.5} />
             <text x={locations[loc].x} y={locations[loc].y + getBubbleSize(loc) + 6} fontSize="4" fill={hoveredLoc === loc ? "#fff" : "#94a3b8"} textAnchor="middle" fontWeight="bold" className="uppercase tracking-wider transition-colors">
                {locations[loc].label}
             </text>
          </g>
        ))}
      </svg>
      
      {/* Hover Intel Card (Glassmorphism) */}
      {hoveredLoc && (
          <div className="absolute right-4 top-4 w-40 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-lg p-3 shadow-2xl animate-fadeIn z-20">
              <h4 className="text-xs font-bold text-white border-b border-slate-700 pb-1 mb-2 flex justify-between">
                  {hoveredLoc}
                  <span className="text-blue-400">{data.find(d => d.location === hoveredLoc)?.count || 0} Events</span>
              </h4>
              <div className="space-y-1">
                  {locationIntel.length > 0 ? (
                      locationIntel.map(tag => (
                          <div key={tag} className="text-[10px] text-slate-300 bg-slate-800/50 px-2 py-1 rounded">
                              #{tag}
                          </div>
                      ))
                  ) : (
                      <div className="text-[10px] text-slate-500 italic">No specific tags</div>
                  )}
              </div>
          </div>
      )}

      <div className="absolute bottom-2 left-2 text-[8px] text-slate-600 font-mono">
         INTERACTIVE VECTOR MAP
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ news, availableBrands, onDrillDown, timeLabel }) => {
  
  // State for Charts
  const [compareBrandA, setCompareBrandA] = useState('Changan');
  const [compareBrandB, setCompareBrandB] = useState('BYD');
  const [trendPeriod, setTrendPeriod] = useState('Month');
  const [comparisonTab, setComparisonTab] = useState<'trend' | 'radar' | 'sentiment'>('trend');
  
  // State for Brand Share (Interactive Sorting)
  const [shareMetric, setShareMetric] = useState<'total' | NewsType>('total');

  // --- 1. KPI CALCULATIONS ---
  const kpis = useMemo(() => {
    const total = news.length;
    const counts: Record<string, number> = {};
    news.forEach(n => counts[n.brand] = (counts[n.brand] || 0) + 1);
    const sortedBrands = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const topBrand = sortedBrands[0] || ['N/A', 0];
    const launchCount = news.filter(n => n.type === NewsType.LAUNCH).length;
    const changanCount = news.filter(n => n.brand === 'Changan').length;
    return { total, topBrand, launchCount, changanCount };
  }, [news]);

  // --- 2. MODULE 1: BRAND SHARE (Interactive Horizontal) ---
  const brandShareData = useMemo(() => {
    const brandMap: Record<string, any> = {};
    
    // Init brands
    availableBrands.forEach(b => {
        brandMap[b] = { name: b, total: 0 };
        Object.values(NewsType).forEach(t => brandMap[b][t] = 0);
    });

    news.forEach(n => {
        if (!brandMap[n.brand]) {
             // Handle 'Other' brands not in available list if needed, or skip
             if (!brandMap['Other']) brandMap['Other'] = { name: 'Other', total: 0 };
             brandMap['Other'][n.type] = (brandMap['Other'][n.type] || 0) + 1;
             brandMap['Other'].total += 1;
        } else {
            brandMap[n.brand][n.type] = (brandMap[n.brand][n.type] || 0) + 1;
            brandMap[n.brand].total += 1;
        }
    });

    // Convert to array and Sort based on current selection
    return Object.values(brandMap)
        .sort((a: any, b: any) => {
            const valA = shareMetric === 'total' ? a.total : a[shareMetric] || 0;
            const valB = shareMetric === 'total' ? b.total : b[shareMetric] || 0;
            return valB - valA;
        })
        .slice(0, 10); // Top 10
  }, [news, availableBrands, shareMetric]);

  // Calculate Available Types (Linkage Logic)
  // If a type has 0 news in the current filtered set, we can grey it out
  const availableTypes = useMemo(() => {
      const types = new Set<string>();
      news.forEach(n => types.add(n.type));
      return types;
  }, [news]);

  // --- 3. MAP DATA ---
  const mapData = useMemo(() => {
    const counts: Record<string, number> = { 'Abu Dhabi': 0, 'Dubai': 0, 'Sharjah': 0, 'Ajman': 0, 'Umm Al Quwain': 0, 'Ras Al Khaimah': 0, 'Fujairah': 0 };
    news.forEach(n => {
      const text = (n.title + n.summary + n.source).toLowerCase();
      if (text.includes('abu dhabi') || text.includes('capital')) counts['Abu Dhabi']++;
      else if (text.includes('dubai')) counts['Dubai']++;
      else if (text.includes('sharjah')) counts['Sharjah']++;
      else if (text.includes('ajman')) counts['Ajman']++;
      else if (text.includes('uaq')) counts['Umm Al Quwain']++;
      else if (text.includes('rak')) counts['Ras Al Khaimah']++;
      else if (text.includes('fujairah')) counts['Fujairah']++;
    });
    return Object.entries(counts).map(([location, count]) => ({ location, count }));
  }, [news]);

  // --- 4. TAG TRENDS ---
  const tagData = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    let totalTags = 0;
    news.forEach(n => n.tags?.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; totalTags++; }));
    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count, percent: Math.round((count / Math.max(totalTags, 1)) * 100) }))
      .sort((a, b) => b.count - a.count).slice(0, 5);
  }, [news]);

  // --- 5. COMPARISON MODULE DATA ---
  
  // Helper: Get news for a specific brand within the selected period
  const getBrandNews = useMemo(() => (brand: string) => {
    const now = new Date();
    const cutoff = new Date();
    if (trendPeriod === 'Week') cutoff.setDate(now.getDate() - 7);
    if (trendPeriod === 'Month') cutoff.setDate(now.getDate() - 30);
    if (trendPeriod === 'Quarter') cutoff.setDate(now.getDate() - 90);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return news.filter(n => n.brand === brand && n.date >= cutoffStr);
  }, [news, trendPeriod]);

  const newsA = useMemo(() => getBrandNews(compareBrandA), [getBrandNews, compareBrandA]);
  const newsB = useMemo(() => getBrandNews(compareBrandB), [getBrandNews, compareBrandB]);

  // 5a. Trend Data (Line Chart)
  const trendData = useMemo(() => {
    const dataPoints: Record<string, any>[] = [];
    const dates = Array.from(new Set([...newsA, ...newsB].map(n => n.date))).sort();
    
    dates.forEach(d => {
        dataPoints.push({
            date: d.substring(5),
            [compareBrandA]: newsA.filter(n => n.date === d).length,
            [compareBrandB]: newsB.filter(n => n.date === d).length
        });
    });
    return dataPoints;
  }, [newsA, newsB, compareBrandA, compareBrandB]);

  // 5b. Radar Data (Dimensions)
  const radarData = useMemo(() => {
      // Metrics Calculator
      const calc = (data: NewsItem[]) => ({
          volume: data.length,
          sentiment: data.length ? (data.filter(n=>n.sentiment==='positive').length / data.length) * 100 : 0,
          launch: data.filter(n=>n.type===NewsType.LAUNCH).length,
          policy: data.filter(n=>n.type===NewsType.POLICY).length,
          sales: data.filter(n=>n.type===NewsType.SALES).length
      });
      const mA = calc(newsA);
      const mB = calc(newsB);

      // Normalization factor (to make the chart look full)
      const maxVol = Math.max(mA.volume, mB.volume, 1);
      const maxLaunch = Math.max(mA.launch, mB.launch, 1);
      const maxPolicy = Math.max(mA.policy, mB.policy, 1);
      const maxSales = Math.max(mA.sales, mB.sales, 1);

      return [
          { subject: 'Volume (声量)', A: (mA.volume/maxVol)*100, B: (mB.volume/maxVol)*100, fullMark: 100, rawA: mA.volume, rawB: mB.volume },
          { subject: 'Sentiment (口碑)', A: mA.sentiment, B: mB.sentiment, fullMark: 100, rawA: Math.round(mA.sentiment)+'%', rawB: Math.round(mB.sentiment)+'%' },
          { subject: 'Launch (新车)', A: (mA.launch/maxLaunch)*100, B: (mB.launch/maxLaunch)*100, fullMark: 100, rawA: mA.launch, rawB: mB.launch },
          { subject: 'Policy (政策)', A: (mA.policy/maxPolicy)*100, B: (mB.policy/maxPolicy)*100, fullMark: 100, rawA: mA.policy, rawB: mB.policy },
          { subject: 'Sales (市场)', A: (mA.sales/maxSales)*100, B: (mB.sales/maxSales)*100, fullMark: 100, rawA: mA.sales, rawB: mB.sales },
      ];
  }, [newsA, newsB]);

  // 5c. Sentiment Data (Stacked Bar)
  const sentimentData = useMemo(() => {
    const calc = (data: NewsItem[], name: string) => ({
        name,
        positive: data.filter(n => n.sentiment === 'positive').length,
        neutral: data.filter(n => !n.sentiment || n.sentiment === 'neutral').length,
        negative: data.filter(n => n.sentiment === 'negative').length
    });
    return [calc(newsA, compareBrandA), calc(newsB, compareBrandB)];
  }, [newsA, newsB, compareBrandA, compareBrandB]);


  // --- UI COMPONENTS ---
  const KpiCard = ({ title, value, sub, colorStr }: any) => (
    <div className="bg-[#1e293b] border border-slate-700/50 p-5 rounded-xl flex flex-col justify-between h-32 relative overflow-hidden group hover:border-slate-600 transition-all shadow-lg shadow-black/20">
       {/* Background Decoration */}
       <svg className="absolute right-0 bottom-0 w-24 h-24 opacity-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
       </svg>
       
       <div className="z-10">
         <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">{title}</div>
         <div className="text-4xl font-mono font-bold text-white tracking-tight">{value}</div>
       </div>

       <div className="z-10 mt-auto">
          {/* Animated Text Indicator */}
          <div className={`text-xs font-bold flex items-center gap-2 ${sub.includes('↑') ? 'text-green-400' : 'text-slate-500'}`}>
             <span className={`${sub.includes('↑') ? 'animate-pulse' : ''}`}>{sub}</span>
          </div>
       </div>
       
       {/* Glow Effect */}
       <div className={`absolute -top-10 -right-10 w-24 h-24 bg-${colorStr}-500 blur-[50px] opacity-10 group-hover:opacity-20 transition-opacity`}></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-200 font-sans p-6 lg:p-8">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 pb-4 border-b border-slate-800/50">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]">
               AI
            </div>
            <div>
               <h1 className="text-2xl font-bold text-white tracking-tight">UAE COMMAND CENTER</h1>
               <div className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-mono mt-0.5">Real-time Market Intelligence</div>
            </div>
         </div>
         <div className="text-xs font-mono text-slate-400 bg-slate-900/50 border border-slate-800 px-4 py-1.5 rounded-full">
            LIVE FEED: {new Date().toISOString().split('T')[0]}
         </div>
      </header>

      {/* KPI ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
         <KpiCard title={`${timeLabel} Volume`} value={kpis.total} sub="Filtered View" colorStr="blue" />
         <KpiCard title="Top Active Brand" value={kpis.topBrand[0]} sub={`${kpis.topBrand[1]} Signals`} colorStr="purple" />
         <KpiCard title="New Launches" value={kpis.launchCount} sub="Selected Period" colorStr="emerald" />
         <KpiCard title="Changan Activity" value={kpis.changanCount} sub={kpis.changanCount > 0 ? "Active" : "Silent"} colorStr="orange" />
      </div>

      {/* MIDDLE SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 min-h-[380px]">
         
         {/* MODULE 1: INTERACTIVE BRAND SHARE */}
         <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-6 flex flex-col shadow-xl">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                   <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                   品牌声量矩阵 (Brand Share)
                </h3>
                <span className="text-[10px] text-slate-500 uppercase">Sort By:</span>
            </div>
            
            {/* Interactive Filters (Legend) */}
            <div className="flex flex-wrap gap-2 mb-4 border-b border-slate-700/50 pb-3">
                <button 
                    onClick={() => setShareMetric('total')}
                    className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                        shareMetric === 'total' ? 'bg-slate-100 text-slate-900' : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                >
                    Total
                </button>
                {Object.keys(TYPE_COLORS).map(type => {
                    const isAvailable = availableTypes.has(type);
                    return (
                        <button
                            key={type}
                            onClick={() => isAvailable && setShareMetric(type as NewsType)}
                            disabled={!isAvailable}
                            className={`px-3 py-1 rounded text-[10px] font-bold transition-all border ${
                                shareMetric === type 
                                ? `bg-${TYPE_COLORS[type]} text-white border-transparent opacity-100` 
                                : isAvailable 
                                    ? 'bg-transparent border-slate-700 text-slate-500 opacity-60 hover:opacity-100' 
                                    : 'bg-transparent border-slate-800 text-slate-700 opacity-30 cursor-not-allowed'
                            }`}
                            style={{ backgroundColor: shareMetric === type ? TYPE_COLORS[type] : undefined }}
                        >
                            {NEWS_TYPE_LABELS[type as NewsType]}
                        </button>
                    );
                })}
            </div>

            {/* Horizontal Bar Chart */}
            <div className="flex-1 w-full min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={brandShareData} layout="vertical" margin={{ left: 0, right: 30, top: 0, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#334155" opacity={0.2} />
                     <XAxis type="number" hide />
                     <YAxis 
                       dataKey="name" 
                       type="category" 
                       width={70} 
                       tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                       axisLine={false}
                       tickLine={false}
                     />
                     <Tooltip 
                       cursor={{ fill: '#ffffff05' }}
                       contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '12px' }}
                     />
                     <Bar 
                        dataKey={shareMetric === 'total' ? 'total' : shareMetric} 
                        radius={[0, 4, 4, 0]} 
                        barSize={18}
                        animationDuration={500}
                     >
                        <LabelList dataKey={shareMetric === 'total' ? 'total' : shareMetric} position="right" fill="#64748b" fontSize={10} />
                        {brandShareData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={shareMetric === 'total' ? '#3b82f6' : TYPE_COLORS[shareMetric]} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* MODULE 2: MAP WITH INTEL CARD */}
         <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-6 flex flex-col shadow-xl">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
               <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
               区域热力追踪 (Geo Heatmap)
            </h3>
            <div className="flex-1 relative">
               <UaeTechMap data={mapData} news={news} />
            </div>
         </div>
      </div>

      {/* LOWER SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* MODULE 3: TAGS */}
         <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-sm font-bold text-slate-200 mb-4">热门标签 (Trending)</h3>
            <div className="space-y-4">
               {tagData.map((item) => (
                  <div key={item.tag} className="group cursor-pointer">
                     <div className="flex justify-between items-end mb-1">
                        <span className="text-xs text-slate-400 font-mono group-hover:text-white transition-colors">#{item.tag}</span>
                        <span className="text-[10px] text-slate-600">{item.percent}%</span>
                     </div>
                     <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500/80 rounded-full" style={{ width: `${item.percent}%` }}></div>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* MODULE 5: COMPARISON MODULE (Updated) */}
         <div className="lg:col-span-2 bg-[#1e293b] border border-slate-700/50 rounded-xl p-6 flex flex-col">
             
             {/* Header & Controls */}
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        竞品深度对比 (Analysis)
                    </h3>
                    <div className="flex gap-2 mt-2">
                        {(['trend', 'radar', 'sentiment'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setComparisonTab(tab)}
                                className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase transition-colors ${
                                    comparisonTab === tab 
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' 
                                    : 'text-slate-500 hover:text-slate-300 border border-transparent'
                                }`}
                            >
                                {tab === 'trend' ? 'Trend' : tab === 'radar' ? 'Dimensions' : 'Sentiment'}
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Dropdowns */}
                <div className="flex gap-2 items-center bg-slate-900/50 p-1.5 rounded-lg border border-slate-800">
                   <select 
                      className="bg-transparent text-xs text-orange-400 font-bold outline-none cursor-pointer"
                      value={compareBrandA}
                      onChange={(e) => setCompareBrandA(e.target.value)}
                   >
                      {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
                   </select>
                   <span className="text-slate-600 text-[10px]">vs</span>
                   <select 
                      className="bg-transparent text-xs text-blue-400 font-bold outline-none cursor-pointer"
                      value={compareBrandB}
                      onChange={(e) => setCompareBrandB(e.target.value)}
                   >
                      {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
                   </select>
                   <div className="w-px h-3 bg-slate-700 mx-2"></div>
                   <select 
                      className="bg-transparent text-[10px] text-slate-400 outline-none"
                      value={trendPeriod}
                      onChange={(e) => setTrendPeriod(e.target.value)}
                   >
                      <option value="Week">7 Days</option>
                      <option value="Month">30 Days</option>
                      <option value="Quarter">90 Days</option>
                   </select>
                </div>
             </div>

             {/* Chart Area */}
             <div className="flex-1 w-full min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                   {comparisonTab === 'trend' ? (
                       <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.2} />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '12px' }} />
                          <Legend iconType="plainline" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}/>
                          <Line type="monotone" name={compareBrandA} dataKey={compareBrandA} stroke="#f97316" strokeWidth={2} dot={{r:3}} activeDot={{r:5}} />
                          <Line type="monotone" name={compareBrandB} dataKey={compareBrandB} stroke="#3b82f6" strokeWidth={2} dot={{r:3}} activeDot={{r:5}} />
                       </LineChart>
                   ) : comparisonTab === 'radar' ? (
                       <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                           <PolarGrid stroke="#334155" opacity={0.5} />
                           <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                           <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                           <Radar name={compareBrandA} dataKey="A" stroke="#f97316" strokeWidth={2} fill="#f97316" fillOpacity={0.2} />
                           <Radar name={compareBrandB} dataKey="B" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.2} />
                           <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }}/>
                           <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '12px' }} 
                                formatter={(val: number, name: string, props: any) => {
                                    // Retrieve raw value for better tooltip
                                    const rawKey = name === compareBrandA ? 'rawA' : 'rawB';
                                    const rawVal = props.payload[rawKey];
                                    return [rawVal, name];
                                }}
                           />
                       </RadarChart>
                   ) : (
                       <BarChart data={sentimentData} layout="vertical" barSize={20} margin={{left: 10, right: 20}}>
                           <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
                           <XAxis type="number" hide />
                           <YAxis dataKey="name" type="category" width={60} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                           <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '12px' }} />
                           <Legend wrapperStyle={{ fontSize: '10px' }}/>
                           <Bar dataKey="positive" name="Positive" stackId="a" fill="#10b981" radius={[2, 0, 0, 2]} />
                           <Bar dataKey="neutral" name="Neutral" stackId="a" fill="#64748b" />
                           <Bar dataKey="negative" name="Negative" stackId="a" fill="#ef4444" radius={[0, 2, 2, 0]} />
                       </BarChart>
                   )}
                </ResponsiveContainer>
             </div>
         </div>

      </div>
    </div>
  );
};

export default Dashboard;