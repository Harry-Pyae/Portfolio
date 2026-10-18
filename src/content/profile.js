// Everything personal lives here. Edit freely; the layout adapts.
export const profile = {
  name: 'Harry',
  monogram: 'H',
  title: 'IT Student · Junior Full-Stack Developer',
  intro:
    'I build web applications with Vue.js on the front end and Laravel and PHP behind it, from my own projects to hackathon prototypes.',
  focusStack: ['Vue.js', 'Laravel', 'PHP', 'MySQL'],

  // Drop a photo in /public (e.g. public/harry.jpg) and set portrait: 'harry.jpg'.
  // null shows the monogram placeholder.
  portrait: null,

  // The About narrative, first person, one short paragraph per entry.
  about: [
    'I’m an IT student and junior full-stack developer, working mostly in Vue.js, Laravel, PHP and MySQL.',
    'I like knowing how things work, so I build features from scratch, and I use AI tools to move faster without skipping the understanding.',
    'Right now that means my own apps, hackathon prototypes, and two document tools in the ClariFile suite.',
  ],

  // Milestones near About. `badges`: issuer + certificate; `projects` links to project ids (opens their details).
  milestones: [
    {
      title: 'Certified full-stack web developer',
      badges: [{ by: 'CodeLab', name: 'Full-Stack Web Developer' }],
    },
    {
      title: 'IT Passport',
      text: 'IT fundamentals, management and strategy.',
      badges: [{ by: 'ITPEC', name: 'IT Passport (IP)' }],
    },
    {
      title: 'Hackathons',
      text: 'Building under a deadline, again and again.',
      badges: [
        { by: 'Cursor', name: 'Myanmar AI Hackathon 2026' },
        { by: 'UNESCO', name: 'Youth Hackathon 2026' },
        { by: 'JICA', name: 'Participation certificate' },
      ],
      projects: ['flavourwave', 'clickwise', 'astrocare', 'chatledger'],
    },
    { title: 'Development offers', text: 'Received multiple development offers.' },
  ],

  skills: {
    core: [
      { group: 'Frontend', items: ['Vue.js', 'JavaScript', 'HTML5', 'CSS3', 'Axios'] },
      { group: 'Backend & environment', items: ['Laravel', 'PHP', 'XAMPP', 'MySQL'] },
    ],
    general: ['Tailwind CSS', 'Bootstrap', 'Docker', 'Java'],
    // Technologies I'm currently deepening. `note` says where they show up; `projects` links them.
    exploring: [
      { name: 'Python', note: 'Building ClassiFile and SummarEase with it.', projects: ['classifile', 'summarease'] },
      { name: 'PostgreSQL', note: 'Through Supabase in ClickWise and Chat to Ledger.', projects: ['clickwise', 'chatledger'] },
      { name: 'React', note: 'Part of the stack in InternshipJP, Chat to Ledger and AstroCare.', projects: ['internshipjp', 'chatledger', 'astrocare'] },
      { name: 'Next.js', note: 'Part of the stack in ClickWise and FlavourWave.', projects: ['clickwise', 'flavourwave'] },
    ],
  },

  // Beyond the Code: a few things I enjoy. `icon` picks one of the line drawings in InterestsSection.vue.
  interests: [
    { icon: 'chess', title: 'Chess', text: 'I enjoy chess: the planning, the trade-offs, and discovering what I missed after a game.' },
    { icon: 'story', title: 'Story-driven games', text: 'I’m drawn to games with memorable stories, characters, and choices that stay with you after you stop playing.' },
    { icon: 'cup', title: 'Cappuccino', text: 'A good cappuccino is always a welcome part of the day.' },
  ],

  contactLede: 'Have a role, a project, or an idea in mind? I’d be happy to talk.',

  // Only entries with an href are shown; leave href empty to hide a channel.
  contact: [
    { label: 'Email', href: 'mailto:pyae.sone.htut.99@gmail.com', text: 'pyae.sone.htut.99@gmail.com' },
    { label: 'GitHub', href: 'https://github.com/Harry-Pyae', text: 'github.com/Harry-Pyae' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/lighto67', text: 'linkedin.com/in/lighto67' },
  ],
}
