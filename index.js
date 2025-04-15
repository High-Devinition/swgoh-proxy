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
  const reqTime = Date.now().toString(); // milliseconds since epoch
  const method = 'GET';
  const uri = '/data';

  // 🧠 Match spreadsheet HMAC: time + method + uri + md5(body)
  const emptyBodyHash = crypto
    .createHash('md5')
    .update(JSON.stringify({})) // empty POST body
    .digest('hex');

  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(reqTime);
  hmac.update(method);
  hmac.update(uri);
  hmac.update(emptyBodyHash);
  const signature = hmac.digest('hex');

  const authHeader = `HMAC-SHA256 Credential=${ACCESS_KEY},Signature=${signature}`;

  const headers = {
    'x-date': reqTime,
    'Authorization': authHeader,
    'Accept': 'application/json',
    'User-Agent': 'swgoh-proxy-bot'
  };

  // 🧪 Debug logs
  console.log("🧠 Signing values:");
  console.log("  Timestamp:", reqTime);
  console.log("  Method:", method);
  console.log("  URI:", uri);
  console.log("  MD5 Body:", emptyBodyHash);
  console.log("  Signature:", signature);
  console.log("  Final Authorization:", authHeader);
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

app.listen(port, () => {
  console.log(`✅ Proxy using spreadsheet-style signature is running on port ${port}`);
});
