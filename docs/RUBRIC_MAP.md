# Evidence against the hackathon rubric

The two supplied PDFs are the implementation brief. The official generated
template determines the actual folder paths and integration conventions.

| Weight | What to show | Files / evidence |
| ---: | --- | --- |
| 25% design | Wide and 280px layouts in both themes; click timeline; expand guidance; open schematic map | `AlertDashboard.jsx`, `styles.css`, `TimelineStrip`, `MiniMap`, `useCompact` |
| 20% clarity | Count, worst severity, affected areas, local until time; Phoenix YES/NO; disclose unrelated alerts | `VerdictBanner`, `AlertCard`, `time.js`, filter row |
| 15% accuracy | Official instruction text exactly preserved; clear source/time; Delhi unsupported; failure and partial never become no alerts | `analyze.js`, `officialUrl`, `VerdictBanner`, `Footer`, API tests |
| 15% robustness | Six required queries; array/object props; PR/GU; null end/geometry; timeout, HTTP failures, cache, pagination, large states | `intent.test.js`, `api.test.js`, `analyze.test.js`, labelled sample cases |
| 15% live review | Trace a query through intent/API/analyzer/UI; explain safety states; add a query or hazard live | `LIVE_REVIEW.md` and focused modules |
| 10% code/docs | Reproducible setup, original validator retained, `.gitignore`, provenance, truthful AI disclosure | `README.md`, `package-lock.json`, `fixtures/README.md`, template integration |

## Required query acceptance checks

1. Houston: NWS point query; cards or a successful timestamped no-alert result.
2. Colorado flood warnings: `area=CO`; Warning product only; grouped flood events.
3. Alaska severe weather: Severe/Extreme subset; Show all reveals remaining levels.
4. Phoenix heat advisory: direct YES/NO for Advisory product; other alerts disclosed.
5. Near me: userLocation coordinate shape from the challenge; approximate IP text;
   India is explicitly outside coverage. A US IP sample is also provided.
6. Delhi: no NWS call, Not covered, official IMD pointer.

## Scope of extras

Implemented: local countdowns, interactive timeline, affected-polygon schematic,
lazy zone shapes, unmodified official instruction section, automatic refresh,
historical fixture provenance and a separate local scenario workbench.

Not included: Indian/global alert ingestion, geocoding independent of hyperDart,
AI rewriting, push notifications, or a full tile basemap. The IMD link is clearly
an external source, not a claim of live coverage.

No feature list guarantees a particular score; judges still assess originality,
real-host integration and the participant's explanation.
