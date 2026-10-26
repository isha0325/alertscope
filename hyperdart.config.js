import pkg from './package.json' with { type: 'json' };

// Fill these with YOUR real public links before npm run validate / npm publish.
// Leaving them empty deliberately prevents an incomplete submission being published.
const submission = { github: '', demovideo: '' };

export default {
  name: pkg.name,
  triggers: {
    keywords: [
      'weather alerts', 'weather alert', 'weather warnings', 'weather warning',
      'severe weather', 'tornado warning', 'flood warning', 'heat advisory',
      'winter storm warning', 'safety alerts', 'wildfire alerts', 'storm warning',
    ],
  },
  query_format: {
    regex: [
      '(weather|severe\\s+weather|safety|emergency)\\s+(alerts?|warnings?|advisories)\\s+(in|for|near|at)\\s+HD_LOCATION(__\\w+)?.*',
      '(tornado|flood|flash\\s+flood|heat|winter\\s+storm|storm|wind|fire\\s+weather|hurricane|air\\s+quality|wildfire)\\s+(alerts?|warnings?|watch(es)?|advisor(y|ies))\\s+(in|for|near|at)\\s+HD_LOCATION(__\\w+)?.*',
      'is\\s+there\\s+(a|an|any)\\s+.*(warning|alert|watch|advisory)\\s+(in|for|near)\\s+HD_LOCATION(__\\w+)?.*',
      'HD_LOCATION(__\\w+)?\\s+(weather\\s+)?(alerts?|warnings?|advisories).*',
      '(weather\\s+)?(alerts?|warnings?)\\s+(near|around)\\s+me.*',
      '(weather|safety)\\s+(alerts?|warnings?)\\s+(today|right\\s+now)\\s+(in|for|near)\\s+HD_LOCATION(__\\w+)?.*',
      '(tornado|flood|heat|storm|wind|winter\\s+storm|wildfire)\\s+(alerts?|warnings?|watch(es)?|advisor(y|ies))\\s+(near|around)\\s+me.*',
    ],
  },
  client: {
    location: pkg.module,
    moduleName: pkg.umdName || 'HD' + pkg.name,
    baseURL: '/' + pkg.name,
  },
  format: { mainline: true, sidebar: true },
  permissions: {},
  info: { title: 'AlertScope', description: 'Official weather alerts, clearly.' },
  ...submission,
  // The supplied template validates lowercase demovideo. Some docs use demoVideo.
  demoVideo: submission.demovideo,
};
