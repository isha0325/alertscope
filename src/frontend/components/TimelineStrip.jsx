import { formatTime } from '../time.js';
import Icon from './Icon.jsx';

const WINDOW_MS = 48 * 3600000;
export default function TimelineStrip({ alerts, now, timeZone, onSelect }) {
  const items = alerts.slice(0, 6);
  return <section className="as-timeline" aria-label="Alert timing over the next 48 hours">
    <div className="as-section-heading"><h3><Icon name="clock" size={16}/>The next 48 hours</h3><span>Local time</span></div>
    <div className="as-axis" aria-hidden="true"><span>NOW</span><span>+12h</span><span>+24h</span><span>+36h</span><span>+48h</span></div>
    <div className="as-timeline-tracks">{items.map(alert => {
      const start = alert.start ?? now, end = alert.end;
      const left = Math.max(0, Math.min(99.4, ((start - now) / WINDOW_MS) * 100));
      const right = end === null ? 100 : Math.max(left + 0.6, Math.min(100, ((end - now) / WINDOW_MS) * 100));
      const known = alert.start !== null && end !== null;
      return <button key={alert.id} className="as-track-row" onClick={() => onSelect(alert.id)} aria-label={`${alert.event}: ${end === null ? 'end not published' : `until ${formatTime(end, timeZone)}`}. Open alert details.`}>
        <span className="as-track-name">{alert.event}</span>
        <span className="as-track"><span className={`as-track-bar as-bar-${alert.severity.toLowerCase()} ${known ? '' : 'as-bar-uncertain'}`} style={{ left: `${left}%`, width: `${Math.max(.6, Math.min(100 - left, right - left))}%` }}>
          <span>{alert.start === null ? '?' : start < now ? '‹' : ''}</span><span>{end === null ? '?' : end > now + WINDOW_MS ? '›' : ''}</span>
        </span></span>
      </button>;
    })}</div>
    <p className="as-timeline-note">Select a bar for details. Hatching / ? means timing is unpublished. {alerts.length > 6 ? `Showing the six highest-ranked of ${alerts.length} alerts.` : ''}</p>
  </section>;
}
