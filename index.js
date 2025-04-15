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

  const digest = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(xDate)
    .digest('hex');

  const authHeader = `hmac ${digest}:${xDate}`;

  const options = {
    hostname: 'swgoh-comlink-0zch.onrender.com',
    path: '/data',
    method: 'GET',
    headers: {
      'x-date': xDate,
      'Authorization': authHeader, // ✅ preserve exact casing
      'Accept': 'application/json',
      'User-Agent': 'swgoh-proxy-bot'
    }
  };

  console.log("🔍 Outgoing headers:", options.headers);

  const request = https.request(options, (response) => {
    let data = '';
    response.on('data', chunk => data += chunk);
    response.on('end', () => {
      try {
        const json = JSON.parse(data);
        res.status(response.statusCode).json(json);
      } catch (parseErr) {
        console.error("❌ Failed to parse response:", parseErr);
        res.status(500).json({ error: "Invalid JSON response", raw: data });
      }
    });
  });

  request.on('error', (err) => {
    console.error("❌ Proxy request failed:");
    console.error("Message:", err.message);
    res.status(500).json({ error: err.message });
  });

  request.end();
});

app.listen(port, () => {
  console.log(`✅ Proxy with preserved header casing is running on port ${port}`);
});
