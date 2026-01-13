import { put, list } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return res.status(503).json({ error: "未配置 Blob Token" });

  try {
    // 获取列表
    if (req.method === 'GET') {
        const { blobs } = await list({ token, limit: 100 });
        const blob = blobs.find(b => b.pathname === 'pending.json');
        
        if (!blob) return res.status(200).json([]);

        // 加上时间戳防止缓存
        const response = await fetch(`${blob.url}?t=${Date.now()}`, { cache: 'no-store' });
        const data = await response.json();
        return res.status(200).json(data);
    }

    // 删除条目 (通常是在处理完之后)
    if (req.method === 'DELETE') {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: "Missing ID" });

        // 读取
        const { blobs } = await list({ token, limit: 100 });
        const blob = blobs.find(b => b.pathname === 'pending.json');
        if (!blob) return res.status(200).json({ success: true });

        const response = await fetch(blob.url, { cache: 'no-store' });
        let data = await response.json();

        // 过滤
        const initialLength = data.length;
        data = data.filter(item => item.id !== id);

        if (data.length === initialLength) {
            return res.status(404).json({ error: "Item not found" });
        }

        // 写入
        await put('pending.json', JSON.stringify(data), {
            access: 'public',
            addRandomSuffix: false,
            addOverwrite: true,
            token,
            contentType: 'application/json'
        });

        return res.status(200).json({ success: true });
    }

    return res.status(405).end();
  } catch (error) {
    console.error("Pending API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}