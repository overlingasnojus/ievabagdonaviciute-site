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
// One entry per note on the board. The same data draws the board both as the 3D
// texture seen from across the room and as the HTML board up close (see
// ui/researchLayout.ts), so the two always match. `body` paragraphs use
// **double asterisks** for <strong>. `image2` is an optional second print shown in
// the expanded entry.

export interface ResearchImage {
  src: string;
  alt: string;
  /** 'photo' may be cropped to fill a frame; 'figure' (plots, scans) is always shown whole. */
  kind: 'photo' | 'figure';
  /** CSS-style object-position for cropped photos, e.g. '50% 30%'. */
  focus?: string;
  /** Short visible caption (shown under the print and in the viewer); `alt` stays descriptive. */
  caption?: string;
}

export interface ResearchLink {
  label: string;
  href: string;
  /** Shown alongside the link, e.g. the paper title. */
  title?: string;
  /** Small status tag, e.g. "Preprint". */
  tag?: string;
}

/** A separate project inside one entry, shown as its own tab in the expanded note. */
export interface ResearchProject {
  id: string;
  tab: string;
  title: string;
  body: string[];
  topics?: string[];
  /** Understated recognition labels shown under the description. */
  labels?: string[];
  image?: ResearchImage;
  links?: ResearchLink[];
}

export interface ResearchEntry {
  id: string;
  org: string;
  role?: string;
  title: string;
  preview: string;
  body: string[];
  topics: string[];
  /** The overview card's picture (and the expanded entry's main print). */
  image: ResearchImage;
  /** A second print: with `layout: 'feature'` it spans the full width below. */
  image2?: ResearchImage;
  links?: ResearchLink[];
  /** 'feature': portrait print beside the text, second print full width beneath. */
  layout?: 'feature';
  /** When present, the expanded entry shows these as tabs instead of one body. */
  projects?: ResearchProject[];
}

/** Line sketch of a robot arm, used until a real NeuroAILab image is supplied. */
const ARM_SKETCH = `data:image/svg+xml;utf8,${encodeURIComponent(
  // viewBox trimmed to the drawing so it fills its frame, on white like the other figures
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="12 14 140 94"><rect x="12" y="14" width="140" height="94" fill="#ffffff"/>' +
    '<g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6">' +
    '<g stroke="#6B2346"><path d="M30 96 L90 96"/><rect x="44" y="86" width="26" height="10" rx="2"/><path d="M57 86 L64 56 L100 38"/>' +
    '<circle cx="64" cy="56" r="5"/><circle cx="100" cy="38" r="4"/><path d="M100 38 L112 52 M108 56 L112 52 L118 56"/></g>' +
    '<g stroke="#C66F8E"><rect x="106" y="74" width="14" height="14" rx="1.5"/><path d="M113 62 L113 70" stroke-dasharray="2 3"/><path d="M22 30 L34 30 M28 24 L28 36"/></g>' +
    '</g></svg>',
)}`;

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
    image: { src: ARM_SKETCH, alt: 'Sketch of a robot arm reaching for a block', kind: 'figure' },
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
    image: {
      src: './research/microsoft.jpg',
      alt: 'Ieva holding a #MicrosoftResearch sign in front of large MSR letters',
      kind: 'photo',
      // her face and the MSR letters together
      focus: '50% 30%',
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
    title: 'Physical reasoning & image reconstruction',
    preview: 'Exploring how vision-language models reason about physical scenes and help reconstruct visual information.',
    body: [],
    topics: [],
    image: {
      src: './research/underwater-reconstruction.jpg',
      alt: 'Figure comparing ground-truth room images at 2.34, 3.61, 4.92 and 6.01 m with easy-water and challenging-water versions and their Seedream and Slurpp reconstructions',
      kind: 'figure',
    },
    projects: [
      {
        id: 'thesis',
        tab: 'Physical reasoning thesis',
        title: 'Teaching vision-language models to reason about physics',
        body: [
          'For my undergraduate thesis, I fine-tuned **vision-language models with LoRA** to explore physical reasoning. I investigated dataset scaling, difficulty-aware sample weighting, multimodal embeddings, and prompting strategies to understand what helps these models improve.',
        ],
        topics: ['Vision-language models', 'LoRA fine-tuning', 'Physical reasoning'],
        labels: ['Graduated with Highest Honors', 'Undergraduate Researcher Certificate'],
      },
      {
        id: 'underwater',
        tab: 'Underwater reconstruction',
        title: 'Reconstructing what lies beneath the surface',
        body: [
          'I built an **RGB-D data and reconstruction pipeline** combining depth estimation, physics-based simulation, generative models, and automated VLM feedback. Through systematic experiments, I evaluated reconstruction quality and contributed to a preprint on underwater image reconstruction.',
        ],
        topics: ['RGB-D', 'Depth estimation', 'Generative reconstruction'],
        image: {
          src: './research/underwater-reconstruction.jpg',
          alt: 'Figure comparing ground-truth room images at 2.34, 3.61, 4.92 and 6.01 m with easy-water and challenging-water versions and their Seedream and Slurpp reconstructions',
          kind: 'figure',
        },
        links: [
          {
            label: 'Read preprint ↗',
            href: 'https://arxiv.org/abs/2608.11425',
            title: 'VLMs Win: A Systematic Evaluation of Underwater Image Reconstruction',
            tag: 'Preprint',
          },
        ],
      },
    ],
  },
  {
    id: 'epfl',
    org: 'EPFL · Computational Quantum Science Laboratory',
    role: 'Excellence Research Scholar · Summer 2024',
    title: 'Learning around a phase transition',
    preview: 'Using differentiable sampling to explore the 2D Ising model.',
    body: [
      'As an **Excellence Research Scholar at EPFL**, I developed a **differentiable Markov chain Monte Carlo framework in JAX** to study the 2D Ising phase transition. I compared two gradient-estimation methods across system sizes, exploring their accuracy and computational tradeoffs.',
    ],
    topics: ['JAX', 'Differentiable MCMC', 'Computational physics'],
    layout: 'feature',
    image: {
      src: './research/epfl.jpg',
      alt: 'Collage from a summer at EPFL: Ieva beside the red EPFL letters on campus, with mountain lakes, friends, picnics and a visit to CERN',
      kind: 'photo',
      // on the overview card: the band with the red EPFL letters and her face
      focus: '50% 59%',
      caption: 'Memories from summer internship',
    },
    image2: {
      src: './research/ising-plot.png',
      alt: 'Log-log plot titled “ΔTc vs Grid Size (L)”: ΔTc (|Tc − Tc*|) on the vertical axis against grid size L on the horizontal axis',
      kind: 'figure',
      caption: 'Difference between the estimated and reference critical temperatures across grid sizes in the 2D Ising model.',
    },
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
    image: {
      src: './research/abdomen-segmentation.png',
      alt: 'Abdominal CT slice from study 1014-103 shown beside its colour-coded segmentation of organs and tissues, with muscle, subcutaneous fat and visceral fat areas in cm²',
      kind: 'figure',
    },
  },
  {
    id: 'csl',
    org: 'UIUC · Coordinated Science Laboratory',
    role: 'Research Assistant · January–May 2024',
    title: 'Can everyday hardware run industrial control software?',
    preview: 'Exploring how open-source industrial control software performs on Raspberry Pis and Arduinos.',
    body: [
      'At **UIUC’s Coordinated Science Laboratory**, I used **OpenPLC** to evaluate industrial control software on **Raspberry Pis and Arduinos**. I conducted experiments across PLC programming languages and measured **CPU, memory, and I/O utilization** to assess performance overhead.',
      'I presented this work at UIUC’s **2024 Undergraduate Research Symposium**.',
    ],
    topics: ['Embedded systems', 'OpenPLC', 'Performance evaluation'],
    image: {
      src: './research/plc-setup.jpg',
      alt: 'Experiment setup on a desk: a Raspberry Pi, a case labelled OpenPLC, a relay board on a breadboard, and a white plastic valve, wired together',
      kind: 'photo',
      // keeps the Raspberry Pi, relay board and valve in frame
      focus: '50% 55%',
    },
    links: [{ label: 'View research poster ↗', href: 'https://drive.google.com/file/d/1AeyaoV522XlNSIqjBSpGwMKaCnfk9J7j/view' }],
  },
];

// --- Projects desktop ---------------------------------------------------------------
// Each project is a desktop icon that opens one window. `body` paragraphs use
// **double asterisks** for <strong>; `awards` become pixel trophy badges; `files`
// are clickable documents shown inside a folder window.

/** A short named section shown inside a project's window. */
export interface ProjectSection {
  name: string;
  text: string;
}

export interface Project {
  id: string;
  icon: 'hackathon' | 'flower' | 'arm' | 'folder';
  /** Label under the desktop icon. */
  label: string;
  title: string;
  tagline?: string;
  meta: string;
  body: string[];
  awards?: string[];
  sections?: ProjectSection[];
  links?: ResearchLink[];
}

export const PROJECTS: Project[] = [
  {
    id: 'hackathon',
    icon: 'hackathon',
    label: 'AI Hackathon',
    title: 'Privacy-preserving AI agent',
    meta: 'Stanford Flower.ai Hackathon · 2026',
    body: ['A privacy-preserving agentic AI system built with my team at Stanford’s Flower.ai Hackathon, where we won **1st place**.'],
    awards: ['1st Place'],
    links: [{ label: 'View on GitHub ↗', href: 'https://github.com/uzmahamid01/aius-flower-hackathon' }],
  },
  {
    id: 'flower-power',
    icon: 'flower',
    label: 'Flower Power',
    title: 'Flower Power',
    tagline: 'A robot that follows the sun.',
    meta: 'WECE · Engineering Open House 2024',
    body: [
      'I led a **sub-team of four** to develop a solar-tracking robot using photoresistors, servo-controlled panel orientation, and a mobile app override.',
      'The project earned **2nd place in Most Industry Impact** and **3rd place in Chevron Environmental and Sustainability Efforts**.',
    ],
    awards: ['2nd place · Most Industry Impact', '3rd place · Chevron Environmental and Sustainability Efforts'],
  },
  {
    id: 'sunday',
    icon: 'arm',
    label: 'Robot S.U.N.D.A.Y.',
    title: 'Robot S.U.N.D.A.Y.',
    tagline: 'A robotic arm controlled from your phone.',
    meta: 'WECE · Engineering Open House 2023',
    body: [
      'I collaborated on a **six-DOF robotic arm** controlled through a **Flutter mobile app**, connecting an Arduino UNO and six servo motors through HC-05 Bluetooth.',
    ],
  },
  {
    id: 'gdsc',
    icon: 'folder',
    label: 'Google Developer Student Club',
    title: 'Google Developer Student Club',
    tagline: 'Building a community that builds together.',
    meta: 'UIUC · Founder & Lead · 2023–2024',
    body: [
      'I founded and led a community of **35+ members**, overseeing committees and student teams building practical tools for campus life.',
    ],
    sections: [
      { name: 'UNIride', text: 'A student carpooling app designed to help students coordinate shared rides.' },
      { name: 'DeedMatch', text: 'A volunteering platform designed to connect students with opportunities to contribute.' },
    ],
  },
];

// --- Beyond scrapbook ---------------------------------------------------------------
// One open spread per chapter, in this order. `w`/`h` are each file's real pixel size,
// so frames reserve the right shape before anything loads and nothing is stretched.
// `focus` positions a photo inside its frame where the frame crops it slightly.
// Videos are the original GIFs converted to looping, muted MP4 (same frames and
// timing); `poster` is their first frame.

export interface ScrapMedia {
  kind: 'image' | 'video';
  src: string;
  poster?: string;
  w: number;
  h: number;
  alt: string;
  focus?: string;
}

export interface ScrapChapter {
  id: 'create' | 'sing' | 'explore';
  tab: string;
  heading: string;
  text: string[];
  media: ScrapMedia[];
  /** Short handwritten notes placed around the spread. */
  notes: string[];
}

export const BEYOND: { title: string; chapters: ScrapChapter[] } = {
  title: 'Beyond the lab',
  chapters: [
    {
      id: 'create',
      tab: 'Create',
      heading: 'Creating & sharing',
      text: [
        'I make videos about science, technology, and student life, including as part of Stanford’s social media creator cohort. I enjoy finding a hook, shaping a story, and making something unfamiliar feel approachable.',
        'Some videos share what I’m learning; others capture little moments from student life. This is where my interest in technology meets my creative side.',
      ],
      media: [
        { kind: 'video', src: './beyond/video-1.mp4', poster: './beyond/video-1.jpg', w: 104, h: 184, alt: 'Short video of Ieva talking to the camera' },
        { kind: 'video', src: './beyond/video-2.mp4', poster: './beyond/video-2.jpg', w: 104, h: 184, alt: 'Short video of Ieva talking to the camera, with diagrams shown on screen' },
      ],
      notes: ['a few things I’ve been sharing'],
    },
    {
      id: 'sing',
      tab: 'Sing',
      heading: 'A different kind of stage',
      text: [
        'Outside research, I also sing—and I’ve participated in Lithuanian X Factor. This is a different side of me from the one you’ll usually find in the lab.',
        'Here are a few moments from onstage: a microphone instead of a keyboard, and a different kind of performance.',
      ],
      media: [
        { kind: 'image', src: './beyond/singing-2.jpg', w: 1024, h: 740, alt: 'Ieva singing into a microphone in front of a blue patterned backdrop', focus: '50% 30%' },
        { kind: 'image', src: './beyond/singing-1.jpg', w: 1024, h: 1014, alt: 'Ieva singing into a microphone under a spotlight, in a white dress with black butterflies', focus: '40% 40%' },
        { kind: 'image', src: './beyond/singing-3.jpg', w: 973, h: 1024, alt: 'Ieva singing on a stage under purple and red stage lights', focus: '62% 60%' },
      ],
      notes: ['Lithuanian X Factor'],
    },
    {
      id: 'explore',
      tab: 'Explore',
      heading: 'When I remember to touch grass…',
      text: [
        'An occasional break from screens, experiments, and debugging. I like heading outside for a hike, a good view, and a reminder that the world has pretty impressive graphics.',
      ],
      media: [
        { kind: 'image', src: './beyond/hiking-2.jpg', w: 768, h: 1024, alt: 'Ieva by a turquoise mountain lake surrounded by forest and peaks' },
        { kind: 'image', src: './beyond/hiking-1.jpg', w: 1024, h: 767, alt: 'Ieva standing on a grassy mountainside above a green valley, with snowy peaks behind' },
        { kind: 'image', src: './beyond/hiking-3.jpg', w: 683, h: 1024, alt: 'Ieva with arms outstretched on a rocky trail below a snow-covered mountain' },
      ],
      notes: ['the view was worth it'],
    },
  ],
};

export const PLACEHOLDERS = {
  cv: {
    title: 'Curriculum Vitae',
    /** Page images rendered from the PDF (see lab/README.md to regenerate them). */
    pages: ['./cv/page-1.png', './cv/page-2.png'],
    /** Set to null to hide the download button. */
    pdfUrl: './ieva-bagdonaviciute-cv.pdf' as string | null,
  },
};
