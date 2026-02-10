/**
 * Always returns a string safe to render as React child.
 * Prevents "Objects are not valid as a React child" errors when API returns objects.
 * @param {*} val - Any value (string, number, object, null, undefined)
 * @param {string} fallback - String to return when value is empty or invalid (default '—')
 * @returns {string}
 */
export function safeDisplay(val, fallback = '—') {
  try {
    if (val == null) return fallback;
    if (typeof val === 'string' || typeof val === 'number') return String(val);
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (typeof val === 'object') {
      if (Array.isArray(val)) return val.map((v) => safeDisplay(v, '')).filter(Boolean).join(', ') || fallback;
      return val?.name ?? val?.model ?? val?.title ?? (val?.aircraft != null ? String(val.aircraft) : null) ?? val?.address ?? fallback;
    }
  } catch (_) {
    return fallback;
  }
  return fallback;
}
