const express = require('express');
const { ComlinkClient } = require('comlink-js');

const app = express();
const port = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY;
const BASE_URL = 'https://swgoh-comlink-0zch.onrender.com'; // Your actual Comlink API endpoint

if (!SECRET_KEY) {
  console.error("❌ SECRET_KEY not set.");
  process.exit(1);
}

app.get('/data', async (req, res) => {
  try {
    const client = new ComlinkClient({
      baseUrl: BASE_URL,
      secretKey: SECRET_KEY
    });

    const result = await client.request({
      collection: 'units',
      payload: {
        // You can add more filters here if desired
      }
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Comlink client error:", error);
    res.status(500).json({ error: error.message || "Unknown error" });
  }
});

app.listen(port, () => {
  console.log(`✅ Proxy using comlink-js running on port ${port}`);
});
