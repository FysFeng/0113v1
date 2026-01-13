import { put, list } from '@vercel/blob';

// Node.js Runtime for Vercel Functions
export default async function handler(req, res) {
  // CORS & Cache Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control, Pragma');
  // Explicitly tell browser/clients NOT to cache this API response
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
      // 1. List files to find 'news.json'
      const { blobs } = await list({ token, limit: 100 }); 
      const newsBlob = blobs.find(b => b.pathname === 'news.json');

      if (!newsBlob) {
        return res.status(200).json([]);
      }

      // 2. Fetch the actual JSON content from the blob URL
      // CRITICAL: Append timestamp to bypass Vercel Edge Cache (CDN)
      const noCacheUrl = `${newsBlob.url}?t=${Date.now()}`;
      
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
        try {
            body = JSON.parse(body);
        } catch (e) {
            return res.status(400).json({ error: "Invalid JSON body" });
        }
      }

      // Save 'news.json'
      // addRandomSuffix: false ensures we keep the same filename like a database
      // addOverwrite: true is REQUIRED when addRandomSuffix is false and file exists
      await put('news.json', JSON.stringify(body), {
        access: 'public',
        addRandomSuffix: false,
        addOverwrite: true,
        token,
        contentType: 'application/json',
        cacheControlMaxAge: 0
      });

      return res.status(200).json({ success: true, timestamp: Date.now() });
    }

    return res.status(405).end();

  } catch (error) {
    console.error("Blob Error:", error);
    return res.status(500).json({ error: error.message });
  }
}