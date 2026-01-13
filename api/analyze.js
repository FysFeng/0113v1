export default async function handler(req, res) {
  // 1. 允许跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // ==========================================
  // 🔴 配置 API Key
  // ==========================================
  const apiKey = process.env.DASHSCOPE_API_KEY;

  if (!apiKey || apiKey.startsWith('sk-xxxx')) {
    console.error("API Key is missing or invalid placeholder.");
    return res.status(503).json({ 
      error: "服务器配置错误: 未设置 DASHSCOPE_API_KEY 环境变量。" 
    });
  }

  const { text, prompt } = req.body;

  try {
    // ⚡️ 核心修复：增加超时控制
    // 默认 fetch 超时通常只有 10s，连接国内阿里云容易超时。这里设置为 60s。
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    // 2. 服务器端请求阿里云 (Qwen-Plus)
    const response = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "qwen-plus",
        input: {
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: `News Text: ${text}` }
          ]
        },
        parameters: {
          result_format: "message",
          temperature: 0.1,
          top_p: 0.8
        }
      }),
      signal: controller.signal // 绑定超时控制器
    });

    clearTimeout(timeoutId); // 请求成功，清除定时器

    const data = await response.json();

    if (!response.ok) {
      console.error("Alibaba Cloud API Error:", data);
      const errorMsg = data.message || data.code || "AI 服务响应异常";
      throw new Error(errorMsg);
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("Analyze Proxy Error:", error);
    
    // 捕获超时错误并返回友好的提示
    if (error.name === 'AbortError') {
        return res.status(504).json({ error: "服务器连接 AI 超时 (60s)，请稍后重试。" });
    }
    
    return res.status(500).json({ error: error.message });
  }
}