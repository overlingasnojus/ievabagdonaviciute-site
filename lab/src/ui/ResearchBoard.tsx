import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { RESEARCH, type ResearchEntry, type ResearchImage, type ResearchLink } from '../content';
import { CARD, cardRect, HEADER, IMAGE, LINE, ORG_SPACING, TILTS, TYPE } from './researchLayout';

// The Research whiteboard, up close. The overview is laid out from the same layout as
// the texture painted on the 3D whiteboard (researchLayout.ts), so when it fades in
// over that board nothing moves. Choosing an entry expands it inside the same board
// while the others move into a side strip; the camera never moves while browsing.
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

function Magnet({ tone = 'pink' }: { tone?: 'pink' | 'burgundy' | 'cream' }) {
  return <span className="magnet" data-tone={tone} aria-hidden="true" />;
}

const TONES = ['pink', 'burgundy', 'cream'] as const;

/** Board-layout values as CSS custom properties, so the CSS reads the shared numbers. */
function layoutVars(): React.CSSProperties {
  const pct = (f: number) => `${f * 100}`;
  return {
    '--hx': pct(HEADER.x),
    '--htop': pct(HEADER.top),
    '--htitle': pct(HEADER.title),
    '--hhint': pct(HEADER.hint),
    '--hgap': pct(HEADER.hintGap),
    '--pad': pct(CARD.pad),
    '--img': IMAGE.full,
    '--img-c': IMAGE.compact,
    '--org-ls': `${ORG_SPACING}em`,
    '--gap': pct(CARD.gap),
    '--org-gap': pct(CARD.orgGap),
    '--title-gap': pct(CARD.titleGap),
    '--magnet': pct(CARD.magnet),
    '--t-org': pct(TYPE.full.org),
    '--t-title': pct(TYPE.full.title),
    '--t-preview': pct(TYPE.full.preview),
    '--t-more': pct(TYPE.full.more),
    '--c-org': pct(TYPE.compact.org),
    '--c-title': pct(TYPE.compact.title),
    '--c-more': pct(TYPE.compact.more),
    '--lh-org': LINE.org,
    '--lh-title': LINE.title,
    '--lh-preview': LINE.preview,
    '--lh-more': LINE.more,
  } as React.CSSProperties;
}

// --- overview -----------------------------------------------------------------------

function Overview({ onOpen, returnTo }: { onOpen: (id: string) => void; returnTo: string | null }) {
  // When coming back from an entry, put focus back on that entry's note.
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (returnTo) root.current?.querySelector<HTMLElement>(`[data-entry="${returnTo}"]`)?.focus({ preventScroll: true });
  }, [returnTo]);

  return (
    <div ref={root} className="rb-overview" style={layoutVars()}>
      <header className="rb-head">
        <h2 id="section-title" className="rb-title" tabIndex={-1}>
          Research
        </h2>
        <p className="rb-hint" aria-hidden="true">
          pick a note to read more ↘
        </p>
      </header>
      <ul className="rb-cards">
        {RESEARCH.map((e, i) => {
          const r = cardRect(i);
          return (
            <li
              key={e.id}
              className="pin rb-card-pin"
              style={
                {
                  left: `${r.x * 100}%`,
                  top: `${r.y * 100}%`,
                  width: `${r.w * 100}%`,
                  height: `${r.h * 100}%`,
                  '--tilt': `${TILTS[i]}deg`,
                } as React.CSSProperties
              }
            >
              <article className="paper rb-card">
                <div className="rb-card-img" data-kind={e.image.kind}>
                  <img
                    src={e.image.src}
                    alt=""
                    style={e.image.focus ? { objectPosition: e.image.focus } : undefined}
                    decoding="async"
                  />
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
              <Magnet tone={TONES[i % 3]} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// --- detail -------------------------------------------------------------------------

function Links({ links }: { links?: ResearchLink[] }) {
  if (!links?.length) return null;
  return (
    <ul className="rb-links">
      {links.map((l) => (
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

function Topics({ topics }: { topics?: string[] }) {
  if (!topics?.length) return null;
  return (
    <ul className="rb-topics" aria-label="Topics">
      {topics.map((t) => (
        <li key={t}>{t}</li>
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

/**
 * A magnet-held print whose paper hugs the image: the white border follows the
 * picture's own proportions and the magnet sits on the print, never on empty paper.
 */
function Print({
  img,
  onView,
  tone = 'burgundy',
  tilt = -0.8,
  variant,
}: {
  img: ResearchImage;
  onView: (img: ResearchImage) => void;
  tone?: 'pink' | 'burgundy' | 'cream';
  tilt?: number;
  variant?: 'portrait' | 'wide';
}) {
  return (
    <figure className="rb-print" data-variant={variant} style={{ '--tilt': `${tilt}deg` } as React.CSSProperties}>
      <div className="pin rb-print-pin">
        <div className="paper paper-print">
          <Figure img={img} onView={onView} />
        </div>
        <Magnet tone={tone} />
      </div>
      {img.caption && <figcaption className="rb-caption">{img.caption}</figcaption>}
    </figure>
  );
}

function Body({ paragraphs }: { paragraphs: string[] }) {
  return (
    <>
      {paragraphs.map((p) => (
        <p key={p} className="rb-body">
          <Rich text={p} />
        </p>
      ))}
    </>
  );
}

/** UIUC Computer Vision Group: two separate projects behind tabs. */
function ProjectTabs({ entry, onView }: { entry: ResearchEntry; onView: (img: ResearchImage) => void }) {
  const projects = entry.projects!;
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const p = projects[active];
  const select = (i: number) => {
    const n = (i + projects.length) % projects.length;
    setActive(n);
    tabs.current[n]?.focus();
  };
  return (
    <>
      <div className="rb-tabs" role="tablist" aria-label="Projects">
        {projects.map((q, i) => (
          <button
            key={q.id}
            ref={(el) => void (tabs.current[i] = el)}
            type="button"
            role="tab"
            id={`rb-tab-${q.id}`}
            aria-selected={i === active}
            aria-controls={`rb-panel-${q.id}`}
            tabIndex={i === active ? 0 : -1}
            className="rb-tab"
            onClick={() => setActive(i)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') select(i + 1);
              if (e.key === 'ArrowLeft') select(i - 1);
            }}
          >
            {q.tab}
          </button>
        ))}
      </div>
      <div className="rb-panel" role="tabpanel" id={`rb-panel-${p.id}`} aria-labelledby={`rb-tab-${p.id}`} key={p.id} data-has-image={p.image ? true : undefined}>
        {p.image && <Print img={p.image} onView={onView} tilt={-0.6} />}
        <div className="rb-panel-text">
          <h4 className="rb-project-title">{p.title}</h4>
          <Body paragraphs={p.body} />
          {p.labels && (
            <ul className="rb-labels" aria-label="Recognition">
              {p.labels.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          )}
          <Topics topics={p.topics} />
          <Links links={p.links} />
        </div>
      </div>
    </>
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

  const heading = (
    <>
      <p className="rb-org">{entry.org}</p>
      {entry.role && <p className="rb-role">{entry.role}</p>}
      <h3 id="rb-entry-title" ref={title} className="rb-entry-title" tabIndex={-1}>
        {entry.title}
      </h3>
    </>
  );

  let content: JSX.Element;
  if (entry.projects) {
    content = (
      <article className="rb-text rb-text-full" aria-labelledby="rb-entry-title">
        {heading}
        <ProjectTabs entry={entry} onView={onView} />
      </article>
    );
  } else if (entry.layout === 'feature') {
    // a portrait print beside the words, the second print across the full width below
    content = (
      <div className="rb-feature">
        <div className="rb-feature-top">
          <Print img={entry.image} onView={onView} variant="portrait" tilt={-1.2} />
          <article className="rb-text" aria-labelledby="rb-entry-title">
            {heading}
            <Body paragraphs={entry.body} />
            <Topics topics={entry.topics} />
            <Links links={entry.links} />
          </article>
        </div>
        {entry.image2 && <Print img={entry.image2} onView={onView} variant="wide" tone="pink" tilt={0.4} />}
      </div>
    );
  } else {
    content = (
      <div className="rb-main-grid">
        <Print img={entry.image} onView={onView} />
        <article className="rb-text" aria-labelledby="rb-entry-title">
          {heading}
          <Body paragraphs={entry.body} />
          <Topics topics={entry.topics} />
          <Links links={entry.links} />
        </article>
      </div>
    );
  }

  return (
    <div className="rb-detail">
      <h2 id="section-title" className="sr-only">
        Research
      </h2>
      <div className="rb-main" key={entry.id}>
        <button type="button" className="rb-back" onClick={onBack}>
          <span aria-hidden="true">←</span> All research
        </button>
        {content}
      </div>
      <nav className="rb-strip" aria-label="Other research">
        <p className="rb-strip-label" aria-hidden="true">
          more notes
        </p>
        <ul>
          {others.map((e, i) => (
            <li key={e.id} className="pin pin-strip" style={{ '--tilt': `${TILTS[i] / 2}deg` } as React.CSSProperties}>
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
    <div className="rb-viewer" role="dialog" aria-modal="true" aria-label={img.caption ?? img.alt} onClick={onClose}>
      {/* the white mount hugs the image; the caption wraps to the image's width */}
      <figure onClick={(e) => e.stopPropagation()}>
        <img src={img.src} alt={img.alt} />
        {img.caption && <figcaption>{img.caption}</figcaption>}
      </figure>
      <button ref={close} type="button" className="rb-viewer-close" onClick={onClose}>
        Close <span aria-hidden="true">×</span>
      </button>
    </div>,
    document.body,
  );
}

// --- narrow screens -------------------------------------------------------------------

function ListPrint({ img, onView }: { img: ResearchImage; onView: (img: ResearchImage) => void }) {
  return (
    <figure className="rb-list-print">
      <div className="paper paper-print rb-list-figure">
        <Figure img={img} onView={onView} />
      </div>
      {img.caption && <figcaption className="rb-caption">{img.caption}</figcaption>}
    </figure>
  );
}

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
                  {e.role && <p className="rb-role">{e.role}</p>}
                  {e.projects ? (
                    e.projects.map((p) => (
                      <section key={p.id} className="rb-list-project">
                        <h4 className="rb-project-title">{p.title}</h4>
                        {p.image && <ListPrint img={p.image} onView={onView} />}
                        <Body paragraphs={p.body} />
                        {p.labels && (
                          <ul className="rb-labels" aria-label="Recognition">
                            {p.labels.map((l) => (
                              <li key={l}>{l}</li>
                            ))}
                          </ul>
                        )}
                        <Topics topics={p.topics} />
                        <Links links={p.links} />
                      </section>
                    ))
                  ) : (
                    <>
                      <ListPrint img={e.image} onView={onView} />
                      <Body paragraphs={e.body} />
                      {e.image2 && <ListPrint img={e.image2} onView={onView} />}
                      <Topics topics={e.topics} />
                      <Links links={e.links} />
                    </>
                  )}
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
