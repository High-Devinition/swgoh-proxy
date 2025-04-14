const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY;

app.get('/data', async (req, res) => {
  const xDate = Math.floor(Date.now() / 1000); // pure number
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(xDate.toString()).digest('hex');

  console.log("Sending headers:", {
    'x-date': xDate,
    'Authorization': signature
  });
  console.log("typeof xDate:", typeof xDate); // 🔍 should be number

  try {
    const response = await axios.get('https://swgoh-comlink-0zch.onrender.com/data', {
