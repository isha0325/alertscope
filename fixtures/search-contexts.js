export const CONTEXTS = {
  houston: { query: 'weather alerts in Houston', word: 'Houston', collection: 'CITIES', geo: { lat: 29.76328, long: -95.36327, city: 'Houston', state: 'Texas', stateAbb: 'TX', country: 'United States', countryCode: 'US', tz: 'America/Chicago' } },
  colorado: { query: 'flood warnings in Colorado', word: 'Colorado', collection: 'STATES', geo: { state: 'Colorado', stateAbb: 'CO', countryCode: 'US', tz: 'America/Denver' } },
  alaska: { query: 'severe weather alerts in Alaska', word: 'Alaska', collection: 'STATES', geo: { state: 'Alaska', stateAbb: 'AK', countryCode: 'US', tz: 'America/Anchorage' } },
  phoenix: { query: 'is there a heat advisory in Phoenix', word: 'Phoenix', collection: 'CITIES', geo: { lat: 33.4484, long: -112.074, city: 'Phoenix', stateAbb: 'AZ', countryCode: 'US', tz: 'America/Phoenix' } },
  nearIndia: { query: 'weather alerts near me' },
  delhi: { query: 'weather alerts in Delhi', word: 'Delhi', collection: 'CITIES', geo: { lat: 28.6139, long: 77.209, city: 'Delhi', countryCode: 'IN', tz: 'Asia/Kolkata' } },
  puertoRico: { query: 'weather alerts in San Juan', word: 'San Juan', collection: 'CITIES', geo: { lat: 18.4655, long: -66.1057, city: 'San Juan', countryCode: 'PR', tz: 'America/Puerto_Rico' } },
  guam: { query: 'weather alerts in Guam', word: 'Guam', collection: 'TERRITORIES', geo: { state: 'Guam', stateAbb: 'GU', countryCode: 'GU', tz: 'Pacific/Guam' } },
  nearUS: { query: 'weather alerts near me', nearUS: true },
};

export function searchContext(id, query) {
  const item = CONTEXTS[id];
  if (!item) return { query: query || '', entities: [] };
  return {
    query: query || item.query,
    entities: item.geo ? [{ word: item.word, collectionName: item.collection, collectionType: 'HD_LOCATION', entityInfo: { geo: { ...item.geo } } }] : [],
    userLocation: { source: 'ip', position: item.nearUS
      ? { coords: { latitude: 29.76328, longitude: -95.36327 }, countryCode: 'US', city: 'Houston', state: 'Texas', country: 'United States' }
      : { coords: { latitude: 26.4631, longitude: 80.3479 }, countryCode: 'IN', country: 'India' } },
  };
}
