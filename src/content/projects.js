// Display order of the category groups in the project tree. Empty categories are hidden.
export const categories = ['Personal Full-Stack Projects', 'Hackathon Prototypes', 'Frontend Projects']

// status: 'Planned' | 'In progress' | 'Completed' (overview cards show the year instead when Completed)
// tagline: one concise sentence for the overview cards (summary is shown in the details view).
// icon: small logo for the card glyph; image: cover screenshot; gallery: screenshots for the details
// view; video: short reel (rendered from video/ with Remotion). All paths are relative to /public.
// challenge / contribution / solution / lessons: null renders as "not documented yet".
// links: leave '' when there is nothing to link — the UI shows it as unavailable.
const shots = (id, n) => Array.from({ length: n }, (_, i) => `projects/${id}/${i + 1}.jpg`)

export const projects = [
  {
    id: 'bloodcare',
    title: 'BloodCare',
    category: 'Personal Full-Stack Projects',
    status: 'Completed',
    year: 2026,
    icon: 'projects/bloodcare/icon.svg',
    image: 'projects/bloodcare/2.jpg',
    gallery: shots('bloodcare', 5),
    video: 'projects/bloodcare/reel.mp4',
    tagline: 'Blood donation cards, stock and hospital requests, traceable end to end by QR.',
    summary:
      'A blood donation card management system for a national blood service. Donors register and book online; staff run donations, cards and stock; the laboratory screens and processes units; hospitals request blood and report what happened to it. Every card and unit label carries a QR code that opens its live record.',
    stack: ['Vue 3', 'Vuetify', 'Laravel 13', 'PHP 8.4', 'MySQL 8.4', 'Docker', 'vue-i18n'],
    challenge:
      'Model the whole donation chain (donor, staff, laboratory and hospital) with separate workspaces and permissions, while keeping every unit of blood traceable from donation to transfusion.',
    contribution: 'Own project idea; product design and full-stack build across the Vue front end and the Laravel API.',
    solution:
      'A headless Laravel API with session auth and TOTP two-factor sign-in, and a Vue 3 + Vuetify app with a public donor site plus staff, laboratory and hospital workspaces. Blood requests are allocated first-expiry-first-out, adverse reactions are reported through haemovigilance, and reports export to CSV with a full audit history. English and Myanmar, light and dark themes, Docker for local setup.',
    lessons: null,
    links: { demo: '', github: 'https://github.com/Harry-Pyae/blood-donation-card-system' },
  },
  {
    id: 'internshipjp',
    title: 'InternshipJP',
    category: 'Personal Full-Stack Projects',
    status: 'Completed',
    year: 2026,
    icon: 'projects/internshipjp/icon.svg',
    image: 'projects/internshipjp/1.jpg',
    gallery: shots('internshipjp', 5),
    video: 'projects/internshipjp/reel.mp4',
    tagline: 'Internships matched on verified skills, in English and Myanmar.',
    summary:
      'An internship platform where students upload certificates, an administrator verifies them before employers can see them, and matching uses verified skills only. Students, employers and administrators each get their own workspace, with an AI assistant throughout.',
    stack: ['React 19', 'Spring Boot 3.5', 'Java 24', 'MariaDB', 'Flyway', 'Bootstrap 5'],
    challenge:
      'Build trust into matching: employers only ever see qualifications an administrator has checked, and every match score explains itself, for a bilingual audience.',
    contribution:
      'Member 1 of a four-person team (CST-6108, University of Information Technology): project foundation, database, integration, shared components and the bilingual layer.',
    solution:
      'A Spring Boot REST API with session and CSRF protection, TOTP or email-OTP two-factor sign-in and Flyway migrations, with a React front end. Certificate verification gates what employers see, match scores come from verified skills, and AI features (chat through Groq or Gemini, plus offline skill-gap and matching helpers) support each role.',
    lessons: null,
    links: { demo: '', github: 'https://github.com/Harry-Pyae/InternshipJP' },
  },
  {
    id: 'clickwise',
    title: 'ClickWise AI Tools Hub',
    category: 'Hackathon Prototypes',
    status: 'Completed',
    year: 2026,
    icon: null,
    image: 'projects/clickwise/2.jpg',
    gallery: shots('clickwise', 5),
    video: 'projects/clickwise/reel.mp4',
    tagline: 'Detect AI-generated text, images and audio, with scores that explain themselves.',
    summary:
      'One of Harry’s two major hackathon builds: an AI-awareness hub for checking text, images and audio for AI-generated content, with charts that explain each score, highlighted passages, masking and humanising tools, and a quiz with a leaderboard.',
    stack: ['Next.js 16', 'React 19', 'Tailwind CSS 4', 'Supabase', 'Groq (Qwen, Whisper)', 'Recharts'],
    challenge:
      'Give people a clear, explainable read on whether content was AI-generated across three media types, rather than a single opaque percentage.',
    contribution: null,
    solution:
      'Text scores blend local statistical analysis with a language-model read; images are checked with a vision model and audio is transcribed with Whisper. Results show a gauge, category breakdown, risk radar, score distribution and highlighted sentences. Supabase handles accounts and history; masking and humanising run locally with rule-based transforms.',
    lessons: null,
    links: { demo: '', github: 'https://github.com/Harry-Pyae/ai-detection-project' },
  },
  {
    id: 'flavourwave',
    title: 'FlavourWave',
    category: 'Hackathon Prototypes',
    status: 'Completed',
    year: 2023,
    icon: 'projects/flavourwave/icon.png',
    image: 'projects/flavourwave/1.jpg',
    gallery: shots('flavourwave', 4),
    video: 'projects/flavourwave/reel.mp4',
    tagline: 'A drinks storefront with Stripe pre-orders and a delivery-tracking back office.',
    summary:
      'One of Harry’s two major hackathon builds, made with team Axionix: a customer storefront for browsing drinks, pre-ordering and paying with Stripe, connected to an internal admin for pre-orders, products, recipes, factories, warehouses, logistics and drivers.',
    stack: ['Next.js 14', 'TypeScript', 'Tailwind CSS', 'Clerk', 'Stripe', 'Laravel 10', 'Backpack', 'MySQL'],
    challenge:
      'Connect a consumer storefront to the operations behind it, from pre-order and payment to production, stock and delivery, within a hackathon timeframe.',
    contribution: null,
    solution:
      'A Next.js storefront with Clerk sign-in, Stripe checkout, TanStack Query and a map-based delivery view, plus a Laravel 10 + Backpack admin with department-based roles, pre-order acceptance and sales dashboards, joined by a JSON API.',
    lessons: null,
    links: { demo: '', github: 'https://github.com/linhtutkyawdev/Axionix_FlavourWave' },
  },
  {
    id: 'astrocare',
    title: 'AstroCare',
    category: 'Hackathon Prototypes',
    status: 'Completed',
    year: 2026,
    icon: 'projects/astrocare/icon.png',
    image: 'projects/astrocare/2.jpg',
    gallery: shots('astrocare', 4),
    video: 'projects/astrocare/reel.mp4',
    tagline: 'Astronaut health trends measured against each crew member’s own baseline.',
    summary:
      'A crew health self-monitoring prototype that compares each astronaut’s last seven days with their own three-week baseline and explains changes in plain, neutral language, with no diagnoses and no risk scores. Built by a five-member student team in a hackathon practice round, using synthetic data.',
    stack: ['React 18', 'TypeScript', 'Vite', 'Tailwind CSS 4', 'Recharts', 'NASA DONKI API'],
    challenge:
      'Surface meaningful health changes for crew without alarming them or pretending to diagnose, and stay useful when data is missing or stale.',
    contribution: null,
    solution:
      'Personal-baseline statuses (within range, worth reviewing at ±15%, insufficient or stale data), trend charts with the baseline shaded, daily check-ins, upcoming-task context, a decision log, demo scenarios, a NASA solar-flare feed with a cached fallback, QR crew badges, English and Myanmar, and light and dark themes.',
    lessons: null,
    links: { demo: 'https://astro-care-ai.vercel.app', github: 'https://github.com/Harry-Pyae/AstroCareAI' },
  },
  {
    id: 'chatledger',
    title: 'Chat to Ledger',
    category: 'Hackathon Prototypes',
    status: 'Completed',
    year: 2026,
    icon: null,
    image: 'projects/chatledger/2.jpg',
    gallery: shots('chatledger', 2),
    video: 'projects/chatledger/reel.mp4',
    tagline: 'Turns messy Messenger and Viber sales chats into a clean order book.',
    summary:
      'An AI order book for Myanmar small businesses: paste chat text in mixed Burmese and English, and Gemini extracts structured orders for review before they reach a sales ledger with revenue, unpaid amounts and repeat customers. Built for the Cursor Myanmar AI Hackathon 2026 (uab Bank topic: AI for SMEs & Entrepreneurs).',
    stack: ['React 19', 'Vite', 'Tailwind CSS 4', 'Supabase', 'Google Gemini', 'Netlify Functions'],
    challenge:
      'Read informal, mixed-language chat reliably enough that a seller can trust the extracted orders, without saving anything they have not reviewed.',
    contribution: 'Built solo in about three hours with an AI-assisted workflow: Cursor’s agent for the code, Claude for planning and prompts.',
    solution:
      'Netlify Functions call Gemini to extract orders, draft Burmese payment reminders and write business insights. A review table lets the seller fix rows before saving to Supabase; the ledger shows revenue, orders, top product, money owed, average order value and repeat customers, with search and paid/unpaid toggles.',
    lessons: null,
    links: { demo: 'https://chat-ledger.netlify.app', github: 'https://github.com/Harry-Pyae/chat-ledger' },
  },
  {
    id: 'mymedia',
    title: 'MyMedia',
    category: 'Personal Full-Stack Projects',
    status: 'Completed',
    year: 2023,
    icon: 'projects/mymedia/icon.png',
    image: 'projects/mymedia/1.jpg',
    gallery: shots('mymedia', 3),
    video: 'projects/mymedia/reel.mp4',
    tagline: 'A news and media admin with categories, posts and trending stats.',
    summary:
      'An earlier Laravel project (2023): a news and media site where admins manage categories and posts with images in a Laravel dashboard, and readers use a separate Vue client through an API that also records post views for a trending list.',
    stack: ['Laravel 10', 'Jetstream', 'Livewire', 'MySQL', 'AdminLTE'],
    challenge: 'Separate content management from reading: a dashboard for editors and a public API for a single-page client.',
    contribution: null,
    solution:
      'Laravel 10 with Jetstream authentication; category and post management with image upload and search; admin account management; and an API for sign-in, registration, post lists, search, details and view tracking that powers the trending posts view.',
    lessons: null,
    links: { demo: '', github: 'https://github.com/Harry-Pyae/MyMediaProject' },
  },
  {
    id: 'pizza',
    title: 'Pizza Order System',
    category: 'Personal Full-Stack Projects',
    status: 'Completed',
    year: 2022,
    icon: null,
    image: 'projects/pizza/1.jpg',
    gallery: shots('pizza', 5),
    video: 'projects/pizza/reel.mp4',
    tagline: 'Browse pizzas, fill a cart and order, with an admin to run the shop.',
    summary:
      'An early Laravel project (December 2022): a pizza ordering site with separate customer and admin experiences. Customers filter the menu by category, view details, add to cart and track orders; admins manage categories, pizzas, orders, users and contact messages.',
    stack: ['Laravel 9', 'Jetstream', 'Blade', 'jQuery (AJAX)', 'MySQL'],
    challenge: 'Serve two roles from one app, routing each user to the right experience after sign-in, and keep the cart and ordering responsive without full page reloads.',
    contribution: null,
    solution:
      'Role-based redirects and middleware for the admin and customer areas; AJAX cart, ordering and order-status updates; category filtering, view counts and order history; and admin management for the menu, orders, users and messages.',
    lessons: null,
    links: { demo: '', github: 'https://github.com/Harry-Pyae/PizzaOrderSystem' },
  },
]
