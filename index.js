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
  const xDate = new Date().toUTCString();
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(xDate).digest('hex');

  console.log("Sending headers:", {
    'x-date': xDate,
    'Authorization': signature
  });

  const response = await axios.get('https://swgoh-comlink-0zch.onrender.com/data', {
    headers: {
      'x-date': xDate,
      'Authorization': signature,
      'Accept': 'application/json',
      'User-Agent': 'swgoh-proxy-bot/1.0',
      'Content-Type': 'application/json'
    }
  });

  res.json(response.data);
} catch (error) {
  console.error("Proxy request error:", error.response?.status, error.response?.data || error.message);
  res.status(error.response?.status || 500).json({ error: error.message });
}


    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Proxy listening on port ${port}`);
});
