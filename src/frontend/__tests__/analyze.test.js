import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyze, normalizeAlert, officialUrl } from '../analyze.js';
import { resolveIntent } from '../intent.js';
import { searchContext } from '../../../fixtures/search-contexts.js';

const load = name => JSON.parse(readFileSync(new URL(`../../../fixtures/${name}.json`, import.meta.url)));
const houston = load('houston'), colorado = load('colorado'), phoenix = load('phoenix');
const now = Date.parse(houston._fixture.referenceTime);
const result = features => ({ ok: true, alerts: features, fetchedAt: now, complete: true });
const intent = id => resolveIntent(searchContext(id));
const run = (features, queryIntent = intent('houston'), options = {}) => analyze(result(features), queryIntent, { now, ...options });

test('severity ranks first, then urgency, then nearest end', () => {
  const features = structuredClone(houston.features);
  const a = structuredClone(features[0]); a.id = 'second'; a.properties.urgency = 'Expected';
  const b = structuredClone(features[0]); b.id = 'third'; b.properties.ends = new Date(now + 3600000).toISOString();
  assert.deepEqual(run([a,...features,b]).alerts.slice(0,3).map(item => item.id), ['third', features[0].id, 'second']);
});
test('deduplicates and removes expired, test, and cancellation messages', () => {
  const a = structuredClone(houston.features[0]); a.id = 'expired'; a.properties.ends = new Date(now-1).toISOString();
  const b = structuredClone(houston.features[0]); b.id = 'test'; b.properties.status = 'Test';
  const c = structuredClone(houston.features[0]); c.id = 'cancel'; c.properties.messageType = 'Cancel';
  assert.equal(run([...houston.features,houston.features[0],a,b,c]).count, 3);
});
test('an update reference suppresses its older bulletin', () => {
  const a = houston.features[0], b = structuredClone(a); b.id = 'new'; b.properties.id = 'new'; b.properties.messageType = 'Update'; b.properties.references = [{ identifier: a.id }];
  assert.deepEqual(run([a,b]).alerts.map(item => item.id), ['new']);
});
test('update references also match NWS URNs when the feature id is a URL', () => {
  const older = structuredClone(houston.features[0]);
  older.id = 'https://api.weather.gov/alerts/urn:example:older';
  older.properties.id = 'urn:example:older';
  const newer = structuredClone(houston.features[0]); newer.id = 'new'; newer.properties.id = 'new';
  newer.properties.references = [{ identifier: 'urn:example:older' }];
  assert.deepEqual(run([older, newer]).alerts.map(item => item.id), ['new']);
});
test('state flood warnings excludes watches and unrelated warnings', () => {
  const view = run(colorado.features, intent('colorado'));
  assert.equal(view.count, 2); assert.equal(view.otherCount, 2);
  assert.equal(view.groups.length, 1); assert.equal(view.groups[0].event, 'Flood Warning');
});
test('heat advisory yes/no cannot be satisfied by a heat warning', () => {
  const warning = structuredClone(phoenix.features[0]); warning.properties.event = 'Extreme Heat Warning';
  const view = run([warning,phoenix.features[1]], intent('phoenix'));
  assert.equal(view.state, 'none'); assert.equal(view.count, 0); assert.equal(view.otherCount, 2);
  assert.equal(run(phoenix.features, intent('phoenix')).count, 1);
});
test('show all changes visible list while preserving the query verdict', () => {
  const view = run(colorado.features, intent('colorado'), { showAll: true });
  assert.equal(view.alerts.length, 4); assert.equal(view.count, 2);
  assert.equal(view.matchingAlerts.length, 2);
  assert.ok(view.matchingAlerts.every(alert => alert.event === 'Flood Warning'));
});
test('severe filter shows Severe and Extreme, show all reveals the others', () => {
  const fixture = load('alaska');
  assert.equal(run(fixture.features, intent('alaska')).count, 2);
  assert.equal(run(fixture.features, intent('alaska'), { showAll: true }).alerts.length, 3);
});
test('null ends falls back to expires; missing times remain unknown', () => {
  const fixture = load('null-geometry');
  const alerts = run(fixture.features).alerts;
  assert.equal(alerts[0].end, now+6*3600000); assert.equal(alerts[0].geometry, null);
  assert.equal(alerts[1].end, null);
});
test('only a successful complete response can give a no-alert result', () => {
  assert.equal(run([]).state, 'none');
  assert.equal(analyze({ ok: false, alerts: null, error: { kind: 'offline' } }, intent('houston'), { now }).state, 'error');
  assert.equal(analyze({ ok: true, alerts: {} }, intent('houston'), { now }).state, 'error');
  assert.equal(analyze(null, intent('houston'), { now }).state, 'loading');
});
test('incomplete zero alerts never produces a reassuring NO', () => {
  const view = analyze({ ...result([]), complete: false, warnings: ['Page unavailable'] }, intent('houston'), { now });
  assert.equal(view.state, 'partial'); assert.equal(view.complete, false);
});
test('malformed records cannot create a false no-alert verdict', () => {
  assert.equal(run([null,{}, { properties: { event: 'Flood Warning' } }]).state, 'partial');
  assert.equal(normalizeAlert(null), null);
});
test('old snapshot loses its confirmed status', () => {
  const view = analyze({ ...result([]), fetchedAt: now-300001 }, intent('houston'), { now });
  assert.equal(view.state, 'partial');
});
test('unknown severities remain visible as Unknown', () => {
  const a = structuredClone(houston.features[0]); a.properties.severity = 'UnexpectedValue';
  assert.equal(run([a]).worst, 'Unknown');
});
test('no API result can override outside-coverage status', () => {
  assert.equal(analyze(result([]), intent('delhi'), { now }).state, 'notCovered');
});
test('source URLs only allow https weather.gov origins', () => {
  for (const value of ['javascript:alert(1)','https://weather.gov.evil.example/x','http://api.weather.gov/alerts/x']) assert.equal(officialUrl(value), null);
  assert.equal(officialUrl('https://api.weather.gov/alerts/test'), 'https://api.weather.gov/alerts/test');
});
test('normalization retains the exact official instruction string', () => {
  const sample = structuredClone(houston.features[0]); sample.properties.instruction = 'Line 1.\n\n  Line 2, EXACT.';
  assert.equal(normalizeAlert(sample).instruction, sample.properties.instruction);
});
test('large collections and long descriptions keep correct counts', () => {
  const samples = Array.from({ length: 1200 }, (_, i) => ({ ...houston.features[0], id: `many:${i}`, properties: { ...houston.features[0].properties, description: 'x'.repeat(5000) } }));
  assert.equal(run(samples).count, 1200);
});
