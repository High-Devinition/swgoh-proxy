const express = require('express');
const crypto = require('crypto');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
  console.error("❌ SECRET_KEY not set.");
  process.exit(1);
}

app.get('/data', async (req, res) => {
  const xDate = Date.now().toString();
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(xDate)
    .digest('hex');

  // ✅ Correct Authorization format for comlink: hmac <signature>:<x-date>
  const authHeader = `hmac ${signature}:${xDate}`;

  const headers = {
    'x-date': xDate,
    'Authorization': authHeader,
    'Accept': 'application/json',
    'User-Agent': 'swgoh-proxy-bot'
  };

  console.log("🔍 Outgoing headers:", headers);

  try {
    const response = await fetch('https://swgoh-comlink-0zch.onrender.com/data', {
      method: 'GET',
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw { response: { status: response.status, data } };
    }

    res.status(response.status).json(data);
  } catch (error) {
    console.error("❌ Proxy request failed:");
    console.error("Status:", error.response?.status);
    console.error("Message:", error.message);
    console.error("Data:", error.response?.data || '[no data]');

    res.status(error.response?.status || 500).json({
      error: error.message,
      backend: error.response?.data || null
    });
  }
});

app.listen(port, () => {
  console.log(`✅ Proxy with exact header casing is running on port ${port}`);
});
