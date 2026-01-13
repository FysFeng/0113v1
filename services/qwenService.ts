import { NewsType, SentimentType, NewsItem } from "../types";
import { DEFAULT_BRANDS } from "../constants";

export interface ExtractedNewsData {
  title: string;
  summary: string;
  brand: string;
  type: NewsType;
  date: string;
  url: string;
  image_keywords: string;
  sentiment: SentimentType;
  tags: string[];
}

export interface BrandReportData {
  executive_summary: string;
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
}

// 接收 currentBrands 参数，默认为 DEFAULT_BRANDS
export const analyzeTextWithQwen = async (text: string, currentBrands: string[] = DEFAULT_BRANDS): Promise<ExtractedNewsData> => {
  
  // 确保品牌列表去重并包含默认品牌
  const brandsToPrompt = Array.from(new Set([...DEFAULT_BRANDS, ...currentBrands]));
  const brandsString = brandsToPrompt.join(', ');

  const systemPrompt = `
    You are an expert automotive news analyst for the UAE market. Extract structured data into STRICT JSON format.
    
    Tasks:
    1. Identify the Brand (Map to list: [${brandsString}] or "Other").
    2. Summarize the news (2-3 sentences in Chinese).
    3. Categorize the news Type.
    4. Analyze Sentiment (positive/neutral/negative).
    5. Extract 3-5 relevant Tags (e.g., "EV", "Price Cut", "SUV", "Ramadan Offer").
    6. Extract Image Keywords for generation.

    Output Structure:
    {
      "title": "Chinese headline",
      "summary": "Chinese summary",
      "brand": "Brand Name",
      "type": "One of: ${Object.values(NewsType).join(', ')}",
      "date": "YYYY-MM-DD (default: ${new Date().toISOString().split('T')[0]})",
      "url": "URL found in text or empty",
      "image_keywords": "3-6 English keywords",
      "sentiment": "positive" | "neutral" | "negative",
      "tags": ["Tag1", "Tag2", "Tag3"]
    }
  `;

  try {
    // 直接请求后端 API
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, prompt: systemPrompt })
    });

    if (!response.ok) {
        let errorMsg = `Server Error: ${response.status}`;
        try {
            const errData = await response.json();
            errorMsg = errData.error || errData.message || errorMsg;
        } catch {
            const text = await response.text();
            if (text) errorMsg += ` - ${text.substring(0, 50)}`;
        }
        throw new Error(errorMsg);
    }
    
    const rawData = await response.json();

    if (rawData.code && rawData.code !== '200' && rawData.message) {
        throw new Error(`Qwen API Error: ${rawData.message}`);
    }

    const rawContent = rawData.output?.choices?.[0]?.message?.content || "";

    if (!rawContent) throw new Error("AI 返回了空内容");

    // 🧹 JSON 清洗逻辑
    let cleanJson = rawContent.replace(/```json/gi, "").replace(/```/g, "").trim();
    const firstOpen = cleanJson.indexOf("{");
    const lastClose = cleanJson.lastIndexOf("}");
    if (firstOpen !== -1 && lastClose !== -1) {
      cleanJson = cleanJson.substring(firstOpen, lastClose + 1);
    }

    try {
        return JSON.parse(cleanJson) as ExtractedNewsData;
    } catch (e) {
        console.error("JSON Parse Error", cleanJson);
        throw new Error("AI 返回格式无法解析，请重试");
    }

  } catch (error: any) {
    console.error("Qwen Analysis Failed:", error);
    throw new Error(error.message || "智能分析服务暂时不可用");
  }
};

// 新增：生成品牌复盘报告
export const generateBrandReport = async (brand: string, periodLabel: string, newsList: NewsItem[]): Promise<BrandReportData> => {
    // 简化输入，减少 Token 消耗
    const newsContext = newsList.map(n => `[${n.date}] ${n.type}: ${n.title}`).join('\n');
    
    const systemPrompt = `
      You are a senior strategic consultant for the automotive industry. 
      Write a concise, high-level "Brand Dossier" Executive Summary for "${brand}" during the period "${periodLabel}".
      
      Instructions:
      1. Analyze the provided news list to identify the brand's key strategic focus (e.g., Aggressive Expansion, Product Renewal, Policy Compliance).
      2. Write an "executive_summary" (approx 200 words, in Chinese) that reads like a professional briefing for a CEO. Focus on business impact, not just listing events.
      3. Extract key bullet points for SWOT analysis based on the events.

      Output strictly in JSON format:
      {
        "executive_summary": "Professional strategic summary in Chinese...",
        "swot": {
          "strengths": ["Strategic point 1", "Strategic point 2"],
          "weaknesses": ["Risk point 1", "Risk point 2"],
          "opportunities": ["Market opportunity 1"],
          "threats": ["Competitive threat 1"]
        }
      }
    `;
  
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `News Context:\n${newsContext}`, prompt: systemPrompt })
      });
  
      if (!response.ok) throw new Error("Report Generation Failed");
      const rawData = await response.json();
      const rawContent = rawData.output?.choices?.[0]?.message?.content || "";
  
      let cleanJson = rawContent.replace(/```json/gi, "").replace(/```/g, "").trim();
      const firstOpen = cleanJson.indexOf("{");
      const lastClose = cleanJson.lastIndexOf("}");
      if (firstOpen !== -1 && lastClose !== -1) {
        cleanJson = cleanJson.substring(firstOpen, lastClose + 1);
      }
      
      return JSON.parse(cleanJson) as BrandReportData;
    } catch (error: any) {
      console.error("Report Generation Error:", error);
      throw error;
    }
  };