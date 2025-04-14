const express = require('express');
const crypto = require('crypto');
const https = require('https');

const app = express();
const port = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
  console.error("❌ SECRET_KEY not set.");
  process.exit(1);
}

app.get('/data', async (req, res) => {
  const xDate = Date.now().toString();
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(xDate).digest('hex');

  const headers = {
    'x-date': xDate,
    'Authorization': `hmac ${signature}`,
    'Accept': 'application/json',
    'User-Agent': 'swgoh-proxy-bot'
  };

  console.log("🔎 Outgoing headers:", headers);

  const options = {
    hostname: 'swgoh-comlink-0zch.onrender.com',
    path: '/data',
    method: 'GET',
    headers
  };

  const proxyReq = https.request(options, (proxyRes) => {
    let body = '';
    proxyRes.on('data', chunk => body += chunk);
    proxyRes.on('end', () => {
      try {
        const json = JSON.parse(body);
        if (proxyRes.statusCode >= 400) {
          throw { response: { status: proxyRes.statusCode, data: json } };
        }
        res.status(proxyRes.statusCode).json(json);
      } catch (err) {
        console.error("❌ Failed parsing or proxy error:");
        console.error(err);
        res.status(err.response?.status || 500).json({
          error: err.message || 'Unknown error',
          backend: err.response?.data || null
        });
      }
    });
  });

  proxyReq.on('error', err => {
    console.error("❌ Request error:", err);
    res.status(500).json({ error: err.message });
  });

  proxyReq.end();
});

app.listen(port, () => {
  console.log(`✅ Proxy using raw HTTPS request is running on port ${port}`);
});
