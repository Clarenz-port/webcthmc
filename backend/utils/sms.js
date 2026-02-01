const axios = require('axios');
const qs = require('qs');

const SEMAPHORE_API_KEY = process.env.SEMAPHORE_API_KEY;
const SEMAPHORE_URL = 'https://api.semaphore.co/api/v4/messages';
const SENDER_NAME = 'CTHMC'; // must be approved in Semaphore

async function sendSMS(numbers, message) {
  if (!SEMAPHORE_API_KEY) {
    console.warn('❌ SEMAPHORE_API_KEY not set');
    return;
  }

  // Normalize PH numbers
  const cleanedNumbers = numbers
    .map(n => n.replace(/\D/g, '')) // remove symbols
    .map(n => {
      if (n.startsWith('09') && n.length === 11) return '63' + n.slice(1);
      if (n.startsWith('639') && n.length === 12) return n;
      return null;
    })
    .filter(Boolean);

  if (!cleanedNumbers.length) {
    console.warn('❌ No valid phone numbers after cleaning');
    return;
  }

  const payload = qs.stringify({
    apikey: SEMAPHORE_API_KEY,
    number: cleanedNumbers.join(','),
    message: message.slice(0, 300),
  });

  try {
    const response = await axios.post(SEMAPHORE_URL, payload, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
    });

    console.log('✅ Semaphore SMS sent');
    console.log(response.data);
  } catch (err) {
    console.error('❌ Semaphore SMS failed');

    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    } else {
      console.error(err.message);
    }
  }
}

module.exports = { sendSMS };
