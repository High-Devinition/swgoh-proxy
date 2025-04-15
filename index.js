const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const http = require('http'); // Force HTTP/1.1

const app = express();
const port = process.env.PORT || 3000;
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

  // Format exactly: 'hmac <digest>:<timestamp>'
  const authHeader = `hmac ${digest}:${xDate}`;

  const headers = {
    'x-date': xDate,
    'Authorization': authHeader, // Capital A
    'Accept': 'application/json',
    'User-Agent': 'swgoh-proxy-bot'
  };

  console.log("🔍 Outgoing headers:", headers);

  try {
    const response = await axios.get('https://swgoh-comlink-0zch.onrender.com/data', {
      headers
    });

    res.status(response.status).json(response.data);
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

// 🔁 Force HTTP/1.1 to preserve header casing
http.createServer(app).listen(port, () => {
  console.log(`✅ HTTP/1.1 proxy running on port ${port}`);
});
