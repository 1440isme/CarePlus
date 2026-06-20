const redis = require('../infrastructure/cache/redis.client');
const { AUTH_ERROR_CODES } = require('../modules/auth/auth.types');

function createRateLimiter({ action, limit, windowSeconds }) {
  return async (req, res, next) => {
    const identifier = getRateLimitIdentifier(req);
    const redisKey = `ratelimit:${action}:${identifier}`;

    try {
      const requestCount = await redis.incr(redisKey);

      if (requestCount === 1) {
        await redis.expire(redisKey, windowSeconds);
      }

      const ttlSeconds = await redis.ttl(redisKey);
      const remainingRequests = Math.max(limit - requestCount, 0);

      res.setHeader('X-RateLimit-Limit', String(limit));
      res.setHeader('X-RateLimit-Remaining', String(remainingRequests));

      if (ttlSeconds > 0) {
        res.setHeader('Retry-After', String(ttlSeconds));
      }

      if (requestCount > limit) {
        return res.status(429).json({
          success: false,
          error: {
            code: AUTH_ERROR_CODES.TOO_MANY_REQUESTS,
            message: 'Bạn thao tác quá nhanh, vui lòng thử lại sau',
            details: [],
          },
        });
      }

      return next();
    } catch (error) {
      return res.status(503).json({
        success: false,
        error: {
          code: AUTH_ERROR_CODES.RATE_LIMITER_UNAVAILABLE,
          message: 'Dịch vụ giới hạn tần suất tạm thời không khả dụng',
          details: [],
        },
      });
    }
  };
}

function getRateLimitIdentifier(req) {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (email) {
    return email;
  }

  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim().toLowerCase();
  }

  return (req.ip || 'unknown').toLowerCase();
}

module.exports = {
  createRateLimiter,
};
