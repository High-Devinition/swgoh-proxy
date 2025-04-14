const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY;

app.get('/data', async (req, res) => {
  const xDate = new Date().toUTCString();
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(xDate).digest('hex');

  try {
    const response = await axios.get('https://swgoh-comlink-0zch.onrender.com/data', {
      headers: {
        'x-date': xDate,
        'Authorization': signature,
        'Accept': 'application/json',
        'User-Agent': 'swgoh-proxy-bot'
      }
    });

    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Proxy listening on port ${port}`);
});
