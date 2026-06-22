import rateLimit from 'express-rate-limit';

export function rateLimiter(maxRequests: number = 100, windowMinutes: number = 1) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        message: `Too many requests. Please try again after ${windowMinutes} minute(s).`,
        code: 'RATE_LIMIT_EXCEEDED',
      },
    },
  });
}
