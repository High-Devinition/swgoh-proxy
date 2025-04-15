const express = require('express');
const crypto = require('crypto');
const http2 = require('http2');

const app = express();
const port = process.env.PORT || 10000;
const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
  console.error("❌ SECRET_KEY not set.");
  process.exit(1);
}

app.get('/data', async (req, res) => {
  const xDate = Date.now().toString();

  // Generate HMAC digest
  const digest = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(xDate)
    .digest('hex');

  // Format as: HMAC <digest>:<timestamp>
  const authHeader = `HMAC ${digest}:${xDate}`;

  // Prepare headers with exact casing
  const headers = {
    ':method': 'GET',
    ':path': '/data',
    'x-date': xDate,
    'Authorization': authHeader, // Capital A!
    'Accept': 'application/json',
    'User-Agent': 'swgoh-proxy-bot'
  };

  console.log("🔍 Outgoing headers:", headers);

  const client = http2.connect('https://swgoh-comlink-0zch.onrender.com');

  const request = client.request(headers);

  let rawData = '';
  request.setEncoding('utf8');

  request.on('data', (chunk) => {
    rawData += chunk;
  });

  request.on('end', () => {
    try {
      const json = JSON.parse(rawData);
      res.status(200).json(json);
    } catch (e) {
      console.error("❌ Failed parsing or proxy error:");
      console.error("Response:", rawData);
      res.status(502).json({ error: 'Failed to parse response', raw: rawData });
    }
    client.close();
  });

  request.on('error', (err) => {
    console.error("❌ Proxy request failed:", err);
    res.status(500).json({ error: err.message });
  });

  request.end();
});

app.listen(port, () => {
  console.log(`✅ HTTP2 proxy running on port ${port}`);
});
