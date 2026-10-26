# Fixture provenance

`houston.json`, `colorado.json`, `phoenix.json`, `alaska.json`, `quiet.json`, and
`null-geometry.json` are **synthetic test data**, not actual NWS warnings. Their
reference clock is `2026-10-26T12:00:00Z`. Sample instruction text explicitly says
it is synthetic. The standalone playground rebases sample dates to the current
clock for demonstration, labels every sample, and never uses samples as a live
fallback. Unit tests use the fixed reference clock.

`recorded-texas.json` is an unmodified alert collection from a successful NWS
request, with an added `_fixture` provenance object. Its capture time and exact
request are in that object. It is historical data, is not rebased, and is never
used by the published component.

`search-contexts.js` contains host-prop examples, including the exact Houston
coordinates and IP-location shape from the challenge. Country codes for the
five territories and both payload shapes are also tested. The host's actual
entity resolver remains responsible for production place resolution.
