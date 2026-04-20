const cacheStore = new Map();

function now() {
  return Date.now();
}

function buildCacheKey(request) {
  return `${request.method}:${request.originalUrl}`;
}

export function createResponseCache(ttlMs) {
  return function responseCacheMiddleware(request, response, next) {
    const key = buildCacheKey(request);
    const cached = cacheStore.get(key);

    if (cached && cached.expiresAt > now()) {
      response.set("X-Cache", "HIT");
      return response.json(cached.payload);
    }

    const originalJson = response.json.bind(response);
    response.json = (payload) => {
      if (response.statusCode >= 200 && response.statusCode < 300) {
        cacheStore.set(key, {
          payload,
          expiresAt: now() + ttlMs,
        });
        response.set("X-Cache", "MISS");
      }

      return originalJson(payload);
    };

    return next();
  };
}

export function clearResponseCache() {
  cacheStore.clear();
}
