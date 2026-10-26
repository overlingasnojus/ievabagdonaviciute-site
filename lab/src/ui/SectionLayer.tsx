import { useEffect, useRef, useState } from 'react';
import { PLACEHOLDERS, type SectionId } from '../content';
import { dom } from '../scene/registry';
import { AboutNotebook } from './AboutNotebook';
import { ProjectsDesktop } from './ProjectsDesktop';
import { ResearchBoard } from './ResearchBoard';
import { Scrapbook } from './Scrapbook';
import { requestSection, useNav } from '../state/nav';

// HTML surfaces for each section. While a section is open the Projector pins the
// surface to its 3D object (open notebook pages, whiteboard, screen, scrapbook, paper),
// or turns it into a centred panel when the in-world surface would be too small.

function Cv() {
  const c = PLACEHOLDERS.cv;
  const [zoomed, setZoomed] = useState(false);
  const scroll = useRef<HTMLDivElement>(null);
  const toggleZoom = () => {
    const el = scroll.current;
    const ratio = el ? el.scrollTop / Math.max(1, el.scrollHeight) : 0;
    setZoomed((z) => !z);
    // keep roughly the same place in the document after the zoom
    requestAnimationFrame(() => {
      if (!el) return;
      el.scrollTop = ratio * el.scrollHeight;
      el.scrollLeft = 0;
    });
  };
  return (
    <div className="cv" data-zoomed={zoomed || undefined}>
      <h2 id="section-title" className="sr-only" tabIndex={-1}>
        {c.title}
      </h2>
      {/* the pages scroll inside the viewer; focusable so arrow keys and Page Down work */}
      <div ref={scroll} className="cv-scroll" tabIndex={0} role="document" aria-label="Curriculum vitae, two pages" data-autofocus>
        {c.pages.map((src, i) => (
          <img
            key={src}
            className="cv-page"
            src={src}
            alt={`Ieva Bagdonaviciute, CV page ${i + 1} of ${c.pages.length}. The full text is in the downloadable PDF.`}
            width={1530}
            height={1980}
            decoding="async"
          />
        ))}
      </div>
      <div className="cv-actions">
        {/* only shown on narrow screens, where a fitted page is too small to read */}
        <button type="button" className="btn btn-light cv-zoom" onClick={toggleZoom} aria-pressed={zoomed}>
          {zoomed ? 'Fit width' : 'Zoom in'}
        </button>
        {c.pdfUrl && (
          <a className="btn" href={c.pdfUrl} download>
            Download PDF
          </a>
        )}
      </div>
    </div>
  );
}

const CONTENT: Record<SectionId, () => JSX.Element> = { about: AboutNotebook, research: ResearchBoard, projects: ProjectsDesktop, beyond: Scrapbook, cv: Cv };

export function SectionLayer() {
  const { phase, section } = useNav();
  const surface = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dom.surface = surface.current;
  });

  useEffect(() => {
    if (phase !== 'open' || !surface.current) return;
    const target = surface.current.querySelector<HTMLElement>('[data-autofocus]') ?? surface.current.querySelector<HTMLElement>('#section-title');
    target?.focus({ preventScroll: true });
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
