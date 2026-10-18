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
    'I’m an IT student and a junior full-stack developer. Most of what I build uses Vue.js, Laravel, PHP and MySQL.',
    'I like understanding how things work, so I enjoy building features from scratch: shaping the data, the API and the interface myself. I learned by writing that code by hand, and I now pair the habit with AI-assisted tools, which help me move faster without skipping the understanding.',
    'So far that has meant my own applications like BloodCare, team projects like InternshipJP, prototypes built against the clock at hackathons, and now ClassiFile and SummarEase, two document tools I’m developing in the ClariFile suite.',
  ],

  // Milestones near About. `projects` links to project ids (opens their details).
  // Only general wording until the details are confirmed (see AUTHOR-CHECKLIST.md).
  milestones: [
    { title: 'Full-stack developer certification', text: 'Completed a full-stack developer certification.' },
    { title: 'Development offers', text: 'Received multiple development offers.' },
    {
      title: 'Hackathons',
      text: 'Took part in hackathons and built these projects there:',
      projects: ['flavourwave', 'clickwise', 'astrocare', 'chatledger'],
    },
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
    { icon: 'chess', title: 'Chess', text: 'I enjoy chess—the planning, the trade-offs, and discovering what I missed after a game.' },
    { icon: 'story', title: 'Story-driven games', text: 'I’m drawn to games with memorable stories, characters, and choices that stay with you after you stop playing.' },
    { icon: 'cup', title: 'Cappuccino', text: 'A good cappuccino is always a welcome part of the day.' },
  ],

  contactLede: 'Have a role, a project, or an idea in mind? I’d be happy to talk.',

  // Only entries with an href are shown; leave href empty to hide a channel.
  contact: [
    { label: 'Email', href: '', text: '' }, // e.g. href: 'mailto:you@example.com', text: 'you@example.com'
    { label: 'GitHub', href: 'https://github.com/Harry-Pyae', text: 'github.com/Harry-Pyae' },
    { label: 'LinkedIn', href: '', text: '' },
  ],
}
