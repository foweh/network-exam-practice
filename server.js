/**
 * 简易静态文件服务器 + DeepSeek API 代理
 * 用于本地预览和 AI 评分
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

async function proxyGrade(req, res) {
  try {
    const { apiKey, model, baseUrl, prompt } = await readBody(req);
    if (!apiKey) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: '缺少 API Key' }));
      return;
    }

    const url = `${baseUrl || 'https://api.deepseek.com'}/chat/completions`;
    const payload = {
      model: model || 'deepseek-chat',
      messages: [
        { role: 'system', content: '你是一个严格的计算机网络课程助教，只输出 JSON 格式评分结果。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 512
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    res.writeHead(response.status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

const server = http.createServer(async (req, res) => {
  // 允许跨域（开发便利）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // AI 评分代理接口
  if (req.url === '/api/grade' && req.method === 'POST') {
    await proxyGrade(req, res);
    return;
  }

  // 静态文件
  let filePath = path.join(ROOT, decodeURIComponent(req.url).split('?')[0]);
  if (filePath.endsWith('/')) filePath += 'index.html';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found: ' + req.url);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
