import { NewsType, NewsItem } from './types';

export const DEFAULT_BRANDS = [
  "Toyota", "Nissan", "Ford", "BMW", "Mercedes", 
  "Changan", "BYD", "Geely", "Jetour", "Tesla", "MG"
];

export const NEWS_TYPES_LIST = [
  NewsType.LAUNCH,
  NewsType.POLICY,
  NewsType.SALES,
  NewsType.PERSONNEL,
  NewsType.COMPETITOR,
  NewsType.OTHER
];

export const NEWS_TYPE_LABELS: Record<NewsType, string> = {
  [NewsType.LAUNCH]: "新车上市",
  [NewsType.POLICY]: "政策法规",
  [NewsType.SALES]: "市场销量",
  [NewsType.PERSONNEL]: "人事变动",
  [NewsType.COMPETITOR]: "竞品动态",
  [NewsType.OTHER]: "其他"
};

// Helper to generate a random ID
const uuid = () => Math.random().toString(36).substring(2, 15);

// Initial Demo Data
const today = new Date();
const formatDate = (date: Date) => date.toISOString().split('T')[0];

const getAIImage = (prompt: string) => 
  `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=600&nologo=true&seed=${Math.floor(Math.random()*1000)}`;

export const INITIAL_NEWS: NewsItem[] = [
  {
    id: uuid(),
    date: formatDate(today),
    title: "比亚迪在迪拜开设新旗舰店，扩大市场份额",
    summary: "比亚迪在谢赫扎耶德路正式开设了中东地区最大的展厅。活动重点介绍了针对高温环境优化的汉 EV 和唐 EV 车型，旨在提升该品牌在阿联酋高端电动汽车市场的竞争力。新展厅还将提供全方位的售后服务。",
    type: NewsType.SALES,
    brand: "BYD",
    source: "AutoMiddleEast",
    image: getAIImage("BYD showroom Dubai modern electric car"),
    url: "#",
    sentiment: 'positive',
    tags: ["EV", "Showroom", "Expansion"]
  },
  {
    id: uuid(),
    date: formatDate(new Date(today.getTime() - 86400000 * 2)), // 2 days ago
    title: "丰田发布 2025 款凯美瑞，混合动力成标配",
    summary: "丰田阿联酋代理商 Al-Futtaim Motors 宣布 2025 款凯美瑞正式上市。新款车型全系标配第五代混合动力系统，不再提供纯燃油版本，以此响应阿联酋的绿色交通倡议。",
    type: NewsType.LAUNCH,
    brand: "Toyota",
    source: "Gulf News",
    image: getAIImage("Toyota Camry 2025 desert driving hybrid"),
    url: "#",
    sentiment: 'positive',
    tags: ["Hybrid", "New Model", "Sustainability"]
  },
  {
    id: uuid(),
    date: formatDate(new Date(today.getTime() - 86400000 * 5)),
    title: "阿联酋新交通法规：加大对分心驾驶的处罚力度",
    summary: "阿联酋内政部宣布更新交通法规，自下月起，开车使用手机等分心驾驶行为的罚款将提高至 800 迪拉姆，并记 4 个黑点。此举旨在降低交通事故率。",
    type: NewsType.POLICY,
    brand: "Other",
    source: "Khaleej Times",
    image: getAIImage("UAE traffic police highway safety"),
    url: "#",
    sentiment: 'neutral',
    tags: ["Regulation", "Safety", "Traffic"]
  }
];