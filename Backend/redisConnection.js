const { createClient } = require('redis');
const client = createClient();

client.on('error', err => console.log('Redis Error:', err));

(async () => {
  try {
    await client.connect();
    console.log('Redis connected');
  } catch (err) {
    console.log('Redis Connection Refused. Running without Redis cache.', err.message);
  }
})();

module.exports = client;
