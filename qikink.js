// qikink.js
// Small helper around the Qikink Sandbox/Live API.
// Docs reference: POST /api/token, POST /api/order/create

const axios = require('axios');

const BASE_URL =
  process.env.QIKINK_ENV === 'live'
    ? 'https://api.qikink.com'
    : 'https://sandbox.qikink.com';

const CLIENT_ID = process.env.QIKINK_CLIENT_ID;
const CLIENT_SECRET = process.env.QIKINK_CLIENT_SECRET;

// Cache the access token in memory so we don't call /api/token on every order.
// Qikink tokens are valid for 3600 seconds (1 hour) per their docs.
let cachedToken = null;
let tokenExpiresAt = 0; // epoch ms

async function getAccessToken() {
  const now = Date.now();

  // Reuse cached token if it still has more than 60 seconds of life left.
  if (cachedToken && now < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      'QIKINK_CLIENT_ID or QIKINK_CLIENT_SECRET is missing. Check your .env file.'
    );
  }

  const params = new URLSearchParams();
  params.append('ClientId', CLIENT_ID);
  params.append('client_secret', CLIENT_SECRET);

  const response = await axios.post(`${BASE_URL}/api/token`, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  const { Accesstoken, expires_in } = response.data;

  if (!Accesstoken) {
    throw new Error(
      `Qikink token request did not return an Accesstoken: ${JSON.stringify(
        response.data
      )}`
    );
  }

  cachedToken = Accesstoken;
  tokenExpiresAt = now + (expires_in || 3600) * 1000;

  return cachedToken;
}

/**
 * Creates an order on Qikink.
 * @param {object} orderPayload - shaped exactly like Qikink's /api/order/create body.
 */
async function createQikinkOrder(orderPayload) {
  const token = await getAccessToken();

  try {
    const response = await axios.post(
      `${BASE_URL}/api/order/create`,
      orderPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          ClientId: CLIENT_ID,
          Accesstoken: token,
        },
      }
    );
    return { ok: true, data: response.data };
  } catch (err) {
    // If Qikink rejects with a validation error, surface that message instead
    // of a generic network error, so the caller can show something useful.
    if (err.response) {
      return { ok: false, status: err.response.status, data: err.response.data };
    }
    throw err;
  }
}

module.exports = { getAccessToken, createQikinkOrder, BASE_URL };
