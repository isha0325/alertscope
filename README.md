# AlertScope — Live Disruption & Safety Alerts

A standalone **hyperDart React + Vite component** that answers four questions:
**Is anything happening? How serious? Where? Until when?**

The verdict comes first. A 48-hour timeline, local countdowns, official instruction
text, event groups and an optional affected-area map provide the detail. There is
no backend, API key, LLM call, or paid service.

## Run it in five minutes

Install **Node.js 24** (or Node.js 22.12+), then open a terminal in this folder:

```bash
npm ci
npm start
```

Open **http://localhost:5173/playground.html** for the custom demo, or
**http://localhost:5173/** for the unchanged official hyperDart sandbox.
`npm run playground` starts Vite and opens the custom demo automatically.

The demo starts in **Live NWS request** mode. Select **Sample scenarios · not live**
to demonstrate consistent alerts, a quiet day, a connection failure, incomplete
data, missing geometry/end times, or 83 alerts with long bulletins. Samples are
labelled in the preview, verdict and footer. Production never falls back to them.

```bash
npm test          # deterministic tests, no external services
npm run build    # actual hyperDart ES module, including injected CSS
npm run smoke    # optional real NWS calls; network failures fail this check
```

The exact dependencies are committed in `package-lock.json`. Use `npm ci` for the
same versions. There is no Python requirements file. See
[Windows setup](docs/SETUP_WINDOWS.md) for a beginner walkthrough.

## Marking scheme

| Criterion | Weight | Implementation / evidence |
| --- | ---: | --- |
| Design and creativity | 25% | Verdict first; interactive 48-hour strip; SVG footprint map; container-based 280px layout; light/dark/host themes |
| Usefulness and clarity | 20% | Count, highest severity, exact area text, local end times, countdowns; direct yes/no with other alerts disclosed |
| Accuracy and responsibility | 15% | Official text unchanged; sample isolation; errors, partial data and unsupported coverage never become no-alert results |
| Robustness | 15% | 8-second timeout, one retry, 60-second cache, pagination, deduplication, expiry, ISO territory codes, request cancellation, null-safe fields |
| Understanding / live review | 15% | Small intent/API/analyzer modules; tests; live-change exercise and explanation guide |
| Code quality and README | 10% | Named components, plain JS, limited dependencies, reproducible setup, provenance, test and submission guides |

This is a mapping to the rubric, **not a guaranteed mark**. The live review and
the final public links/registry submission are still the participant's work.
See [detailed rubric map](docs/RUBRIC_MAP.md).

## File structure

```text
alertscope/
├── AGENTS.md                       Official template conventions
├── package.json / package-lock.json Dependencies and commands
├── hyperdart.config.js             Triggers, formats, submission links
├── vite.config.js                  Official build config, unchanged
├── index.html / src/sandbox/        Official host sandbox, unchanged
├── playground.html                 Separate local demonstration shell
├── searchData.json                 Realistic Houston host-prop example
├── resource.json / RESOURCE.md      Structured query metadata
├── scripts/validate-publish.js      Official validator, unchanged
├── fixtures/                       Synthetic tests + recorded NWS snapshot
├── tools/live-smoke.mjs             Optional real-API verification
├── docs/                           Setup, rubric, demo, testing, live review
└── src/
    ├── frontend/
    │   ├── index.jsx               Required withHD wrapper
    │   ├── NewComponent.jsx        Production entry, no sample provider
    │   ├── AlertDashboard.jsx      Orchestration and host lifecycle callback
    │   ├── intent.js               Query parsing, coverage, coordinates/states
    │   ├── api.js                  NWS requests, cache, retry, pagination
    │   ├── analyze.js              Normalize, dedupe, filter, rank, verdict
    │   ├── time.js / geometry.js    Local times and schematic projection
    │   ├── hooks.js / styles.css    Refresh, cancellation, container, themes
    │   ├── components/
    │   │   ├── VerdictBanner.jsx
    │   │   ├── TimelineStrip.jsx
    │   │   ├── AlertCard.jsx
    │   │   ├── StateSummary.jsx
    │   │   ├── MiniMap.jsx
    │   │   ├── Footer.jsx
    │   │   ├── SeverityBadge.jsx
    │   │   └── Icon.jsx
    │   └── __tests__/               Intent, API, analyzer, time/map/config tests
    └── playground/                 Local controls and labelled sample provider
```

The roadmap's core files live in `src/frontend/` because that is the mandatory
location in the actual hyperDart template. Its sandbox, Vite config, HTML shell,
`withHD` wrapper and publish validator have been preserved.

## Data flow and supported queries

`searchData` (object or array) / `searchQuery` → `resolveIntent` → coverage check →
NWS request → `analyze` → components. `queryProps.query/entities` are supported
when the primary search payload is unavailable. No example location is used as
an implicit production default.

| Search | Behaviour |
| --- | --- |
| weather alerts in Houston | Point query using host `geo.lat` / `geo.long` |
| flood warnings in Colorado | State `area=CO`; flood warnings only; groups/counts |
| severe weather alerts in Alaska | Severe + Extreme filter; Show all reveals other products |
| is there a heat advisory in Phoenix | YES/NO for heat advisories; other alerts disclosed |
| weather alerts near me | Host userLocation; IP shown as approximate; outside coverage handled |
| weather alerts in Delhi | Not covered; official IMD link, without inventing Indian alert data |
| Puerto Rico / Guam / VI / AS / MP | Covered, including territory-as-country host entities |

Hazards map to event substrings so changing NWS product names still match.
Explicit *warning / watch / advisory* wording narrows the product too. A negative
answer only describes the requested category and the returned snapshot.

The local playground supplies **example entities**. Its query text box changes
intent wording for the selected example; it is not a general geocoder. Production
place resolution is provided by hyperDart, as required by the challenge.

## Safety and engineering decisions

- NWS endpoint: `https://api.weather.gov/alerts/active`; always `status=actual`,
  `message_type=alert,update` and `Accept: application/geo+json`.
- A successful, complete, fresh collection can yield `none`. A failure has
  `alerts: null`; incomplete pagination, bad records or old snapshots yield
  `partial`. Neither state can display a reassuring NO.
- Normalization uses `onset || effective` and `ends || expires`, with valid-date
  checks. Unknown times remain unknown. Alerts expire from the UI as time passes.
- Sort: Extreme → Severe → Moderate → Minor → Unknown; then urgency and nearest
  end. The newest duplicate is retained; referenced older updates are suppressed.
- Requests have an 8-second deadline including the body; one retry for network,
  timeout and 5xx failures; no automatic retry for 4xx or bad JSON. Manual refresh
  bypasses the bounded one-minute cache. The original fetch timestamp is retained.
- Auto-refresh every two minutes while visible; resume refresh when visible again;
  abort obsolete requests when the location changes or the component unmounts.
- Source text is rendered as escaped React text, not HTML. Instructions are never
  generated or paraphrased. Source links and zone/pagination fetches are restricted
  to official HTTPS NWS origins/paths.
- The SVG is a **schematic** of available polygons, not a basemap. Null geometry
  falls back to the affected-area list. Opening the map fetches up to eight zone
  geometries, four at a time; omitted/failed shapes are disclosed.
- Coverage requires known US/territory metadata. Missing country/coordinates asks
  for a location. US national queries ask for a city/state. Browser-timezone
  fallback and multi-timezone state displays are explicitly labelled.
- Keyboard-operable native details, labelled controls, visible focus, reduced
  motion support, severity words + icons + colour, and polite verdict updates.

## Submission — do these steps yourself

1. Create a public GitHub repo and push this source, including `.gitignore`.
2. Record and upload a 2–3 minute YouTube demo; use [the script](docs/DEMO_SCRIPT.md).
3. In `hyperdart.config.js`, fill `submission.github` with the **repo root** and
   `submission.demovideo` with the real YouTube link. Both `demovideo` (actual
   template) and `demoVideo` (some docs) derive from that one value.
4. Create your package in the hyperDart Partner Portal. Set `package.json.name`
   to its exact scoped name; the supplied `@shivek-gandhi/alertscope` is a suggested
   name, **not an already registered package**. Re-run `npm install --package-lock-only`
   after a rename. Set the token using the portal's command; never commit it.
5. Run `npm test`, `npm run build`, and `npm run validate`. Validation intentionally
   blocks while your public submission links are blank.
6. Run **plain `npm publish`**. `publishConfig.registry` selects the hyperDart dev
   registry and the original `prepublishOnly` validator runs. Never bypass scripts,
   remove validation, or publish to the public npm registry by mistake.
7. On subsequent publishes, increment the version with `npm version patch` and
   rebuild. Check your published component in the real host before submission.

No public repo, YouTube video, portal package, registry token, or registry publish
is created by this source-code delivery.

## Sources and libraries

- [NWS API documentation](https://www.weather.gov/documentation/services-web-api)
- [NWS OpenAPI](https://api.weather.gov/openapi.json)
- [hyperDart docs](https://hyperdart.com/docs/docs/intro/)
- [hyperDart React/Vite template](https://hyperdart.com/docs/docs/template/react-vite/)
- [Host theme props](https://hyperdart.com/docs/docs/props-recieved/UIOptions/)
- [India Meteorological Department](https://mausam.imd.gov.in/) — external link only

React renders the UI; Vite builds it; the official `@hyperdart/frontend` wrapper
connects it to the host. The scaffold retains its MUI, Emotion, Router, sandbox and
build dependencies. The new UI uses scoped CSS, native `Intl`, `fetch`, SVG and
Node's test runner; no additional runtime library was introduced.

## How it was built / AI disclosure

The project was created with the official `create-hyper-dart@1.0.12` React/Vite
scaffold. OpenAI ChatGPT/Codex assisted with the implementation, fixtures, tests,
design and documentation. The sample warnings were written as explicitly
synthetic test data; official live instructions are fetched and displayed without
an AI model. The original template's protected integration files were retained.

The participant should review the code, adapt it where appropriate, and describe
their own changes honestly during the live review. This README does not claim
that generated code was written unaided. Use [LIVE_REVIEW.md](docs/LIVE_REVIEW.md)
to understand and practise the important parts.
