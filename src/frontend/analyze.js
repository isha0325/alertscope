import { dateMs } from './time.js';

export const SEVERITY_ORDER = { Extreme: 0, Severe: 1, Moderate: 2, Minor: 3, Unknown: 4 };
const URGENCY_ORDER = { Immediate: 0, Expected: 1, Future: 2, Past: 3, Unknown: 4 };
const text = (value, fallback = '') => typeof value === 'string' ? value : fallback;

export function officialUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (url.hostname === 'weather.gov' || url.hostname.endsWith('.weather.gov')) ? url.href : null;
  } catch { return null; }
}

export function normalizeAlert(feature) {
  const p = feature?.properties;
  const id = feature?.id || p?.id || p?.['@id'];
  if (!p || typeof id !== 'string' || !text(p.event).trim()) return null;
  const severity = Object.hasOwn(SEVERITY_ORDER, p.severity) ? p.severity : 'Unknown';
  const urgency = Object.hasOwn(URGENCY_ORDER, p.urgency) ? p.urgency : 'Unknown';
  return {
    id, aliases: [id, p.id, p['@id']].filter(value => typeof value === 'string'),
    event: p.event, severity, urgency, certainty: text(p.certainty, 'Unknown'),
    headline: text(p.headline), description: text(p.description), instruction: text(p.instruction),
    area: text(p.areaDesc, 'Affected areas not published'), sender: text(p.senderName, 'National Weather Service'),
    start: dateMs(p.onset) ?? dateMs(p.effective), end: dateMs(p.ends) ?? dateMs(p.expires),
    sent: dateMs(p.sent) ?? 0, geometry: feature.geometry || null,
    zones: Array.isArray(p.affectedZones) ? p.affectedZones.filter(item => typeof item === 'string') : [],
    url: officialUrl(p.web) || officialUrl(p['@id']) || officialUrl(id) || 'https://www.weather.gov/alerts',
    status: text(p.status, 'Actual'), messageType: text(p.messageType, 'Alert'),
    references: Array.isArray(p.references) ? p.references.map(ref => ref?.identifier).filter(Boolean) : [],
  };
}

export function rankAlerts(a, b) {
  return SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
    || URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency]
    || (a.end ?? Infinity) - (b.end ?? Infinity) || a.event.localeCompare(b.event);
}

export function matchesIntent(alert, intent, showAll = false) {
  if (showAll) return true;
  const event = alert.event.toLowerCase();
  return (!intent.eventTerms.length || intent.eventTerms.some(term => event.includes(term.toLowerCase())))
    && (!intent.product || event.includes(intent.product.toLowerCase()))
    && (!intent.severeOnly || ['Extreme', 'Severe'].includes(alert.severity));
}

export function analyze(result, intent, { now = Date.now(), showAll = false } = {}) {
  const base = { count: 0, total: 0, otherCount: 0, alerts: [], matchingAlerts: [], allAlerts: [], groups: [], worst: null, fetchedAt: result?.fetchedAt, warnings: [], complete: false };
  if (intent.mode === 'notCovered' || intent.mode === 'needsLocation') return { ...base, state: intent.mode };
  if (!result) return { ...base, state: 'loading' };
  if (!result.ok) return { ...base, state: 'error', error: result.error };
  if (!Array.isArray(result.alerts)) return { ...base, state: 'error', error: { kind: 'bad-data', message: 'Invalid NWS alert response.' } };

  const byId = new Map();
  let malformed = 0;
  for (const feature of result.alerts) {
    const alert = normalizeAlert(feature);
    if (!alert) { malformed++; continue; }
    if (alert.status.toLowerCase() !== 'actual' || !['alert', 'update'].includes(alert.messageType.toLowerCase())) continue;
    if (alert.end !== null && alert.end <= now) continue;
    if (!byId.has(alert.id) || alert.sent >= byId.get(alert.id).sent) byId.set(alert.id, alert);
  }
  const superseded = new Set([...byId.values()].flatMap(alert => alert.references));
  const allAlerts = [...byId.values()].filter(alert => !alert.aliases.some(id => superseded.has(id))).sort(rankAlerts);
  const matching = allAlerts.filter(alert => matchesIntent(alert, intent));
  const alerts = showAll ? allAlerts : matching;
  const warnings = [...(result.warnings || [])];
  if (malformed) warnings.push(`${malformed} unreadable alert record${malformed === 1 ? ' was' : 's were'} omitted.`);
  if (!Number.isFinite(result.fetchedAt) || now - result.fetchedAt > 300000) warnings.push('The last successful check is over five minutes old or its time is unavailable. Refresh before relying on this snapshot.');
  const complete = result.complete !== false && warnings.length === 0;
  const groups = [...new Set(alerts.map(alert => alert.event))].map(event => ({ event, alerts: alerts.filter(alert => alert.event === event) }));
  return {
    ...base, state: !complete ? 'partial' : matching.length ? 'alerts' : 'none',
    complete, count: matching.length, total: allAlerts.length, otherCount: allAlerts.length - matching.length,
    alerts, matchingAlerts: matching, allAlerts, groups, worst: matching[0]?.severity || null,
    fetchedAt: result.fetchedAt, fromCache: result.fromCache, warnings,
  };
}
