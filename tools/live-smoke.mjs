import { createNwsClient } from '../src/frontend/api.js';

// Manual verification only. Unit tests never depend on live weather or a network.
const client = createNwsClient({ fetchImpl: (url, options) => fetch(url, {
  ...options, headers: { ...options.headers, 'User-Agent': 'AlertScope-hackathon-development' },
}) });
let failed = false;
for (const [place, params] of [
  ['Houston', { point: '29.76328,-95.36327' }],
  ['Colorado', { area: 'CO' }],
  ['Phoenix', { point: '33.44840,-112.07400' }],
  ['Guam', { area: 'GU' }],
]) {
  const result = await client.getAlerts(params, { force: true });
  console.log(JSON.stringify({ place, ok: result.ok, received: result.alerts?.length ?? null, complete: result.complete ?? false, error: result.error || null }));
  failed ||= !result.ok || result.complete === false;
}
if (failed) process.exitCode = 1;
