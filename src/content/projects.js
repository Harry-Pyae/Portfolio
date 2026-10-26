// Everything about the projects lives in this file: grouping, order, the hero selection and each case study.

// Project groups, in display order. Groups without `section` are branches of the main project tree;
// `section` places a group in its own part of the page ('explorations' = In development,
// 'roots' = Where it began, drawn into the footer roots). `lead` gives a group's cards slightly more
// emphasis; `quiet` draws a smaller, calmer branch. `label` is the default kind of project shown on hero
// cards, the centre of the project view and its header (a project's own `kind` overrides it).
// `branch` names the group in the project view's explorer when it differs from `name` (groups that share
// a branch are listed together there).
export const categories = [
  { name: 'Recent projects', label: 'Personal project', lead: true },
  { name: 'Hackathon projects', label: 'Hackathon project' },
  { name: 'More hackathon projects', label: 'Hackathon project', branch: 'Hackathon projects' },
  { name: 'Earlier work', label: 'Earlier work', quiet: true },
  { name: 'In development', label: 'ClariFile suite', section: 'explorations' },
  { name: 'Where it began', label: 'Earliest work', section: 'roots', quiet: true, branch: 'Roots' },
]

// Projects (or suites) shown in the hero spiral, in carousel order. Every project is also on the page.
export const featured = ['bloodcare', 'internshipjp', 'clarifile', 'flavourwave', 'clickwise', 'astrocare', 'chatledger']

// Fields (paths are relative to /public):
//   tagline       one sentence for cards; problem / solution: one or two sentences each
//   highlights    a few verified features or implementation details; a ['Lead', 'text'] pair adds a lead phrase
//   contribution  only where documented (omit otherwise; nothing is shown)
//   context       scope, team or time constraints when known, or the project's place in the journey
//   kind          optional: what kind of project it is, when it differs from its group's label
//   short         optional short name for compact links (cards keep the full title)
//   glyph         monoline symbol for cards and the orbit (one of the set in ProjectArt.vue)
//   image         poster / cover screenshot; gallery: screenshots; icon: the project's own logo (optional)
//   video         walkthrough reel rendered from video/ with Remotion
//   videoNote     optional one-line disclosure beside the media (sample data, presentation copy, screenshots)
//   limitation    optional note shown beside the links (e.g. a live demo with a broken feature)
//   links         only real URLs; leave '' to hide a link
//   status        optional development status, shown on cards and in details (e.g. 'In development')
//   suite         id of the suite an app belongs to (see `suites`)
const shots = (id, n) => Array.from({ length: n }, (_, i) => `projects/${id}/${i + 1}.jpg`)

export const projects = [
  {
    id: 'bloodcare',
    glyph: 'drop',
    title: 'BloodCare',
    category: 'Recent projects',
    year: 2026,
    icon: 'projects/bloodcare/icon.svg',
    image: 'projects/bloodcare/2.jpg',
    gallery: shots('bloodcare', 5),
    video: 'projects/bloodcare/reel.mp4',
    tagline: 'Blood donation cards, stock and hospital requests, traceable end to end by QR.',
    problem:
      'A national blood service needs donors, staff, the laboratory and hospitals in one system, with every unit of blood traceable from donation to transfusion.',
    solution:
      'A Laravel API with a Vue 3 + Vuetify app: a public donor site plus separate staff, laboratory and hospital workspaces. Every card and unit label carries a QR code that opens its live record.',
    highlights: [
      'Session auth with TOTP two-factor sign-in and role-based workspaces',
      'Blood requests allocated first-expiry-first-out, with haemovigilance reporting',
      'Live inventory by blood group, donation cards and CSV reports with a full audit history',
      'English and Myanmar, light and dark themes, Docker for local setup',
    ],
    contribution: 'Own project idea; product design and full-stack build across the Vue front end and the Laravel API.',
    context: null,
    stack: ['Vue 3', 'Vuetify', 'Laravel 13', 'PHP 8.4', 'MySQL 8.4', 'Docker', 'vue-i18n'],
    links: { demo: '', github: 'https://github.com/Harry-Pyae/blood-donation-card-system' },
  },
  {
    id: 'internshipjp',
    glyph: 'cap',
    kind: 'University team project',
    title: 'InternshipJP',
    category: 'Recent projects',
    year: 2026,
    icon: 'projects/internshipjp/icon.svg',
    image: 'projects/internshipjp/1.jpg',
    gallery: shots('internshipjp', 5),
    video: 'projects/internshipjp/reel.mp4',
    tagline: 'Internships matched on verified skills, in English and Myanmar.',
    problem:
      'Matching students to internships only works if employers can trust the skills shown and every score explains itself, for a bilingual audience.',
    solution:
      'Students upload certificates, an administrator verifies them before employers can see them, and match scores use verified skills only. Students, employers and administrators each get their own workspace.',
    highlights: [
      ['Verified visibility', 'certificate verification gates what employers see.'],
      ['Explainable matching', 'scores use verified skills and explain their results.'],
      ['AI and offline assistance', 'Groq or Gemini chat, plus offline skill-gap and matching helpers.'],
      ['Backend and account security', 'Spring Boot REST API, CSRF protection, TOTP or email OTP, and Flyway migrations.'],
    ],
    contribution: 'Project foundation, database, integration, shared components and the bilingual layer.',
    context: 'Four-person team project for CST-6108 at the University of Information Technology.',
    stack: ['React 19', 'Spring Boot 3.5', 'Java 24', 'MariaDB', 'Flyway', 'Bootstrap 5'],
    links: { demo: '', github: 'https://github.com/Harry-Pyae/InternshipJP' },
  },
  {
    id: 'flavourwave',
    glyph: 'cup',
    title: 'FlavourWave',
    category: 'Hackathon projects',
    year: 2023,
    icon: 'projects/flavourwave/icon.png',
    image: 'projects/flavourwave/1.jpg',
    gallery: ['projects/flavourwave/1.jpg', 'projects/flavourwave/3.jpg', 'projects/flavourwave/4.jpg'], // 2.jpg (a map pin with coordinates and a blurred teammate avatar) left out
    videoNote: 'Composed from the repository’s own screenshots, not a recording of the running app.',
    video: 'projects/flavourwave/reel.mp4',
    tagline: 'A drinks storefront with Stripe pre-orders and a delivery-tracking back office.',
    problem: 'Connect a consumer storefront to the operations behind it, from pre-order and payment to production, stock and delivery.',
    solution:
      'A Next.js storefront for browsing drinks, pre-ordering and paying with Stripe, joined by a JSON API to a Laravel + Backpack admin for pre-orders, products, recipes, factories, warehouses, logistics and drivers.',
    highlights: [
      'Clerk sign-in and Stripe checkout for pre-orders',
      'Map-based delivery location picker',
      'Department-based admin roles, pre-order acceptance and sales dashboards',
    ],
    contribution: null,
    context: 'Built with team Axionix for the JICA hackathon held by the Myanmar-Japan Centre (MJC), December 2023.',
    stack: ['Next.js 14', 'TypeScript', 'Tailwind CSS', 'Clerk', 'Stripe', 'Laravel 10', 'Backpack', 'MySQL'],
    links: { demo: '', github: 'https://github.com/linhtutkyawdev/Axionix_FlavourWave' },
  },
  {
    id: 'clickwise',
    glyph: 'scan',
    short: 'ClickWise',
    title: 'ClickWise AI Tools Hub',
    category: 'Hackathon projects',
    year: 2026,
    icon: null,
    image: 'projects/clickwise/2.jpg',
    gallery: shots('clickwise', 5),
    videoNote: 'Detection screenshots show the app’s demo mode with sample results.',
    limitation: 'A hackathon prototype: live text detection is currently unavailable because its Supabase backend is inactive.',
    video: 'projects/clickwise/reel.mp4',
    tagline: 'Detect AI-generated text, images and audio, with scores that explain themselves.',
    problem: 'People need a clear read on whether text, images or audio were AI-generated, not a single opaque percentage.',
    solution:
      'Text scores blend local statistical analysis with a language-model read; images are checked with a vision model and audio is transcribed with Whisper. Charts and highlighted sentences explain each result.',
    highlights: [
      'Gauge, category breakdown, risk radar and score distribution for every check',
      'Masking and humanising tools that run locally with rule-based transforms',
      'Quiz with a leaderboard; Supabase accounts and history',
    ],
    contribution: null,
    context: 'UNESCO Youth Hackathon 2026 project.',
    stack: ['Next.js 16', 'React 19', 'Tailwind CSS 4', 'Supabase', 'Groq (Qwen, Whisper)', 'Recharts'],
    links: { demo: 'https://ai-detection-project-nine.vercel.app', github: 'https://github.com/Harry-Pyae/ai-detection-project' },
  },
  {
    id: 'astrocare',
    glyph: 'pulse',
    title: 'AstroCare AI',
    category: 'More hackathon projects',
    year: 2026,
    icon: 'projects/astrocare/icon.png',
    image: 'projects/astrocare/2.jpg',
    gallery: shots('astrocare', 4),
    video: 'projects/astrocare/reel.mp4',
    tagline: 'Astronaut health trends measured against each crew member’s own baseline.',
    problem: 'Surface meaningful health changes for crew without alarming them or pretending to diagnose, even when data is missing or stale.',
    solution:
      'Each astronaut’s last seven days are compared with their own three-week baseline and explained in plain, neutral language: no diagnoses and no risk scores.',
    highlights: [
      'Baseline statuses: within range, worth reviewing at ±15%, insufficient or stale data',
      'Trend charts with the baseline shaded, daily check-ins and a decision log',
      'NASA solar-flare feed with a cached fallback, QR crew badges, English and Myanmar',
    ],
    contribution: null,
    context: 'NASA hackathon practice round: a five-member student team, working with synthetic data.',
    stack: ['React 18', 'TypeScript', 'Vite', 'Tailwind CSS 4', 'Recharts', 'NASA DONKI API'],
    links: { demo: 'https://astro-care-ai.vercel.app', github: 'https://github.com/Harry-Pyae/AstroCareAI' },
  },
  {
    id: 'chatledger',
    glyph: 'chat',
    title: 'Chat to Ledger',
    category: 'More hackathon projects',
    year: 2026,
    icon: null,
    image: 'projects/chatledger/2.jpg',
    gallery: shots('chatledger', 2),
    video: 'projects/chatledger/reel.mp4',
    tagline: 'Turns messy Messenger and Viber sales chats into a clean order book.',
    problem: 'Small Myanmar businesses take orders in informal, mixed Burmese and English chats that are hard to turn into a reliable record of sales and unpaid amounts.',
    solution:
      'Paste the chat, Gemini extracts structured orders, and the seller reviews and fixes them before anything is saved to a sales ledger.',
    highlights: [
      'Review table: nothing is saved until the seller confirms',
      'Ledger with revenue, money owed, top product, average order value and repeat customers',
      'Burmese payment reminders and business insights drafted by Gemini through Netlify Functions',
    ],
    contribution: 'Built solo with an AI-assisted workflow: Cursor’s agent for the code, Claude for planning and prompts.',
    context: 'Cursor Myanmar AI Hackathon 2026 (uab Bank topic: AI for SMEs & Entrepreneurs), built in about three hours.',
    stack: ['React 19', 'Vite', 'Tailwind CSS 4', 'Supabase', 'Google Gemini', 'Netlify Functions'],
    links: { demo: 'https://chat-ledger.netlify.app', github: 'https://github.com/Harry-Pyae/chat-ledger' },
  },
  {
    id: 'mymedia',
    glyph: 'news',
    title: 'MyMedia',
    category: 'Earlier work',
    year: 2022,
    icon: 'projects/mymedia/icon.png',
    image: 'projects/mymedia/1.jpg',
    gallery: shots('mymedia', 3),
    videoNote: 'Walkthrough uses sample categories and posts.',
    video: 'projects/mymedia/reel.mp4',
    tagline: 'A news and media admin with categories, posts and trending stats.',
    problem: 'Separate content management from reading: a dashboard for editors and a public API for a single-page client.',
    solution:
      'A Laravel dashboard where admins manage categories and posts with images, and a JSON API for a separate Vue client that also records post views for a trending list.',
    highlights: [
      'Jetstream authentication and admin account management',
      'Category and post management with image upload and search',
      'API for sign-in, post lists, search, details and view tracking',
    ],
    contribution: 'My own app from 2022: where I first split the editors’ dashboard from the reader’s side, and where I met my longest-running bug.',
    context: 'Earlier work: a Laravel admin plus a JSON API for a separate Vue client, a step toward the Vue + Laravel API apps that followed. The repository holds a later Laravel 10 upgrade.',
    stack: ['Laravel 10', 'Jetstream', 'Livewire', 'MySQL', 'AdminLTE'],
    links: { demo: '', github: 'https://github.com/Harry-Pyae/MyMediaProject' },
  },
  {
    id: 'pizza',
    glyph: 'slice',
    title: 'Pizza Order System',
    category: 'Earlier work',
    year: 2022,
    icon: null,
    image: 'projects/pizza/1.jpg',
    gallery: shots('pizza', 5),
    videoNote: 'Walkthrough uses a sample menu with generated pizza images.',
    video: 'projects/pizza/reel.mp4',
    tagline: 'Browse pizzas, fill a cart and order, with an admin to run the shop.',
    problem: 'Serve customers and shop admins from one app, and keep the cart and ordering responsive without full page reloads.',
    solution:
      'Role-based redirects and middleware send each user to the right area; the cart, ordering and order-status updates run over AJAX.',
    highlights: [
      'Menu filtering by category, view counts and order history',
      'Admin management for categories, pizzas, orders, users and contact messages',
    ],
    contribution: 'My own build from 2022: my first app with two kinds of users to serve, the customers ordering and the admins running the shop.',
    context: 'Earlier work: server-rendered Laravel with Blade and jQuery AJAX, the groundwork for the API-driven apps that followed.',
    stack: ['Laravel 9', 'Jetstream', 'Blade', 'jQuery (AJAX)', 'MySQL'],
    links: { demo: '', github: 'https://github.com/Harry-Pyae/PizzaOrderSystem' },
  },
  {
    id: 'classifile',
    glyph: 'sort',
    title: 'ClassiFile',
    category: 'In development',
    suite: 'clarifile',
    status: 'Release candidate',
    year: 2026,
    icon: 'projects/classifile/icon.svg',
    image: 'projects/classifile/1.jpg',
    gallery: shots('classifile', 4),
    video: 'projects/classifile/reel.mp4',
    tagline: 'Sorts documents by their content: files a copy when sure, asks when not, and learns from the answers.',
    problem:
      'Sorting folders of mixed documents takes time, and an automatic sorter only helps if it knows when to ask and never loses or alters the originals.',
    solution:
      'A Windows desktop app that classifies documents offline and files a verified copy when one category is clearly ahead. Everything else waits in “Needs your decision” with the best categories and the reason.',
    highlights: [
      'Offline classification: word-level TF-IDF built on the Python standard library, with no network calls',
      'Confidence-gated filing (Strict by default), only into categories with at least three confirmed documents',
      'Learns from your decisions and existing folders; matching updates every 10 decisions and keeps the previous version if the new one would make more mistakes',
      'Originals are never changed, moved or deleted: it works on hash-verified copies and never overwrites',
    ],
    contribution:
      'My own project, from idea to release candidate: deciding when it should file and when it should ask, an offline classifier on Python’s standard library, and the copy-only rules that keep originals untouched.',
    context: 'Release candidate 1.0.0-rc.2, under active development, for a small pilot on Windows; English only for now. Part of the ClariFile suite.',
    stack: ['Python 3.12', 'PySide6', 'PyMuPDF', 'Tesseract OCR', 'SQLite', 'PyInstaller'],
    links: { demo: '', github: 'https://github.com/ClariFile/ClassiFile' },
  },
  {
    id: 'summarease',
    glyph: 'summary',
    title: 'SummarEase',
    category: 'In development',
    suite: 'clarifile',
    status: 'In development',
    year: 2026,
    icon: 'projects/summarease/icon.svg',
    image: 'projects/summarease/1.jpg',
    gallery: shots('summarease', 4),
    video: 'projects/summarease/reel.mp4',
    tagline: 'Summarizes a document at the level of detail you choose, with every line linked to its source.',
    problem: 'A long document needs a quick read you can trust, so every line of a summary should lead back to where it came from.',
    solution:
      'An offline desktop app with a two-pane reading workspace. Summaries are extractive: every line is taken word for word from the document and links to its page, slide or section.',
    highlights: [
      'Four nested detail levels: Brief, Key points, Detailed and Comprehensive',
      'Source references: following a summary line scrolls the source pane to that page',
      'Copy, or export to searchable PDF or Word; an export is checked and never overwrites a file',
      'Open, paste or drag in documents; OCR text and gaps are marked',
    ],
    contribution:
      'My own project, built around one rule I set for it: every line of a summary must lead back to where it came from.',
    context:
      'In development: reading, summaries and export work; evaluation on real documents has not been run yet. Part of the ClariFile suite.',
    stack: ['Python 3.12', 'PySide6', 'PyMuPDF'],
    links: { demo: '', github: 'https://github.com/ClariFile/SummarEase' },
  },
  {
    id: 'fhcp',
    glyph: 'code',
    title: 'FHCP',
    category: 'Where it began',
    icon: null,
    image: 'projects/fhcp/1.jpg',
    gallery: shots('fhcp', 4),
    videoNote: 'Presentation copy: the original film and series images are replaced with generated artwork.',
    video: 'projects/fhcp/reel.mp4',
    tagline: 'My first HTML and CSS page: a one-page fan site for the series Supernatural.',
    highlights: [
      'Hand-written HTML and CSS, no JavaScript',
      'Season cards and detail blocks that scale up on hover',
      'Media queries from 320 px up to 3840 px wide',
    ],
    context:
      'Where it began: my first project using only HTML and CSS, pushed to GitHub in May 2022. Its buttons, links and sign-up form are layout only.',
    stack: ['HTML5', 'CSS3', 'MDB UI Kit (CSS)', 'Font Awesome', 'Boxicons'],
    links: { demo: '', github: 'https://github.com/Harry-Pyae/FHCP' },
  },
  {
    id: 'cinemagichub',
    glyph: 'film',
    title: 'CineMagicHub',
    category: 'Where it began',
    year: 2023,
    icon: 'projects/cinemagichub/icon.png',
    image: 'projects/cinemagichub/1.jpg',
    gallery: shots('cinemagichub', 4),
    videoNote: 'Presentation copy: the original film images are replaced with generated artwork.',
    video: 'projects/cinemagichub/reel.mp4',
    tagline: 'An early movie-themed landing page with dropdown menus and hover effects.',
    highlights: [
      'Bootstrap 4 navbar with Movies and Guest dropdowns',
      'Featured film section, a hero grid and a Popular Movies row that lifts on hover',
      'Responsive layout: the hero grid steps aside on small screens',
    ],
    context:
      'Where it began: built in 2023 while learning HTML, CSS and Bootstrap, and uploaded to GitHub later. Search, log-in, watch and download are layout only.',
    stack: ['HTML5', 'CSS3', 'Bootstrap 4', 'Font Awesome'],
    links: { demo: '', github: 'https://github.com/Harry-Pyae/CineMagicHub-2023' },
  },
]

// A suite groups related applications under one name; it is not a project of its own. Its card opens
// an overview that leads to each app. `integration` describes how the apps relate, as currently planned.
export const suites = [
  {
    id: 'clarifile',
    glyph: 'folder',
    title: 'ClariFile',
    category: 'In development',
    kind: 'Desktop suite',
    status: 'In development',
    icon: 'projects/clarifile/icon.svg',
    tagline: 'Companion desktop tools for organizing documents and creating source-linked summaries.',
    apps: ['classifile', 'summarease'],
    integration: {
      label: 'Planned companion integration',
      text: 'Both applications work on their own and never share a database. Discovering the companion app and handing a document to it, with your permission, is the intended workflow; the integration design is still a draft and not built.',
    },
    links: { demo: '', github: '' },
  },
]

// Engineering story from the author's own account, from building MyMedia in 2022. It is told in About and
// inside that project's details (`project`: the project id; null = About only).
export const story = {
  published: true,
  project: 'mymedia',
  year: 2022,
  label: 'My longest-running bug', // shown beside the year
  title: 'Getting pagination right',
  teaser: 'Two months stuck, one method to fix it.',
  parts: [
    ['The app', 'MyMedia: a Vue front end, a Laravel API via Axios, MySQL underneath. Lists needed pages.'],
    ['The bug', 'For two months paging never worked: my query used get(), which returns every row and no page details.'],
    ['The fix', 'paginate() returns one page plus current page, last page and total. Page 2 finally meant page 2.'],
    ['The lesson', 'Check what a method really returns before blaming the code around it.'],
  ],
  // Illustrative only: written for this page, not the original code.
  code: `// before: every row, no page info
Post::latest()->get();

// after: one page + page details
Post::latest()->paginate(10);`,
}

const byId = (id) => projects.find((p) => p.id === id) ?? suites.find((x) => x.id === id)

// Everything the project view can show, in page order (a suite sits before its apps).
export const inspectable = categories.flatMap((c) => [...suites.filter((x) => x.category === c.name), ...projects.filter((p) => p.category === c.name)])
// The project view's branches, in page order, each with its projects.
const branchName = (c) => c.branch ?? c.name
export const branchOf = (p) => branchName(categories.find((c) => c.name === p.category))
export const branches = [...new Set(categories.map(branchName))]
  .map((name) => ({ name, items: inspectable.filter((p) => branchOf(p) === name) }))
  .filter((b) => b.items.length)
// Each project's full case study on the showcase site, by its route there.
const SHOWCASE = 'https://harry-project-showcase.vercel.app/projects/'
const caseStudies = {
  bloodcare: 'blood-donation', internshipjp: 'internship-jp', flavourwave: 'flavourwave', clickwise: 'ai-detection',
  astrocare: 'astrocare-ai', chatledger: 'chat-ledger', mymedia: 'mymedia', pizza: 'pizza-order', clarifile: 'clarifile',
  classifile: 'classifile', summarease: 'summarease', fhcp: 'fhcp', cinemagichub: 'cinemagichub',
}
export const caseStudyOf = (p) => (caseStudies[p.id] ? SHOWCASE + caseStudies[p.id] : '')
export const featuredProjects = featured.map(byId).filter(Boolean)
export const categoryOf = (p) => categories.find((c) => c.name === p.category)
// What kind of project it is: its own `kind`, else its group's label.
export const kindOf = (p) => p.kind ?? categoryOf(p)?.label ?? ''
// Highlights as { lead, text }: a plain string has no lead phrase.
export const highlightsOf = (p) => (p.highlights ?? []).map((h) => (Array.isArray(h) ? { lead: h[0], text: h[1] } : { lead: '', text: h }))
export const appsOf = (suite) => suite.apps.map(byId)
export const inGroup = (name) => projects.filter((p) => p.category === name)
