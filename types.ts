export enum NewsType {
  LAUNCH = "New Car Launch",
  POLICY = "Policy & Regulation",
  SALES = "Market Sales",
  PERSONNEL = "Personnel Changes",
  COMPETITOR = "Competitor Dynamics",
  OTHER = "Other"
}

export type SentimentType = 'positive' | 'neutral' | 'negative';

export interface NewsItem {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  title: string;
  summary: string;
  type: NewsType;
  brand: string;
  source: string;
  image: string;
  url: string;
  sentiment?: SentimentType; // 新增：情感分析
  tags?: string[]; // 新增：标签系统
}

export interface FilterState {
  startDate: string;
  endDate: string;
  selectedBrands: string[];
  selectedTypes: NewsType[];
  searchQuery: string;
}