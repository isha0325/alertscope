import houston from '../../fixtures/houston.json';
import colorado from '../../fixtures/colorado.json';
import phoenix from '../../fixtures/phoenix.json';
import alaska from '../../fixtures/alaska.json';
import quiet from '../../fixtures/quiet.json';
import nullGeometry from '../../fixtures/null-geometry.json';

const fixtures = { houston, colorado, phoenix, alaska, quiet, null: nullGeometry };

export function makeSampleProvider(placeId, responseCase) {
  return async (_params, { signal } = {}) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    if (signal?.aborted) return { ok: false, alerts: null, error: { kind: 'cancelled' } };
    if (responseCase === 'error') return { ok: false, alerts: null, error: { kind: 'network', message: 'Simulated connection failure (sample mode).' } };
    const fixture = fixtures[responseCase] || fixtures[placeId] || houston;
    const now = Date.now();
    const offset = now - Date.parse(fixture._fixture.referenceTime);
    const alerts = structuredClone(fixture.features);
    for (const feature of alerts) {
      for (const key of ['sent', 'effective', 'onset', 'ends', 'expires']) {
        const timestamp = Date.parse(feature.properties[key]);
        if (Number.isFinite(timestamp)) feature.properties[key] = new Date(timestamp + offset).toISOString();
      }
    }
    if (responseCase === 'many') {
      const base = structuredClone(alerts[0]);
      for (let i = 1; i <= 80; i++) alerts.push({ ...structuredClone(base), id: `sample:many:${i}`, properties: { ...base.properties, id: `sample:many:${i}`, areaDesc: `Sample county ${i}`, description: 'SYNTHETIC LONG BULLETIN. '.repeat(600) } });
    }
    return { ok: true, alerts, fetchedAt: now, complete: responseCase !== 'partial', warnings: responseCase === 'partial' ? ['Simulated missing page. Remaining alerts could not be checked.'] : [] };
  };
}
