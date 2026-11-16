// A certificate shown as a cleaned-up copy, with the photo of the paper original beside it.
const cleaned = (id) => ({ file: `certificates/${id}.jpg`, photo: `certificates/${id}-photo.jpg` })

// Everything personal lives here. Edit freely; the layout adapts.
export const profile = {
  name: 'Pyae Sone Htut',
  monogram: 'P',
  title: 'IT Student · Junior Full-Stack Developer',
  intro:
    'I build web applications with Vue.js on the front end and Laravel and PHP behind it, from my own projects to hackathon prototypes.',
  focusStack: ['Vue.js', 'Laravel', 'PHP', 'MySQL'],

  // A short film of this portfolio, linked after the hero's two buttons. null hides it.
  film: { href: 'https://youtu.be/qzsSEy04Rj0', label: 'Watch the tour' },

  // Square photo in /public/profile (shown in a circle in the hero and About). null shows the monogram.
  portrait: 'profile/pyae-sone-htut.jpg',

  // The About narrative, first person, one short paragraph per entry.
  about: [
    'I’m an IT student and junior full-stack developer, working mostly in Vue.js, Laravel, PHP and MySQL.',
    'I like knowing how things work, so I build features from scratch, and I use AI tools to move faster without skipping the understanding.',
    'Right now that means my own apps, hackathon prototypes, and two document tools in the ClariFile suite.',
  ],

  // Milestones near About. `badges`: issuer + certificate (`file`: its image in /public, opened from the badge;
  // `photo`: a photo of the paper original when `file` is a cleaned-up copy, disclosed and linked in the viewer);
  // `projects` links to project ids (opens their details).
  milestones: [
    {
      title: 'Certified full-stack web developer',
      badges: [
        { by: 'CodeLab', name: 'Laravel + Vue JS Full Stack, 2023', ...cleaned('codelab-laravel-vue-full-stack') },
        { by: 'CodeLab', name: 'Fullstack Developer, 2023', ...cleaned('codelab-fullstack-developer') },
        { by: 'CodeLab', name: 'Professional Web Design, 2022', ...cleaned('codelab-professional-web-design') },
      ],
    },
    {
      title: 'IT Passport',
      text: 'IT fundamentals, management and strategy.',
      badges: [{ by: 'ITPEC', name: 'IT Passport (IP)', ...cleaned('itpec-it-passport') }],
    },
    {
      title: 'Hackathons',
      text: 'Building under a deadline, again and again.',
      badges: [
        { by: 'NASA', name: 'Space Apps Challenge 2026', file: 'certificates/nasa-space-apps-2026.jpg' },
        { by: 'Cursor', name: 'AI Hackathon Myanmar 2026', file: 'certificates/cursor-ai-hackathon-myanmar-2026.jpg' },
        { by: 'UNESCO', name: 'Youth Hackathon 2026', file: 'certificates/unesco-youth-hackathon-2026.jpg' },
        { by: 'JICA', name: 'MJC Job-Matching Hackathon, December 2023', ...cleaned('jica-mjc-job-matching-hackathon') },
      ],
      projects: ['ignis', 'flavourwave', 'clickwise', 'astrocare', 'chatledger'],
    },
    { title: 'Development offers', text: 'Received multiple development offers.' },
  ],

  skills: {
    core: [
      { group: 'Frontend', items: ['Vue.js', 'JavaScript', 'HTML5', 'CSS3', 'Axios'] },
      { group: 'Backend & environment', items: ['Laravel', 'PHP', 'XAMPP', 'MySQL'] },
    ],
    general: ['Tailwind CSS', 'Bootstrap', 'Docker', 'Java'],
    // Technologies I'm currently deepening. `note` says how I'm using it; `projects` links where it shows up.
    exploring: [
      { name: 'Python', note: 'Building two offline desktop apps with it.', projects: ['classifile', 'summarease'] },
      { name: 'PostgreSQL', note: 'Through Supabase, for accounts, history, saved orders and a row-level-secured catalog.', projects: ['ignis', 'clickwise', 'chatledger'] },
      { name: 'React', note: 'Front ends for a team project and three hackathon builds.', projects: ['internshipjp', 'ignis', 'chatledger', 'astrocare'] },
      { name: 'Next.js', note: 'Front ends for two hackathon projects.', projects: ['clickwise', 'flavourwave'] },
      { name: 'Spring Boot', note: 'The REST API and Flyway migrations behind a team project.', projects: ['internshipjp'] },
    ],
  },

  // Beyond the Code: a few things I enjoy. `icon` picks one of the line drawings in InterestsSection.vue.
  interests: [
    { icon: 'chess', title: 'Chess', text: 'The planning, the trade-offs, and finding what I missed after a game.' },
    { icon: 'story', title: 'Story-driven games', text: 'Memorable stories, characters and choices that stay with you.' },
    { icon: 'cup', title: 'Cappuccino', text: 'Always a welcome part of the day.' },
  ],

  contactLede: 'Have a role, a project, or an idea in mind? I’d be happy to talk.',

  // Only entries with an href are shown; leave href empty to hide a channel.
  contact: [
    { label: 'Email', href: 'mailto:pyae.sone.htut.99@gmail.com', text: 'pyae.sone.htut.99@gmail.com' },
    { label: 'GitHub', href: 'https://github.com/Harry-Pyae', text: 'github.com/Harry-Pyae' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/lighto67', text: 'linkedin.com/in/lighto67' },
  ],
}
