const Redis = require('ioredis');

// Load env vars if not loaded
if (!process.env.REDIS_URL) {
  require('dotenv').config();
}

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    console.warn(`Redis connection retry attempt #${times}`);
    if (times > 3) {
      // End retrying after 3 attempts and return null to handle gracefully
      console.error('Redis connection failed permanently for this retry cycle.');
      return null;
    }
    return Math.min(times * 1000, 3000); // Wait 1s, 2s, 3s
  }
});

redis.on('connect', () => {
  console.log('✅ Connected to Redis cache successfully');
});

redis.on('error', (error) => {
  console.error('❌ Redis cache connection error:', error.message);
});

module.exports = redis;
