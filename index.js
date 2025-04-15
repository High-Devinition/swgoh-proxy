const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 10000;

const ACCESS_KEY = process.env.ACCESS_KEY;
const SECRET_KEY = process.env.SECRET_KEY;

if (!ACCESS_KEY || !SECRET_KEY) {
  console.error("❌ ACCESS_KEY and/or SECRET_KEY not set.");
  process.exit(1);
}

app.get('/data', async (req, res) => {
  const reqTime = Date.now().toString(); // ✅ milliseconds since epoch
  const method = 'GET';
  const uri = '/data';

  // ✅ GET body treated as '{}' per GAS wrapper behavior
  const body = JSON.stringify({});
  const bodyMD5 = crypto.createHash('md5').update(body).digest('hex');

  // ✅ Signature format: timestamp + method + uri + bodyMD5
  const toSign = reqTime + method + uri + bodyMD5;
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(toSign).digest('hex');

  const authHeader = `HMAC-SHA256 Credential=${ACCESS_KEY},Signature=${signature}`;

  const headers = {
    'x-date': reqTime,
    'Authorization': authHeader,
    'Accept': 'application/json',
    'User-Agent': 'swgoh-proxy-bot'
  };

  // 🧠 Debug logging
  console.log("\n=== 🧠 Signature Debug ===");
  console.log("ACCESS_KEY:", ACCESS_KEY);
  console.log("Timestamp (x-date):", reqTime);
  console.log("Method:", method);
  console.log("URI:", uri);
  console.log("Body (raw):", body);
  console.log("Body MD5:", bodyMD5);
  console.log("String to Sign:", toSign);
  console.log("Signature:", signature);
  console.log("Authorization Header:", authHeader);
  console.log("Headers:", headers);
  console.log("==========================\n");

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

app.listen(port, () => {
  console.log(`✅ Proxy with exact spreadsheet-matching signature logic is running on port ${port}`);
});
