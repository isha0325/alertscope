import test from 'node:test';
import assert from 'node:assert/strict';
import { createNwsClient } from '../api.js';

const body = { type: 'FeatureCollection', features: [] };
const response = (data = body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => data });
const params = { point: '29.76328,-95.36327' };

test('request uses official origin, correct filters and GeoJSON accept header', async () => {
  let seen;
  const client = createNwsClient({ fetchImpl: async (...args) => { seen = args; return response(); } });
  assert.equal((await client.getAlerts(params)).ok, true);
  const url = new URL(seen[0]); assert.equal(url.origin, 'https://api.weather.gov');
  assert.equal(url.searchParams.get('status'), 'actual');
  assert.equal(url.searchParams.get('message_type'), 'alert,update');
  assert.equal(url.searchParams.get('point'), params.point);
  assert.equal(seen[1].headers.Accept, 'application/geo+json');
});
test('cache preserves fetch time and force refresh bypasses it', async () => {
  let count = 0, now = 1000;
  const client = createNwsClient({ clock: () => now, fetchImpl: async () => { count++; return response(); } });
  const first = await client.getAlerts(params); now = 2000;
  const cached = await client.getAlerts(params);
  assert.equal(count, 1); assert.equal(cached.fetchedAt, first.fetchedAt); assert.equal(cached.fromCache, true);
  await client.getAlerts(params, { force: true }); assert.equal(count, 2);
  now = 63000; await client.getAlerts(params); assert.equal(count, 3);
});
for (const kind of ['server','network']) test(`one retry for ${kind} failure, never an empty success`, async () => {
  let count = 0;
  const client = createNwsClient({ fetchImpl: async () => { count++; if (kind === 'network') throw new Error('Network failure'); return response({},503); } });
  const result = await client.getAlerts(params);
  assert.equal(count, 2); assert.equal(result.ok, false); assert.equal(result.alerts, null);
});
test('second attempt can recover from a 5xx response', async () => {
  let count = 0;
  const client = createNwsClient({ fetchImpl: async () => ++count === 1 ? response({},502) : response() });
  assert.equal((await client.getAlerts(params)).ok, true); assert.equal(count, 2);
});
test('4xx is not retried', async () => {
  let count = 0;
  const client = createNwsClient({ fetchImpl: async () => { count++; return response({},429); } });
  const result = await client.getAlerts(params); assert.equal(count,1); assert.equal(result.error.status,429);
});
test('malformed JSON is a distinct error and is not retried', async () => {
  let count = 0;
  const client = createNwsClient({ fetchImpl: async () => { count++; return { ok: true, json: async () => { throw new SyntaxError('bad JSON'); } }; } });
  const result = await client.getAlerts(params); assert.equal(count,1); assert.equal(result.error.kind,'bad-json');
});
test('HTTP 200 with missing features is an error rather than no alerts', async () => {
  const client = createNwsClient({ fetchImpl: async () => response({ type: 'FeatureCollection' }) });
  const result = await client.getAlerts(params); assert.equal(result.ok,false); assert.equal(result.error.kind,'bad-data');
});
test('timeout aborts the body/request and retries only once', async () => {
  let count = 0;
  const client = createNwsClient({ timeoutMs: 5, fetchImpl: (_url,{signal}) => new Promise((_resolve,reject) => { count++; signal.addEventListener('abort', () => reject(new Error('aborted'))); }) });
  const result = await client.getAlerts(params); assert.equal(count,2); assert.equal(result.error.kind,'timeout');
});
test('caller cancellation never retries or caches a result', async () => {
  let count = 0;
  const controller = new AbortController();
  const client = createNwsClient({ fetchImpl: (_url,{signal}) => new Promise((_resolve,reject) => { count++; signal.addEventListener('abort', () => reject(new Error('cancelled'))); controller.abort(); }) });
  const result = await client.getAlerts(params,{signal:controller.signal});
  assert.equal(result.error.kind,'cancelled'); assert.equal(count,1);
});
test('follows official pagination and marks a failed later page as partial', async () => {
  let count = 0;
  const client = createNwsClient({ fetchImpl: async () => ++count === 1
    ? response({ ...body, features: [{ id:'first' }], pagination:{next:'https://api.weather.gov/alerts?cursor=next'} }) : response({},400) });
  const result = await client.getAlerts(params);
  assert.equal(count,2); assert.equal(result.ok,true); assert.equal(result.complete,false); assert.equal(result.alerts.length,1);
});
test('multiple successful pages are combined', async () => {
  let count = 0;
  const client = createNwsClient({ fetchImpl: async () => ++count === 1 ? response({...body,features:[{id:'a'}],pagination:{next:'/alerts?cursor=next'}}) : response({...body,features:[{id:'b'}]}) });
  const result = await client.getAlerts(params); assert.equal(result.complete,true); assert.equal(result.alerts.length,2);
});
test('foreign and looping pagination links are not followed', async () => {
  for (const next of ['https://evil.example/data','https://api.weather.gov/points/1,2']) {
    let count = 0;
    const client = createNwsClient({ fetchImpl: async () => { count++; return response({...body,pagination:{next}}); } });
    assert.equal((await client.getAlerts(params)).complete,false); assert.equal(count,1);
  }
});
test('page cap prevents an unbounded state-query fetch', async () => {
  let count = 0;
  const client = createNwsClient({ maxPages:2, fetchImpl: async () => response({...body,pagination:{next:`https://api.weather.gov/alerts?cursor=${++count}`}}) });
  const result = await client.getAlerts(params); assert.equal(count,2); assert.equal(result.complete,false);
});
test('failed force refresh never falls back to cached no-alert data', async () => {
  let fail = false;
  const client = createNwsClient({ fetchImpl: async () => { if(fail) throw new Error('offline'); return response(); } });
  await client.getAlerts(params); fail=true;
  const result = await client.getAlerts(params,{force:true}); assert.equal(result.ok,false); assert.equal(result.alerts,null);
});
test('zone lookup accepts only official zone paths', async () => {
  let count=0;
  const client = createNwsClient({fetchImpl:async()=>{count++;return response({geometry:null});}});
  assert.equal((await client.getZoneGeometry('https://evil.example/zone')).ok,false);
  assert.equal((await client.getZoneGeometry('https://api.weather.gov/zones/forecast/TXZ213')).ok,true);
  assert.equal(count,1);
});
