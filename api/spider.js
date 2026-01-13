import { put, list } from '@vercel/blob';

// 简单的 HTML 清洗函数 (避免引入 cheerio 依赖，减少部署麻烦)
function extractContent(html) {
  try {
    // 1. 提取标题
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '无标题';

    // 2. 移除无关标签 (script, style, nav, footer, header, iframe, etc.)
    let body = html
       .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
       .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
       .replace(/<!--[\s\S]*?-->/g, '')
       .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
       .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
       .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
       .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
       .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '');

    // 3. 提取主体文本 (简单的正则去除所有标签)
    let text = body.replace(/<[^>]+>/g, '\n');
    
    // 4. 清洗空白字符 (将连续换行和空格压缩)
    text = text
        .replace(/\t/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\n\s*\n/g, '\n') // 多个空行变一个
        .trim();
    
    // 截取过长的文本，保留前 5000 字 (足够 AI 分析)
    return { title, text: text.substring(0, 5000) };
  } catch (e) {
    return { title: '解析失败', text: '' };
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return res.status(503).json({ error: "服务器配置错误: 未配置 Blob Token" });

  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL 不能为空" });

    // 1. 抓取网页 (增加超时控制)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`抓取失败: 目标网站返回 ${response.status}`);
        
        const html = await response.text();
        const { title, text } = extractContent(html);

        if (text.length < 50) throw new Error("未能提取到有效内容 (可能内容过短或为纯动态渲染)");

        // 2. 读取现有的 pending.json
        let pendingList = [];
        try {
            const { blobs } = await list({ token, limit: 100 });
            const blob = blobs.find(b => b.pathname === 'pending.json');
            if (blob) {
                // 加上时间戳防止 Vercel 内部缓存
                const oldRes = await fetch(`${blob.url}?t=${Date.now()}`, { cache: 'no-store' });
                if (oldRes.ok) {
                    pendingList = await oldRes.json();
                }
            }
        } catch (e) {
            console.warn("No existing pending file, creating new.", e);
        }

        // 3. 追加新条目
        const newItem = {
            id: Math.random().toString(36).substring(2, 10),
            url,
            title,
            text, 
            scrapedAt: new Date().toISOString().split('T')[0],
            source: new URL(url).hostname
        };

        // 新抓取的放最前面
        pendingList = [newItem, ...pendingList];

        // 4. 保存回 pending.json
        await put('pending.json', JSON.stringify(pendingList), {
            access: 'public',
            addRandomSuffix: false,
            addOverwrite: true,
            token,
            contentType: 'application/json'
        });

        return res.status(200).json({ success: true, item: newItem });

    } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
            throw new Error("抓取超时 (15s): 目标网站响应过慢");
        }
        throw fetchError;
    }

  } catch (error) {
    console.error("Spider Error:", error);
    return res.status(500).json({ error: error.message });
  }
}