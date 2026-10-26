# 2–3 minute demo script

Before recording: run the tests/build, open `/playground.html`, and prepare the
official host sandbox too. If the weather is quiet, use Sample scenarios and say
explicitly that they are synthetic examples. Never describe them as live alerts.

| Time | Action | What to explain |
| --- | --- | --- |
| 0:00–0:15 | Show mainline component | “Official bulletins are long. AlertScope answers whether anything is happening, how serious, where and until when.” |
| 0:15–0:35 | Houston in Live mode, then Sample if needed | Show verdict, source timestamp, severity, areas, local end and countdown. State clearly when switching to samples. |
| 0:35–0:50 | Click a timeline bar, expand instruction field and full bulletin | “The official instruction string is unchanged; there is no AI rewrite. The timeline opens the matching bulletin.” |
| 0:50–1:05 | Colorado flood warnings | Explain `area=CO`, event groups and excluding flood watches from a warnings query. |
| 1:05–1:20 | Phoenix YES, then sample Quiet day NO | “NO means no matching advisory in this check. Other active products are disclosed.” |
| 1:20–1:35 | Near me India, then Delhi | Explain approximate IP and limited coverage. Show the official IMD link. |
| 1:35–1:55 | Live mode; block `api.weather.gov` in DevTools and Refresh | Show actual error wording and Retry. Unblock it and retry. A simulated failure can be used if identified as simulated. |
| 1:55–2:15 | 280px, dark mode, object payload | Demonstrate the same component without clipping. Mention container measurement and host theme props. |
| 2:15–2:30 | Open map; show null geometry scenario | Explain available shapes and honest affected-area fallback. |
| 2:30–2:50 | Briefly show code/tests and real host sandbox | Trace intent → API → analyzer → view. Mention the test count from your actual latest run and conclude. |

## Live review change to practise separately

Add a hazard synonym (e.g. “smoke alerts”) or a new trigger phrase. Write one
focused test, run `npm test`, rebuild, and explain why the existing safety states
remain intact. See `LIVE_REVIEW.md`.

Upload to YouTube, copy the real public link, add it to `submission.demovideo` in
`hyperdart.config.js`, validate and publish. A video is not created by this code.
