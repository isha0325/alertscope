import { useCallback, useEffect, useRef, useState } from 'react';
import { getAlerts } from './api.js';

export function useNow() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function useCompact() {
  const ref = useRef(null);
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setCompact(element.getBoundingClientRect().width < 520);
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, compact];
}

export function useAlertFeed(intent, loader = getAlerts) {
  const [record, setRecord] = useState(null);
  const [refreshId, setRefreshId] = useState(0);
  const refresh = useCallback(() => setRefreshId(value => value + 1), []);
  const paramsKey = JSON.stringify(intent.params);
  const dataKey = intent.dataKey;
  const canFetch = Boolean(intent.params);
  useEffect(() => {
    if (!canFetch) return;
    const controller = new AbortController();
    setRecord({ key: dataKey, value: null });
    Promise.resolve().then(() => loader(JSON.parse(paramsKey), { signal: controller.signal, force: refreshId > 0 }))
      .then(value => { if (!controller.signal.aborted) setRecord({ key: dataKey, value }); })
      .catch(() => {
        if (!controller.signal.aborted) setRecord({ key: dataKey, value: { ok: false, alerts: null, error: { kind: 'network', message: 'The alert check could not finish.' } } });
      });
    return () => controller.abort();
  }, [dataKey, paramsKey, canFetch, loader, refreshId]);

  useEffect(() => {
    if (!canFetch) return;
    const timer = setInterval(() => { if (!document.hidden) refresh(); }, 120000);
    const visible = () => { if (!document.hidden) refresh(); };
    document.addEventListener('visibilitychange', visible);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', visible); };
  }, [canFetch, refresh]);
  return { result: record?.key === dataKey ? record.value : null, refresh };
}
