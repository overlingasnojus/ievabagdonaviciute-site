import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ABOUT, type AboutBlock } from '../content';
import { anim } from '../state/anim';
import { getNav } from '../state/nav';

// The About notebook's pages. Text is real HTML laid over the open 3D spread.
//
// Layouts, in order of preference:
//   spread   – everything on one two-page spread (large screens)
//   compact  – the compact page set, two pages per spread, with page turns
//   single   – the compact page set one page at a time (phones / panel mode)
// The spread layout is tried first and dropped if any page would overflow.

type Mode = 'anchored' | 'panel';

/** Text scales tried in order (largest first) before falling back to more pages. */
const SCALES = [1.2, 1.1, 1.0, 0.92];

function PixelRobot() {
  // Small margin doodle, drawn on a 14×14 grid.
  const px = (x: number, y: number, w: number, h: number, c: string) => <rect x={x} y={y} width={w} height={h} fill={c} />;
  return (
    <svg className="nb-doodle" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
      {px(7, 0, 2, 1, '#BE3E70')}
      {px(7.5, 1, 1, 2, '#7A5A6A')}
      {px(3, 3, 10, 7, '#7A5A6A')}
      {px(4, 4, 8, 5, '#F6E9DE')}
      {px(5, 5, 6, 3, '#3A2A33')}
      {px(6, 6, 1, 1, '#F28DB2')}
      {px(9, 6, 1, 1, '#F28DB2')}
      {px(2, 5, 1, 3, '#7A5A6A')}
      {px(13, 5, 1, 3, '#7A5A6A')}
      {px(4, 10, 8, 4, '#7A5A6A')}
      {px(5, 11, 6, 2, '#F6E9DE')}
      {px(7, 11, 2, 1, '#BE3E70')}
      {px(4, 14, 2, 2, '#3A2A33')}
      {px(10, 14, 2, 2, '#3A2A33')}
    </svg>
  );
}

function Block({ id, order }: { id: AboutBlock; order: number }) {
  const style = { '--r': order } as React.CSSProperties;
  switch (id) {
    case 'heading':
      return (
        <>
          <p className="kicker" style={style}>
            01 · About
          </p>
          <h2 id="section-title" className="nb-title" tabIndex={-1} style={style}>
            {ABOUT.heading}
          </h2>
        </>
      );
    case 'photo':
      return (
        <figure className="polaroid" style={style}>
          <span className="tape" aria-hidden="true" />
          <img src={ABOUT.photo.src} alt={ABOUT.photo.alt} style={{ objectPosition: ABOUT.photo.focus }} decoding="async" />
        </figure>
      );
    case 'doodle':
      return (
        <div className="nb-doodle-wrap" style={style}>
          <PixelRobot />
        </div>
      );
    default: {
      const i = Number(id.slice(1));
      const last = i === ABOUT.paragraphs.length - 1;
      return (
        <p className={last ? 'nb-p nb-invite' : 'nb-p'} style={style}>
          {ABOUT.paragraphs[i]}
        </p>
      );
    }
  }
}

export function AboutNotebook() {
  const root = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>('anchored');
  const [layout, setLayout] = useState<'spread' | 'compact'>('spread');
  const [fit, setFit] = useState(0);
  const [index, setIndex] = useState(0);
  const [turning, setTurning] = useState(false);
  const tween = useRef<gsap.core.Tween | null>(null);
  const size = useRef<[number, number]>([0, 0]);

  const pages = (layout === 'spread' && mode === 'anchored' ? ABOUT.pages.spread : ABOUT.pages.compact) as AboutBlock[][];
  const perView = mode === 'anchored' ? 2 : 1;
  const views: (AboutBlock[] | null)[][] = [];
  for (let i = 0; i < pages.length; i += perView) views.push(perView === 2 ? [pages[i], pages[i + 1] ?? null] : [pages[i]]);
  const view = views[Math.min(index, views.length - 1)];

  // Follow the surface's anchored/panel mode and its size.
  useEffect(() => {
    const surface = root.current?.closest<HTMLElement>('.surface');
    if (!surface) return;
    const onMode = (e: Event) => {
      setMode((e as CustomEvent<Mode>).detail);
      setIndex(0);
    };
    surface.addEventListener('surfacemode', onMode);
    if (surface.dataset.mode === 'panel') setMode('panel');
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const [w0, h0] = size.current;
      if (Math.abs(width - w0) > 24 || Math.abs(height - h0) > 24) {
        size.current = [width, height];
        // re-try the roomiest layout and largest type at the new size
        setLayout('spread');
        setFit(0);
        setIndex(0);
      }
    });
    ro.observe(surface);
    return () => {
      surface.removeEventListener('surfacemode', onMode);
      ro.disconnect();
    };
  }, []);

  // Fit the text: step the type down, then fall back to the compact layout, so nothing
  // is ever clipped. Runs before paint, so the intermediate attempts are never seen.
  useLayoutEffect(() => {
    if (mode !== 'anchored' || !root.current) return;
    const overflowing = [...root.current.querySelectorAll<HTMLElement>('.nb-page')].some((p) => p.scrollHeight > p.clientHeight + 1);
    if (!overflowing) return;
    if (fit < SCALES.length - 1) setFit(fit + 1);
    else if (layout === 'spread') {
      setLayout('compact');
      setFit(0);
    }
  });

  useEffect(
    () => () => {
      tween.current?.kill();
      anim.about.turn = 0;
    },
    [],
  );

  const go = useCallback(
    (delta: number) => {
      const next = index + delta;
      if (turning || next < 0 || next >= views.length) return;
      if (getNav().reducedMotion) {
        setIndex(next);
        return;
      }
      setTurning(true);
      const done = () => {
        anim.about.turn = 0;
        setTurning(false);
      };
      if (mode === 'anchored') {
        // Turn the real 3D page: forward lifts the right-hand page over to the left.
        // The text swaps halfway, while the page is upright and the text is faded out.
        const from = delta > 0 ? 0 : 1;
        let swapped = false;
        anim.about.turn = from;
        tween.current = gsap.to(anim.about, {
          turn: 1 - from,
          duration: 0.7,
          delay: 0.15,
          ease: 'power2.inOut',
          onUpdate() {
            if (!swapped && this.progress() > 0.5) {
              swapped = true;
              setIndex(next);
            }
          },
          onComplete: done,
        });
      } else {
        tween.current = gsap.delayedCall(0.2, () => {
          setIndex(next);
          tween.current = gsap.delayedCall(0.3, done);
        });
      }
    },
    [index, turning, views.length, mode],
  );

  let order = 0;
  return (
    <div
      ref={root}
      className="nb"
      data-layout={mode === 'panel' ? 'single' : layout}
      data-turning={turning || undefined}
      style={{ '--nb-scale': mode === 'anchored' ? SCALES[fit] : 1 } as React.CSSProperties}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(1);
        if (e.key === 'ArrowLeft') go(-1);
      }}
    >
      <div className="nb-pages">
        {view.map((blocks, side) => (
          <div key={`${index}-${side}`} className={`nb-page nb-${side === 0 ? 'left' : 'right'}`}>
            {blocks?.map((b) => (
              <Fragment key={b}>
                <Block id={b} order={order++} />
              </Fragment>
            ))}
          </div>
        ))}
      </div>
      {views.length > 1 && (
        <nav className="nb-nav" aria-label="Notebook pages">
          <button type="button" onClick={() => go(-1)} disabled={index === 0 || turning}>
            <span aria-hidden="true">‹</span> Previous
          </button>
          <span className="nb-count" aria-live="polite">
            {mode === 'panel' ? 'Page' : 'Spread'} {index + 1} of {views.length}
          </span>
          <button type="button" onClick={() => go(1)} disabled={index === views.length - 1 || turning}>
            Next <span aria-hidden="true">›</span>
          </button>
        </nav>
      )}
    </div>
  );
}
