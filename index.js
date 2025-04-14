const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
  console.error("❌ ERROR: SECRET_KEY environment variable is not set.");
  process.exit(1);
}

app.get('/data', async (req, res) => {
  const xDate = Math.floor(Date.now() / 1000).toString(); // ✅ strict UNIX timestamp as string
  const cleanDate = xDate.replace(/['"]/g, ''); // extra defense

  const signature = crypto.createHmac('sha256', SECRET_KEY)
    .update(cleanDate)
    .digest('hex');

  console.log("🔍 Sending headers:", {
    'x-date': cleanDate,
    Authorization: signature,
  });

  try {
    const response = await axios.get('https://swgoh-comlink-0zch.onrender.com/data', {
      headers: {
        'x-date': cleanDate,
        Authorization: signature,
        Accept: 'application/json',
        'User-Agent': 'swgoh-proxy-bot/1.0'
      }
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error("❌ Proxy request failed:", error.response?.status || error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      backend: error.response?.data || null
    });
  }
});

app.listen(port, () => {
  console.log(`✅ Proxy listening on port ${port}`);
});
