import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { BEYOND, type ScrapChapter, type ScrapMedia } from '../content';
import { beyondReady } from '../preload';
import { Doodle, PaperClip, Sticker, type DoodleKind, type StickerKind } from './ScrapbookParts';
import { getNav } from '../state/nav';

// Beyond: a scrapbook with one chapter per open spread, laid over the 3D book the cat
// was sleeping on. Unlike About, it turns pages: a two-sided leaf swings around the
// spine, carrying the current page on its front and the next chapter's page on its
// back. The next chapter is rendered underneath before the turn starts, and every
// photo's frame takes its shape from the file's real size, so nothing reflows mid-turn.
// Phones get one chapter at a time in a scrolling panel with the same navigation.

type Mode = 'anchored' | 'panel';
type Side = 'left' | 'right';

const TURN_MS = 820;
/** Text scales tried, largest first, so the left page's text never runs into its photo. */
const SCALES = [1, 0.94, 0.88, 0.82];

function reducedMotion() {
  return getNav().reducedMotion;
}

// --- compositions ------------------------------------------------------------------------
// Each chapter has its own arrangement. Positions are percentages of a page (x, y, w);
// a print's height follows from the file's own aspect ratio, so these were worked out
// from the real sizes to keep prints apart, clear of the binding and the controls.
// Stickers only ever overlap a print's border.

type TapeStyle = 'stripe' | 'dots' | 'grid';

interface PrintPlace {
  side: Side;
  x: number;
  y: number;
  w: number;
  rot: number;
  tape: TapeStyle[];
  corners?: boolean;
  clip?: boolean;
}

type Deco =
  | { side: Side; kind: 'sticker'; which: StickerKind; x: number; y: number; w: number; rot?: number }
  | { side: Side; kind: 'doodle'; which: DoodleKind; x: number; y: number; w: number; rot?: number }
  | { side: Side; kind: 'note'; note: number; x: number; y: number; w: number; rot?: number }
  | { side: Side; kind: 'pill'; text: string; x: number; y: number; w: number; rot?: number };

interface Composition {
  text: { x: number; y: number; w: number; torn?: boolean };
  prints: PrintPlace[]; // one per chapter.media, in order
  decos: Deco[];
}

const COMPOSE: Record<ScrapChapter['id'], Composition> = {
  // words and one clip on the left, the second clip leading on the right
  create: {
    text: { x: 9, y: 7, w: 50, torn: true },
    prints: [
      { side: 'left', x: 64, y: 21, w: 25, rot: 2.5, tape: ['stripe'] },
      { side: 'right', x: 36, y: 12, w: 34, rot: -2, tape: ['dots', 'stripe'] },
    ],
    decos: [
      { side: 'left', kind: 'sticker', which: 'camera', x: 65, y: 70, w: 12, rot: -8 },
      { side: 'left', kind: 'sticker', which: 'bubble', x: 80, y: 68, w: 8, rot: 6 },
      { side: 'left', kind: 'doodle', which: 'sparkles', x: 81, y: 79, w: 6 },
      { side: 'left', kind: 'sticker', which: 'heart', x: 61, y: 15, w: 4.5, rot: -10 },
      { side: 'right', kind: 'note', note: 0, x: 7, y: 9, w: 27, rot: -4 },
      { side: 'right', kind: 'doodle', which: 'arrow', x: 13, y: 25, w: 19 },
      { side: 'right', kind: 'sticker', which: 'play', x: 66.5, y: 66, w: 6, rot: 8 },
      { side: 'right', kind: 'sticker', which: 'sparkle', x: 77, y: 18, w: 5 },
      { side: 'right', kind: 'doodle', which: 'heart', x: 79, y: 45, w: 6, rot: 8 },
      { side: 'right', kind: 'sticker', which: 'bubble', x: 11, y: 54, w: 10, rot: -6 },
      { side: 'right', kind: 'sticker', which: 'star', x: 20, y: 76, w: 5, rot: 12 },
    ],
  },
  // words up top with a large landscape below; two square-ish prints on the right
  sing: {
    text: { x: 10, y: 7, w: 78 },
    prints: [
      { side: 'left', x: 24, y: 52, w: 52, rot: -1.5, tape: ['grid'] },
      { side: 'right', x: 9, y: 9, w: 40, rot: -2.5, tape: ['stripe'], corners: true },
      { side: 'right', x: 53, y: 45, w: 38, rot: 2, tape: ['dots'] },
    ],
    decos: [
      { side: 'left', kind: 'sticker', which: 'note', x: 11, y: 60, w: 4.5, rot: -10 },
      { side: 'left', kind: 'doodle', which: 'notes', x: 8, y: 72, w: 12 },
      { side: 'left', kind: 'sticker', which: 'star', x: 80, y: 57, w: 5, rot: 8 },
      { side: 'right', kind: 'sticker', which: 'mic', x: 66, y: 11, w: 4.5, rot: 12 },
      { side: 'right', kind: 'doodle', which: 'star', x: 79, y: 25, w: 6, rot: -6 },
      { side: 'right', kind: 'sticker', which: 'sparkle', x: 57, y: 31, w: 4.5 },
      { side: 'right', kind: 'doodle', which: 'notes', x: 13, y: 59, w: 19 },
      { side: 'right', kind: 'sticker', which: 'note', x: 34, y: 71, w: 4.5, rot: 8 },
      { side: 'right', kind: 'sticker', which: 'heart', x: 20, y: 80, w: 4.5, rot: -8 },
    ],
  },
  // scenery leads: a big landscape on the right, a trail winding through
  explore: {
    text: { x: 10, y: 7, w: 76, torn: true },
    prints: [
      { side: 'left', x: 12, y: 48, w: 30, rot: -2, tape: ['grid'] },
      { side: 'right', x: 9, y: 7, w: 66, rot: 1.2, tape: ['stripe'], clip: true },
      { side: 'right', x: 56, y: 60, w: 21, rot: 3, tape: ['dots'] },
    ],
    decos: [
      { side: 'left', kind: 'pill', text: 'touching grass', x: 50, y: 56, w: 27, rot: -5 },
      { side: 'left', kind: 'sticker', which: 'boot', x: 53, y: 69, w: 7, rot: 6 },
      { side: 'left', kind: 'sticker', which: 'leaf', x: 66, y: 68, w: 5.5, rot: -10 },
      { side: 'left', kind: 'sticker', which: 'leaf', x: 74, y: 76, w: 4.5, rot: 22 },
      { side: 'left', kind: 'doodle', which: 'trail', x: 44, y: 78, w: 40 },
      { side: 'right', kind: 'doodle', which: 'mountains', x: 9, y: 63, w: 28 },
      { side: 'right', kind: 'doodle', which: 'trail', x: 8, y: 74, w: 46 },
      { side: 'right', kind: 'note', note: 0, x: 78, y: 15, w: 17, rot: 6 },
      { side: 'right', kind: 'doodle', which: 'arrowLeft', x: 78, y: 29, w: 14 },
      { side: 'right', kind: 'sticker', which: 'mountain', x: 80, y: 62, w: 10, rot: -4 },
      { side: 'right', kind: 'sticker', which: 'leaf', x: 44, y: 63, w: 5, rot: 12 },
    ],
  },
};

// --- pieces ----------------------------------------------------------------------------

function Print({ m, place, still }: { m: ScrapMedia; place: PrintPlace; still?: boolean }) {
  const reduced = reducedMotion();
  const style = {
    left: `${place.x}%`,
    top: `${place.y}%`,
    width: `${place.w}%`,
    '--rot': `${place.rot}deg`,
    '--ar': `${m.w} / ${m.h}`,
  } as React.CSSProperties;
  return (
    <figure className="sb-media" data-kind={m.kind} style={style}>
      {place.tape.map((t, i) => (
        <span key={i} className="sb-tape" data-tape={t} data-n={i} aria-hidden="true" />
      ))}
      {place.corners && ['tl', 'tr', 'bl', 'br'].map((c) => <span key={c} className="sb-corner" data-c={c} aria-hidden="true" />)}
      {place.clip && <PaperClip />}
      {m.kind === 'video' && !still ? (
        <video src={m.src} poster={m.poster} width={m.w} height={m.h} muted loop playsInline autoPlay={!reduced} controls={reduced} preload="auto" aria-label={m.alt} />
      ) : (
        <img
          src={m.kind === 'video' ? m.poster : m.src}
          width={m.w}
          height={m.h}
          alt={still ? '' : m.alt}
          style={m.focus ? { objectPosition: m.focus } : undefined}
          decoding="sync"
        />
      )}
    </figure>
  );
}

function Decoration({ d, chapter }: { d: Deco; chapter: ScrapChapter }) {
  const style = { left: `${d.x}%`, top: `${d.y}%`, width: `${d.w}%`, '--rot': `${d.rot ?? 0}deg` } as React.CSSProperties;
  if (d.kind === 'note')
    return (
      <p className="sb-deco sb-note" style={style}>
        {chapter.notes[d.note]}
      </p>
    );
  if (d.kind === 'pill')
    return (
      <span className="sb-deco sb-pill" style={style} aria-hidden="true">
        <span className="sb-pill-grass" />
        {d.text}
      </span>
    );
  return (
    <span className={`sb-deco sb-${d.kind}`} style={style} aria-hidden="true">
      {d.kind === 'sticker' ? <Sticker kind={d.which} /> : <Doodle kind={d.which} />}
    </span>
  );
}

/** One page of a chapter, composed from COMPOSE. */
function Page({ chapter, side, still }: { chapter: ScrapChapter; side: Side; still?: boolean }) {
  const c = COMPOSE[chapter.id];
  const t = c.text;
  return (
    <div className={`sb-page sb-${side}`} data-chapter={chapter.id}>
      {side === 'left' && (
        <div className="sb-text" data-torn={t.torn || undefined} style={{ left: `${t.x}%`, top: `${t.y}%`, width: `${t.w}%` }}>
          {t.torn && (
            <span className="sb-torn-wrap" aria-hidden="true">
              <span className="sb-torn" />
            </span>
          )}
          <h3 className="sb-heading">{chapter.heading}</h3>
          {chapter.text.map((p) => (
            <p key={p} className="sb-body">
              {p}
            </p>
          ))}
          {chapter.id === 'sing' && (
            // a margin note on the sentence that mentions it, not on any one photo
            <p className="sb-margin-note">
              <span aria-hidden="true">✦ </span>
              {chapter.notes[0]}
              <span aria-hidden="true"> ✦</span>
            </p>
          )}
        </div>
      )}
      {chapter.media.map((m, i) => c.prints[i].side === side && <Print key={m.src} m={m} place={c.prints[i]} still={still} />)}
      {c.decos.map((d, i) => d.side === side && <Decoration key={i} d={d} chapter={chapter} />)}
    </div>
  );
}

// --- scrapbook --------------------------------------------------------------------------

export function Scrapbook() {
  const root = useRef<HTMLDivElement>(null);
  const leaf = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>('anchored');
  const [ready, setReady] = useState(false);
  const [cur, setCur] = useState(0);
  const [turn, setTurn] = useState<{ to: number; dir: 1 | -1 } | null>(null);
  const [fit, setFit] = useState(0);
  const [, remeasure] = useReducer((n: number) => n + 1, 0);
  const pending = useRef<number | null>(null);
  const chapters = BEYOND.chapters;

  useEffect(() => {
    let alive = true;
    beyondReady.then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const surface = root.current?.closest<HTMLElement>('.surface');
    if (!surface) return;
    if (surface.dataset.mode === 'panel') setMode('panel');
    const onMode = (e: Event) => setMode((e as CustomEvent<Mode>).detail);
    surface.addEventListener('surfacemode', onMode);
    const ro = new ResizeObserver(() => {
      setFit(0);
      remeasure();
    });
    ro.observe(surface);
    return () => {
      surface.removeEventListener('surfacemode', onMode);
      ro.disconnect();
    };
  }, []);

  // Keep the left page's words clear of its prints: step the text down if they'd touch.
  useLayoutEffect(() => {
    if (!ready || mode !== 'anchored' || !root.current) return;
    const page = root.current.querySelector<HTMLElement>('.sb-spread > .sb-left');
    const text = page?.querySelector<HTMLElement>('.sb-text');
    if (!page || !text) return;
    const box = (e: HTMLElement) => ({ l: e.offsetLeft, t: e.offsetTop, r: e.offsetLeft + e.offsetWidth, b: e.offsetTop + e.offsetHeight });
    const tb = box(text);
    const gap = page.clientHeight * 0.02;
    const hits = [...page.querySelectorAll<HTMLElement>('.sb-media')].some((m) => {
      const mb = box(m);
      return tb.l < mb.r && tb.r > mb.l && tb.b + gap > mb.t && tb.t < mb.b;
    });
    if ((hits || tb.b > page.clientHeight * 0.9) && fit < SCALES.length - 1) setFit(fit + 1);
  });

  const go = useCallback(
    (to: number) => {
      if (to < 0 || to >= chapters.length) return;
      if (turn) {
        pending.current = to; // the latest request wins; played once this turn ends
        return;
      }
      if (to === cur) return;
      if (mode === 'panel' || reducedMotion()) {
        setCur(to);
        return;
      }
      setTurn({ to, dir: to > cur ? 1 : -1 });
    },
    [turn, cur, mode, chapters.length],
  );

  // Run the page turn once the leaf (with both pages) is in the DOM.
  useLayoutEffect(() => {
    if (!turn || !leaf.current) return;
    const angle = turn.dir > 0 ? -180 : 180;
    const anim = leaf.current.animate(
      [
        { transform: 'rotateY(0deg)' },
        { transform: `rotateY(${angle * 0.5}deg) translateZ(14px)`, offset: 0.5 },
        { transform: `rotateY(${angle}deg)` },
      ],
      { duration: TURN_MS, easing: 'cubic-bezier(0.45, 0.05, 0.3, 1)', fill: 'forwards' },
    );
    anim.onfinish = () => {
      setCur(turn.to);
      setTurn(null);
    };
    return () => anim.cancel();
  }, [turn]);

  // Follow a request made during the turn.
  useEffect(() => {
    if (turn || pending.current === null) return;
    const next = pending.current;
    pending.current = null;
    if (next !== cur) go(next);
  }, [turn, cur, go]);

  // Arrow keys turn pages, unless focus is in something that uses them itself.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const t = e.target as HTMLElement | null;
      if (t?.closest('input, textarea, select, video, [contenteditable="true"]')) return;
      e.preventDefault();
      go((turn?.to ?? cur) + (e.key === 'ArrowRight' ? 1 : -1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, cur, turn]);

  const shown = chapters[cur];
  const target = turn ? chapters[turn.to] : shown;
  // During a forward turn the right page underneath already shows the next chapter
  // (revealed as the leaf lifts); during a backward turn, the left page does.
  const leftChapter = turn && turn.dir < 0 ? target : shown;
  const rightChapter = turn && turn.dir > 0 ? target : shown;
  const active = turn ? turn.to : cur;

  const controls = (
    <>
      <nav className="sb-tabs" aria-label="Chapters">
        {chapters.map((c, i) => (
          <button key={c.id} type="button" className="sb-tab" data-chapter={c.id} aria-current={i === active ? 'true' : undefined} onClick={() => go(i)}>
            {c.tab}
          </button>
        ))}
      </nav>
      <button type="button" className="sb-nav sb-prev" onClick={() => go(active - 1)} disabled={active === 0}>
        <span aria-hidden="true">‹</span> Previous
      </button>
      <button type="button" className="sb-nav sb-next" onClick={() => go(active + 1)} disabled={active === chapters.length - 1}>
        Next <span aria-hidden="true">›</span>
      </button>
      <p className="sb-count" aria-live="polite">
        <span className="sr-only">Chapter </span>
        {String(active + 1).padStart(2, '0')} / {String(chapters.length).padStart(2, '0')}
        <span className="sr-only">: {chapters[active].heading}</span>
      </p>
    </>
  );

  return (
    <div
      ref={root}
      className="sb"
      data-layout={mode === 'panel' ? 'single' : 'spread'}
      data-ready={ready || undefined}
      style={{ '--sb-scale': SCALES[fit] } as React.CSSProperties}
    >
      <h2 id="section-title" className="sr-only" tabIndex={-1}>
        {BEYOND.title}
      </h2>
      {mode === 'panel' ? (
        <div className="sb-single" key={shown.id}>
          <Page chapter={shown} side="left" />
          <Page chapter={shown} side="right" />
        </div>
      ) : (
        <div className="sb-spread" data-turning={turn ? (turn.dir > 0 ? 'forward' : 'back') : undefined}>
          <Page chapter={leftChapter} side="left" />
          <Page chapter={rightChapter} side="right" />
          {turn && (
            <div ref={leaf} className="sb-leaf" data-dir={turn.dir > 0 ? 'forward' : 'back'} aria-hidden="true">
              <div className="sb-face sb-front">
                <Page chapter={shown} side={turn.dir > 0 ? 'right' : 'left'} still />
              </div>
              <div className="sb-face sb-back">
                <Page chapter={target} side={turn.dir > 0 ? 'left' : 'right'} still />
              </div>
            </div>
          )}
        </div>
      )}
      {controls}
    </div>
  );
}
