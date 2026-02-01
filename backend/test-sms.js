require('dotenv').config(); // ⭐ IMPORTANTE

const axios = require('axios');

async function testSMS() {
  try {
    const res = await axios.post(
      'https://api.semaphore.co/api/v4/messages',
      {
        apikey: process.env.SEMAPHORE_API_KEY,
        number: '09622909280', // palitan ng totoong number
        message: 'this is Test message from thesis system'
      }
    );

    console.log('Semaphore response:', res.data);
  } catch (err) {
    console.error('SMS error:', err.response?.data || err.message);
  }
}

testSMS();
