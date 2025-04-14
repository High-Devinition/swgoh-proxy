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

app.get('/data', (req, res) => {
  const unixEpoch = Math.floor(Date.now() / 1000);
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(unixEpoch.toString())
    .digest('hex');

  console.log("🔍 Headers going out:");
  console.log("x-date:", unixEpoch);
  console.log("Authorization:", signature);

  const options = {
    hostname: 'swgoh-comlink-0zch.onrender.com',
    path: '/data',
    method: 'GET',
    headers: {
      'x-date': unixEpoch, // raw number format
      'Authorization': signature,
      'Accept': 'application/json',
      'User-Agent': 'swgoh-proxy-bot/1.0'
    }
  };

  const request = https.request(options, (response) => {
    let data = '';
    response.on('data', chunk => data += chunk);
    response.on('end', () => {
      res.status(response.statusCode).send(data);
    });
  });

  request.on('error', (err) => {
    console.error('❌ Request error:', err);
    res.status(500).json({ error: err.message });
  });

  request.end();
});

app.listen(port, () => {
  console.log(`✅ Proxy listening on port ${port}`);
});
