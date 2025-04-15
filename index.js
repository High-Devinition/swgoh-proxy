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
  // ✅ Use milliseconds since epoch
  const reqTime = Date.now().toString(); // <-- this is critical!
  const method = 'GET';
  const uri = '/data';

  // ✅ HMAC digest using individual updates
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(String(method));
  hmac.update(String(uri));
  hmac.update(String(reqTime));
  const signature = hmac.digest('hex');

  // ✅ Proper Authorization header format
  const authHeader = `HMAC-SHA256 Credential=${ACCESS_KEY},Signature=${signature}`;

  const headers = {
    ':method': method,
    ':path': uri,
    'x-date': reqTime, // <-- lowercase "x-date" is critical!
    'Authorization': authHeader,
    'Accept': 'application/json',
    'User-Agent': 'swgoh-proxy-bot'
  };

  console.log("🔍 Outgoing headers:", headers);

  const client = http2.connect('https://swgoh-comlink-0zch.onrender.com');

  const request = client.request(headers);

  let responseData = '';
  request.setEncoding('utf8');
  request.on('data', chunk => responseData += chunk);

  request.on('end', () => {
    try {
      const json = JSON.parse(responseData);
      res.status(200).json(json);
    } catch (e) {
      console.error("❌ Parse error:", e);
      res.status(500).json({ error: "Parse error", raw: responseData });
    }
    client.close();
  });

  request.on('error', err => {
    console.error("❌ HTTP2 error:", err.message);
    res.status(500).json({ error: err.message });
    client.close();
  });

  request.end();
});

app.listen(port, () => {
  console.log(`✅ HTTP/2 proxy running on port ${port}`);
});
