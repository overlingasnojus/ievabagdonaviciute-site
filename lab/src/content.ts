// All visible section copy lives here, so real content can replace the placeholders
// without touching the scene or animation code.

export type SectionId = 'about' | 'research' | 'projects' | 'beyond' | 'cv';

export interface Section {
  id: SectionId;
  number: string;
  label: string;
  /** What the visitor clicks in the room; used for accessible labels. */
  object: string;
}

export const SECTIONS: Section[] = [
  { id: 'about', number: '01', label: 'About', object: 'notebook in the cabinet' },
  { id: 'research', number: '02', label: 'Research', object: 'whiteboard' },
  { id: 'projects', number: '03', label: 'Projects', object: 'computer monitor' },
  { id: 'beyond', number: '04', label: 'Beyond', object: 'cat on the rug' },
  { id: 'cv', number: '05', label: 'CV', object: 'desk drawer' },
];

export const SECTION_BY_ID = Object.fromEntries(SECTIONS.map((s) => [s.id, s])) as Record<SectionId, Section>;

// --- Homepage introduction --------------------------------------------------------

export const INTRO = {
  heading: 'Hi, I’m Ieva!',
  tagline: 'Exploring intelligence in the physical world.',
  lede: 'I’m a Computer Science master’s student at Stanford, exploring how AI understands and interacts with the physical world.',
  cue: 'Explore my little lab',
  helper: 'Click the numbered objects to look around.',
};

export type SocialIcon = 'github' | 'linkedin' | 'email' | 'scholar';

export const SOCIAL: { id: SocialIcon; label: string; href: string; description: string }[] = [
  { id: 'github', label: 'GitHub', href: 'https://github.com/ievabagdonaviciute', description: 'GitHub profile (opens in a new tab)' },
  { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/ieva-bagdonaviciute/', description: 'LinkedIn profile (opens in a new tab)' },
  { id: 'email', label: 'Email', href: 'mailto:ievab@stanford.edu', description: 'Email ievab@stanford.edu' },
  {
    id: 'scholar',
    label: 'Google Scholar',
    href: 'https://scholar.google.com/citations?user=o_tXWHsAAAAJ&hl=en',
    description: 'Google Scholar profile (opens in a new tab)',
  },
];

// --- About notebook ------------------------------------------------------------
// Paragraphs are kept verbatim. `pages` decides how blocks are spread over notebook
// pages: `spread` is the single two-page layout used when everything fits; `compact`
// is used when it doesn't (smaller screens) and is shown two pages per spread, or one
// page at a time on phones.

export const ABOUT = {
  heading: 'Hi, I’m Ieva!',
  photo: {
    src: './about/ieva.jpg',
    alt: 'Ieva smiling and looking up, chin resting on her hands, against a pink background',
    /** CSS object-position used to crop around the face. */
    focus: '50% 26%',
  },
  paragraphs: [
    'I’m a Computer Science master’s student at Stanford, originally from Lithuania. I’m interested in how AI can understand and interact with the physical world - from reasoning about what happens in a video to helping a robot figure out what to do next.',
    'Currently, I work with Stanford’s NeuroAILab on robot learning and evaluation. Previously, I explored physical reasoning in vision-language models at Microsoft Research and studied the Ising model at EPFL. Before Stanford, I earned my bachelor’s in Computer Engineering at the University of Illinois Urbana-Champaign.',
    'I enjoy working where ideas meet experiments: building something, watching what happens, and figuring out why it didn’t quite work as expected. That curiosity has taken me from computer engineering to multimodal AI and, increasingly, to robots.',
    'Outside the lab, I make videos about science, technology, and student life, including as part of Stanford’s social media creator cohort. I like finding ways to make the things I’m learning approachable - and sharing the excitement of figuring something out.',
    'This little lab is home to some of my research, things I’m building, and pieces of life along the way. Have a look around!',
  ],
  pages: {
    spread: [
      ['heading', 'photo', 'p0', 'p1'],
      ['p2', 'p3', 'p4', 'doodle'],
    ],
    compact: [
      ['heading', 'photo', 'p0'],
      ['p1', 'p2'],
      ['p3', 'p4', 'doodle'],
    ],
  },
};

export type AboutBlock = 'heading' | 'photo' | 'p0' | 'p1' | 'p2' | 'p3' | 'p4' | 'doodle';

export const PLACEHOLDERS = {
  research: { title: 'Research', note: 'Research notes coming soon.' },
  projects: { title: 'Projects', note: 'Experiments loading…' },
  beyond: { title: 'Beyond the lab', note: 'A little more of me, coming soon.' },
  cv: {
    title: 'Curriculum Vitae',
    /** Page images rendered from the PDF (see lab/README.md to regenerate them). */
    pages: ['./cv/page-1.png', './cv/page-2.png'],
    /** Set to null to hide the download button. */
    pdfUrl: './ieva-bagdonaviciute-cv.pdf' as string | null,
  },
};
