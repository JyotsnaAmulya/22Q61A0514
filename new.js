
const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

const validIds = ['primes', 'fibo', 'even', 'rand'];


let numberWindow = [];
const WINDOW_SIZE = 10;
const BASE_URL = 'http://20.244.56.144/evaluation-service/';
const TOKEN_URL= 'http://20.244.56.144/token';

const clientId =process.env.clientId;
const clientSecret= process.env.clientSecret;

let accessToken='';


async function fetchToken() {
  try {
    const response = await axios.post(TOKEN_URL, {
      clientId: clientId,
      clientSecret: clientSecret
    });
    accessToken = response.data.access_token;
    console.log('Fetched new token!');
  } catch (error) {
    console.error('Token fetch failed:', error.message);
  }
}


async function fetchNumbers(numberId) {
  if (!accessToken) await fetchToken();
  try {
    const response = await axios.get(`${BASE_URL}${numberId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      timeout: 500
    });
    return response.data.numbers || [];
  } catch (error) {
    console.error('Fetch error:', error.message);
    return [];
  }
}

function updateWindow(fetchedNumbers) {
  const prevState = [...numberWindow];
  fetchedNumbers.forEach(num => {
    if (!numberWindow.includes(num)) {
      if (numberWindow.length >= WINDOW_SIZE) {
        numberWindow.shift();
      }
      numberWindow.push(num);
    }
  });
  return prevState;
}

function calculateAverage() {
  if (numberWindow.length === 0) return 0;
  const sum = numberWindow.reduce((a, b) => a + b, 0);
  return +(sum / numberWindow.length).toFixed(2);
}

app.get('/numbers/:numberid', async (req, res) => {
  const numberId = req.params.numberid;

  if (!validIds.includes(numberId)) {
    return res.status(400).json({ error: 'Invalid number id.' });
  }

  const startTime = Date.now();
  const fetchedNumbers = await fetchNumbers(numberId);
  const prevState = updateWindow(fetchedNumbers);
  const avg = calculateAverage();

  const elapsed = Date.now() - startTime;
  if (elapsed > 500) {
    return res.status(504).json({ error: 'Request timed out.' });
  }

  return res.json({
    windowPrevState: prevState,
    windowCurrState: numberWindow,
    numbers: fetchedNumbers,
    avg: avg
  });
});

app.listen(port, () => {
  console.log(`Average Calculator Microservice running on port ${port}`);
});
