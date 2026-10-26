import { countdown, formatTime } from '../time.js';
import SeverityBadge from './SeverityBadge.jsx';
import Icon from './Icon.jsx';

export default function AlertCard({ alert, timeZone, now, selected, onSelected, demoMode }) {
  return <details className="as-alert" data-alert-id={alert.id} open={selected || undefined} onToggle={event => {
    if (!event.currentTarget.open && selected) onSelected(null);
  }}>
    <summary>
      <div className="as-alert-title"><SeverityBadge severity={alert.severity}/><h4>{alert.event}</h4><Icon name="chevron" size={17} className="as-details-arrow"/></div>
      <p className="as-alert-area"><Icon name="pin" size={14}/>{alert.area}</p>
      <div className="as-alert-time"><span>{alert.end === null ? 'No end time published' : `Until ${formatTime(alert.end, timeZone)}`}</span><strong>{countdown(alert.end, now)}</strong></div>
    </summary>
    <div className="as-alert-body">
      {alert.headline && <p className="as-headline">{alert.headline}</p>}
      <dl className="as-alert-meta"><div><dt>Urgency</dt><dd>{alert.urgency}</dd></div><div><dt>Certainty</dt><dd>{alert.certainty}</dd></div><div><dt>Starts</dt><dd>{formatTime(alert.start, timeZone)}</dd></div></dl>
      <section className="as-instruction"><h5>{demoMode ? 'Sample instruction field' : 'What to do · official instructions'}</h5><p>{alert.instruction || 'No instruction text was published with this alert. Check the issuing weather office for guidance.'}</p></section>
      <details className="as-description"><summary>Read {demoMode ? 'sample' : 'full official'} bulletin</summary><p>{alert.description || 'No description published.'}</p></details>
      <p className="as-issued">Issued by {alert.sender}</p>
      {!demoMode && <a className="as-source-link" href={alert.url} target="_blank" rel="noreferrer">Open NWS source<Icon name="external" size={14}/></a>}
    </div>
  </details>;
}
