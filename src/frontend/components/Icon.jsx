const paths = {
  shield: <><path d="M12 3 4 6v6c0 4.5 8 9 8 9s8-4.5 8-9V6l-8-3Z"/><path d="m8.5 11.5 2.5 2.5 4.5-5"/></>,
  pin: <><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 6a8 8 0 0 1 13 2M5 16a8 8 0 0 0 13 2"/></>,
  alert: <><path d="m12 3 10 18H2L12 3Z"/><path d="M12 9v5m0 3v.1"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"/></>,
  arrow: <><path d="M5 12h14m-5-5 5 5-5 5"/></>,
  external: <><path d="M13 4h7v7m0-7L10 14"/><path d="M10 4H4v16h16v-6"/></>,
  chevron: <path d="m6 9 6 6 6-6"/>,
  layers: <><path d="m3 7 9-5 9 5-9 5-9-5Zm0 5 9 5 9-5M3 17l9 5 9-5"/></>,
};

export default function Icon({ name = 'alert', size = 18, ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>{paths[name] || paths.alert}</svg>;
}
