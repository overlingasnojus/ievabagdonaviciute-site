import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RESEARCH, type ResearchEntry, type ResearchImage } from '../content';

// The Research whiteboard: an opaque board laid over the 3D whiteboard (it wipes in
// as the board's doodles are wiped away). The overview shows every entry as a note
// held on with magnets; choosing one expands it inside the same board while the other
// entries move into a side strip. The camera never moves while browsing.
// Narrow screens get a simple list of expandable entries instead.

type Mode = 'anchored' | 'panel';

/** Renders **phrases** as <strong>. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>))}
    </>
  );
}

// --- little line drawings for entries without a real figure ----------------------

const pen = { fill: 'none', stroke: '#6B2346', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const accent = { ...pen, stroke: '#C66F8E' };

function Sketch({ kind }: { kind: NonNullable<ResearchEntry['sketch']> }) {
  return (
    <svg className="rb-sketch" viewBox="0 0 160 110" role="img" aria-label={SKETCH_LABEL[kind]}>
      {kind === 'arm' && (
        <g>
          <path d="M30 96 L90 96" {...pen} />
          <rect x="44" y="86" width="26" height="10" rx="2" {...pen} />
          <path d="M57 86 L64 56 L100 38" {...pen} strokeWidth={5} stroke="#E9DCE2" />
          <path d="M57 86 L64 56 L100 38" {...pen} />
          <circle cx="64" cy="56" r="5" {...pen} />
          <circle cx="100" cy="38" r="4" {...pen} />
          <path d="M100 38 L112 52 M108 56 L112 52 L118 56" {...pen} />
          <rect x="106" y="74" width="14" height="14" rx="1.5" {...accent} />
          <path d="M113 62 L113 70" {...accent} strokeDasharray="2 3" />
          <path d="M22 30 L34 30 M28 24 L28 36" {...accent} />
        </g>
      )}
      {kind === 'depth' && (
        <g>
          <rect x="18" y="44" width="34" height="24" rx="4" {...pen} />
          <circle cx="35" cy="56" r="7" {...pen} />
          <path d="M52 50 L74 30 M52 62 L74 82" {...pen} strokeDasharray="3 3" />
          <path d="M78 32 Q 98 56, 78 80" {...accent} />
          <path d="M96 30 Q 118 56, 96 82" {...accent} opacity={0.75} />
          <path d="M114 28 Q 138 56, 114 84" {...accent} opacity={0.5} />
          <path d="M120 44 L136 40 L142 56 L128 62 Z" {...pen} />
          <path d="M18 96 L142 96" {...pen} strokeDasharray="2 4" />
        </g>
      )}
      {kind === 'scan' && (
        <g>
          {[0, 1, 2, 3].map((i) => (
            <ellipse key={i} cx={80} cy={34 + i * 16} rx={46} ry={12} {...pen} opacity={1 - i * 0.18} />
          ))}
          <path d="M66 50 Q 80 40, 94 52 Q 100 66, 84 70 Q 66 72, 66 50 Z" {...accent} />
          <path d="M34 34 L34 82 M126 34 L126 82" {...pen} />
          <path d="M138 24 L150 24 M138 36 L148 36" {...accent} />
        </g>
      )}
    </svg>
  );
}

const SKETCH_LABEL = {
  arm: 'Sketch of a robot arm picking up a block',
  depth: 'Sketch of a camera capturing a scene in depth layers',
  scan: 'Sketch of stacked imaging slices through a volume',
};

function Magnet({ tone = 'pink' }: { tone?: 'pink' | 'burgundy' | 'cream' }) {
  return <span className="magnet" data-tone={tone} aria-hidden="true" />;
}

/** The picture for an entry: its image, or its line sketch. */
function Visual({ entry, size }: { entry: ResearchEntry; size: 'card' | 'thumb' }) {
  const img = entry.image;
  if (!img) return entry.sketch ? <Sketch kind={entry.sketch} /> : null;
  return (
    <img
      className="rb-img"
      data-kind={img.kind}
      src={img.src}
      alt={size === 'thumb' ? '' : img.alt}
      style={img.focus ? { objectPosition: img.focus } : undefined}
      loading="lazy"
      decoding="async"
    />
  );
}

const TONES = ['pink', 'burgundy', 'cream'] as const;
const TILT = [-1.6, 1.2, -0.8, 1.8, -1.2, 0.9];

// --- overview -----------------------------------------------------------------------

function Overview({ onOpen, returnTo }: { onOpen: (id: string) => void; returnTo: string | null }) {
  const featured = RESEARCH.filter((e) => e.featured);
  const notes = RESEARCH.filter((e) => !e.featured);

  // When coming back from an entry, put focus back on that entry's note.
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (returnTo) root.current?.querySelector<HTMLElement>(`[data-entry="${returnTo}"]`)?.focus({ preventScroll: true });
  }, [returnTo]);

  return (
    <div ref={root} className="rb-overview">
      <header className="rb-head">
        <h2 id="section-title" className="rb-title" tabIndex={-1}>
          Research
        </h2>
        <p className="rb-hint" aria-hidden="true">
          pick a note to read more ↘
        </p>
      </header>
      <ul className="rb-featured" aria-label="Main research">
        {featured.map((e, i) => (
          <li key={e.id} className="pin" style={{ '--tilt': `${TILT[i]}deg` } as React.CSSProperties}>
            <Magnet tone={TONES[i % 3]} />
            <article className="paper paper-print">
              <div className="rb-visual">
                <Visual entry={e} size="card" />
              </div>
              <p className="rb-org">{e.org}</p>
              <h3 className="rb-card-title">
                <button type="button" className="stretch" data-entry={e.id} onClick={() => onOpen(e.id)}>
                  {e.title}
                </button>
              </h3>
              <p className="rb-preview">{e.preview}</p>
              <span className="rb-more" aria-hidden="true">
                Read more →
              </span>
            </article>
          </li>
        ))}
      </ul>
      <ul className="rb-notes" aria-label="More research">
        {notes.map((e, i) => (
          <li key={e.id} className="pin pin-small" style={{ '--tilt': `${TILT[i + 3]}deg` } as React.CSSProperties}>
            <Magnet tone={TONES[(i + 1) % 3]} />
            <article className="paper paper-note">
              <div className="rb-thumb">
                <Visual entry={e} size="thumb" />
              </div>
              <div>
                <p className="rb-org">{e.org}</p>
                <h3 className="rb-note-title">
                  <button type="button" className="stretch" data-entry={e.id} onClick={() => onOpen(e.id)}>
                    {e.title}
                  </button>
                </h3>
                <p className="rb-preview">{e.preview}</p>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- detail -------------------------------------------------------------------------

function Links({ entry }: { entry: ResearchEntry }) {
  if (!entry.links?.length) return null;
  return (
    <ul className="rb-links">
      {entry.links.map((l) => (
        <li key={l.href}>
          {l.tag && <span className="rb-tag">{l.tag}</span>}
          {l.title && <span className="rb-link-title">{l.title}</span>}
          <a href={l.href} target="_blank" rel="noopener noreferrer">
            {l.label}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function Figure({ img, onView }: { img: ResearchImage; onView: (img: ResearchImage) => void }) {
  return (
    <button type="button" className="rb-figure-btn" onClick={() => onView(img)} aria-label={`Enlarge image: ${img.alt}`}>
      <img className="rb-img" data-kind={img.kind} src={img.src} alt="" decoding="async" />
      <span className="rb-zoom" aria-hidden="true">
        ⤢
      </span>
    </button>
  );
}

function Detail({
  entry,
  onBack,
  onOpen,
  onView,
}: {
  entry: ResearchEntry;
  onBack: () => void;
  onOpen: (id: string) => void;
  onView: (img: ResearchImage) => void;
}) {
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => title.current?.focus({ preventScroll: true }), [entry.id]);
  const others = RESEARCH.filter((e) => e.id !== entry.id);

  return (
    <div className="rb-detail">
      <h2 id="section-title" className="sr-only">
        Research
      </h2>
      <div className="rb-main" key={entry.id}>
        <button type="button" className="rb-back" onClick={onBack}>
          <span aria-hidden="true">←</span> All research
        </button>
        <div className="rb-main-grid">
          <div className="pin pin-figure" style={{ '--tilt': '-0.8deg' } as React.CSSProperties}>
            <Magnet tone="burgundy" />
            <div className="paper paper-print" data-plot={entry.image?.kind === 'plot' || undefined}>
              {entry.image ? (
                <Figure img={entry.image} onView={onView} />
              ) : (
                entry.sketch && (
                  <div className="rb-figure-sketch">
                    <Sketch kind={entry.sketch} />
                  </div>
                )
              )}
            </div>
            {entry.image2 && (
              <div className="paper paper-print rb-second">
                <Figure img={entry.image2} onView={onView} />
              </div>
            )}
          </div>
          <article className="rb-text" aria-labelledby="rb-entry-title">
            <p className="rb-org">{entry.org}</p>
            {entry.role && <p className="rb-role">{entry.role}</p>}
            <h3 id="rb-entry-title" ref={title} className="rb-entry-title" tabIndex={-1}>
              {entry.title}
            </h3>
            {entry.body.map((p) => (
              <p key={p} className="rb-body">
                <Rich text={p} />
              </p>
            ))}
            <ul className="rb-topics" aria-label="Topics">
              {entry.topics.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <Links entry={entry} />
          </article>
        </div>
      </div>
      <nav className="rb-strip" aria-label="Other research">
        <p className="rb-strip-label" aria-hidden="true">
          more notes
        </p>
        <ul>
          {others.map((e, i) => (
            <li key={e.id} className="pin pin-strip" style={{ '--tilt': `${TILT[i] / 2}deg` } as React.CSSProperties}>
              <Magnet tone={TONES[i % 3]} />
              <button type="button" className="paper paper-strip" onClick={() => onOpen(e.id)}>
                <span className="rb-org">{e.org}</span>
                <span className="rb-strip-title">{e.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

// --- image viewer -------------------------------------------------------------------

function Viewer({ img, onClose }: { img: ResearchImage; onClose: () => void }) {
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    close.current?.focus();
    // Escape closes the viewer only, not the whole section.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      opener?.focus({ preventScroll: true });
    };
  }, [onClose]);
  return createPortal(
    <div className="rb-viewer" role="dialog" aria-modal="true" aria-label={img.alt} onClick={onClose}>
      <figure onClick={(e) => e.stopPropagation()}>
        <img src={img.src} alt={img.alt} />
        <figcaption>{img.alt}</figcaption>
      </figure>
      <button ref={close} type="button" className="rb-viewer-close" onClick={onClose}>
        Close <span aria-hidden="true">×</span>
      </button>
    </div>,
    document.body,
  );
}

// --- narrow screens -------------------------------------------------------------------

function List({ onView }: { onView: (img: ResearchImage) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="rb-list">
      <h2 id="section-title" className="rb-title" tabIndex={-1}>
        Research
      </h2>
      <ul>
        {RESEARCH.map((e) => {
          const expanded = open === e.id;
          return (
            <li key={e.id} className="rb-list-item">
              <button type="button" className="rb-list-toggle" aria-expanded={expanded} aria-controls={`rb-${e.id}`} onClick={() => setOpen(expanded ? null : e.id)}>
                <span className="rb-org">{e.org}</span>
                <span className="rb-list-title">{e.title}</span>
                <span className="rb-preview">{e.preview}</span>
                <span className="rb-list-chev" aria-hidden="true">
                  {expanded ? '−' : '+'}
                </span>
              </button>
              {expanded && (
                <div id={`rb-${e.id}`} className="rb-list-body">
                  <div className="paper paper-print rb-list-figure">
                    {e.image ? <Figure img={e.image} onView={onView} /> : e.sketch && <Sketch kind={e.sketch} />}
                  </div>
                  {e.image2 && (
                    <div className="paper paper-print rb-list-figure">
                      <Figure img={e.image2} onView={onView} />
                    </div>
                  )}
                  {e.role && <p className="rb-role">{e.role}</p>}
                  {e.body.map((p) => (
                    <p key={p} className="rb-body">
                      <Rich text={p} />
                    </p>
                  ))}
                  <ul className="rb-topics" aria-label="Topics">
                    {e.topics.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                  <Links entry={e} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// --- board ----------------------------------------------------------------------------

export function ResearchBoard() {
  const root = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>('anchored');
  const [selected, setSelected] = useState<string | null>(null);
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const [viewer, setViewer] = useState<ResearchImage | null>(null);

  useLayoutEffect(() => {
    const surface = root.current?.closest<HTMLElement>('.surface');
    if (!surface) return;
    if (surface.dataset.mode === 'panel') setMode('panel');
    const onMode = (e: Event) => setMode((e as CustomEvent<Mode>).detail);
    surface.addEventListener('surfacemode', onMode);
    return () => surface.removeEventListener('surfacemode', onMode);
  }, []);

  const closeViewer = useCallback(() => setViewer(null), []);
  const entry = RESEARCH.find((e) => e.id === selected);
  return (
    <div ref={root} className="rb" data-view={mode === 'panel' ? 'list' : entry ? 'detail' : 'overview'}>
      <div className="rb-content">
        {mode === 'panel' ? (
          <List onView={setViewer} />
        ) : entry ? (
          <Detail
            entry={entry}
            onOpen={setSelected}
            onView={setViewer}
            onBack={() => {
              setReturnTo(entry.id);
              setSelected(null);
            }}
          />
        ) : (
          <Overview
            returnTo={returnTo}
            onOpen={(id) => {
              setReturnTo(null);
              setSelected(id);
            }}
          />
        )}
      </div>
      {viewer && <Viewer img={viewer} onClose={closeViewer} />}
    </div>
  );
}
