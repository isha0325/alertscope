import { useEffect, useMemo, useRef, useState } from 'react';
import { resolveIntent } from './intent.js';
import { analyze } from './analyze.js';
import { getAlerts } from './api.js';
import { useAlertFeed, useCompact, useNow } from './hooks.js';
import VerdictBanner from './components/VerdictBanner.jsx';
import TimelineStrip from './components/TimelineStrip.jsx';
import AlertCard from './components/AlertCard.jsx';
import StateSummary from './components/StateSummary.jsx';
import MiniMap from './components/MiniMap.jsx';
import Footer from './components/Footer.jsx';
import Icon from './components/Icon.jsx';
import './styles.css';

// The playground imports this directly. Fixture code is never imported by the
// published entry (index.jsx -> NewComponent.jsx).
export default function AlertDashboard({ searchData, searchQuery, queryProps, UIOptions, format, theme, messageHandlers, loadAlerts = getAlerts, demoMode = false }) {
  const intent = useMemo(() => resolveIntent(searchData, searchQuery, queryProps), [searchData, searchQuery, queryProps]);
  const { result, refresh } = useAlertFeed(intent, loadAlerts);
  const [container, compact] = useCompact();
  const now = useNow();
  const [view, setView] = useState({ query: '', all: false });
  const [selected, setSelected] = useState(null);
  const showAll = view.query === intent.query && view.all;
  const model = useMemo(() => analyze(result, intent, { now, showAll }), [result, intent, now, showAll]);
  const announced = useRef(false);
  useEffect(() => {
    if (model.state !== 'loading' && !announced.current && typeof messageHandlers?.componentLoaded === 'function') {
      announced.current = true;
      messageHandlers.componentLoaded();
    }
  }, [model.state, messageHandlers]);
  const hostTheme = UIOptions?.themeName || (typeof theme === 'string' ? theme : theme?.palette?.mode);
  const colorScheme = ['dark', 'lightsOut'].includes(hostTheme) ? 'dark' : hostTheme === 'light' ? 'light' : undefined;
  const hasFilter = Boolean(intent.hazard || intent.product || intent.severeOnly);
  const pickAlert = id => {
    setSelected(id);
    requestAnimationFrame(() => {
      const element = [...(container.current?.querySelectorAll('[data-alert-id]') || [])].find(item => item.dataset.alertId === id);
      element?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  };
  const cardProps = { timeZone: intent.timeZone, now, selected, onSelected: setSelected, demoMode };
  return <article className={`alertscope ${compact || (UIOptions?.format || format) === 'sidebar' ? 'as-compact' : ''}`} ref={container} data-theme={colorScheme} aria-label={`Weather alerts for ${intent.place}`}>
    <header className="as-header"><div className="as-brand"><span className="as-brand-mark"><Icon name="shield" size={20}/></span><div><strong>AlertScope</strong><span>Weather, in focus.</span></div></div>
      <div className="as-header-tools"><span className={`as-status ${demoMode ? 'as-status-demo' : ''}`}><span/>{demoMode ? 'SAMPLE' : 'NWS'}</span>
        {intent.params && <button className="as-icon-button" onClick={refresh} disabled={model.state === 'loading'} aria-label="Refresh alerts" title="Refresh alerts"><Icon name="refresh" size={17}/></button>}</div>
    </header>
    <div className="as-location-row"><Icon name="pin" size={15}/><span>{intent.place}</span>{intent.approximate && <span className="as-approximate">Approximate · IP</span>}</div>
    {demoMode && <div className="as-demo-notice">DEMO · Synthetic sample data, not current conditions.</div>}
    {model.state === 'loading' ? <div className="as-loading" role="status" aria-live="polite"><span className="as-eyebrow">CHECKING OFFICIAL NWS ALERTS</span><div className="as-skeleton as-skeleton-title"/><div className="as-skeleton"/><div className="as-skeleton as-skeleton-short"/><span>Checking {intent.place}…</span></div>
      : <VerdictBanner model={model} intent={intent} refresh={refresh} demoMode={demoMode}/>}
    {hasFilter && ['alerts', 'none', 'partial'].includes(model.state) && <div className="as-filter-row"><span>{model.otherCount ? `${model.otherCount} other active ${model.otherCount === 1 ? 'alert' : 'alerts'} in this snapshot.` : 'Showing alerts matching your query.'}</span><button className="as-text-button" onClick={() => setView({ query: intent.query, all: !showAll })}>{showAll ? 'Show matching only' : `Show all (${model.total})`}<Icon name="arrow" size={14}/></button></div>}
    {model.alerts.length > 0 && <>
      <TimelineStrip alerts={model.alerts} now={now} timeZone={intent.timeZone} onSelect={pickAlert}/>
      <div className="as-section-heading as-alerts-heading"><h3>{intent.mode === 'state' ? 'Alerts by event' : 'Alert details'}</h3><span>{model.alerts.length} {model.alerts.length === 1 ? 'bulletin' : 'bulletins'}</span></div>
      {intent.mode === 'state' ? <StateSummary key={intent.dataKey} groups={model.groups} {...cardProps}/> : <div className="as-alert-list">{model.alerts.map(alert => <AlertCard key={alert.id} alert={alert} {...cardProps} selected={selected === alert.id}/>)}</div>}
      <MiniMap key={intent.dataKey} alerts={model.alerts} demoMode={demoMode}/>
    </>}
    <Footer model={model} intent={intent} demoMode={demoMode}/>
  </article>;
}
