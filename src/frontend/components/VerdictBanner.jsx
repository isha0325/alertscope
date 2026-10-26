import { formatTime } from '../time.js';
import Icon from './Icon.jsx';

function filterName(intent, singular) {
  if (intent.severeOnly) return `Severe or Extreme ${singular ? 'alert' : 'alerts'}`;
  const hazard = intent.hazard ? `${intent.hazard} ` : '';
  const product = singular ? (intent.product || 'alert').toLowerCase() : intent.product === 'Advisory' ? 'advisories' : intent.product === 'Watch' ? 'watches' : intent.product === 'Warning' ? 'warnings' : 'alerts';
  return hazard + product;
}

export default function VerdictBanner({ model, intent, refresh, demoMode }) {
  const { state, count, worst } = model;
  const filter = filterName(intent, count === 1);
  const partial = state === 'partial';
  let title, body, icon = 'alert', tone = 'neutral';
  if (state === 'alerts') {
    title = intent.yesNo ? 'YES' : `${count} active ${count === 1 ? 'alert' : 'alerts'}`;
    body = intent.yesNo ? `${demoMode ? 'This sample contains' : 'NWS reports'} ${count} active ${filter} for ${intent.place}.` : `${intent.place} · ${intent.hazard || (intent.severeOnly ? 'Severe and Extreme only' : demoMode ? 'Sample alert scenario' : 'Official NWS alerts')}`;
    tone = worst?.toLowerCase() || 'unknown';
  } else if (state === 'none') {
    title = intent.yesNo ? 'NO' : intent.hazard || intent.product || intent.severeOnly ? 'No matching alerts' : 'No active alerts';
    body = demoMode ? `This synthetic scenario has no active ${filter} for ${intent.place}. It does not describe current conditions.` : `No active ${filter} reported by NWS for ${intent.place} in this check. This is not a guarantee of safety.`;
    icon = 'check'; tone = 'quiet';
  } else if (partial) {
    title = 'Check incomplete';
    body = `${count ? `At least ${count} matching ${count === 1 ? 'alert appears' : 'alerts appear'} in the received snapshot. ` : ''}Current alert status cannot be fully confirmed.`;
    tone = 'moderate';
  } else if (state === 'notCovered') {
    title = intent.reason === 'scope' ? 'Choose a city or state' : 'Not covered';
    body = intent.reason === 'scope'
      ? 'Country-wide searches are not supported by this component. Search a US city, state, or territory.'
      : `NWS coverage is limited to the US and its territories. This tool cannot check ${intent.place}. That does not mean there are no alerts.`;
    icon = 'globe';
  } else if (state === 'needsLocation') {
    title = 'Location needed';
    body = 'A covered location with a confirmed country and usable coordinates or state code is needed. Try “weather alerts in Houston”.';
    icon = 'pin';
  } else {
    title = 'Couldn’t check alerts';
    body = `${model.error?.message || 'NWS could not be reached.'} This does not mean there are no alerts.`;
  }
  const relevant = model.matchingAlerts;
  const nearest = relevant.filter(alert => alert.end !== null).reduce((end, alert) => Math.min(end, alert.end), Infinity);
  const first = relevant[0];
  return <section className={`as-verdict as-tone-${tone}`} aria-live="polite" aria-atomic="true">
    <div className="as-verdict-top"><span className="as-eyebrow"><Icon name={icon} size={16}/>{demoMode ? 'SAMPLE SNAPSHOT' : partial ? 'STATUS NOT CONFIRMED' : 'AT A GLANCE'}</span>{worst && <span className="as-worst">Highest severity: <strong>{worst}</strong></span>}</div>
    <h2 className={intent.yesNo && ['alerts', 'none'].includes(state) ? 'as-answer' : ''}>{title}</h2>
    <p>{body}</p>
    {['alerts', 'partial'].includes(state) && first && <div className="as-verdict-facts">
      <div><span className="as-fact-label">WHERE</span><strong>{first.area}</strong>{count > 1 && <span>+ {count - 1} more matching {count === 2 ? 'alert' : 'alerts'} below</span>}</div>
      <div><span className="as-fact-label">NEXT END TIME</span><strong>{Number.isFinite(nearest) ? formatTime(nearest, intent.timeZone) : 'No end time published'}</strong><span>Each alert has its own end time</span></div>
    </div>}
    {state === 'error' && <button className="as-button as-button-solid" onClick={refresh}><Icon name="refresh"/>Retry check</button>}
    {state === 'notCovered' && intent.country === 'IN' && <a className="as-source-link" href="https://mausam.imd.gov.in/" target="_blank" rel="noreferrer">Check India Meteorological Department<Icon name="external" size={14}/></a>}
    {partial && <ul className="as-warning-list">{model.warnings.map(item => <li key={item}>{item}</li>)}</ul>}
    <div className="as-verdict-source">{demoMode ? 'Synthetic sample · not current conditions' : Number.isFinite(model.fetchedAt) ? `Checked ${formatTime(model.fetchedAt, intent.timeZone, { short: true })} · Source: NWS` : 'Current NWS status not verified'}</div>
  </section>;
}
