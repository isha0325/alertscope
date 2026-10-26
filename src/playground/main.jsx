import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import AlertDashboard from '../frontend/AlertDashboard.jsx';
import { getAlerts } from '../frontend/api.js';
import { CONTEXTS, searchContext } from '../../fixtures/search-contexts.js';
import { makeSampleProvider } from './sample-provider.js';
import Icon from '../frontend/components/Icon.jsx';
import './playground.css';

const options = Object.entries(CONTEXTS);
function Playground() {
  const [placeId, setPlaceId] = useState('houston');
  const [mode, setMode] = useState('live');
  const [responseCase, setResponseCase] = useState('normal');
  const [theme, setTheme] = useState('light');
  const [format, setFormat] = useState('mainline');
  const [query, setQuery] = useState(CONTEXTS.houston.query);
  const [activeQuery, setActiveQuery] = useState(CONTEXTS.houston.query);
  const [shape, setShape] = useState('array');
  const payload = useMemo(() => searchContext(placeId, activeQuery), [placeId, activeQuery]);
  const loader = useMemo(() => mode === 'live' ? getAlerts : makeSampleProvider(placeId, responseCase), [mode, placeId, responseCase]);
  const choose = id => { setPlaceId(id); setQuery(CONTEXTS[id].query); setActiveQuery(CONTEXTS[id].query); };
  return <div className="pg-app" data-theme={theme}>
    <nav className="pg-nav"><a href="/playground.html" className="pg-logo"><Icon name="shield" size={21}/>AlertScope<span>/ playground</span></a><a href="/">Open hyperDart sandbox ↗</a></nav>
    <main className="pg-main"><div className="pg-intro"><div><span className="pg-eyebrow">OFFICIAL DATA. A CLEARER PICTURE.</span><h1>Know what’s happening.<br/><span>At a glance.</span></h1><p>A small search component for the moments that matter.<br/>Live weather alerts, local timing, and official guidance.</p></div><div className="pg-note"><Icon name="globe" size={23}/><strong>One source of truth.</strong><span>Live mode checks NWS.<br/>Sample mode is clearly labelled.</span></div></div>
    <div className="pg-workbench"><aside className="pg-controls"><div className="pg-controls-title"><span>01</span><h2>Explore the component</h2></div>
      <label>Example query<select aria-label="Example query" value={placeId} onChange={event => choose(event.target.value)}>{options.map(([id,item]) => <option value={id} key={id}>{id === 'nearUS' ? 'Near me · US IP' : id === 'nearIndia' ? 'Near me · India IP' : item.word}</option>)}</select></label>
      <form onSubmit={event => { event.preventDefault(); setActiveQuery(query); }}><label>Query wording<textarea aria-label="Query wording" value={query} rows="3" onChange={event => setQuery(event.target.value)}/></label><button className="pg-submit" type="submit">Run query<Icon name="arrow" size={16}/></button></form>
      <p className="pg-help">The selected example supplies the place entity. Edit wording to test intent; change the example to change location. hyperDart resolves real search entities.</p>
      <label>Data source<select aria-label="Data source" value={mode} onChange={event => setMode(event.target.value)}><option value="live">Live NWS request</option><option value="sample">Sample scenarios · not live</option></select></label>
      {mode === 'sample' && <label>Response scenario<select aria-label="Response scenario" value={responseCase} onChange={event => setResponseCase(event.target.value)}><option value="normal">Alerts for the example</option><option value="quiet">Quiet day · zero alerts</option><option value="error">API connection failure</option><option value="partial">Incomplete response</option><option value="null">Null geometry / missing end</option><option value="many">Many alerts / long bulletin</option></select></label>}
      <fieldset><legend>Layout</legend><div className="pg-segment">{['mainline','sidebar'].map(value => <button type="button" key={value} aria-pressed={format === value} onClick={() => setFormat(value)}>{value === 'mainline' ? 'Wide' : '280 px'}</button>)}</div></fieldset>
      <fieldset><legend>Theme</legend><div className="pg-segment">{['light','dark'].map(value => <button type="button" key={value} aria-pressed={theme === value} onClick={() => setTheme(value)}>{value}</button>)}</div></fieldset>
      <label>searchData shape<select aria-label="searchData shape" value={shape} onChange={event => setShape(event.target.value)}><option value="array">Array</option><option value="object">Object</option></select></label>
      <div className="pg-build-note"><Icon name="layers" size={16}/><p>React + Vite<br/><strong>No backend. No API key.</strong></p></div>
    </aside><section className="pg-stage" aria-label="Component preview"><div className="pg-stage-label"><span>{format === 'sidebar' ? 'SIDEBAR · 280 PX' : 'MAINLINE · RESPONSIVE'}</span><span>{mode === 'live' ? 'LIVE REQUEST' : 'SAMPLE DATA'}</span></div><div className={`pg-component ${format === 'sidebar' ? 'pg-sidebar' : ''}`}><AlertDashboard searchData={shape === 'array' ? [payload] : payload} UIOptions={{ themeName: theme, format }} loadAlerts={loader} demoMode={mode === 'sample'}/></div></section></div>
    <footer className="pg-footer">Built for the Live Disruption & Safety Alerts challenge.<span>Clarity first. Official wording always.</span></footer></main>
  </div>;
}
createRoot(document.getElementById('playground')).render(<Playground/>);
