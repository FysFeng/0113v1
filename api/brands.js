import { put, list } from '@vercel/blob';

// Node.js Runtime
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control, Pragma');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    if (req.method === 'GET') {
        return res.status(200).json([]);
    }
    return res.status(503).json({ error: "Vercel Blob token not found" });
  }

  try {
    if (req.method === 'GET') {
      const { blobs } = await list({ token, limit: 100 });
      const brandsBlob = blobs.find(b => b.pathname === 'brands.json');

      if (!brandsBlob) {
        return res.status(200).json([]);
      }

      const noCacheUrl = `${brandsBlob.url}?t=${Date.now()}`;

      const dataRes = await fetch(noCacheUrl, { 
          cache: 'no-store',
          headers: { 
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
          } 
      });
      
      if (!dataRes.ok) {
        throw new Error(`Failed to fetch blob content: ${dataRes.status}`);
      }

      const data = await dataRes.json();
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (e) { return res.status(400).json({ error: "Invalid JSON" }); }
      }
      
      // Also adding addOverwrite: true here to be safe
      await put('brands.json', JSON.stringify(body), {
        access: 'public',
        addRandomSuffix: false,
        addOverwrite: true,
        token,
        contentType: 'application/json',
        cacheControlMaxAge: 0
      });

      return res.status(200).json({ success: true });
    }

    return res.status(405).end();

  } catch (error) {
    console.error("Blob Error:", error);
    return res.status(500).json({ error: error.message });
  }
}