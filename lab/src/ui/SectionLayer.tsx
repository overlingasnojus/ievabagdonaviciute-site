import { useEffect, useRef } from 'react';
import { PLACEHOLDERS, SECTION_BY_ID, type SectionId } from '../content';
import { dom } from '../scene/registry';
import { AboutNotebook } from './AboutNotebook';
import { requestSection, useNav } from '../state/nav';

// HTML surfaces for each section. While a section is open the Projector pins the
// surface to its 3D object (open notebook pages, whiteboard, screen, scrapbook, paper),
// or turns it into a centred panel when the in-world surface would be too small.

function Kicker({ id }: { id: SectionId }) {
  const s = SECTION_BY_ID[id];
  return (
    <p className="kicker">
      {s.number} · {s.label}
    </p>
  );
}

function Research() {
  const c = PLACEHOLDERS.research;
  return (
    <div className="board">
      <Kicker id="research" />
      <h2 id="section-title" tabIndex={-1}>
        {c.title}
      </h2>
      <p className="note">{c.note}</p>
    </div>
  );
}

const BOOT_LINES = ['lab-os v0.1', 'mounting ~/projects', 'checking experiments', 'ready'];

function Projects() {
  const c = PLACEHOLDERS.projects;
  return (
    <div className="screen">
      <div className="boot" aria-hidden="true">
        {BOOT_LINES.map((l, i) => (
          <p key={l} style={{ '--i': i } as React.CSSProperties}>
            <span className="prompt">&gt;</span> {l}
          </p>
        ))}
      </div>
      <div className="console">
        <p className="bar">~/projects</p>
        <h2 id="section-title" tabIndex={-1}>
          {c.title}
        </h2>
        <p className="note">
          {c.note}
          <span className="cursor" aria-hidden="true" />
        </p>
      </div>
    </div>
  );
}

function Beyond() {
  const c = PLACEHOLDERS.beyond;
  return (
    <div className="spread">
      <div className="page">
        <Kicker id="beyond" />
        <h2 id="section-title" tabIndex={-1}>
          {c.title}
        </h2>
      </div>
      <div className="page">
        <p className="note">{c.note}</p>
      </div>
    </div>
  );
}

function Cv() {
  const c = PLACEHOLDERS.cv;
  return (
    <article className="paper">
      <p className="kicker">05 · CV</p>
      <h2 id="section-title" tabIndex={-1}>
        {c.name}
      </h2>
      <p className="doc-title">{c.title}</p>
      <hr />
      <p className="note">{c.note}</p>
      <div className="actions">
        {c.pdfUrl ? (
          <a className="btn" href={c.pdfUrl} download>
            Download PDF
          </a>
        ) : (
          <>
            <button type="button" className="btn" disabled aria-describedby="pdf-status">
              Download PDF
            </button>
            <span id="pdf-status" className="status">
              PDF coming soon
            </span>
          </>
        )}
      </div>
    </article>
  );
}

const CONTENT: Record<SectionId, () => JSX.Element> = { about: AboutNotebook, research: Research, projects: Projects, beyond: Beyond, cv: Cv };

export function SectionLayer() {
  const { phase, section } = useNav();
  const surface = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dom.surface = surface.current;
  });

  useEffect(() => {
    if (phase === 'open') surface.current?.querySelector<HTMLElement>('#section-title')?.focus({ preventScroll: true });
  }, [phase]);

  const Content = section ? CONTENT[section] : null;
  return (
    <div className="section-layer">
      <button type="button" className="back" onClick={() => requestSection(null)} tabIndex={phase === 'overview' ? -1 : 0} aria-hidden={phase === 'overview'}>
        <span aria-hidden="true">←</span> Back to lab
      </button>
      {Content && (
        <div
          key={section}
          ref={surface}
          className="surface"
          data-section={section}
          data-mode="anchored"
          role="region"
          aria-labelledby="section-title"
          style={{ opacity: 0 }}
        >
          <Content />
        </div>
      )}
    </div>
  );
}
