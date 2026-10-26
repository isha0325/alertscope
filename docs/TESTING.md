# Validation and reproducible checks

## Automated checks

Run `npm test`. There are **68 deterministic Node tests** covering:

- All six challenge examples, both searchData shapes, raw query fallback,
  geo.long, state names/codes, missing metadata, IP approximation, US near-me,
  five territories and common ISO-3 aliases.
- Hazard phrase priority, specific warning/watch/advisory products, severe-only
  behaviour, Show all without changing the verdict, source URL restrictions,
  exact instruction preservation, deduplication, update-reference URNs, expiry,
  unknown severity, stale and incomplete data, large collections and long text.
- Official request/header/filter construction, 60-second cache, force refresh,
  5xx/network/timeout retry, no 4xx retry, bad JSON/schema, cancellation, safe
  pagination, page caps, missing pages, and safe zone URLs.
- Local-time conversion, countdowns, null/invalid map shapes, polygon holes,
  multipolygons, dateline wrapping and all trigger regex examples.

Run `npm run build`. The actual official Vite library configuration produces
`dist/frontend/index.modern.js` and injects scoped CSS into the JS bundle.

Run `npm run smoke` when internet access is available. It makes manual live
requests for Houston, Colorado, Phoenix and Guam. It prints actual counts and
fails if a request or pagination fails. Counts are weather-dependent, so they
are deliberately not asserted in unit tests. In a Node 24 environment that
requires HTTP_PROXY/HTTPS_PROXY, enable Node's env-proxy support if necessary;
ordinary personal installations generally do not need this.

## Browser checks performed during creation

The separate local playground was exercised in headless Chromium, including:

- Expand/collapse cards and official/sample bulletin sections; open SVG map.
- Colorado grouping and Show all; Phoenix YES then quiet-day NO.
- Partial results with no definitive NO; API failure with Retry.
- Delhi coverage; near-me India with approximate-IP disclosure.
- Null geometry / end fallback; 83 alerts and long bulletins.
- Array and object payloads; wide light, 280px dark, mobile width.
- At 280px the component had no horizontal overflow. At a 390px mobile viewport,
  its responsive 366px container also had no horizontal overflow.
- No uncaught page errors in that interaction run.

The unmodified official hyperDart sandbox also rendered the production
`withHD`-wrapped entry inside its Dart Frame using an intercepted deterministic
NWS response. The correct Houston point request was observed and a timestamped
successful no-alert view rendered. This is an integration check of the supplied
host wrapper; it is not proof of a registry deployment.

Live NWS requests succeeded separately in the Node smoke check for all four
locations, and an official Texas response was saved with historical provenance.
The headless browser's initial unproxied external live call failed in the build
environment and correctly displayed the error state; browser UI/host checks
therefore used labelled samples or intercepted responses. Check live browser
connectivity again on your own machine and in the published host.

No screenshot is part of the deliverable; the browser checks used screenshots
only for internal layout review. The source contains a manual acceptance matrix
below so you can reproduce the important checks yourself.

## Manual acceptance matrix

| Test | Expected |
| --- | --- |
| Each of the six example queries | Behaviour in README's query table |
| Near-me US vs India | US checks its point; India is not covered |
| PR / GU / VI / AS / MP metadata | Covered; no false outside-US rejection |
| NWS blocked in DevTools | Couldn't check + Retry; never No active alerts |
| Remove block and retry | New request bypasses cache and recovers |
| Quiet day | NWS source and original successful timestamp |
| Missing later response page | Partial; absence of results is not definitive |
| Older-than-five-minute snapshot | Partial until refreshed |
| Long official descriptions | Initially collapsed; bounded inner text scroll |
| Null geometry | Area list remains, lazy zone shapes if available |
| Null ends | expires fallback, otherwise unpublished end label |
| Hide tab for several minutes | No background polling; immediate resume check |
| Change location during fetch | Previous request aborted; no cross-location result |
| Keyboard Tab / Enter / Space | Visible focus and operable controls/details |
| Light/dark and 280px/wide containers | Readable palette, no horizontal overflow |

## Publish validation

`npm run validate` intentionally fails with exactly the missing GitHub/YouTube
requirements until you provide real links in `hyperdart.config.js`. Keep that
behaviour. Never fake a link or bypass `prepublishOnly`.

The original protected files are preserved: `vite.config.js`, `index.html`,
`src/sandbox/main.jsx`, `src/sandbox/index.css`, and `scripts/validate-publish.js`.
Their checksums were compared with the freshly generated template.
