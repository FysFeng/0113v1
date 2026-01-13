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

// --- 1. SVG MAP COMPONENT (With Dynamic Heat Logic) ---
const UaeTechMap = ({ data, news }: { data: { location: string; count: number }[], news: NewsItem[] }) => {
  const [hoveredLoc, setHoveredLoc] = useState<string | null>(null);

  // 1. Calculate Max for Relative Scaling
  const maxCount = useMemo(() => Math.max(...data.map(d => d.count), 1), [data]);

  // 2. Dynamic Location Intel
  const locationIntel = useMemo(() => {
    if (!hoveredLoc) return [];
    
    const locNews = news.filter(n => {
        const text = (n.title + n.summary + n.source).toLowerCase();
        return text.includes(hoveredLoc.toLowerCase()) || 
               (hoveredLoc === 'Abu Dhabi' && text.includes('capital')) ||
               (hoveredLoc === 'Ras Al Khaimah' && text.includes('rak')) ||
               (hoveredLoc === 'Umm Al Quwain' && text.includes('uaq'));
    });

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
    'Abu Dhabi': { x: 30, y: 78, label: 'ABU DHABI' }, // Shifted down slightly
    'Dubai': { x: 78, y: 38, label: 'DUBAI' },
    'Sharjah': { x: 84, y: 32, label: 'SHJ' },
    'Ajman': { x: 88, y: 28, label: 'AJM' },
    'Umm Al Quwain': { x: 92, y: 24, label: 'UAQ' },
    'Ras Al Khaimah': { x: 96, y: 16, label: 'RAK' },
    'Fujairah': { x: 105, y: 40, label: 'FUJ' },
  };

  // 3. Dynamic Visual Logic
  const getVisuals = (loc: string) => {
    const item = data.find(d => d.location === loc);
    const count = item?.count || 0;
    const ratio = count / maxCount;

    // Radius: Base 3, Max 22. More dramatic difference.
    const radius = count === 0 ? 2 : 4 + (ratio * 18); 
    
    // Color: Heatmap Gradient
    let color = '#334155'; // Default slate
    let pulse = false;

    if (count > 0) {
        if (ratio < 0.2) color = '#3b82f6'; // Low (Blue)
        else if (ratio < 0.6) color = '#f59e0b'; // Mid (Orange)
        else {
             color = '#ef4444'; // High (Red)
             pulse = true;      // Only high heat locations pulse
        }
    }

    return { radius, color, pulse, count };
  };

  return (
    <div className="w-full h-full relative bg-slate-800/20 rounded-lg overflow-hidden flex items-center justify-center group">
      
      {/* Map SVG - Compact ViewBox */}
      <svg viewBox="0 0 140 100" className="w-full h-full drop-shadow-2xl" preserveAspectRatio="xMidYMid meet">
        <path 
          d="M 20 85 L 10 70 L 15 60 L 50 50 L 70 40 L 85 35 L 95 10 L 110 15 L 115 40 L 100 50 L 90 45 L 75 55 L 60 75 L 40 90 Z" 
          fill="#1e293b" stroke="#334155" strokeWidth="1" opacity="0.8"
        />
        {/* Connection Lines */}
        <line x1="30" y1="78" x2="78" y2="38" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.5"/>
        <line x1="78" y1="38" x2="105" y2="40" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.5"/>

        {Object.keys(locations).map(loc => {
          const { radius, color, pulse, count } = getVisuals(loc);
          return (
            <g 
                key={loc} 
                className="cursor-pointer transition-opacity"
                onMouseEnter={() => setHoveredLoc(loc)}
                onMouseLeave={() => setHoveredLoc(null)}
            >
                {/* Pulse Effect for High Traffic */}
                {pulse && (
                    <circle cx={locations[loc].x} cy={locations[loc].y} r={radius + 4} fill={color} opacity="0.2" className="animate-ping origin-center" style={{ animationDuration: '3s' }} />
                )}
                
                {/* Main Bubble */}
                <circle cx={locations[loc].x} cy={locations[loc].y} r={radius} fill={color} opacity={hoveredLoc === loc ? 1 : 0.8} stroke="#0f172a" strokeWidth={hoveredLoc === loc ? 1.5 : 0.5} className="transition-all duration-500" />
                
                {/* Label (Only show if count > 0 or hovered) */}
                {(count > 0 || hoveredLoc === loc) && (
                    <text x={locations[loc].x} y={locations[loc].y + radius + 5} fontSize="3.5" fill={hoveredLoc === loc ? "#fff" : "#64748b"} textAnchor="middle" fontWeight="bold" className="uppercase tracking-wider transition-colors">
                        {locations[loc].label}
                    </text>
                )}
            </g>
          );
        })}
      </svg>
      
      {/* Legend for Heatmap */}
      <div className="absolute bottom-2 right-2 flex flex-col gap-1 items-end pointer-events-none">
          <div className="flex items-center gap-1">
              <span className="text-[8px] text-slate-500">High</span>
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
          </div>
          <div className="flex items-center gap-1">
              <span className="text-[8px] text-slate-500">Med</span>
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
          </div>
          <div className="flex items-center gap-1">
              <span className="text-[8px] text-slate-500">Low</span>
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          </div>
      </div>

      {/* Hover Intel Card */}
      {hoveredLoc && (
          <div className="absolute left-4 top-4 w-32 bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-lg p-3 shadow-2xl animate-fadeIn z-20 pointer-events-none">
              <h4 className="text-[10px] font-bold text-white border-b border-slate-700 pb-1 mb-2 flex justify-between">
                  {hoveredLoc}
                  <span className="text-blue-400">{getVisuals(hoveredLoc).count}</span>
              </h4>
              <div className="space-y-1">
                  {locationIntel.length > 0 ? (
                      locationIntel.map(tag => (
                          <div key={tag} className="text-[9px] text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded truncate">
                              #{tag}
                          </div>
                      ))
                  ) : (
                      <div className="text-[9px] text-slate-500 italic">No activity</div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ news, availableBrands, onDrillDown, timeLabel }) => {
  
  const [compareBrandA, setCompareBrandA] = useState('Changan');
  const [compareBrandB, setCompareBrandB] = useState('BYD');
  const [trendPeriod, setTrendPeriod] = useState('Month');
  const [comparisonTab, setComparisonTab] = useState<'trend' | 'radar' | 'sentiment'>('trend');
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

  // --- 2. BRAND SHARE (TOP 7 + OTHERS) ---
  const brandShareData = useMemo(() => {
    const brandMap: Record<string, any> = {};
    
    // Count all raw data
    news.forEach(n => {
        const b = n.brand || 'Other';
        if (!brandMap[b]) {
            brandMap[b] = { name: b, total: 0 };
            Object.values(NewsType).forEach(t => brandMap[b][t] = 0);
        }
        brandMap[b].total += 1;
        brandMap[b][n.type] = (brandMap[b][n.type] || 0) + 1;
    });

    // Sort by selected metric
    const sorted = Object.values(brandMap).sort((a: any, b: any) => {
        const valA = shareMetric === 'total' ? a.total : a[shareMetric] || 0;
        const valB = shareMetric === 'total' ? b.total : b[shareMetric] || 0;
        return valB - valA;
    });

    // TOP 7 Logic
    const top7 = sorted.slice(0, 7);
    const others = sorted.slice(7);

    if (others.length > 0) {
        const otherNode: any = { name: 'Others', total: 0 };
        Object.values(NewsType).forEach(t => otherNode[t] = 0);
        
        others.forEach((o: any) => {
            otherNode.total += o.total;
            Object.values(NewsType).forEach(t => otherNode[t] = (otherNode[t] || 0) + (o[t] || 0));
        });
        top7.push(otherNode);
    }

    return top7;
  }, [news, shareMetric]);

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
      .sort((a, b) => b.count - a.count).slice(0, 6); // Top 6
  }, [news]);

  // --- 5. COMPARISON DATA ---
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

  const radarData = useMemo(() => {
      const calc = (data: NewsItem[]) => ({
          volume: data.length,
          sentiment: data.length ? (data.filter(n=>n.sentiment==='positive').length / data.length) * 100 : 0,
          launch: data.filter(n=>n.type===NewsType.LAUNCH).length,
          policy: data.filter(n=>n.type===NewsType.POLICY).length,
          sales: data.filter(n=>n.type===NewsType.SALES).length
      });
      const mA = calc(newsA);
      const mB = calc(newsB);
      const maxVol = Math.max(mA.volume, mB.volume, 1);
      const maxLaunch = Math.max(mA.launch, mB.launch, 1);
      const maxPolicy = Math.max(mA.policy, mB.policy, 1);
      const maxSales = Math.max(mA.sales, mB.sales, 1);

      return [
          { subject: 'Volume', A: (mA.volume/maxVol)*100, B: (mB.volume/maxVol)*100, rawA: mA.volume, rawB: mB.volume },
          { subject: 'Sentiment', A: mA.sentiment, B: mB.sentiment, rawA: Math.round(mA.sentiment)+'%', rawB: Math.round(mB.sentiment)+'%' },
          { subject: 'Launch', A: (mA.launch/maxLaunch)*100, B: (mB.launch/maxLaunch)*100, rawA: mA.launch, rawB: mB.launch },
          { subject: 'Policy', A: (mA.policy/maxPolicy)*100, B: (mB.policy/maxPolicy)*100, rawA: mA.policy, rawB: mB.policy },
          { subject: 'Sales', A: (mA.sales/maxSales)*100, B: (mB.sales/maxSales)*100, rawA: mA.sales, rawB: mB.sales },
      ];
  }, [newsA, newsB]);

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
    <div className="bg-[#1e293b] border border-slate-700/50 p-4 rounded-xl flex flex-col justify-between h-24 relative overflow-hidden group shadow-lg">
       <div className="z-10 flex justify-between items-start">
         <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{title}</div>
         <div className={`text-${colorStr}-400 opacity-80`}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg></div>
       </div>
       <div className="z-10 flex items-end gap-2">
         <div className="text-3xl font-mono font-bold text-white tracking-tight leading-none">{value}</div>
         <div className="text-[10px] text-slate-500 mb-0.5">{sub}</div>
       </div>
       <div className={`absolute -right-6 -bottom-6 w-20 h-20 bg-${colorStr}-500 blur-[40px] opacity-10`}></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-200 font-sans p-4 lg:p-6 flex flex-col gap-5">
      
      {/* HEADER */}
      <header className="flex justify-between items-center pb-2 border-b border-slate-800/50">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/40 text-sm">AI</div>
            <div>
               <h1 className="text-lg font-bold text-white tracking-tight">UAE COMMAND CENTER</h1>
            </div>
         </div>
         <div className="text-[10px] font-mono text-slate-500 bg-slate-900 px-3 py-1 rounded border border-slate-800">
            {new Date().toISOString().split('T')[0]}
         </div>
      </header>

      {/* KPI ROW (Compact) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         <KpiCard title="Total Volume" value={kpis.total} sub={timeLabel} colorStr="blue" />
         <KpiCard title="Top Brand" value={kpis.topBrand[0]} sub={`${kpis.topBrand[1]} Signals`} colorStr="purple" />
         <KpiCard title="New Launches" value={kpis.launchCount} sub="Event Count" colorStr="emerald" />
         <KpiCard title="Changan" value={kpis.changanCount} sub="Activity" colorStr="orange" />
      </div>

      {/* COMPACT MIDDLE ROW (Grid 1-2-1) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[300px]">
         
         {/* COL 1: BRAND SHARE (Top 8 Only) */}
         <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-4 flex flex-col shadow-xl lg:col-span-1">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-slate-300">Brand Share (Top 7)</h3>
                <div className="flex gap-1">
                    <button onClick={() => setShareMetric('total')} className={`w-2 h-2 rounded-full ${shareMetric === 'total' ? 'bg-blue-500' : 'bg-slate-700'}`} title="Total" />
                    <button onClick={() => setShareMetric(NewsType.SALES)} className={`w-2 h-2 rounded-full ${shareMetric === NewsType.SALES ? 'bg-emerald-500' : 'bg-slate-700'}`} title="Sales" />
                    <button onClick={() => setShareMetric(NewsType.LAUNCH)} className={`w-2 h-2 rounded-full ${shareMetric === NewsType.LAUNCH ? 'bg-blue-400' : 'bg-slate-700'}`} title="Launch" />
                </div>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={brandShareData} layout="vertical" margin={{ left: 0, right: 35, top: 0, bottom: 0 }} barCategoryGap={4}>
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" width={60} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} axisLine={false} tickLine={false} />
                     <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '12px' }} />
                     <Bar dataKey={shareMetric === 'total' ? 'total' : shareMetric} radius={[0, 3, 3, 0]} barSize={16}>
                        <LabelList dataKey={shareMetric === 'total' ? 'total' : shareMetric} position="right" fill="#64748b" fontSize={9} />
                        {brandShareData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.name === 'Others' ? '#64748b' : (shareMetric === 'total' ? '#3b82f6' : TYPE_COLORS[shareMetric])} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* COL 2: MAP (Center Stage) */}
         <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-4 flex flex-col shadow-xl lg:col-span-2 relative">
            <h3 className="text-xs font-bold text-slate-300 mb-2 absolute top-4 left-4 z-10">Geo Heatmap</h3>
            <div className="flex-1 w-full h-full">
               <UaeTechMap data={mapData} news={news} />
            </div>
         </div>

         {/* COL 3: TRENDING TAGS */}
         <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-4 flex flex-col lg:col-span-1">
            <h3 className="text-xs font-bold text-slate-300 mb-3">Trending Tags</h3>
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar">
               {tagData.map((item, idx) => (
                  <div key={item.tag} className="group cursor-pointer">
                     <div className="flex justify-between items-end mb-1">
                        <span className="text-[11px] text-slate-400 font-mono group-hover:text-blue-400 transition-colors truncate w-24">#{item.tag}</span>
                        <span className="text-[10px] text-slate-600 font-mono">{item.count}</span>
                     </div>
                     <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${item.percent}%`, opacity: 1 - (idx * 0.1) }}></div>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>

      {/* LOWER ROW: COMPARISON (Compact Height) */}
      <div className="bg-[#1e293b] border border-slate-700/50 rounded-xl p-4 flex flex-col h-[280px]">
         <div className="flex justify-between items-center mb-2">
            <div className="flex gap-2">
                <h3 className="text-xs font-bold text-slate-300">Competitor Analysis</h3>
                <div className="flex bg-slate-800 rounded p-0.5">
                    {(['trend', 'radar', 'sentiment'] as const).map(tab => (
                        <button key={tab} onClick={() => setComparisonTab(tab)} className={`px-2 py-0.5 text-[9px] rounded uppercase font-bold ${comparisonTab === tab ? 'bg-blue-600 text-white' : 'text-slate-500'}`}>
                            {tab}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="flex gap-2 items-center">
               <select className="bg-slate-900 border border-slate-800 text-[10px] text-orange-400 rounded px-2 py-1 outline-none" value={compareBrandA} onChange={(e) => setCompareBrandA(e.target.value)}>
                  {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
               </select>
               <span className="text-slate-600 text-[9px]">vs</span>
               <select className="bg-slate-900 border border-slate-800 text-[10px] text-blue-400 rounded px-2 py-1 outline-none" value={compareBrandB} onChange={(e) => setCompareBrandB(e.target.value)}>
                  {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
               </select>
            </div>
         </div>

         <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
               {comparisonTab === 'trend' ? (
                   <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.2} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9 }} dy={5} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '11px' }} />
                      <Legend iconType="plainline" wrapperStyle={{ fontSize: '9px', bottom: 0 }}/>
                      <Line type="monotone" name={compareBrandA} dataKey={compareBrandA} stroke="#f97316" strokeWidth={2} dot={false} activeDot={{r:4}} />
                      <Line type="monotone" name={compareBrandB} dataKey={compareBrandB} stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{r:4}} />
                   </LineChart>
               ) : comparisonTab === 'radar' ? (
                   <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                       <PolarGrid stroke="#334155" opacity={0.5} />
                       <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 'bold' }} />
                       <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                       <Radar name={compareBrandA} dataKey="A" stroke="#f97316" strokeWidth={2} fill="#f97316" fillOpacity={0.2} />
                       <Radar name={compareBrandB} dataKey="B" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.2} />
                       <Legend iconType="circle" wrapperStyle={{ fontSize: '9px' }}/>
                       <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '11px' }} />
                   </RadarChart>
               ) : (
                   <BarChart data={sentimentData} layout="vertical" barSize={16} margin={{left: 0, right: 20}}>
                       <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
                       <XAxis type="number" hide />
                       <YAxis dataKey="name" type="category" width={60} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                       <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', fontSize: '11px' }} />
                       <Legend wrapperStyle={{ fontSize: '9px' }}/>
                       <Bar dataKey="positive" stackId="a" fill="#10b981" radius={[2, 0, 0, 2]} />
                       <Bar dataKey="neutral" stackId="a" fill="#64748b" />
                       <Bar dataKey="negative" stackId="a" fill="#ef4444" radius={[0, 2, 2, 0]} />
                   </BarChart>
               )}
            </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
