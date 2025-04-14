const express = require('express');
const crypto = require('crypto');
const fetch = require('node-fetch'); // node-fetch v2
const app = express();
const port = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
  console.error("❌ SECRET_KEY not set.");
  process.exit(1);
}

// Optional: Clean up headers
app.set('x-powered-by', false);

app.get('/data', async (req, res) => {
  const xDate = Date.now().toString(); // Use milliseconds
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(xDate)
    .digest('hex');

  const authHeader = `hmac ${signature}`; // ✅ Correct format

  const headers = {
    'x-date': xDate,
    'Authorization': authHeader, // ✅ Capital "A"
    'Accept': 'application/json',
    'User-Agent': 'swgoh-proxy-bot'
  };

  console.log("🧠 Outgoing headers:", headers);

  try {
    const response = await fetch('https://swgoh-comlink-0zch.onrender.com/data', {
      method: 'GET',
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw { response: { status: response.status, data } };
    }

    res.status(response.status).json(data);
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
  console.log(`✅ Proxy using preserved header casing is running on port ${port}`);
});
