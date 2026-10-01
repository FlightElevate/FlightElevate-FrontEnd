// Shared registry for in-memory caches.
// Each cached module registers a clear function; logout calls clearAllCaches()
// so the next person who logs in on the same tab never sees the previous user's data.

const clearers = new Set();

export const registerCacheClear = (fn) => {
  clearers.add(fn);
  return () => clearers.delete(fn);
};

export const clearAllCaches = () => {
  clearers.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('[sessionCache] clear failed', e);
    }
  });
};
