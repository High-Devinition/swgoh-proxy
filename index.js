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
  const timestamp = Date.now().toString();  // ✅ back to epoch milliseconds
  const method = 'POST';
  const uri = '/data';
  const payload = {};
  const payloadString = JSON.stringify(payload);
  const bodyHash = crypto.createHash('md5').update(payloadString).digest('hex');

  // Construct string to sign
  const toSign = timestamp + method + uri + bodyHash;
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(toSign).digest('hex');
  const authHeader = `HMAC-SHA256 Credential=${ACCESS_KEY},Signature=${signature}`;

  const headers = {
    'X-Date': timestamp,   // ✅ uppercased header casing
    'Authorization': authHeader,
    'Accept': 'application/json',
    'User-Agent': 'swgoh-proxy-bot'
  };

  // Debug
  console.log("\n🧠 HMAC Signature Debug");
  console.log("  X-Date (ms):", timestamp);
  console.log("  Method:", method);
  console.log("  URI:", uri);
  console.log("  Payload:", payloadString);
  console.log("  Body MD5:", bodyHash);
  console.log("  ToSign:", toSign);
  console.log("  Signature:", signature);
  console.log("  Auth Header:", authHeader);
  console.log("  Outgoing Headers:", headers);

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
  console.log(`✅ Proxy with uppercase X-Date + ms timestamp running on port ${port}`);
});
