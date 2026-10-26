import { formatTime } from '../time.js';
import Icon from './Icon.jsx';

export default function Footer({ model, intent, demoMode }) {
  const checked = Number.isFinite(model.fetchedAt);
  return <footer className="as-footer">
    <div className="as-footer-source"><a href="https://www.weather.gov/alerts" target="_blank" rel="noreferrer">National Weather Service<Icon name="external" size={12}/></a>
      <span>{demoMode ? 'Sample data · not live' : checked ? `Checked ${formatTime(model.fetchedAt, intent.timeZone, { short: true })}${model.fromCache ? ' · cached' : ''}` : model.state === 'loading' ? 'Checking now…' : 'Live status not verified'}</span></div>
    <p>{demoMode ? 'These synthetic scenarios demonstrate the interface and must not guide real decisions.' : 'Follow official local guidance and emergency services. This component is not an emergency notification service.'}</p>
    <p>Times in {intent.timeZone.replaceAll('_', ' ')}{intent.timezoneEstimated ? ' (browser timezone)' : ''}.{intent.mode === 'state' ? ' A state may span multiple time zones.' : ''}</p>
  </footer>;
}
