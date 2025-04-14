const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY;

app.get('/data', async (req, res) => {
  const xDate = Math.floor(Date.now() / 1000).toString(); // 🔥 string, not number
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(xDate).digest('hex');

  console.log("Sending headers:", {
    'x-date': xDate,
    'Authorization': signature
  });

  try {
    const response = await axios.get('https://swgoh-comlink-0zch.onrender.com/data', {
      headers: {
        'x-date': xDate, // ✅ clean string version
        'Authorization': signature,
        'Accept': 'application/json',
        'User-Agent': 'swgoh-proxy-bot'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error("Proxy request failed:");
    console.error("Status:", error.response?.status);
    console.error("Data:", error.response?.data);
    console.error("Message:", error.message);

    res.status(error.response?.status || 500).json({
      error: error.message,
      data: error.response?.data || null
    });
  }
});

app.listen(port, () => {
  console.log(`Proxy listening on port ${port}`);
});
