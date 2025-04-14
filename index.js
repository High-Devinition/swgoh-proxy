const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
  console.error("❌ SECRET_KEY not set.");
  process.exit(1);
}

app.get('/data', async (req, res) => {
  const unixEpoch = Math.floor(Date.now() / 1000); // ✅ number only
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(unixEpoch.toString()) // Must always sign a string!
    .digest('hex');

  console.log("🧠 Outgoing headers:");
  console.log("  x-date:", unixEpoch);
  console.log("  Authorization:", signature);

  try {
    const response = await axios.get('https://swgoh-comlink-0zch.onrender.com/data', {
      headers: {
        'x-date': unixEpoch, // ✅ sent as number
        Authorization: signature,
        Accept: 'application/json',
        'User-Agent': 'swgoh-proxy-bot/1.0'
      }
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
  console.log(`✅ Proxy listening on port ${port}`);
});
