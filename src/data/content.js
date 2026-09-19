/* ============================================================
   Fictional content for the simulated provider environments.
   All titles, courses and artwork are ORIGINAL and invented for
   this prototype. Any resemblance to real works is coincidental.
   ============================================================ */

// gradient palettes for generated "posters"
const P = {
  crimson: ['#3a0d1a', '#7f1030', '#150407'],
  ocean: ['#052033', '#0a5a8c', '#02121f'],
  violet: ['#1e1240', '#4a2a8c', '#0c0824'],
  ember: ['#33140a', '#8c3d10', '#180804'],
  forest: ['#0a2818', '#155c34', '#04160d'],
  slate: ['#161a24', '#2b3550', '#080a12'],
  gold: ['#332409', '#8c6510', '#1a1204'],
  rose: ['#33101f', '#8c1f4a', '#180510'],
  teal: ['#052a2a', '#0a6b66', '#021414'],
  royal: ['#0a1440', '#1a2f8c', '#050a24']
}

let idc = 0
const mk = (title, tag, grad, meta = {}) => ({
  id: 'c' + ++idc, title, tag, grad,
  year: meta.year || 2024 + (idc % 2),
  rating: meta.rating || (['U/A 13+', 'U/A 16+', 'U/A 7+', 'A'][idc % 4]),
  match: meta.match || 85 + (idc % 14),
  seasons: meta.seasons,
  genres: meta.genres || ['Drama', 'Thriller'],
  synopsis: meta.synopsis ||
    'An original prototype title created to demonstrate the twelve temporary-access experience. This synopsis is fictional placeholder copy.'
})

export const STREAM_ROWS = [
  {
    title: 'Trending Now',
    items: [
      mk('Nightfall Protocol', 'Series', P.crimson, { seasons: 3, genres: ['Thriller', 'Sci-Fi'] }),
      mk('The Silver Coast', 'Film', P.ocean, { genres: ['Drama', 'Mystery'] }),
      mk('Neon Dynasty', 'Series', P.violet, { seasons: 2, genres: ['Action', 'Crime'] }),
      mk('Ashfall', 'Film', P.ember, { genres: ['Adventure', 'Drama'] }),
      mk('Verdant', 'Series', P.forest, { seasons: 1, genres: ['Fantasy'] }),
      mk('Cold Harbor', 'Film', P.slate, { genres: ['Thriller'] })
    ]
  },
  {
    title: 'Only on this catalog',
    items: [
      mk('Golden Hour', 'Series', P.gold, { seasons: 4, genres: ['Comedy', 'Drama'] }),
      mk('Crimson Vow', 'Film', P.rose, { genres: ['Romance'] }),
      mk('Deep Signal', 'Series', P.teal, { seasons: 2, genres: ['Sci-Fi'] }),
      mk('The Regent', 'Series', P.royal, { seasons: 3, genres: ['Historical'] }),
      mk('Midnight Larkspur', 'Film', P.violet, { genres: ['Mystery'] }),
      mk('Emberline', 'Film', P.ember, { genres: ['Action'] })
    ]
  },
  {
    title: 'Award-Winning Dramas',
    items: [
      mk('The Long Winter', 'Film', P.slate, { genres: ['Drama'] }),
      mk('Saltwater', 'Series', P.ocean, { seasons: 2, genres: ['Drama'] }),
      mk('Paper Cities', 'Film', P.gold, { genres: ['Drama', 'Romance'] }),
      mk('Ninth Avenue', 'Series', P.crimson, { seasons: 1, genres: ['Crime'] }),
      mk('Hollow Pines', 'Film', P.forest, { genres: ['Mystery'] }),
      mk('Fade to Grey', 'Series', P.slate, { seasons: 3, genres: ['Drama'] })
    ]
  },
  {
    title: 'New & Popular',
    items: [
      mk('Solstice', 'Film', P.violet, { genres: ['Sci-Fi'] }),
      mk('Ironwood', 'Series', P.ember, { seasons: 1, genres: ['Western'] }),
      mk('The Cartographer', 'Film', P.teal, { genres: ['Adventure'] }),
      mk('Blue Meridian', 'Series', P.ocean, { seasons: 2, genres: ['Drama'] }),
      mk('Static', 'Film', P.rose, { genres: ['Horror'] }),
      mk('Kingfisher', 'Series', P.royal, { seasons: 2, genres: ['Thriller'] })
    ]
  }
]

// A hero title for the streaming demo
export const STREAM_HERO = mk('Nightfall Protocol', 'Series', P.crimson, {
  seasons: 3,
  genres: ['Thriller', 'Sci-Fi', 'Mystery'],
  synopsis:
    'When a rogue signal spreads across the grid, a disgraced analyst has one night to trace it to its source before the city goes dark. A fictional flagship title for the twelve prototype.'
})

// ---------------- Education content ----------------
let cid = 0
const course = (title, instructor, grad, meta = {}) => ({
  id: 'e' + ++cid, title, instructor, grad,
  level: meta.level || ['Beginner', 'Intermediate', 'Advanced'][cid % 3],
  hours: meta.hours || 8 + (cid % 30),
  rating: meta.rating || (4.5 + (cid % 5) / 10).toFixed(1),
  learners: meta.learners || (12000 + cid * 3400),
  progress: meta.progress ?? [0, 0, 42, 0, 78, 15][cid % 6],
  tag: meta.tag || 'Course',
  desc: meta.desc ||
    'A fictional prototype course used to demonstrate temporary education access on twelve.'
})

export const EDU_ROWS = [
  {
    title: 'Continue Learning',
    items: [
      course('Python for Everybody', 'Dr. A. Rao', P.royal, { level: 'Beginner', progress: 42, hours: 22 }),
      course('Machine Learning Foundations', 'Prof. L. Menon', P.violet, { level: 'Intermediate', progress: 78, hours: 34 }),
      course('UI/UX Design Systems', 'S. Kapoor', P.rose, { level: 'Intermediate', progress: 15, hours: 18 })
    ]
  },
  {
    title: 'Most Popular',
    items: [
      course('Full Stack Development', 'M. Iyer', P.ocean, { level: 'Advanced', hours: 46, progress: 0 }),
      course('Data Analytics with SQL', 'R. Nair', P.teal, { level: 'Beginner', hours: 20, progress: 0 }),
      course('Deep Learning Specialization', 'Dr. K. Bose', P.violet, { level: 'Advanced', hours: 52, progress: 0 }),
      course('Product Management 101', 'N. Sharma', P.gold, { level: 'Beginner', hours: 14, progress: 0 }),
      course('Cloud Fundamentals', 'V. Reddy', P.slate, { level: 'Intermediate', hours: 28, progress: 0 })
    ]
  },
  {
    title: 'Recommended for you',
    items: [
      course('Frontend with React', 'A. Gupta', P.ocean, { level: 'Intermediate', hours: 24, progress: 0 }),
      course('Statistics for Data Science', 'P. Das', P.forest, { level: 'Beginner', hours: 30, progress: 0 }),
      course('Design Thinking', 'T. Bhatt', P.rose, { level: 'Beginner', hours: 10, progress: 0 }),
      course('DevOps Essentials', 'H. Jain', P.ember, { level: 'Advanced', hours: 36, progress: 0 }),
      course('Prompt Engineering', 'C. Verma', P.violet, { level: 'Beginner', hours: 8, progress: 0 })
    ]
  }
]

// ---------------- AI content ----------------
export const AI_CHATS = [
  { id: 'a1', title: 'Trip itinerary for Tokyo' },
  { id: 'a2', title: 'Refactor a React component' },
  { id: 'a3', title: 'Explain transformers simply' },
  { id: 'a4', title: 'Marketing plan for a launch' },
  { id: 'a5', title: 'Debug a SQL query' }
]

export const AI_PROMPTS = [
  'Summarize this article in 5 bullet points',
  'Write a Python script to rename files',
  'Explain quantum computing like I’m 12',
  'Draft a polite follow-up email',
  'Plan a 7-day fitness routine',
  'Turn these notes into a study guide'
]

// Original, generic assistant replies (no copyrighted content)
export const AI_REPLIES = [
  'Great question. Here’s a clear way to think about it:\n\n1. Start with the core idea and one concrete example.\n2. Break the problem into small, testable steps.\n3. Check each step against a simple case before moving on.\n\nWant me to go deeper on any of these?',
  'Here’s a concise plan you can act on right away:\n\n• Define the goal and the single most important metric.\n• List the 3 tasks that move it the most.\n• Timebox each and review at the end of the day.\n\nI can expand any section into a checklist if that helps.',
  'Sure — in plain terms: the model reads your input, weighs which parts matter most, and predicts the most useful next step. It’s pattern-matching at scale, guided by lots of examples.\n\nWould you like a short analogy or a code snippet next?'
]

export const aiReply = (i = 0) => AI_REPLIES[i % AI_REPLIES.length]

// Flat search index over content
export const SEARCH_INDEX = [
  ...STREAM_ROWS.flatMap((r) => r.items.map((i) => ({ ...i, type: 'title', kind: 'entertainment' }))),
  ...EDU_ROWS.flatMap((r) => r.items.map((i) => ({ ...i, title: i.title, type: 'course', kind: 'education' })))
]
