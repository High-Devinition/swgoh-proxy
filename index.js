const express = require('express');
const crypto = require('crypto');
const http2 = require('http2');

const app = express();
const port = process.env.PORT || 10000;

const ACCESS_KEY = process.env.ACCESS_KEY;
const SECRET_KEY = process.env.SECRET_KEY;

if (!ACCESS_KEY || !SECRET_KEY) {
  console.error("❌ ACCESS_KEY and/or SECRET_KEY not set.");
  process.exit(1);
}

app.get('/data', async (req, res) => {
  const timestamp = Math.floor(Date.now()).toString(); // Milliseconds
  const method = 'GET';
  const uri = '/data';
  const payload = '';
  const md5 = crypto.createHash('md5').update(payload).digest('hex');

  const stringToSign = `${timestamp}${method}${uri}${md5}`;
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(stringToSign).digest('hex');
  const authHeader = `HMAC-SHA256 Credential=${ACCESS_KEY},Signature=${signature}`;

  const headers = {
    'x-date': timestamp,
    'Authorization': authHeader,
    'Accept': 'application/json',
    'User-Agent': 'swgoh-proxy-bot'
  };

  console.log("🧠 Final Jedi GET Debug:");
  console.log("  x-date:", timestamp);
  console.log("  Method:", method);
  console.log("  URI:", uri);
  console.log("  Body MD5:", md5);
  console.log("  String to Sign:", stringToSign);
  console.log("  Signature:", signature);
  console.log("  Auth Header:", authHeader);
  console.log("  Outgoing Headers:", headers);

  const client = http2.connect('https://swgoh-comlink-0zch.onrender.com');

  const request = client.request({
    ':method': method,
    ':path': uri,
    ...headers
  });

  let responseData = '';
  request.setEncoding('utf8');
  request.on('data', chunk => responseData += chunk);

  request.on('end', () => {
    try {
      const json = JSON.parse(responseData);
      res.status(200).json(json);
    } catch (err) {
      console.error("❌ Parse error:", err);
      res.status(500).json({ error: "Parse error", raw: responseData });
    }
    client.close();
  });

  request.on('error', err => {
    console.error("❌ HTTP2 error:", err.message);
    res.status(500).json({ error: err.message });
    client.close();
  });

  request.end();
});

app.listen(port, () => {
  console.log(`✅ HTTP/2 proxy running on port ${port}`);
});
