import { useEffect, useMemo, useState } from 'react';
import { getZoneGeometry } from '../api.js';
import { projectShapes } from '../geometry.js';
import Icon from './Icon.jsx';

export default function MiniMap({ alerts, demoMode }) {
  const [opened, setOpened] = useState(false);
  const [zones, setZones] = useState({ key: '', shapes: [], status: 'idle', failed: false });
  const missing = alerts.filter(alert => !alert.geometry);
  const urls = [...new Set(missing.flatMap(alert => alert.zones))];
  const zoneKey = JSON.stringify(urls.slice(0, 8));
  useEffect(() => {
    if (!opened || demoMode || zoneKey === '[]') return;
    const controller = new AbortController();
    setZones({ key: zoneKey, shapes: [], status: 'loading', failed: false });
    (async () => {
      const list = JSON.parse(zoneKey), results = [];
      for (let i = 0; i < list.length; i += 4) {
        results.push(...await Promise.all(list.slice(i, i + 4).map(url => getZoneGeometry(url, { signal: controller.signal }))));
        if (controller.signal.aborted) return;
      }
      setZones({ key: zoneKey, status: 'done', failed: results.some(result => !result.ok || !result.geometry), shapes: results.filter(result => result.ok && result.geometry).map((result, index) => ({ id: `zone-${index}`, geometry: result.geometry, severity: 'Unknown', label: 'NWS affected zone' })) });
    })().catch(() => { if (!controller.signal.aborted) setZones({ key: zoneKey, shapes: [], status: 'done', failed: true }); });
    return () => controller.abort();
  }, [opened, zoneKey, demoMode]);
  const paths = useMemo(() => projectShapes([
    ...alerts.filter(alert => alert.geometry).map(alert => ({ id: alert.id, geometry: alert.geometry, severity: alert.severity, label: alert.event })),
    ...(zones.key === zoneKey ? zones.shapes : []),
  ]), [alerts, zones, zoneKey]);
  const areas = [...new Set(alerts.map(alert => alert.area))];
  return <details className="as-map-panel" onToggle={event => setOpened(event.currentTarget.open)}>
    <summary><Icon name="layers" size={16}/><strong>Affected areas</strong><span>View map & list</span><Icon name="chevron" size={16}/></summary>
    {opened && <div className="as-map-content">
      {paths.length > 0 && <figure><svg viewBox="0 0 360 180" role="img" aria-label="Schematic of available alert polygons; not all areas may have map shapes" className="as-mini-map">
        <path d="M0 45H360M0 90H360M0 135H360M90 0V180M180 0V180M270 0V180" className="as-map-grid"/>
        {paths.map(shape => <path key={shape.id} d={shape.path} fillRule="evenodd" className={`as-map-shape as-map-${shape.severity.toLowerCase()}`}><title>{shape.label}</title></path>)}
      </svg><figcaption>{demoMode ? 'Synthetic sample shapes.' : 'NWS alert / affected-zone shapes.'} Schematic only; no basemap. Shapes may overlap. Missing shapes do not mean unaffected areas.</figcaption></figure>}
      {zones.status === 'loading' && zones.key === zoneKey && <p role="status">Loading available NWS zone shapes…</p>}
      {(!paths.length || missing.length > 0) && <p className="as-map-note">{!paths.length ? 'No usable shapes available yet. ' : ''}The official affected-area text below remains the reference.</p>}
      {(urls.length > 8 || zones.failed) && <p className="as-map-note">Some zone shapes are unavailable or omitted to keep this map responsive.</p>}
      <ul className="as-area-list">{areas.map(area => <li key={area}><Icon name="pin" size={14}/><span>{area}</span></li>)}</ul>
    </div>}
  </details>;
}
