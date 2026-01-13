import React, { useState, useEffect } from 'react';
import { NewsItem, NewsType } from '../types';
import { NEWS_TYPES_LIST, NEWS_TYPE_LABELS } from '../constants';
import { analyzeTextWithQwen } from '../services/qwenService';

interface EntryFormProps {
  onAdd: (item: Omit<NewsItem, 'id'>) => void;
  availableBrands: string[];
}

interface PendingItem {
  id: string;
  title: string;
  url: string;
  text: string;
  source: string;
  scrapedAt: string;
}

const EntryForm: React.FC<EntryFormProps> = ({ onAdd, availableBrands }) => {
  const [activeTab, setActiveTab] = useState<'spider' | 'ai' | 'manual'>('spider'); // 默认展示采集箱
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Spider / Inbox State ---
  const [spiderUrl, setSpiderUrl] = useState('');
  const [isSpidering, setIsSpidering] = useState(false);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);

  // Load pending items on mount or tab change
  useEffect(() => {
    if (activeTab === 'spider') {
        fetchPendingItems();
    }
  }, [activeTab]);

  const fetchPendingItems = async () => {
    try {
        const res = await fetch(`/api/pending?_t=${Date.now()}`);
        if (res.ok) {
            const data = await res.json();
            setPendingItems(data);
        }
    } catch (e) {
        console.error("Failed to load pending items", e);
    }
  };

  const handleSpiderSubmit = async () => {
    if (!spiderUrl) return;
    setIsSpidering(true);
    setError(null);
    try {
        const res = await fetch('/api/spider', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: spiderUrl })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "抓取失败");
        
        setSpiderUrl('');
        fetchPendingItems(); // Refresh list
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsSpidering(false);
    }
  };

  const handleDeletePending = async (id: string) => {
      // Optimistic update
      setPendingItems(prev => prev.filter(i => i.id !== id));
      try {
          await fetch(`/api/pending?id=${id}`, { method: 'DELETE' });
      } catch (e) {
          console.error("Delete failed", e);
      }
  };

  const handleProcessPending = (item: PendingItem) => {
      // 1. Fill AI Form
      setAiText(item.text);
      // 2. Set source url if possible
      setAiImageInput(item.url); // Use article URL as potential image source hint? Or separate field.
      // 3. Switch tab
      setActiveTab('ai');
      // 4. Delete from pending (optional: or wait until success?)
      // Let's delete it now to keep inbox clean, or user can delete manually.
      // We will leave it for user to delete manually to be safe.
  };

  // --- Manual Form State ---
  // Initialize with the first available brand or an empty string
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    brand: availableBrands[0] || '',
    type: NewsType.OTHER,
    date: new Date().toISOString().split('T')[0],
    url: '',
    source: '人工录入',
    image: ''
  });

  // Ensure formData.brand is valid when availableBrands changes (e.g. user adds a brand in sidebar)
  useEffect(() => {
    if (availableBrands.length > 0 && !availableBrands.includes(formData.brand)) {
        setFormData(prev => ({ ...prev, brand: availableBrands[0] }));
    }
  }, [availableBrands]);

  // --- AI Form State ---
  const [aiText, setAiText] = useState('');
  const [aiImageInput, setAiImageInput] = useState(''); // New state for AI tab image URL

  const generateImageUrl = (prompt: string) => {
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=600&nologo=true&seed=${Math.floor(Math.random()*1000)}`;
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If no image URL provided, generate one from title/brand
    const finalImage = formData.image.trim() || generateImageUrl(`${formData.brand} ${formData.title} automotive`);

    onAdd({
        ...formData,
        image: finalImage
    });

    // Reset essential fields
    setFormData(prev => ({ ...prev, title: '', summary: '', url: '', image: '' }));
  };

  const handleAiAnalyze = async () => {
    if (!aiText.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Switched to Qwen (DashScope)
      const result = await analyzeTextWithQwen(aiText, availableBrands);
      
      const finalImage = aiImageInput.trim() 
        ? aiImageInput.trim() 
        : generateImageUrl(result.image_keywords || `${result.brand} car news`);
      
      onAdd({
        title: result.title,
        summary: result.summary,
        brand: result.brand,
        type: result.type as NewsType, // Ensure type cast
        date: result.date,
        url: result.url || aiImageInput, // Prefer extracted URL, fallback to input URL if it was a URL input
        source: 'AI 智能提取 (Qwen)',
        image: finalImage
      });
      
      setAiText(''); // Clear input on success
      setAiImageInput(''); // Clear image input
      
      // If this came from a pending item (we can guess if the text matches), we might want to prompt deletion
      // But for now, simple is better.

    } catch (err: any) {
      console.error("Analysis Error:", err);
      const msg = err.message || "未知错误";
      if (msg.includes("API Key") || msg.includes("401") || msg.includes("403")) {
          setError("API Key 错误。请检查 VITE_DASHSCOPE_API_KEY 配置。");
      } else if (msg.includes("JSON")) {
          setError("AI 返回格式解析失败，请重试。");
      } else {
          setError("分析失败: " + msg);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('spider')}
          className={`flex-1 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'spider' 
              ? 'bg-white text-red-600 border-b-2 border-red-600' 
              : 'bg-slate-50 text-slate-500 hover:text-slate-700'
          }`}
        >
          <span>📥</span> 采集箱
          {pendingItems.length > 0 && (
              <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded-full">{pendingItems.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${
            activeTab === 'ai' 
              ? 'bg-white text-red-600 border-b-2 border-red-600' 
              : 'bg-slate-50 text-slate-500 hover:text-slate-700'
          }`}
        >
          🤖 AI 智能识别
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${
            activeTab === 'manual' 
              ? 'bg-white text-red-600 border-b-2 border-red-600' 
              : 'bg-slate-50 text-slate-500 hover:text-slate-700'
          }`}
        >
          ✍️ 手动录入
        </button>
      </div>

      <div className="p-6">
        {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded text-red-600 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
            </div>
        )}

        {/* --- SPIDER TAB --- */}
        {activeTab === 'spider' && (
            <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">输入文章 URL 进行抓取 (不消耗 AI 额度)</label>
                    <div className="flex gap-2">
                        <input 
                            type="url"
                            className="flex-1 p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-red-500 outline-none"
                            placeholder="https://example.com/news/article..."
                            value={spiderUrl}
                            onChange={(e) => setSpiderUrl(e.target.value)}
                        />
                        <button 
                            onClick={handleSpiderSubmit}
                            disabled={isSpidering || !spiderUrl}
                            className={`px-4 py-2 rounded text-sm font-medium text-white transition-colors ${
                                isSpidering ? 'bg-slate-400' : 'bg-slate-800 hover:bg-slate-900'
                            }`}
                        >
                            {isSpidering ? '抓取中...' : '抓取'}
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">提示：抓取仅保存纯文本到下方列表。你需要点击“AI 分析”才会调用大模型。</p>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-slate-700 mb-3 flex justify-between items-center">
                        待处理列表 ({pendingItems.length})
                        <button onClick={fetchPendingItems} className="text-xs text-blue-500 hover:underline">刷新</button>
                    </h3>
                    
                    {pendingItems.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 border border-dashed border-slate-200 rounded-lg">
                            暂无待处理文章
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {pendingItems.map(item => (
                                <div key={item.id} className="bg-white border border-slate-200 rounded-lg p-3 hover:shadow-md transition-shadow group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-sm line-clamp-1" title={item.title}>{item.title || '无标题'}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{item.source}</span>
                                                <span className="text-[10px] text-slate-400">{item.scrapedAt}</span>
                                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:text-blue-600">原文 ↗</a>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDeletePending(item.id)}
                                            className="text-slate-300 hover:text-red-500 p-1"
                                            title="删除"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 line-clamp-2 mb-3 bg-slate-50 p-2 rounded">
                                        {item.text}
                                    </p>
                                    <button 
                                        onClick={() => handleProcessPending(item)}
                                        className="w-full py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded border border-red-100 hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center gap-1"
                                    >
                                        <span>⚡️ AI 深度分析</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* --- AI TAB --- */}
        {activeTab === 'ai' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-700">
              <p>1. 粘贴新闻原文文本。通义千问 (Qwen) 将自动提取关键信息。</p>
              <p>2. (可选) 粘贴新闻配图链接，否则系统将自动生成示意图。</p>
            </div>
            
            <textarea
              className="w-full h-40 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-slate-700 text-sm"
              placeholder="在此粘贴新闻文本..."
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
            />

            <div>
               <label className="block text-xs font-medium text-slate-500 uppercase mb-1">图片链接 (可选 - 粘贴新闻原图 URL)</label>
               <input 
                  type="url"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                  placeholder="https://example.com/image.jpg"
                  value={aiImageInput}
                  onChange={(e) => setAiImageInput(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleAiAnalyze}
                disabled={isProcessing || !aiText.trim()}
                className={`px-6 py-2.5 rounded-lg font-medium text-white transition-all ${
                  isProcessing || !aiText.trim()
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 shadow-md hover:shadow-lg'
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Qwen 分析中...
                  </span>
                ) : '开始分析并添加'}
              </button>
            </div>
          </div>
        )}

        {/* --- MANUAL TAB --- */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">品牌</label>
                <select 
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-red-500"
                  value={formData.brand}
                  onChange={(e) => setFormData({...formData, brand: e.target.value})}
                >
                  {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">类型</label>
                <select 
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-red-500"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as NewsType})}
                >
                  {NEWS_TYPES_LIST.map(t => <option key={t} value={t}>{NEWS_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">日期</label>
                <input 
                  type="date"
                  required
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">链接 URL (可选)</label>
                <input 
                  type="url"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                  placeholder="https://..."
                  value={formData.url}
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 uppercase mb-1">标题</label>
              <input 
                type="text"
                required
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                placeholder="输入新闻标题..."
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-500 uppercase mb-1">摘要</label>
                    <textarea 
                        required
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-sm h-24 resize-none focus:ring-2 focus:ring-red-500"
                        placeholder="简要概括..."
                        value={formData.summary}
                        onChange={(e) => setFormData({...formData, summary: e.target.value})}
                    />
                </div>
                <div>
                     <label className="block text-xs font-medium text-slate-500 uppercase mb-1">图片链接 (可选 - 粘贴新闻原图)</label>
                     <textarea 
                        className="w-full p-2.5 border border-slate-300 rounded-lg text-sm h-24 resize-none focus:ring-2 focus:ring-red-500"
                        placeholder="https://example.com/image.jpg (留空则根据标题生成)"
                        value={formData.image}
                        onChange={(e) => setFormData({...formData, image: e.target.value})}
                    />
                </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                type="submit"
                className="bg-slate-800 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors shadow-sm"
              >
                ➕ 确认添加
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EntryForm;