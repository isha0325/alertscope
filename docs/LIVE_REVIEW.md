# Understand the implementation before presenting

## Five-minute code tour

1. `hyperdart.config.js` decides **when the host activates** this component.
   Keywords/regex contain `HD_LOCATION` tokens because the host resolves places.
2. `intent.js` decides **what the query means**. Normalize object/array first;
   prefer specific hazard phrases; identify product type and yes/no; distinguish
   country, state, point and near-me modes. Reject unsupported/unknown coverage.
3. `api.js` retrieves **official data**. An AbortController provides a deadline,
   one retry handles transient failures, and the cache keeps the original fetch
   time. Follow only official pagination. A failed call returns null alerts.
4. `analyze.js` decides **what may honestly be said**. Normalize fields, suppress
   duplicates/expired/older updates, rank, apply filters, and return one UI state.
5. `AlertDashboard.jsx` and components display the result. The hook cancels old
   requests and pauses refresh in hidden tabs. `componentLoaded()` fires once
   after a settled view, including error/unsupported states. `index.jsx` keeps
   the mandatory `withHD` wrapper.

## Questions a judge may ask

**Why not an LLM?** Rules handle the supported questions; unmodified instructions
avoid unsupported safety advice. There is no runtime AI dependency.

**Why are `error` and `none` different?** An empty successful collection is
evidence about the last check. A failed check is no evidence about active alerts.
Partial or stale collections cannot support a definitive negative answer either.

**How does “heat advisory” work?** Heat maps to event substrings; Advisory also
filters the product. A Heat Warning alone cannot satisfy an advisory question.
Other products remain disclosed and can be inspected with Show all.

**Why use `geo.long`?** That is the longitude field in the challenge's host props.
The fallback `geo.lon` is supported too. Missing coordinates are never zeroed.

**Why no `User-Agent` header in browser code?** Browsers supply the User-Agent.
The manual Node smoke check explicitly sets an application identifier. The browser
request sets Accept and follows the challenge's no-key approach.

**What happens for PR/GU?** ISO-2 and common ISO-3 codes normalize to covered
territories. City entities use point queries; territory/country entities can use
the territory's area code. US national searches ask for city/state scope.

**Why is the map labelled schematic?** It has no base tiles or full geographic
context, and many NWS alerts are zone-based with no polygon. Zone boundaries are
optional details; the exact affected-area string stays visible.

**How do you avoid a query race?** The hook's effect cancels the previous request.
Results are associated with the location key. A previous location cannot appear
as the new location while its fetch is still loading.

**What did AI write?** Refer to the honest README disclosure and describe your own
actual review/changes. Do not claim unaided authorship of generated code.

## Live change exercise: support a new synonym

Example: treating “smoke” as an air-quality search.

1. In `HAZARDS` in `intent.js`, change the air-quality pattern to
   `/\b(air quality|smoke)\b/`. Retain the NWS event mapping `['Air Quality']`.
2. Add `'smoke alerts'` to the config keywords and add `smoke` to the hazard
   alternatives in the relevant query regexes. Parser and trigger changes are
   separate: both are necessary.
3. Add a focused test:

```js
test('smoke synonym maps to official air-quality events', () => {
  assert.equal(parseQuery('smoke alerts in Houston').hazard, 'air quality');
});
```

4. Run `npm test`, then `npm run build`. In the playground select Houston,
   type the new wording, Run query, and inspect matching/unrelated products.
5. After validation and real links are configured, increment the version and
   publish. Never edit or bypass the official validator to make a demo pass.

The delivered version already supports wildfire and “alerts today” trigger
examples; the exercise above deliberately uses a fresh synonym.
