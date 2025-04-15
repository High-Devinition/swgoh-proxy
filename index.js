const express = require('express');
const crypto = require('crypto');
const http2 = require('http2');

const app = express();
const port = process.env.PORT || 10000;

const ACCESS_KEY = process.env.ACCESS_KEY;
const SECRET_KEY = process.env.SECRET_KEY;

if (!ACCESS_KEY || !SECRET_KEY) {
  console.error("❌ ACCESS_KEY and/or SECRET_KEY not set.");
  process.exit(1);
}

app.get('/data', async (req, res) => {
  const reqTime = Date.now().toString();
  const method = "GET";
  const uri = "/data";

  // ✨ Match Comlink's expected HMAC input format exactly
  const payload = `${reqTime}${method}${uri}`;
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(payload);
  const signature = hmac.digest('hex');

  const authHeader = `HMAC-SHA256 Credential=${ACCESS_KEY},Signature=${signature}`;

  const headers = {
    ':method': method,
    ':path': uri,
    'X-Date': reqTime,
    'Authorization': authHeader,
    'Accept': 'application/json',
    'User-Agent': 'swgoh-proxy-bot'
  };

  console.log("🔍 Outgoing headers:", headers);

  const client = http2.connect('https://swgoh-comlink-0zch.onrender.com');

  const request = client.request(headers);

  let responseData = '';
  request.setEncoding('utf8');
  request.on('data', chunk => {
    responseData += chunk;
  });

  request.on('end', () => {
    try {
      const json = JSON.parse(responseData);
      res.status(200).json(json);
    } catch (e) {
      console.error("❌ Failed parsing response:", e);
      res.status(500).json({ error: "Failed to parse response", raw: responseData });
    }
    client.close();
  });

  request.on('error', (err) => {
    console.error("❌ HTTP2 request error:", err.message);
    res.status(500).json({ error: err.message });
    client.close();
  });

  request.end();
});

app.listen(port, () => {
  console.log(`✅ HTTP/2 proxy running on port ${port}`);
});
