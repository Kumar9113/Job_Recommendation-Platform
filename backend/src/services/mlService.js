require('dotenv').config();

const ML_SERVICE_HOSTPORT =
  process.env.ML_SERVICE_HOSTPORT || 'ml-service:6100';

const ML_SERVICE_URL = `http://${ML_SERVICE_HOSTPORT}`;

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