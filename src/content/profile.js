// Everything personal lives here. Edit freely; the layout adapts.
export const profile = {
  name: 'Harry',
  monogram: 'H',
  title: 'IT Student · Junior Full-Stack Developer',
  intro:
    'I craft clean, high-performance web applications from scratch — Vue.js on the front end, Laravel and PHP behind it — on solid hand-coded fundamentals, now accelerated with AI.',
  focusStack: ['Vue.js', 'Laravel', 'PHP', 'MySQL'],

  // Drop a photo in /public (e.g. public/harry.jpg) and set portrait: 'harry.jpg'.
  // null shows the monogram placeholder.
  portrait: null,

  // The About narrative, one short paragraph per entry.
  about: [
    'I am an IT student and Junior Full-Stack Developer who specializes in crafting clean, high-performance web applications from scratch using Vue.js, Laravel, and PHP.',
    'I built my foundation writing manual, production-ready code with my core stack. As the industry has evolved, I have kept adapting: I now pair those fundamentals with AI-assisted development to deliver faster and better results, while staying familiar with a broad ecosystem of tools.',
    'My fast-paced building skills have been validated by multiple hackathon finishes and immediate engineering job offers.',
  ],

  // Short focus statements for the About section, condensed from the narrative above.
  focus: [
    'Clean, high-performance web apps built from scratch',
    'Hand-coded fundamentals, accelerated with AI tools',
    'Fast building, proven at hackathons',
  ],

  status:
    'Recipient of multiple development offers. Open to discussing roles that align with building and scaling Vue/Laravel applications.',

  skills: {
    core: [
      { group: 'Frontend', items: ['Vue.js', 'JavaScript', 'HTML5', 'CSS3', 'Axios'] },
      { group: 'Backend & environment', items: ['Laravel', 'PHP', 'XAMPP', 'MySQL'] },
    ],
    general: ['Next.js', 'React', 'Tailwind CSS', 'Bootstrap', 'PostgreSQL', 'Docker', 'Java', 'Python'],
  },

  // Leave href empty and the item shows as "not listed yet" instead of a broken link.
  contact: [
    { label: 'Email', href: '', text: '' }, // e.g. href: 'mailto:you@example.com', text: 'you@example.com'
    { label: 'GitHub', href: '', text: '' }, // e.g. href: 'https://github.com/you', text: 'github.com/you'
    { label: 'LinkedIn', href: '', text: '' },
  ],
}
