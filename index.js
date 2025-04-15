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
  const timestamp = Date.now().toString();           // ✅ ms since epoch
  const method = 'POST';                             // ✅ use POST
  const endpoint = '/data';                          // ✅ use lowercase path
  const payload = {};                                // ✅ pretend empty JSON body

  const payloadString = JSON.stringify(payload);     // stringified body
  const bodyMD5 = crypto.createHash('md5').update(payloadString).digest('hex');

  const toSign = timestamp + method + endpoint.toLowerCase() + bodyMD5;
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(toSign).digest('hex');
  const authHeader = `HMAC-SHA256 Credential=${ACCESS_KEY},Signature=${signature}`;

  const headers = {
    'x-date': timestamp,
    'Authorization': authHeader,
    'Accept': 'application/json',
    'User-Agent': 'swgoh-proxy-bot'
  };

  // 🧪 Debug
  console.log("🧠 HMAC Signature Debug");
  console.log("  Timestamp:", timestamp);
  console.log("  Method:", method);
  console.log("  Endpoint:", endpoint.toLowerCase());
  console.log("  Payload:", payloadString);
  console.log("  MD5:", bodyMD5);
  console.log("  ToSign:", toSign);
  console.log("  Signature:", signature);
  console.log("  Final Header:", authHeader);
  console.log("  Outgoing headers:", headers);

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
  console.log(`✅ POST-mode proxy using Mhanndalorian-style HMAC is running on port ${port}`);
});
