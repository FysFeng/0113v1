import React, { useState, useRef, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LabelList } from 'recharts';
import { NewsItem, NewsType } from '../types';
import { NEWS_TYPE_LABELS } from '../constants';

interface WeeklyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  allNews: NewsItem[];
}

const TYPE_COLORS: Record<string, string> = {
  [NewsType.LAUNCH]: '#3b82f6', // Blue
  [NewsType.POLICY]: '#ef4444', // Red
  [NewsType.SALES]: '#10b981',  // Green
  [NewsType.PERSONNEL]: '#f59e0b', // Orange
  [NewsType.COMPETITOR]: '#8b5cf6', // Purple
  [NewsType.OTHER]: '#64748b'    // Gray
};

const WeeklyReportModal: React.FC<WeeklyReportModalProps> = ({ isOpen, onClose, allNews }) => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Filter news based on date range
  const filteredNews = useMemo(() => {
    return allNews.filter(item => 
      item.date >= startDate && item.date <= endDate
    ).sort((a, b) => b.date.localeCompare(a.date));
  }, [allNews, startDate, endDate]);

  // Group by Type for calculations
  const newsByType = useMemo(() => {
    const groups: Partial<Record<NewsType, NewsItem[]>> = {};
    filteredNews.forEach(item => {
      if (!groups[item.type]) groups[item.type] = [];
      groups[item.type]!.push(item);
    });
    return groups;
  }, [filteredNews]);

  // Chart Data: Type Distribution
  const typeChartData = useMemo(() => {
    return Object.entries(newsByType)
      .map(([type, items]) => ({
        name: NEWS_TYPE_LABELS[type as NewsType],
        value: (items as NewsItem[]).length,
        color: TYPE_COLORS[type] || '#ccc'
      }))
      .sort((a, b) => b.value - a.value);
  }, [newsByType]);

  // Chart Data: Top Brands
  const brandChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredNews.forEach(item => {
      counts[item.brand] = (counts[item.brand] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5
  }, [filteredNews]);

  const handleGenerate = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 200)); // Render wait
      
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 700, // Explicit width matches CSS
        windowWidth: 700
      });
      
      setGeneratedImage(canvas.toDataURL('image/png'));
    } catch (error) {
      console.error("Image generation failed", error);
      alert("生成图片失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col lg:flex-row overflow-hidden border border-slate-800/50">
        
        {/* Left Control Panel */}
        <div className="w-full lg:w-1/3 p-6 bg-white border-b lg:border-r border-slate-200 flex flex-col overflow-y-auto z-10 shrink-0">
          <div className="flex justify-between items-center mb-6">
            <div>
               <h2 className="text-xl font-bold text-slate-800">📊 周报生成器</h2>
               <p className="text-xs text-slate-500 mt-1">配置时间范围并导出图片</p>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6 flex-1">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">时间周期</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                   <span className="text-[10px] text-slate-400">开始日期</span>
                   <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setGeneratedImage(null); }}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                   <span className="text-[10px] text-slate-400">结束日期</span>
                   <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setGeneratedImage(null); }}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="text-center">
                 <p className="text-sm text-slate-500 mb-2">即将生成包含 <strong className="text-slate-800">{filteredNews.length}</strong> 条新闻的报告</p>
                 <button
                    onClick={handleGenerate}
                    disabled={isGenerating || filteredNews.length === 0}
                    className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
                        isGenerating || filteredNews.length === 0
                        ? 'bg-slate-300 cursor-not-allowed shadow-none'
                        : 'bg-red-600 hover:bg-red-700 shadow-red-500/30'
                    }`}
                    >
                    {isGenerating ? (
                        <>
                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span>生成中...</span>
                        </>
                    ) : (
                        <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>生成海报图片</span>
                        </>
                    )}
                </button>
            </div>

            {generatedImage && (
              <div className="border-t border-slate-100 pt-6 animate-fadeIn">
                <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-bold text-green-600 flex items-center gap-2">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                       生成成功
                    </p>
                    <a href={generatedImage} download={`AutoInsight_Report_${startDate}.png`} className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors">下载 PNG</a>
                </div>
                <div className="p-2 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden">
                    <img src={generatedImage} alt="Report Preview" className="w-full rounded shadow-sm opacity-90 hover:opacity-100 transition-opacity cursor-zoom-in" onClick={() => window.open(generatedImage)}/>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Preview Area */}
        <div className="w-full lg:w-2/3 bg-slate-100 overflow-y-auto flex justify-center items-start p-8 lg:p-12 relative">
           
           {/* POSTER CONTAINER */}
           {/* Width increased to 700px for better content density */}
           <div 
             ref={reportRef} 
             className="bg-white w-[700px] min-h-[800px] shadow-2xl flex-shrink-0 flex flex-col relative"
             style={{ fontFamily: "'Inter', sans-serif" }}
           >
              {/* 1. Optimized Header: Compact & Horizontal */}
              <div className="bg-[#0f172a] text-white px-8 py-5 flex items-center justify-between border-b-4 border-red-600">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-900/50">
                        <span className="text-sm font-bold">UAE</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight leading-none">UAE Auto Insight</h1>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">UAE News</p>
                    </div>
                 </div>
                 
                 <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Reporting Period</div>
                    <div className="text-sm font-mono font-medium text-white bg-slate-800 px-2 py-1 rounded border border-slate-700">
                        {startDate} <span className="text-slate-500 mx-1">→</span> {endDate}
                    </div>
                 </div>
              </div>

              {/* 2. Visual Overview Section: Side-by-Side Charts */}
              {filteredNews.length > 0 && (
                <div className="bg-slate-50 px-8 py-6 border-b border-slate-200">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="w-1 h-4 bg-slate-800 rounded-full"></span>
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">市场概览 (Market Snapshot)</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-8">
                        {/* Pie Chart */}
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex flex-col items-center justify-center">
                            <div className="h-32 w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={typeChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={35}
                                            outerRadius={55}
                                            paddingAngle={2}
                                            dataKey="value"
                                            isAnimationActive={false}
                                            stroke="none"
                                        >
                                            {typeChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center">
                                        <span className="text-2xl font-bold text-slate-800 leading-none">{filteredNews.length}</span>
                                        <span className="block text-[10px] text-slate-400 uppercase mt-1">Total</span>
                                    </div>
                                </div>
                            </div>
                             <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2 w-full px-2">
                                {typeChartData.slice(0, 4).map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-1.5 text-[10px]">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                        <span className="text-slate-500">{item.name}</span>
                                        <span className="font-bold text-slate-700">{Math.round((item.value/filteredNews.length)*100)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bar Chart (Vertical with Labels) */}
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex flex-col">
                           <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">品牌活跃度 Top 5</span>
                           </div>
                           <div className="flex-1 min-h-[140px]">
                               <ResponsiveContainer width="100%" height="100%">
                                   <BarChart data={brandChartData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                                      <XAxis 
                                        dataKey="name" 
                                        tick={{fontSize: 10, fill: '#64748b', fontWeight: 500}} 
                                        axisLine={{ stroke: '#e2e8f0' }}
                                        tickLine={false}
                                        interval={0}
                                        tickMargin={8}
                                      />
                                      <YAxis hide />
                                      <Tooltip 
                                        cursor={{fill: '#f1f5f9'}}
                                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                        itemStyle={{fontSize: '12px', color: '#1e293b', fontWeight: 'bold'}}
                                      />
                                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} isAnimationActive={false}>
                                        <LabelList dataKey="value" position="top" fill="#64748b" fontSize={12} fontWeight="bold" offset={5} />
                                        {brandChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#3b82f6'} />
                                        ))}
                                      </Bar>
                                   </BarChart>
                               </ResponsiveContainer>
                           </div>
                        </div>
                    </div>
                </div>
              )}

              {/* 3. Detailed News List */}
              <div className="p-8 flex-1 bg-white">
                 <div className="flex items-center gap-2 mb-6">
                    <span className="w-1 h-4 bg-red-600 rounded-full"></span>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">本周重点 (Key Highlights)</h3>
                 </div>

                 <div className="space-y-6">
                    {filteredNews.map((news, index) => (
                        <div key={news.id} className="flex gap-4 border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                             {/* Index Number */}
                             <div className="text-xl font-bold text-slate-200 w-6 shrink-0 pt-1 leading-none text-right font-mono">
                                {String(index + 1).padStart(2, '0')}
                             </div>

                             <div className="flex-1">
                                {/* Meta Header */}
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                                        {news.brand}
                                    </span>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ color: TYPE_COLORS[news.type], backgroundColor: `${TYPE_COLORS[news.type]}15` }}>
                                        {NEWS_TYPE_LABELS[news.type]}
                                    </span>
                                    <span className="text-[10px] text-slate-400 ml-auto font-mono">
                                        {news.date}
                                    </span>
                                </div>

                                {/* Content */}
                                <h4 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                                    {news.title}
                                </h4>
                                <p className="text-xs text-slate-600 leading-relaxed text-justify">
                                    {news.summary}
                                </p>
                             </div>
                        </div>
                    ))}
                 </div>
              </div>

              {/* 4. Footer */}
              <div className="bg-slate-50 text-slate-400 px-8 py-4 shrink-0 flex justify-between items-center border-t border-slate-200">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Generated by UAE Auto Insight</span>
                 </div>
                 <span className="text-[9px] font-mono opacity-60">Confidential • Internal Use Only</span>
              </div>

           </div>
        </div>

      </div>
    </div>
  );
};

export default WeeklyReportModal;