import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { INTRO, SECTIONS, SECTION_BY_ID, SOCIAL, type SectionId, type SocialIcon } from './content';
import { requestSection, setHovered, takeReturnFocus, useNav } from './state/nav';
import { dom, viewport } from './scene/registry';
import Scene from './scene/Scene';
import { SectionLayer } from './ui/SectionLayer';
import { EmailIcon, GitHubIcon, LinkedInIcon, ScholarIcon } from './ui/PixelIcons';

const inert = (on: boolean) => (on ? { inert: '' } : {}) as Record<string, string>;

function PixelMark() {
  // A tiny pixel lab-bot.
  return (
    <svg className="mark" viewBox="0 0 12 10" aria-hidden="true" shapeRendering="crispEdges">
      <path fill="#DFA5B7" d="M1 9h10v1H1z" />
      <path fill="#BE3E70" d="M2 3h8v6H2zM5 1h2v2H5z" />
      <path fill="#520B2D" d="M3 4h6v3H3z" />
      <path fill="#F6DFE5" d="M4 5h1v1H4zM7 5h1v1H7z" />
      <path fill="#F6C177" d="M5 0h2v1H5z" />
    </svg>
  );
}

function SectionButton({ id, className }: { id: SectionId; className: string }) {
  const nav = useNav();
  const s = SECTION_BY_ID[id];
  return (
    <button
      type="button"
      className={className}
      data-hovered={nav.hovered === id || undefined}
      aria-current={nav.section === id ? 'true' : undefined}
      aria-label={`${s.number} ${s.label}, open the ${s.object}`}
      onClick={(e) => requestSection(id, e.currentTarget)}
      onPointerEnter={() => setHovered(id)}
      onPointerLeave={() => setHovered(null)}
      onFocus={() => setHovered(id)}
      onBlur={() => setHovered(null)}
    >
      <span className="num">{s.number}</span>
      <span className="label">{s.label}</span>
    </button>
  );
}

function Header() {
  return (
    <header className="header">
      <a className="brand" href="./" aria-label="Ieva, home">
        <PixelMark />
        <span>IEVA</span>
      </a>
      <nav className="header-nav" aria-label="Sections">
        {SECTIONS.map((s) => (
          <SectionButton key={s.id} id={s.id} className="header-link" />
        ))}
      </nav>
      <p className="tagline" aria-hidden="true">
        <span className="spark">✳</span> STANFORD / AI &amp; ROBOTICS
      </p>
    </header>
  );
}

const ICONS: Record<SocialIcon, () => JSX.Element> = { github: GitHubIcon, linkedin: LinkedInIcon, email: EmailIcon, scholar: ScholarIcon };

function SocialLinks() {
  return (
    <ul className="social" aria-label="Elsewhere">
      {SOCIAL.map((s) => {
        const Icon = ICONS[s.id];
        const external = !s.href.startsWith('mailto:');
        return (
          <li key={s.id}>
            <a href={s.href} aria-label={s.description} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
              <Icon />
              <span>{s.label}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function Hotspots() {
  const nav = useNav();
  return (
    <div className="hotspots" {...inert(nav.phase !== 'overview')}>
      {SECTIONS.map((s) => (
        <div key={s.id} className="hotspot" data-id={s.id} ref={(el) => void (dom.hotspots[s.id] = el)}>
          <SectionButton id={s.id} className="hotspot-btn" />
        </div>
      ))}
    </div>
  );
}

/** Keeps the shared viewport/slot measurement current for the camera framing. */
function useStageSlot(ref: React.RefObject<HTMLDivElement>) {
  useLayoutEffect(() => {
    const measure = () => {
      viewport.width = window.innerWidth;
      viewport.height = window.innerHeight;
      const r = ref.current?.getBoundingClientRect();
      if (r) viewport.slot = { x: r.left, y: r.top, width: r.width, height: r.height };
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (ref.current) ro.observe(ref.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [ref]);
}

export default function App() {
  const nav = useNav();
  const slot = useRef<HTMLDivElement>(null);
  const [announce, setAnnounce] = useState('');
  useStageSlot(slot);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestSection(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Announce arrivals and hand focus back to whatever opened the section.
  const prevPhase = useRef(nav.phase);
  useEffect(() => {
    const prev = prevPhase.current;
    prevPhase.current = nav.phase;
    if (nav.phase === 'open' && nav.section) setAnnounce(`${SECTION_BY_ID[nav.section].label} opened`);
    if (nav.phase === 'overview' && prev === 'closing') {
      setAnnounce('Back in the lab');
      const el = takeReturnFocus();
      if (el?.isConnected) el.focus({ preventScroll: true });
    }
  }, [nav.phase, nav.section]);

  return (
    <div className="app" data-phase={nav.phase} data-section={nav.section ?? undefined}>
      <Scene />
      <Header />
      <main className="home">
        <section className="intro" aria-labelledby="intro-title" {...inert(nav.phase !== 'overview')}>
          <span className="sparkle" aria-hidden="true" />
          <h1 id="intro-title">{INTRO.heading}</h1>
          <p className="tagline-lg">{INTRO.tagline}</p>
          <p className="lede">{INTRO.lede}</p>
          <p className="cue">
            {INTRO.cue} <span aria-hidden="true">→</span>
          </p>
          <p className="helper">{INTRO.helper}</p>
          <SocialLinks />
        </section>
        <div className="stage-slot" ref={slot} aria-hidden="true" />
      </main>
      <Hotspots />
      <SectionLayer />
      <div className="veil" ref={(el) => void (dom.veil = el)} aria-hidden="true" />
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
