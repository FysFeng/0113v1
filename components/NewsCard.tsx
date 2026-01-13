import React, { useState } from 'react';
import { NewsItem, NewsType } from '../types';
import { NEWS_TYPE_LABELS } from '../constants';

interface NewsCardProps {
  item: NewsItem;
  onDelete: (id: string) => void;
}

const getTypeColor = (type: NewsType) => {
  switch (type) {
    case NewsType.LAUNCH: return 'text-blue-600 bg-blue-50 border-blue-200';
    case NewsType.POLICY: return 'text-red-600 bg-red-50 border-red-200';
    case NewsType.SALES: return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    case NewsType.PERSONNEL: return 'text-amber-600 bg-amber-50 border-amber-200';
    case NewsType.COMPETITOR: return 'text-purple-600 bg-purple-50 border-purple-200';
    default: return 'text-slate-600 bg-slate-50 border-slate-200';
  }
};

const getTypeDotColor = (type: NewsType) => {
  switch (type) {
    case NewsType.LAUNCH: return 'bg-blue-500';
    case NewsType.POLICY: return 'bg-red-500';
    case NewsType.SALES: return 'bg-emerald-500';
    case NewsType.PERSONNEL: return 'bg-amber-500';
    case NewsType.COMPETITOR: return 'bg-purple-500';
    default: return 'bg-slate-400';
  }
};

const NewsCard: React.FC<NewsCardProps> = ({ item, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const typeStyle = getTypeColor(item.type);
  const dotColor = getTypeDotColor(item.type);

  return (
    <div className="group relative pl-8 pb-12 last:pb-0">
      {/* Timeline Line */}
      <div className="absolute left-[11px] top-4 bottom-0 w-0.5 bg-slate-200 group-last:bottom-auto group-last:h-full"></div>
      
      {/* Timeline Dot (Business Type Color) */}
      <div className={`absolute left-0 top-6 w-6 h-6 rounded-full border-4 border-white shadow-sm z-10 ${dotColor}`}></div>
      
      {/* Card Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row gap-6">
        
        {/* Image */}
        <div className="w-full md:w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 relative group-hover:shadow-md transition-shadow">
          <img 
            src={item.image} 
            alt={item.title} 
            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://picsum.photos/400/300?blur=2';
            }}
          />
        </div>
        
        {/* Text Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                {item.brand}
              </span>
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${typeStyle}`}>
                {NEWS_TYPE_LABELS[item.type]}
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {item.date}
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 leading-tight mb-2">
            {item.title}
          </h3>
          
          <p className="text-sm text-slate-600 leading-relaxed mb-4 flex-1 line-clamp-3">
            {item.summary}
          </p>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {item.tags.map((tag, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-500 font-medium">#{tag}</span>
              ))}
            </div>
          )}
          
          {expanded && (
             <div className="mt-2 mb-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-700 border border-slate-100 animate-fadeIn">
                <p className="font-semibold mb-1">完整摘要:</p>
                {item.summary}
                <div className="mt-2 text-xs text-slate-400">ID: {item.id}</div>
             </div>
          )}

          <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
            <div className="flex items-center gap-4 text-xs">
              <span className="text-slate-400">来源: <span className="font-medium text-slate-600">{item.source}</span></span>
              
              <button 
                onClick={() => setExpanded(!expanded)}
                className="text-slate-500 hover:text-slate-800 font-medium underline decoration-slate-300 hover:decoration-slate-500 underline-offset-2"
              >
                {expanded ? "收起详情" : "查看详情"}
              </button>

              {item.url && item.url !== '#' ? (
                 <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                   🔗 跳转原文
                 </a>
              ) : (
                 <span className="text-slate-300 cursor-not-allowed">无链接</span>
              )}
            </div>
            
            <button 
              onClick={() => onDelete(item.id)}
              className="text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 text-xs"
              title="删除此条情报"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>删除</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;