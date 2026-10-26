# Start here — Windows / VS Code

1. Install Node.js 24 from https://nodejs.org and restart VS Code. No conda
   environment or Python installation is needed.
2. Extract the project ZIP. Open the **alertscope** folder in VS Code. You should
   see `package.json` directly in that folder, not another nested ZIP.
3. Open Terminal → New Terminal. Check `node -v` and `npm -v`.
4. Run `npm ci`. Wait for installation to finish.
5. Run `npm start`. Keep this terminal open.
6. Open http://localhost:5173/playground.html in your browser.
7. Use the left panel: choose a place, live/sample data, layout, theme, and payload
   shape. For predictable demonstration, use Sample scenarios; they are not live.
8. Open a second terminal in the same folder and run `npm test`, then
   `npm run build`. These commands do not require GitHub, a portal token or YouTube.

## Common problems

| Problem | Fix |
| --- | --- |
| `npm` not recognised | Restart VS Code after installing Node; check `node -v` |
| PowerShell blocks npm.ps1 | Use Command Prompt or run `npm.cmd ci` / `npm.cmd start` |
| `package.json` missing | Change directory to the folder containing it |
| Port 5173 occupied | Vite prints another port; use that port in the URL |
| Live request fails | Check connection, refresh, then inspect DevTools Network; error is a real UI state |
| Demo looks empty | A quiet day is valid; switch to labelled Sample scenarios to inspect active alerts |
| Host sandbox does not load | Use `/playground.html` for local UI; check the official sandbox's browser errors and installed dependencies |
| Validation fails for links | Add your real GitHub repo and YouTube video to `hyperdart.config.js` |
| Wrong package scope | Change `package.json.name` to the exact portal name, then `npm install --package-lock-only` |

Stop the server with Ctrl+C. After source edits, Vite updates the page automatically.

## Suggested 2–3 hour preparation

- **First 20 min:** install, run the playground, inspect every example query.
- **Next 35 min:** read `intent.js`, `api.js`, `analyze.js`; run the tests.
- **Next 25 min:** inspect sidebar/dark mode, map, failure and quiet-day scenarios.
- **Next 20 min:** practise the live-change exercise in `LIVE_REVIEW.md`.
- **Final 40–60 min:** create repo/portal package, record demo, add links, build,
  validate and publish. Allow extra time if account/token setup is new to you.
