const express = require('express');
const crypto = require('crypto');
const http2 = require('http2');

const app = express();
const port = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
  console.error('❌ SECRET_KEY not set.');
  process.exit(1);
}

app.get('/data', async (req, res) => {
  const xDate = Date.now().toString();

  const digest = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(xDate)
    .digest('hex');

  const authHeader = `hmac ${digest}:${xDate}`;

  const client = http2.connect('https://swgoh-comlink-0zch.onrender.com');

  const headers = {
    ':method': 'GET',
    ':path': '/data',
    'x-date': xDate,
    'Authorization': authHeader,
    'Accept': 'application/json',
    'User-Agent': 'swgoh-proxy-bot'
  };

  console.log('🔍 Outgoing headers:', headers);

  const reqStream = client.request(headers);

  let data = '';
  reqStream.setEncoding('utf8');
  reqStream.on('data', chunk => (data += chunk));
  reqStream.on('end', () => {
    try {
      const json = JSON.parse(data);
      res.status(200).json(json);
    } catch (err) {
      console.error('❌ Failed to parse JSON:', err);
      res.status(500).json({ error: 'Invalid response format', raw: data });
    }
    client.close();
  });

  reqStream.on('error', err => {
    console.error('❌ HTTP2 request failed:', err.message);
    res.status(500).json({ error: err.message });
    client.close();
  });

  reqStream.end();
});

app.listen(port, () => {
  console.log(`✅ HTTP2 proxy running on port ${port}`);
});
