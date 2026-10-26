import { Fragment, useEffect, useRef, useState } from 'react';
import { PROJECTS, type Project } from '../content';
import { useNav } from '../state/nav';
import { FilePixel, HeartPixel, ProjectIcon, TrophyPixel } from './DesktopIcons';

// Projects: a little pixel desktop on the lab's main monitor. It boots ("Opening
// Ieva's workspace…", driven by --boot from the open timeline), then shows four
// project icons. One window is open at a time; the camera never moves while browsing.

/** Renders **phrases** as <strong>. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>))}
    </>
  );
}

function Badges({ awards }: { awards: string[] }) {
  return (
    <ul className="dt-badges" aria-label="Awards">
      {awards.map((a) => (
        <li key={a} className="dt-badge">
          <TrophyPixel />
          <span>{a}</span>
        </li>
      ))}
    </ul>
  );
}

function useClock() {
  const fmt = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const [time, setTime] = useState(fmt);
  useEffect(() => {
    const t = window.setInterval(() => setTime(fmt()), 20_000);
    return () => window.clearInterval(t);
  }, []);
  return time;
}

function ProjectWindow({ project, closing, onClose }: { project: Project; closing: boolean; onClose: () => void }) {
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => title.current?.focus({ preventScroll: true }), []);

  return (
    <section className="dt-window" data-id={project.id} data-closing={closing || undefined} role="dialog" aria-labelledby="dt-window-title">
      <header className="dt-titlebar">
        <span className="dt-titlebar-name" aria-hidden="true">
          {project.label}
        </span>
        <button type="button" className="dt-close" onClick={onClose} aria-label={`Close ${project.title}`}>
          ×
        </button>
      </header>

      <div className="dt-body">
        {project.icon !== 'hackathon' && project.icon !== 'folder' && (
          <div className="dt-illustration" aria-hidden="true">
            <ProjectIcon kind={project.icon} />
          </div>
        )}
        <div className="dt-copy">
          {project.icon === 'hackathon' && project.awards && (
            <div className="dt-hero-badge" aria-hidden="true">
              <TrophyPixel />
            </div>
          )}
          <h3 id="dt-window-title" ref={title} tabIndex={-1} className="dt-title">
            {project.title}
          </h3>
          {project.tagline && <p className="dt-tagline">{project.tagline}</p>}
          <p className="dt-meta">{project.meta}</p>
          {project.body.map((p) => (
            <p key={p} className="dt-text">
              <Rich text={p} />
            </p>
          ))}
          {project.awards && <Badges awards={project.awards} />}
          {project.sections && (
            // the club's projects, readable right here: no nested files to open
            <ul className="dt-sections">
              {project.sections.map((sec) => (
                <li key={sec.name} className="dt-section">
                  <FilePixel />
                  <div>
                    <h4 className="dt-section-name">{sec.name}</h4>
                    <p className="dt-section-text">{sec.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

export function ProjectsDesktop() {
  const { phase } = useNav();
  const [openId, setOpenId] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const icons = useRef<Record<string, HTMLButtonElement | null>>({});
  const timer = useRef<number>();
  const time = useClock();
  const project = PROJECTS.find((p) => p.id === openId);

  const close = () => {
    if (!openId || closing) return;
    const id = openId;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setClosing(true);
    timer.current = window.setTimeout(
      () => {
        setOpenId(null);
        setClosing(false);
        icons.current[id]?.focus({ preventScroll: true });
      },
      reduced ? 0 : 140,
    );
  };

  // Escape closes the window first; the next Escape leaves the section.
  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      close();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div className="dt">
      <div className="dt-boot" aria-hidden="true">
        {/* the boot screen plays in reverse on the way out, so say which way it's going */}
        <p>{phase === 'closing' ? 'Closing Ieva’s workspace…' : 'Opening Ieva’s workspace…'}</p>
        <div className="dt-bar">
          <span />
        </div>
      </div>

      <div className="dt-desktop">
        <div className="dt-wallpaper" aria-hidden="true" />
        <p className="dt-workspace-label" aria-hidden="true">
          Ieva’s workspace
        </p>
        <h2 id="section-title" className="sr-only" tabIndex={-1}>
          Projects
        </h2>
        <ul className="dt-icons" aria-label="Projects">
          {PROJECTS.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                ref={(el) => void (icons.current[p.id] = el)}
                className="dt-icon"
                data-kind={p.icon}
                aria-haspopup="dialog"
                aria-pressed={openId === p.id}
                onClick={() => {
                  window.clearTimeout(timer.current);
                  setClosing(false);
                  setOpenId(p.id);
                }}
              >
                <ProjectIcon kind={p.icon} />
                <span className="dt-icon-label">{p.label}</span>
              </button>
            </li>
          ))}
        </ul>

        {project && <ProjectWindow key={project.id} project={project} closing={closing} onClose={close} />}

        <div className="dt-taskbar" aria-hidden="true">
          <span className="dt-start">
            <HeartPixel /> ieva.os
          </span>
          {project && <span className="dt-task">{project.label}</span>}
          <span className="dt-clock">{time}</span>
        </div>
      </div>
    </div>
  );
}
