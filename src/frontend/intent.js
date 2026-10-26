// Prefer specific phrases before broad ones: "winter storm" before "storm".
export const HAZARDS = [
  { key: 'winter storm', pattern: /\b(winter storm|blizzard|ice storm)\b/, events: ['Winter', 'Blizzard', 'Ice Storm'] },
  { key: 'fire weather', pattern: /\b(fire weather|red flag|wildfires?)\b/, events: ['Red Flag', 'Fire Weather', 'Fire Warning'] },
  { key: 'air quality', pattern: /\bair quality\b/, events: ['Air Quality'] },
  { key: 'tornado', pattern: /\btornado(?:es|s)?\b/, events: ['Tornado'] },
  { key: 'flood', pattern: /\bflood(?:s|ing)?\b/, events: ['Flood'] },
  { key: 'heat', pattern: /\bheat\b/, events: ['Heat'] },
  { key: 'hurricane', pattern: /\b(hurricanes?|tropical storm|storm surge)\b/, events: ['Hurricane', 'Tropical Storm', 'Storm Surge'] },
  { key: 'wind', pattern: /\bwinds?\b/, events: ['Wind'] },
  { key: 'storm', pattern: /\b(thunderstorms?|storms?)\b/, events: ['Storm'] },
];

export const STATES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
  PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
  WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  PR: 'Puerto Rico', GU: 'Guam', VI: 'U.S. Virgin Islands',
  AS: 'American Samoa', MP: 'Northern Mariana Islands',
};

const COVERED = new Set(['US', 'USA', 'PR', 'GU', 'VI', 'AS', 'MP', 'PRI', 'GUM', 'VIR', 'ASM', 'MNP']);
const COUNTRY_NAMES = {
  'united states': 'US', 'united states of america': 'US', usa: 'US',
  'puerto rico': 'PR', guam: 'GU', 'u.s. virgin islands': 'VI',
  'us virgin islands': 'VI', 'american samoa': 'AS',
  'northern mariana islands': 'MP', india: 'IN', canada: 'CA',
};

export function parseQuery(query = '') {
  const q = String(query).toLowerCase().replace(/\s+/g, ' ').trim();
  const hazard = HAZARDS.find(item => item.pattern.test(q)) || null;
  const product = /\badvisor(?:y|ies)\b/.test(q) ? 'Advisory'
    : /\bwarnings?\b/.test(q) ? 'Warning' : /\bwatch(?:es)?\b/.test(q) ? 'Watch' : null;
  return {
    query: String(query), hazard: hazard?.key || null, eventTerms: hazard?.events || [],
    product, yesNo: /^(is|are) there\b/.test(q),
    nearMe: /\b(near|around) me\b/.test(q),
    severeOnly: /\bsevere\b/.test(q) && !hazard,
  };
}

export function normalizeSearchData(searchData) {
  const data = Array.isArray(searchData) ? searchData.find(item => item && typeof item === 'object') : searchData;
  return data && typeof data === 'object' ? data : {};
}

export function validTimeZone(value) {
  try {
    if (typeof value !== 'string' || !value.trim()) return null;
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return value;
  } catch { return null; }
}

function numeric(value) {
  if (value === null || value === undefined || typeof value === 'boolean' || String(value).trim() === '') return NaN;
  return Number(value);
}

function pointParams(latValue, lonValue) {
  const lat = numeric(latValue), lon = numeric(lonValue);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { point: `${lat.toFixed(5)},${lon.toFixed(5)}` };
}

function countryCode(geo = {}) {
  const code = String(geo.countryCode || geo.country_code || COUNTRY_NAMES[String(geo.country || '').toLowerCase()] || '').toUpperCase();
  return ({ USA: 'US', PRI: 'PR', GUM: 'GU', VIR: 'VI', ASM: 'AS', MNP: 'MP' })[code] || code;
}

export function stateCode(value) {
  const text = String(value || '').trim();
  if (STATES[text.toUpperCase()]) return text.toUpperCase();
  return Object.entries(STATES).find(([, name]) => name.toLowerCase() === text.toLowerCase())?.[0] || null;
}

export function resolveIntent(searchData, searchQuery, queryProps = {}) {
  const sd = normalizeSearchData(searchData);
  const parsed = parseQuery(searchQuery || sd.query || queryProps.query || '');
  const browserZone = validTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone) || 'UTC';
  let result = {
    ...parsed, mode: 'needsLocation', reason: 'missing', place: 'this location',
    country: '', timeZone: browserZone, timezoneEstimated: true,
    approximate: false, params: null,
  };
  const candidates = Array.isArray(sd.entities) ? sd.entities : Array.isArray(queryProps.entities) ? queryProps.entities : [];
  const entity = candidates.find(item => item && (item.collectionType === 'HD_LOCATION' || item.entityInfo?.geo));

  if (parsed.nearMe || !entity) {
    const location = sd.userLocation || {};
    const position = location.position || {};
    const geo = { ...location, ...position };
    const country = countryCode(geo);
    const coords = position.coords || {};
    const place = [position.city || location.city, position.state || location.state, position.country || location.country].filter(Boolean).join(', ')
      || (country === 'IN' ? 'your approximate location in India' : country ? `your location (${country})` : 'your location');
    result = { ...result, country, place, approximate: location.source === 'ip', nearMe: true };
    if (country && !COVERED.has(country)) result = { ...result, mode: 'notCovered', reason: 'country' };
    else if (country && pointParams(coords.latitude, coords.longitude)) {
      result = { ...result, mode: 'nearMe', reason: null, params: pointParams(coords.latitude, coords.longitude) };
    }
  } else {
    const geo = entity.entityInfo?.geo || {};
    const country = countryCode(geo);
    const collection = String(entity.collectionName || '').toUpperCase();
    const place = entity.word || geo.city || geo.state || geo.country || 'this location';
    const zone = validTimeZone(geo.tz || geo.timeZone);
    result = { ...result, place, country, timeZone: zone || browserZone, timezoneEstimated: !zone };
    if (country && !COVERED.has(country)) result = { ...result, mode: 'notCovered', reason: 'country' };
    else if (country && ['COUNTRY', 'COUNTRIES', 'TERRITORIES'].includes(collection) && ['PR', 'GU', 'VI', 'AS', 'MP'].includes(stateCode(place) || country)) {
      result = { ...result, mode: 'state', reason: null, params: { area: stateCode(place) || country } };
    } else if (['COUNTRY', 'COUNTRIES'].includes(collection) || /^(united states|usa|united states of america)$/i.test(place)) {
      result = { ...result, mode: 'notCovered', reason: 'scope' };
    } else if (country) {
      const isState = ['STATE', 'STATES', 'US_STATES', 'PROVINCES', 'TERRITORIES'].includes(collection)
        || (place.toLowerCase() === String(geo.state || '').toLowerCase() && !geo.city);
      const code = stateCode(geo.stateAbb) || stateCode(geo.state) || stateCode(place);
      if (isState && code) result = { ...result, mode: 'state', reason: null, params: { area: code } };
      else if (!isState && pointParams(geo.lat, geo.long ?? geo.lon)) {
        result = { ...result, mode: 'point', reason: null, params: pointParams(geo.lat, geo.long ?? geo.lon) };
      }
    }
  }
  result.dataKey = JSON.stringify([result.mode, result.params, result.place, result.country]);
  return result;
}
