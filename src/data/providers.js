/* ============================================================
   Provider registry — global roster.
   Real-world service NAMES are referenced for a college demo, with
   ORIGINAL brand-tinted wordmarks + generated gradients. If you add
   official logo files (see data/brandAssets.js) they replace the
   wordmarks automatically. twelve has no affiliation with any provider.
   ============================================================ */

const wm = (text, color, accent, opts = {}) => ({
  text, color, accent, weight: opts.weight || 800, spacing: opts.spacing ?? '-0.02em',
  size: opts.size ?? 1, italic: opts.italic || false, badge: opts.badge, label: opts.label
})

export const PROVIDERS = {
  /* ---------------- Entertainment ---------------- */
  netflix: {
    id: 'netflix', name: 'Netflix', category: 'entertainment', kind: 'real',
    color: '#E50914', color2: '#B20710',
    wordmark: wm('NETFLIX', '#E50914', null, { weight: 900, spacing: '0.02em' }),
    gradient: ['#3a0d0d', '#7f0d14', '#120404'], tagline: 'Premium entertainment access', demo: 'entertainment'
  },
  prime: {
    id: 'prime', name: 'Amazon Prime Video', category: 'entertainment', kind: 'real',
    color: '#1399FF', color2: '#00A8E1',
    wordmark: wm('prime video', '#e6f5ff', '#00A8E1', { size: 0.9 }),
    gradient: ['#041e33', '#0a4b73', '#02121f'], tagline: 'Movies, shows & Originals', demo: 'entertainment'
  },
  max: {
    id: 'max', name: 'Max', category: 'entertainment', kind: 'real',
    color: '#3b5cff', color2: '#0046FF',
    wordmark: wm('MAX', '#eaf0ff', '#3b5cff', { weight: 900, spacing: '-0.04em' }),
    gradient: ['#0b1440', '#1f2f8c', '#05081f'], tagline: 'Blockbusters & HBO series', demo: 'entertainment'
  },
  disney: {
    id: 'disney', name: 'Disney+', category: 'entertainment', kind: 'real',
    color: '#1a54ff', color2: '#0a2a8c',
    wordmark: wm('Disney+', '#eaf0ff', '#4f8bff', { size: 0.98 }),
    gradient: ['#0a1340', '#132a8c', '#050a24'], tagline: 'Stories from every world', demo: 'entertainment'
  },
  hotstar: {
    id: 'hotstar', name: 'JioHotstar', category: 'entertainment', kind: 'real',
    color: '#e23744', color2: '#1a1b6b',
    wordmark: wm('JioHotstar', '#eaf0ff', '#e23744', { size: 0.78 }),
    gradient: ['#0a1230', '#1a1b6b', '#050a24'], tagline: 'Blockbusters, sports & series', demo: 'entertainment'
  },
  tencent: {
    id: 'tencent', name: 'Tencent Video', category: 'entertainment', kind: 'real',
    color: '#ff6a2b', color2: '#e0531a',
    wordmark: wm('Tencent Video', '#fff0e6', '#ff6a2b', { size: 0.72 }),
    gradient: ['#33180a', '#8c4310', '#180a04'], tagline: 'Asian drama & film', demo: 'entertainment'
  },
  iqiyi: {
    id: 'iqiyi', name: 'iQIYI', category: 'entertainment', kind: 'real',
    color: '#00be06', color2: '#00a005',
    wordmark: wm('iQIYI', '#e9ffe9', '#00be06', { size: 0.95 }),
    gradient: ['#06331a', '#0a7d33', '#03160c'], tagline: 'Asian entertainment', demo: 'entertainment'
  },
  paramount: {
    id: 'paramount', name: 'Paramount+', category: 'entertainment', kind: 'real',
    color: '#3a7dff', color2: '#0064FF',
    wordmark: wm('Paramount+', '#eaf1ff', '#3a7dff', { size: 0.8 }),
    gradient: ['#06214f', '#0a52c2', '#03101f'], tagline: 'Movies, sports & Originals', demo: 'entertainment'
  },
  hulu: {
    id: 'hulu', name: 'Hulu', category: 'entertainment', kind: 'real',
    color: '#1CE783', color2: '#12b568',
    wordmark: wm('hulu', '#e9fff4', '#1CE783', { size: 1.05, weight: 900 }),
    gradient: ['#052e1a', '#0a8c3f', '#02160c'], tagline: 'Current shows & Originals', demo: 'entertainment'
  },
  peacock: {
    id: 'peacock', name: 'Peacock', category: 'entertainment', kind: 'real',
    color: '#8a5cff', color2: '#fa6432',
    wordmark: wm('peacock', '#f1ecff', '#8a5cff', { size: 1 }),
    gradient: ['#1a0a2e', '#4a1f8c', '#0c0520'], tagline: 'TV, movies & live', demo: 'entertainment'
  },
  viu: {
    id: 'viu', name: 'Viu', category: 'entertainment', kind: 'real',
    color: '#ffcc00', color2: '#f5b800',
    wordmark: wm('Viu', '#fff8e0', '#ffcc00', { size: 1.05, weight: 900 }),
    gradient: ['#332a05', '#8c7310', '#1a1502'], tagline: 'Asian drama, subtitled', demo: 'entertainment'
  },
  canal: {
    id: 'canal', name: 'CANAL+', category: 'entertainment', kind: 'real',
    color: '#f5f5f7', color2: '#a1a1a6',
    wordmark: wm('CANAL+', '#f5f5f7', '#f5f5f7', { size: 0.9, weight: 900, spacing: '0.02em' }),
    gradient: ['#161618', '#2c2c30', '#050505'], tagline: 'Premium film & series', demo: 'entertainment'
  },
  appletv: {
    id: 'appletv', name: 'Apple TV+', category: 'entertainment', kind: 'real',
    color: '#f5f5f7', color2: '#a1a1a6',
    wordmark: wm('tv+', '#f5f5f7', '#a1a1a6', { weight: 700 }),
    gradient: ['#141416', '#2a2a2e', '#050505'], tagline: 'Award-winning Originals', demo: 'entertainment'
  },
  youtubetv: {
    id: 'youtubetv', name: 'YouTube TV', category: 'entertainment', kind: 'real',
    color: '#FF0000', color2: '#cc0000',
    wordmark: wm('YouTube TV', '#ffeaea', '#FF0000', { size: 0.78 }),
    gradient: ['#3a0808', '#8c1010', '#180404'], tagline: 'Live TV & DVR', demo: 'entertainment'
  },
  crunchyroll: {
    id: 'crunchyroll', name: 'Crunchyroll', category: 'entertainment', kind: 'real',
    color: '#F47521', color2: '#ff8c3a',
    wordmark: wm('crunchyroll', '#fff0e6', '#F47521', { size: 0.86 }),
    gradient: ['#3a1c05', '#8c400f', '#1a0c02'], tagline: 'Anime, all access', demo: 'entertainment'
  },
  dazn: {
    id: 'dazn', name: 'DAZN', category: 'entertainment', kind: 'real',
    color: '#c6f500', color2: '#a8d400',
    wordmark: wm('DAZN', '#f5ffd6', '#c6f500', { size: 0.95, weight: 900, spacing: '-0.03em' }),
    gradient: ['#2a3305', '#6b7d0a', '#141602'], tagline: 'Live sports streaming', demo: 'entertainment'
  },
  shahid: {
    id: 'shahid', name: 'Shahid', category: 'entertainment', kind: 'real',
    color: '#16c79a', color2: '#0fa07c',
    wordmark: wm('Shahid', '#e6fff8', '#16c79a', { size: 0.95 }),
    gradient: ['#052e26', '#0a7d66', '#02160f'], tagline: 'Arabic film & series', demo: 'entertainment'
  },
  zee5: {
    id: 'zee5', name: 'ZEE5', category: 'entertainment', kind: 'real',
    color: '#e5077e', color2: '#8a1e9b',
    wordmark: wm('ZEE5', '#ffeaf5', '#e5077e', { size: 0.95, weight: 900 }),
    gradient: ['#2a0833', '#7a1e9b', '#15051c'], tagline: 'Indian film & series', demo: 'entertainment'
  },
  sonyliv: {
    id: 'sonyliv', name: 'SonyLIV', category: 'entertainment', kind: 'real',
    color: '#7a5fff', color2: '#3b1e8c',
    wordmark: wm('SonyLIV', '#eeeaff', '#7a5fff', { size: 0.9 }),
    gradient: ['#160a33', '#3b1e8c', '#0a0520'], tagline: 'Sports, film & series', demo: 'entertainment'
  },
  tubi: {
    id: 'tubi', name: 'Tubi', category: 'entertainment', kind: 'real',
    color: '#fa382f', color2: '#7a5fff',
    wordmark: wm('tubi', '#ffe9e6', '#fa382f', { size: 1.05, weight: 900 }),
    gradient: ['#2a0a2a', '#7a2f6b', '#3a0810'], tagline: 'Movies & TV, on demand', demo: 'entertainment'
  },

  /* ---------------- Education ---------------- */
  coursera: {
    id: 'coursera', name: 'Coursera', category: 'education', kind: 'real',
    color: '#2a7de1', color2: '#0056D2',
    wordmark: wm('coursera', '#eaf1ff', '#2a7de1'),
    gradient: ['#08234f', '#0f47a1', '#040e24'], tagline: 'Temporary learning access', demo: 'education'
  },
  udemy: {
    id: 'udemy', name: 'Udemy', category: 'education', kind: 'real',
    color: '#A435F0', color2: '#8710d8',
    wordmark: wm('Udemy', '#f6ecff', '#A435F0'),
    gradient: ['#2a0d47', '#5a1799', '#150523'], tagline: 'Skills, on demand', demo: 'education'
  },
  masterclass: {
    id: 'masterclass', name: 'MasterClass', category: 'education', kind: 'real',
    color: '#e0e0e0', color2: '#a1a1a6',
    wordmark: wm('MasterClass', '#f5f5f7', '#c0c0c4', { size: 0.86 }),
    gradient: ['#161618', '#2c2c30', '#050505'], tagline: 'Learn from the best', demo: 'education'
  },
  linkedin: {
    id: 'linkedin', name: 'LinkedIn Learning', category: 'education', kind: 'real',
    color: '#0A66C2', color2: '#2b8ae0',
    wordmark: wm('in', '#eaf2fb', '#0A66C2', { badge: true, label: 'Learning' }),
    gradient: ['#062944', '#0a66c2', '#03121f'], tagline: 'Professional courses', demo: 'education'
  },
  skillshare: {
    id: 'skillshare', name: 'Skillshare', category: 'education', kind: 'real',
    color: '#00d46f', color2: '#00b25c',
    wordmark: wm('Skillshare', '#e9fff4', '#00d46f', { size: 0.94 }),
    gradient: ['#053023', '#0a5c41', '#02160f'], tagline: 'Creative classes', demo: 'education'
  },
  learnbox: {
    id: 'learnbox', name: 'LearnBox', category: 'education', kind: 'demo',
    color: '#2997ff', color2: '#0071e3',
    wordmark: wm('LearnBox', '#e9f2ff', '#2997ff'),
    gradient: ['#0a1a3a', '#123a7d', '#05091f'], tagline: 'Demo learning provider', demo: 'education'
  },

  /* ---------------- AI Models ---------------- */
  chatgpt: {
    id: 'chatgpt', name: 'ChatGPT Plus', category: 'ai', kind: 'real',
    color: '#10A37F', color2: '#0e8c6d',
    wordmark: wm('ChatGPT', '#e9fff8', '#10A37F', { size: 0.92 }),
    gradient: ['#062b22', '#0d6b54', '#03140f'], tagline: 'Advanced reasoning & tools', demo: 'ai'
  },
  claude: {
    id: 'claude', name: 'Claude Pro', category: 'ai', kind: 'real',
    color: '#D97757', color2: '#c25f3f',
    wordmark: wm('Claude', '#fbeee7', '#D97757'),
    gradient: ['#2e1a12', '#8c4b30', '#160b06'], tagline: 'Thoughtful, capable assistant', demo: 'ai'
  },
  gemini: {
    id: 'gemini', name: 'Gemini Advanced', category: 'ai', kind: 'real',
    color: '#4285F4', color2: '#9b72cb',
    wordmark: wm('Gemini', '#eef2ff', '#6f8bff', { size: 0.94 }),
    gradient: ['#131a44', '#3b4bb0', '#0a0c24'], tagline: 'Google’s most capable model', demo: 'ai'
  },
  perplexity: {
    id: 'perplexity', name: 'Perplexity Pro', category: 'ai', kind: 'real',
    color: '#20b8cd', color2: '#20808D',
    wordmark: wm('perplexity', '#e6fbff', '#20b8cd', { size: 0.82 }),
    gradient: ['#062a30', '#0d6470', '#031316'], tagline: 'Answer engine with sources', demo: 'ai'
  },
  midjourney: {
    id: 'midjourney', name: 'Midjourney', category: 'ai', kind: 'real',
    color: '#8a7dff', color2: '#5b4fd6',
    wordmark: wm('Midjourney', '#eeecff', '#8a7dff', { size: 0.84 }),
    gradient: ['#161433', '#38318c', '#080720'], tagline: 'Generative image studio', demo: 'ai'
  },
  twelveai: {
    id: 'twelveai', name: 'twelve AI', category: 'ai', kind: 'demo',
    color: '#2997ff', color2: '#0071e3',
    wordmark: wm('twelve AI', '#eaf4ff', '#2997ff'),
    gradient: ['#0a1830', '#123a7d', '#04091a'], tagline: 'Demo AI provider', demo: 'ai'
  }
}

export const getProvider = (id) => PROVIDERS[id]
export const providerList = Object.values(PROVIDERS)

export const CATEGORIES = [
  { id: 'entertainment', label: 'Entertainment', icon: 'film' },
  { id: 'education', label: 'Education', icon: 'book' },
  { id: 'ai', label: 'AI Models', icon: 'sparkle' }
]
