export function dateMs(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatTime(value, timeZone, { short = false } = {}) {
  if (!Number.isFinite(value)) return 'No time published';
  const options = { timeZone, hour: 'numeric', minute: '2-digit', timeZoneName: 'short', ...(short ? {} : { weekday: 'short', month: 'short', day: 'numeric' }) };
  try { return new Intl.DateTimeFormat('en-US', options).format(value); }
  catch { return new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' }).format(value); }
}

export function countdown(end, now = Date.now()) {
  if (!Number.isFinite(end)) return 'No end time published';
  if (end <= now) return 'End time passed';
  const minutes = Math.ceil((end - now) / 60000);
  const days = Math.floor(minutes / 1440), hours = Math.floor((minutes % 1440) / 60), mins = minutes % 60;
  return [days ? `${days}d` : '', hours ? `${hours}h` : '', mins ? `${mins}m` : ''].filter(Boolean).join(' ') + ' left';
}
