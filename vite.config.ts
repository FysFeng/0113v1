import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // 加载环境变量，允许读取 .env 中的 DASHSCOPE_API_KEY
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'configure-server',
        configureServer(server) {
          // 在本地开发服务器中模拟 Vercel Function 的 /api/analyze 接口
          server.middlewares.use('/api/analyze', async (req, res, next) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk.toString(); });
              req.on('end', async () => {
                try {
                  const { text, prompt } = JSON.parse(body);
                  const apiKey = env.DASHSCOPE_API_KEY || env.VITE_DASHSCOPE_API_KEY;

                  if (!apiKey) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: "本地环境未配置 DASHSCOPE_API_KEY" }));
                    return;
                  }

                  // 增加本地开发代理的超时时间到 60s
                  const controller = new AbortController();
                  const timeoutId = setTimeout(() => controller.abort(), 60000);

                  // 服务器端转发请求（Node.js 环境不受 CORS 限制）
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
                    signal: controller.signal
                  });

                  clearTimeout(timeoutId);

                  const data = await response.json();
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                } catch (error) {
                  console.error("Local Proxy Error:", error);
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  // @ts-ignore
                  const msg = error.name === 'AbortError' ? "Local Proxy Timeout (60s)" : (error as Error).message;
                  res.end(JSON.stringify({ error: "Local Proxy Error: " + msg }));
                }
              });
            } else {
              next();
            }
          });
        }
      }
    ],
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        external: ['html2canvas'],
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'recharts'],
          },
        },
      },
    },
  };
});