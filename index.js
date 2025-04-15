const express = require('express');
const crypto = require('crypto');
const { request } = require('undici');

const app = express();
const port = process.env.PORT || 10000;
const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
  console.error("❌ SECRET_KEY not set.");
  process.exit(1);
}

app.get('/data', async (req, res) => {
  const xDate = Date.now().toString();

  const digest = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(xDate)
    .digest('hex');

  const authHeader = `HMAC ${digest}:${xDate}`;

  const headers = {
    'x-date': xDate,
    'Authorization': authHeader, // 👈 Capital A, now respected by undici
    'Accept': 'application/json',
    'User-Agent': 'swgoh-proxy-bot'
  };

  console.log("🔍 Outgoing headers:", headers);

  try {
    const { body, statusCode } = await request('https://swgoh-comlink-0zch.onrender.com/data', {
      method: 'GET',
      headers
    });

    const raw = await body.text();
    let data;

    try {
      data = JSON.parse(raw);
    } catch (err) {
      return res.status(502).json({ error: 'Invalid JSON from Comlink', raw });
    }

    res.status(statusCode).json(data);
  } catch (error) {
    console.error("❌ Proxy request failed:", error);
    res.status(500).json({
      error: error.message || 'Request failed'
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Proxy using undici is running on port ${port}`);
});
