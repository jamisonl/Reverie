const { logger } = require("./logger");

const createRateLimiter = (maxRequests, timeWindowMs) => {
  let requests = [];
  
  const cleanup = (now) => {
    const oldLength = requests.length;
    requests = requests.filter(timestamp => now - timestamp < timeWindowMs);
    
    if (oldLength !== requests.length) {
      logger.debug(`[Rate Limiter] Cleaned up ${oldLength - requests.length} expired requests`);
    }
  };

  const checkLimit = (now) => {
    cleanup(now);
    const isAllowed = requests.length < maxRequests;
    const remaining = maxRequests - requests.length;
    
    logger.warn(`[Rate Limiter] Requests in window: ${requests.length + 1}/${maxRequests} (${remaining - 1} remaining).
    Adjust these limits with RATE_LIMIT_MAX_REQUESTS and RATE_LIMIT_WINDOW_MS`);
    
    if (!isAllowed) {
      const oldestRequest = requests[0];
      const resetTime = new Date(oldestRequest + timeWindowMs);
      logger.debug(`[Rate Limiter] Rate limit exceeded. Resets at ${resetTime.toLocaleTimeString()}`);
    }
    
    return isAllowed;
  };

  const tryRequest = () => {
    const now = Date.now();
    if (!checkLimit(now)) {
      throw new Error('Rate limit exceeded');
    }
    
    requests.push(now);
    return true;
  };

  return { tryRequest };
};

module.exports = { createRateLimiter };