export const API_ORIGIN = 'https://api.weather.gov';
const ACCEPT = { Accept: 'application/geo+json' };

function allowedAlertUrl(value) {
  try {
    const url = new URL(value, API_ORIGIN);
    return url.origin === API_ORIGIN && /^\/alerts(?:\/|$)/.test(url.pathname) ? url.href : null;
  } catch { return null; }
}

export function createNwsClient({ fetchImpl = (...args) => fetch(...args), timeoutMs = 8000, cacheMs = 60000, maxPages = 8, clock = Date.now } = {}) {
  const cache = new Map();

  async function requestJson(url, { signal, force = false } = {}) {
    const cached = cache.get(url);
    if (!force && cached && clock() - cached.fetchedAt < cacheMs) return { ...cached, fromCache: true };
    for (let attempt = 0; attempt < 2; attempt++) {
      if (signal?.aborted) return { ok: false, error: { kind: 'cancelled', message: 'Request cancelled.' } };
      const controller = new AbortController();
      let timedOut = false;
      const cancel = () => controller.abort();
      signal?.addEventListener('abort', cancel, { once: true });
      const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
      try {
        const response = await fetchImpl(url, { headers: ACCEPT, signal: controller.signal });
        if (!response.ok) {
          if (response.status >= 500 && attempt === 0) continue;
          return { ok: false, error: { kind: 'http', status: response.status, message: `NWS returned HTTP ${response.status}.` } };
        }
        let data;
        try { data = await response.json(); }
        catch {
          if (controller.signal.aborted) throw new Error('Response interrupted.');
          return { ok: false, error: { kind: 'bad-json', message: 'NWS returned unreadable JSON.' } };
        }
        if (controller.signal.aborted) throw new Error('Response interrupted.');
        if (!data || typeof data !== 'object') return { ok: false, error: { kind: 'bad-data', message: 'NWS returned an invalid response.' } };
        const result = { ok: true, data, fetchedAt: clock(), fromCache: false };
        cache.set(url, result);
        if (cache.size > 60) cache.delete(cache.keys().next().value);
        return result;
      } catch {
        if (signal?.aborted) return { ok: false, error: { kind: 'cancelled', message: 'Request cancelled.' } };
        const kind = timedOut ? 'timeout' : typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'network';
        if (attempt === 1) return { ok: false, error: { kind, message: kind === 'timeout' ? 'NWS did not respond in time.' : 'Could not connect to NWS.' } };
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', cancel);
      }
    }
    return { ok: false, error: { kind: 'network', message: 'Could not connect to NWS.' } };
  }

  async function getAlerts(params, options = {}) {
    if (!params || (!params.point && !params.area)) return { ok: false, alerts: null, error: { kind: 'location', message: 'Choose a location first.' } };
    const search = new URLSearchParams({ status: 'actual', message_type: 'alert,update', ...params });
    let url = `${API_ORIGIN}/alerts/active?${search}`;
    const alerts = [], visited = new Set();
    let fetchedAt = Infinity, fromCache = true;
    for (let page = 0; page < maxPages; page++) {
      visited.add(url);
      const result = await requestJson(url, options);
      if (!result.ok || result.data?.type !== 'FeatureCollection' || !Array.isArray(result.data?.features)) {
        const error = result.error || { kind: 'bad-data', message: 'NWS response has no valid alert collection.' };
        if (page === 0 || error.kind === 'cancelled') return { ok: false, alerts: null, error };
        return { ok: true, alerts, fetchedAt, fromCache, complete: false, warnings: ['Only part of the NWS response was received.'], error };
      }
      alerts.push(...result.data.features);
      fetchedAt = Math.min(fetchedAt, result.fetchedAt);
      fromCache = fromCache && result.fromCache;
      const next = result.data.pagination?.next;
      if (!next) return { ok: true, alerts, fetchedAt, fromCache, complete: true, warnings: [] };
      const nextUrl = allowedAlertUrl(next);
      if (!nextUrl || visited.has(nextUrl) || page === maxPages - 1) {
        return { ok: true, alerts, fetchedAt, fromCache, complete: false, warnings: ['NWS results are incomplete; open the official source for the full list.'] };
      }
      url = nextUrl;
    }
  }

  async function getZoneGeometry(url, options) {
    if (!/^https:\/\/api\.weather\.gov\/zones\/(forecast|county|fire)\/[A-Z0-9]+$/.test(String(url))) {
      return { ok: false, error: { kind: 'zone', message: 'Unrecognized NWS zone URL.' } };
    }
    const result = await requestJson(url, options);
    return result.ok ? { ...result, geometry: result.data.geometry || null } : result;
  }

  return { getAlerts, getZoneGeometry, clearCache: () => cache.clear() };
}

const client = createNwsClient();
export const getAlerts = client.getAlerts;
export const getZoneGeometry = client.getZoneGeometry;
