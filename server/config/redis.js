const redis = require('redis');
require('dotenv').config();

const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  },
  password: process.env.REDIS_PASSWORD || undefined
});

client.on('error', (err) => {
  console.error('Redis连接错误:', err);
});

client.on('connect', () => {
  console.log('Redis连接成功');
});

// 连接Redis
client.connect().catch(console.error);

module.exports = client;
