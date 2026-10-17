// Display order of the category groups in the project grid. Empty categories are hidden.
export const categories = ['Hackathon Prototypes', 'Personal Full-Stack Projects', 'Frontend Projects']

// status: 'Planned' | 'In progress' | 'Completed'
// tagline: one concise sentence for the overview cards (summary is shown in the details view).
// image: path to a screenshot in /public, e.g. 'projects/theme-studio.png'.
// challenge / contribution / solution / lessons: null renders as "to be documented".
// links: leave '' when there is nothing to link — the UI shows it as unavailable.
export const projects = [
  {
    id: 'theme-studio',
    title: 'Theme Studio',
    category: 'Frontend Projects',
    status: 'Planned',
    image: null,
    tagline: 'Compose UI colour themes in the browser and export them as CSS variables.',
    summary:
      'A planned in-browser editor for composing UI colour themes, previewing them on sample components and exporting CSS custom properties.',
    stack: ['Vue.js', 'JavaScript', 'CSS3'],
    challenge:
      'Intended scope: keep previews instant while many colour tokens change at once, and surface text-contrast problems while a theme is being edited.',
    contribution: null,
    solution: null,
    lessons: null,
    links: { demo: '', github: '' },
  },
  {
    id: 'csv-playground',
    title: 'CSV Data Playground',
    category: 'Personal Full-Stack Projects',
    status: 'Planned',
    image: null,
    tagline: 'Upload CSV files, explore them as tables and save cleaned datasets.',
    summary:
      'A planned workspace for uploading CSV files, exploring them as sortable, filterable tables and saving cleaned datasets.',
    stack: ['Vue.js', 'Axios', 'Laravel', 'PHP', 'MySQL'],
    challenge:
      'Intended scope: handle large files without freezing the interface, and validate messy, inconsistent columns on the server.',
    contribution: null,
    solution: null,
    lessons: null,
    links: { demo: '', github: '' },
  },
  {
    id: 'focus-workspace',
    title: 'Focus Workspace',
    category: 'Personal Full-Stack Projects',
    status: 'Planned',
    image: null,
    tagline: 'Focus timers, task lists and session notes in one calm space.',
    summary:
      'A planned productivity space bringing focus timers, task lists and session notes together in one calm interface.',
    stack: ['Vue.js', 'Laravel', 'PHP', 'MySQL'],
    challenge:
      'Intended scope: keep timers accurate when the tab is in the background, and sync tasks and notes reliably across sessions.',
    contribution: null,
    solution: null,
    lessons: null,
    links: { demo: '', github: '' },
  },
]
