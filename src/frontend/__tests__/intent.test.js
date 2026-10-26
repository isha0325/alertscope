import test from 'node:test';
import assert from 'node:assert/strict';
import { parseQuery, resolveIntent, normalizeSearchData } from '../intent.js';
import { searchContext } from '../../../fixtures/search-contexts.js';

for (const [id, mode, hazard] of [
  ['houston','point',null], ['colorado','state','flood'], ['alaska','state',null],
  ['phoenix','point','heat'], ['nearIndia','notCovered',null], ['delhi','notCovered',null],
  ['puertoRico','point',null], ['guam','state',null], ['nearUS','nearMe',null],
]) test(`resolve example: ${id}`, () => {
  const intent = resolveIntent([searchContext(id)]);
  assert.equal(intent.mode, mode); assert.equal(intent.hazard, hazard);
});

test('identical intent for array and single-object host payloads', () => {
  const object = searchContext('houston');
  assert.deepEqual(resolveIntent(object), resolveIntent([object]));
  assert.deepEqual(normalizeSearchData(null), {});
  assert.equal(resolveIntent(null).mode, 'needsLocation');
});
test('specific winter storm and fire weather mappings win over broad terms', () => {
  assert.equal(parseQuery('winter storm warnings in Colorado').hazard, 'winter storm');
  assert.deepEqual(parseQuery('fire weather alerts in Texas').eventTerms, ['Red Flag','Fire Weather','Fire Warning']);
  assert.equal(parseQuery('wildfire alerts in Texas').hazard, 'fire weather');
});
test('explicit products, case, whitespace and yes/no', () => {
  const query = parseQuery('  IS   THERE a heat advisory in Phoenix');
  assert.equal(query.yesNo, true); assert.equal(query.product, 'Advisory');
  assert.equal(parseQuery('flood watches in Colorado').product, 'Watch');
  assert.equal(parseQuery('flood warnings in Colorado').product, 'Warning');
  assert.equal(parseQuery('severe weather alerts in Alaska').severeOnly, true);
  assert.equal(parseQuery('severe thunderstorm warnings in Alaska').severeOnly, false);
});
test('near me overrides a conflicting entity and marks IP as approximate', () => {
  const data = searchContext('houston'); data.query = 'tornado warning near me';
  const intent = resolveIntent(data);
  assert.equal(intent.mode, 'notCovered'); assert.equal(intent.country, 'IN');
  assert.equal(intent.approximate, true);
});
test('reads geo.long and uses the state area code', () => {
  assert.equal(resolveIntent(searchContext('houston')).params.point, '29.76328,-95.36327');
  assert.deepEqual(resolveIntent(searchContext('colorado')).params, { area: 'CO' });
});
test('state-name fallback works without stateAbb', () => {
  const data = searchContext('alaska'); delete data.entities[0].entityInfo.geo.stateAbb;
  assert.deepEqual(resolveIntent(data).params, { area: 'AK' });
});
test('bad coordinates never silently use zero or a default city', () => {
  for (const value of [null, '', undefined, 100, 'oops', true]) {
    const data = searchContext('houston'); data.entities[0].entityInfo.geo.lat = value;
    assert.equal(resolveIntent(data).mode, 'needsLocation');
  }
});
test('unknown country is not assumed covered', () => {
  const data = searchContext('houston'); delete data.entities[0].entityInfo.geo.countryCode; delete data.entities[0].entityInfo.geo.country;
  assert.equal(resolveIntent(data).mode, 'needsLocation');
});
test('invalid timezone has an explicit browser-timezone fallback', () => {
  const data = searchContext('houston'); data.entities[0].entityInfo.geo.tz = 'Not/AZone';
  assert.equal(resolveIntent(data).timezoneEstimated, true);
});
test('finds the location entity after unrelated entities', () => {
  const data = searchContext('houston'); data.entities.unshift({ collectionType: 'OTHER', word: 'weather' });
  assert.equal(resolveIntent(data).mode, 'point');
});
for (const [country, state] of [['PR','PR'],['GU','GU'],['VI','VI'],['AS','AS'],['MP','MP'],['PRI','PR'],['GUM','GU']]) {
  test(`territory ${country} is covered even as a country entity`, () => {
    const data = searchContext('guam');
    data.entities[0].collectionName = 'COUNTRIES'; data.entities[0].word = state;
    data.entities[0].entityInfo.geo.countryCode = country;
    assert.equal(resolveIntent(data).mode, 'state');
    assert.equal(resolveIntent(data).params.area, state);
  });
}
test('US national query asks for a city/state rather than claiming no alerts', () => {
  const data = { query: 'weather alerts in USA', entities: [{ word: 'USA', collectionName: 'COUNTRIES', collectionType: 'HD_LOCATION', entityInfo: { geo: { countryCode: 'US' } } }] };
  assert.equal(resolveIntent(data).reason, 'scope');
  assert.equal(resolveIntent(data).params, null);
});
test('can read documented structured query fallback without inventing place data', () => {
  const data = searchContext('houston');
  const result = resolveIntent(null, null, { query: data.query, entities: data.entities });
  assert.equal(result.mode, 'point');
});
