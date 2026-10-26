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
// Everything sits on one open spread: heading, photo and the first paragraph on the
// left page, the rest on the right. Wrap a phrase in **double asterisks** to render
// it as <strong>.

export const ABOUT = {
  heading: 'Hi, I’m Ieva!',
  photo: {
    src: './about/ieva.jpg',
    alt: 'Ieva smiling and looking up, chin resting on her hands, against a pink background',
    /** CSS object-position used to crop around the face. */
    focus: '50% 30%',
  },
  left: [
    'I’m a **Computer Science master’s student at Stanford**, originally from **Lithuania**. I’m fascinated by how machines make sense of the physical world: can a model understand why an object falls, anticipate what happens next, or help a robot decide what to do?',
  ],
  right: [
    'That curiosity connects my work at **Stanford’s NeuroAILab**, where I focus on robot learning and evaluation, with my earlier research on physical reasoning in vision-language models at **Microsoft Research**. I also explored the Ising model at **EPFL** and earned my bachelor’s in Computer Engineering at the **University of Illinois Urbana-Champaign (UIUC)**.',
    'My favorite part is **turning ideas into experiments**: building something, seeing what happens, and figuring out why it didn’t work quite as planned. I’m especially drawn to the space where multimodal AI meets robots and the messy, unpredictable real world.',
    'Outside research, I make videos about **science, technology, and student life**, including as part of **Stanford’s social media creator cohort**. I enjoy making unfamiliar ideas feel approachable and sharing the excitement of learning something new.',
  ],
};

// --- Research whiteboard ---------------------------------------------------------
// One entry per pinned note. `featured` entries get the larger notes on the board;
// the rest are smaller supporting notes, equally clickable. `body` paragraphs use
// **double asterisks** for <strong>. Leave `image` out to show the line sketch named
// by `sketch`; `image2` is an optional second picture (e.g. a later EPFL photo).

export interface ResearchImage {
  src: string;
  alt: string;
  /** 'photo' may be cropped for thumbnails; 'plot' is always shown whole. */
  kind: 'photo' | 'plot';
  /** CSS object-position for photo thumbnails. */
  focus?: string;
}

export interface ResearchLink {
  label: string;
  href: string;
  /** Shown alongside the link, e.g. the paper title. */
  title?: string;
  /** Small status tag, e.g. "Preprint". */
  tag?: string;
}

export interface ResearchEntry {
  id: string;
  org: string;
  role?: string;
  title: string;
  preview: string;
  body: string[];
  topics: string[];
  featured: boolean;
  image?: ResearchImage;
  image2?: ResearchImage;
  sketch?: 'arm' | 'depth' | 'scan';
  links?: ResearchLink[];
}

export const RESEARCH: ResearchEntry[] = [
  {
    id: 'neuroailab',
    org: 'Stanford NeuroAILab',
    title: 'How do we know a robot is doing well?',
    preview: 'Evaluating vision-language-action models on real-world robot manipulation.',
    body: [
      'At **Stanford’s NeuroAILab**, I work on evaluating how **vision-language-action models** perform pick-and-place tasks with bimanual YAM robots. I’m developing a **standardized evaluation framework** across physically diverse objects, alongside a robotics interface for data collection and experiment control.',
    ],
    topics: ['Robot learning', 'VLA evaluation', 'Manipulation'],
    featured: true,
    sketch: 'arm',
  },
  {
    id: 'msr',
    org: 'Microsoft Research · AI Frontiers Laboratory',
    title: 'Do models understand the physics they see?',
    preview: 'Looking beyond correct answers to understand how vision-language models reason about physical events.',
    body: [
      'During my **Microsoft Research** internship, I built a video evaluation pipeline in the open-source EUREKA framework to study **physical reasoning across six frontier models**. By separating perception from reasoning and examining confidence alongside accuracy, I investigated where models succeed—and where their understanding breaks down.',
      'The work included over 10,000 video samples, custom diagnostic tests, and an LLM-based judging system, and led to a **co-authored preprint**.',
    ],
    topics: ['Video understanding', 'Physical reasoning', 'Model evaluation'],
    featured: true,
    image: {
      src: './research/microsoft.jpg',
      alt: 'Ieva holding a #MicrosoftResearch sign in front of large MSR letters',
      kind: 'photo',
      focus: '48% 38%',
    },
    links: [
      {
        label: 'Read preprint ↗',
        href: 'https://arxiv.org/abs/2510.06251',
        title: 'Physics Knowledge in Frontier Models: A Diagnostic Study of Failure Modes',
        tag: 'Preprint',
      },
    ],
  },
  {
    id: 'uiuc-cv',
    org: 'UIUC · Computer Vision Group',
    title: 'Physical reasoning and visual reconstruction',
    preview: 'Exploring how vision-language models reason about physical scenes and help reconstruct visual information.',
    body: [
      'At **UIUC’s Computer Vision Group**, I explored physical reasoning through **vision-language model fine-tuning**, dataset scaling, and prompting strategies. I also built an **RGB-D data and reconstruction pipeline** combining depth estimation, physics-based simulation, generative models, and automated VLM feedback.',
      'This work connected model development with systematic experiments on reconstruction quality and contributed to a **preprint on underwater image reconstruction**.',
    ],
    topics: ['Vision-language models', 'RGB-D', 'Generative reconstruction'],
    featured: true,
    sketch: 'depth',
    links: [
      {
        label: 'Read preprint ↗',
        href: 'https://www.researchgate.net/publication/412211611_VLMs_Win_a_Systematic_Evaluation_of_Underwater_Image_Reconstruction',
        title: 'VLMs Win: A Systematic Evaluation of Underwater Image Reconstruction',
        tag: 'Preprint',
      },
    ],
  },
  {
    id: 'epfl',
    org: 'EPFL · Computational Quantum Science Laboratory',
    title: 'Learning around a phase transition',
    preview: 'Using differentiable sampling to explore the 2D Ising model.',
    body: [
      'At **EPFL**, I developed a **differentiable Markov chain Monte Carlo framework** in JAX to study the 2D Ising phase transition. I compared two gradient-estimation methods across increasing system sizes, exploring how their accuracy and computational tradeoffs changed as the problem grew.',
      'I presented this work in a research report and poster.',
    ],
    topics: ['JAX', 'Differentiable MCMC', 'Computational physics'],
    featured: false,
    image: {
      src: './research/ising-plot.png',
      alt: 'Log-log plot titled “ΔTc vs Grid Size (L)”: ΔTc (|Tc − Tc*|) on the vertical axis against grid size L on the horizontal axis',
      kind: 'plot',
    },
    // image2: { src: './research/epfl.jpg', alt: '…', kind: 'photo' },  ← add when available
    links: [{ label: 'View research poster ↗', href: 'https://drive.google.com/file/d/1L7ifeEmrU3Qb6h9Hf9Kn6qxWR9Vh0a4p/view' }],
  },
  {
    id: 'bresler',
    org: 'UIUC · Prof. Yoram Bresler’s Laboratory',
    title: 'Simulating the body for medical imaging',
    preview: 'Building simulated data for ultrasound, electrical impedance tomography, and image segmentation.',
    body: [
      'In **Prof. Yoram Bresler’s lab**, I developed Python pipelines for **3D ultrasound and electrical impedance tomography simulations**, alongside U-Net medical-image segmentation. I generated more than **20,000 multimodal parameter maps** from segmented abdominal organs and tissues to support future multimodal model training.',
    ],
    topics: ['Medical imaging', 'Simulation', 'Segmentation'],
    featured: false,
    sketch: 'scan',
  },
  {
    id: 'csl',
    org: 'UIUC · Coordinated Science Laboratory',
    role: 'Research Assistant · January–May 2024',
    title: 'Can everyday hardware run industrial control software?',
    preview: 'Exploring how open-source industrial control software performs on Raspberry Pis and Arduinos.',
    body: [
      'At **UIUC’s Coordinated Science Laboratory**, I used **OpenPLC** to investigate how industrial control software runs on commodity embedded hardware. I designed and conducted experiments on **Raspberry Pis and Arduinos**, working across several PLC programming languages.',
      'I measured **CPU, memory, and I/O utilization** to understand the software’s performance overhead and validated its deployment on these platforms. I presented the work in a research poster at UIUC’s 2024 Undergraduate Research Symposium.',
    ],
    topics: ['Embedded systems', 'OpenPLC', 'Performance evaluation'],
    featured: false,
    image: {
      src: './research/plc-setup.jpg',
      alt: 'Experiment setup on a desk: a Raspberry Pi, a case labelled OpenPLC, a relay board on a breadboard, and a white plastic valve, wired together',
      kind: 'photo',
      focus: '50% 50%',
    },
    links: [{ label: 'View research poster ↗', href: 'https://drive.google.com/file/d/1AeyaoV522XlNSIqjBSpGwMKaCnfk9J7j/view' }],
  },
];

export const PLACEHOLDERS = {
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
