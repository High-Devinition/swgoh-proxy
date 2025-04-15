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
  const timestamp = Math.floor(Date.now() / 1000).toString();  // ✅ seconds-based epoch
  const method = 'POST';
  const uri = '/data';
  const payload = {};  // ✅ consistent with POST structure
  const payloadString = JSON.stringify(payload);
  const bodyHash = crypto.createHash('md5').update(payloadString).digest('hex');

  const toSign = timestamp + method + uri + bodyHash;
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(toSign).digest('hex');
  const authHeader = `HMAC-SHA256 Credential=${ACCESS_KEY},Signature=${signature}`;

  const headers = {
    'x-date': timestamp, // ✅ finally correct
    'Authorization': authHeader,
    'Accept': 'application/json',
    'User-Agent': 'swgoh-proxy-bot'
  };

  // 🧠 Debug log
  console.log("\n🧠 HMAC Signature Debug");
  console.log("  x-date (epoch seconds):", timestamp);
  console.log("  Method:", method);
  console.log("  URI:", uri);
  console.log("  Payload:", payloadString);
  console.log("  Body MD5:", bodyHash);
  console.log("  String to Sign:", toSign);
  console.log("  Signature:", signature);
  console.log("  Authorization:", authHeader);
  console.log("  Headers:", headers);

  try {
    const response = await axios.post('https://swgoh-comlink-0zch.onrender.com/data', payload, {
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
  console.log(`✅ Final Comlink proxy running on port ${port}`);
});
