// This is the ONLY file that knows the ML service exists.
// Controllers call these functions; they don't know or care that
// the recommendation logic actually runs in a separate Python
// process. This separation is what "microservice" means here.
require('dotenv').config();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://ml-service:6100';

// Node.js 18+ has a built-in `fetch`, so no extra HTTP client library is needed.
async function getRecommendations(payload) {
  const response = await fetch(`${ML_SERVICE_URL}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`ML service error (${response.status}): ${text}`);
  }

  return response.json();
}

module.exports = { getRecommendations };
