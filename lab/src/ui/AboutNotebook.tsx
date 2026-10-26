import { Fragment, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { ABOUT } from '../content';
import { aboutReady } from '../preload';

// The About notebook's pages: real, selectable HTML laid over the open 3D spread.
// Everything lives on one spread, sized from the spread itself (cqh units), so the
// layout depends on the space the notebook actually gets, not on a device breakpoint.
//
// Fitting, before paint: start with generous type and the largest photo. The right
// page settles the type: it steps down to normal, then the robot sketch goes, then
// spacing tightens, and only then does the type go below normal. The left page then
// takes the largest photo that fits at that type size. If even that can't fit (a genuinely
// tiny spread), the surface switches to the one-page scrolling phone layout.
// Nothing is ever clipped or scrolled inside the spread.

type Mode = 'anchored' | 'panel';

/** Photo width as a share of the left page, largest first. */
const PHOTO = [0.84, 0.76, 0.68, 0.6, 0.54];

interface Level {
  scale: number;
  robot?: false;
  /** 1: tighter line and paragraph spacing; 2: also slimmer page margins. */
  spacing?: 1 | 2;
}
const LEVELS: Level[] = [
  { scale: 1.25 },
  { scale: 1.17 },
  { scale: 1.1 },
  { scale: 1.04 },
  { scale: 1 },
  { scale: 1, robot: false },
  { scale: 1, robot: false, spacing: 1 },
  { scale: 1, robot: false, spacing: 2 },
  { scale: 0.95, robot: false, spacing: 2 },
  { scale: 0.9, robot: false, spacing: 2 },
  { scale: 0.85, robot: false, spacing: 2 },
];

/** Renders **phrases** as <strong>. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>))}
    </>
  );
}

const ink = { fill: 'none', stroke: '#C66F8E', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const Underline = () => (
  <svg className="nb-underline" viewBox="0 0 200 14" aria-hidden="true" preserveAspectRatio="none">
    <path d="M3 10 C 50 3, 130 2, 197 7" {...ink} strokeWidth={4} />
  </svg>
);

const Heart = ({ className }: { className: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 21 C 4 15, 2 10, 5.5 6 C 8.5 3, 11.5 4.5, 12 8 C 12.5 4.5, 15.5 3, 18.5 6 C 22 10, 20 15, 12 21 Z" {...ink} />
  </svg>
);

const Dashes = ({ className }: { className: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 14 L9 4 M10 18 L19 11 M12 22 L21 20" {...ink} />
  </svg>
);

/** A little hand-sketched robot for the corner of the right page. */
const RobotSketch = () => (
  <svg className="nb-robot" viewBox="0 0 90 80" aria-hidden="true">
    <g {...ink} strokeWidth={1.8}>
      <path d="M45 6 L45 14" />
      <circle cx="45" cy="5" r="2.5" />
      <rect x="31" y="14" width="28" height="20" rx="5" />
      <path d="M38 22 L38 24 M52 22 L52 24" strokeWidth={2.6} />
      <path d="M40 28 Q 45 31, 50 28" />
      <rect x="33" y="37" width="24" height="20" rx="4" />
      <path d="M38 44 L52 44 M38 49 L46 49" />
      <path d="M33 42 L25 48 M57 42 L65 36" />
      <path d="M38 57 L37 64 M52 57 L53 64" />
      <path d="M14 68 Q 45 63, 78 68" strokeWidth={3} opacity={0.6} />
      <path d="M70 26 C 66 22, 66 19, 69 18 C 70.5 17.5, 72 18.5, 72 20 C 72 18.5, 73.5 17.5, 75 18 C 78 19, 77 22, 72 26 Z" />
      <path d="M20 22 L20 30 M16 26 L24 26" strokeWidth={1.6} />
      <path d="M80 8 L76 15 M85 13 L80 17" />
    </g>
  </svg>
);

export function AboutNotebook() {
  const root = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>('anchored');
  const [photo, setPhoto] = useState(0);
  const [level, setLevel] = useState(0);
  const [, remeasure] = useReducer((n: number) => n + 1, 0);
  // Fonts and portrait are preloaded at startup; until they're in, nothing is shown or
  // measured, so the first visible frame already has the final layout.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    aboutReady.then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);
  const size = useRef<[number, number]>([0, 0]);

  // Follow the surface's anchored/panel mode and its size; re-fit when web fonts land,
  // since they change the text's measurements.
  useEffect(() => {
    const surface = root.current?.closest<HTMLElement>('.surface');
    if (!surface) return;
    const refit = () => {
      delete surface.dataset.force;
      setPhoto(0);
      setLevel(0);
      // always re-render, so the fit is re-measured even if both were already 0
      remeasure();
    };
    const onMode = (e: Event) => setMode((e as CustomEvent<Mode>).detail);
    surface.addEventListener('surfacemode', onMode);
    if (surface.dataset.mode === 'panel') setMode('panel');
    const ro = new ResizeObserver(([entry]) => {
      // While the phone fallback is forced, its own size changes mustn't undo it;
      // only a real window resize (below) re-tries the spread.
      if (surface.dataset.force) return;
      const { width, height } = entry.contentRect;
      const [w0, h0] = size.current;
      if (Math.abs(width - w0) > 24 || Math.abs(height - h0) > 24) {
        size.current = [width, height];
        refit();
      }
    });
    ro.observe(surface);
    window.addEventListener('resize', refit);
    document.fonts?.addEventListener('loadingdone', refit);
    return () => {
      surface.removeEventListener('surfacemode', onMode);
      window.removeEventListener('resize', refit);
      document.fonts?.removeEventListener('loadingdone', refit);
      ro.disconnect();
      delete surface.dataset.force;
    };
  }, []);

  // Step until both pages fit. Runs before paint, so the attempts are never seen.
  useLayoutEffect(() => {
    // measure only with the real fonts and photo in place
    if (!ready || mode !== 'anchored' || !root.current) return;
    const over = (sel: string) => {
      const p = root.current!.querySelector<HTMLElement>(sel);
      return !!p && p.scrollHeight > p.clientHeight + 1;
    };
    const last = LEVELS.length - 1;
    // The right page (text only) sets the type size first. Then the left page gets the
    // largest photo that fits beside that type; only if none does does the type shrink.
    if (over('.nb-right')) {
      if (level < last) setLevel(level + 1);
      else forcePanel();
    } else if (over('.nb-left')) {
      if (photo < PHOTO.length - 1) setPhoto(photo + 1);
      else if (level < last) setLevel(level + 1);
      else forcePanel();
    }
  });

  function forcePanel() {
    const surface = root.current?.closest<HTMLElement>('.surface');
    if (surface) surface.dataset.force = 'panel'; // read by the Projector
  }

  const anchored = mode === 'anchored';
  const lv = LEVELS[level];
  let order = 0;
  const r = () => ({ '--r': order++ }) as React.CSSProperties;

  return (
    <div
      ref={root}
      className="nb"
      data-layout={anchored ? 'spread' : 'scroll'}
      data-ready={ready || undefined}
      data-robot={anchored && lv.robot === false ? 'off' : undefined}
      data-spacing={anchored ? lv.spacing : undefined}
      style={{ '--photo': anchored ? PHOTO[photo] : 0.84, '--nb-scale': anchored ? lv.scale : 1 } as React.CSSProperties}
    >
      <div className="nb-pages">
        <section className="nb-page nb-left" aria-labelledby="section-title">
          <div className="nb-heading" style={r()}>
            <h2 id="section-title" className="nb-title" tabIndex={-1}>
              {ABOUT.heading}
            </h2>
            <Underline />
            <Dashes className="nb-doodle nb-doodle-title" />
          </div>
          <div className="nb-photo-row" style={r()}>
            <Heart className="nb-doodle nb-doodle-heart" />
            <Dashes className="nb-doodle nb-doodle-side" />
            <figure className="polaroid">
              <span className="tape" aria-hidden="true" />
              <img src={ABOUT.photo.src} alt={ABOUT.photo.alt} style={{ objectPosition: ABOUT.photo.focus }} decoding="async" />
            </figure>
          </div>
          {ABOUT.left.map((p) => (
            <p key={p} className="nb-p" style={r()}>
              <Rich text={p} />
            </p>
          ))}
        </section>
        <section className="nb-page nb-right" aria-label="About, continued">
          <Dashes className="nb-doodle nb-doodle-corner" />
          {/* the paragraphs share the page height evenly instead of bunching at the top */}
          <div className="nb-right-text">
            {ABOUT.right.map((p) => (
              <p key={p} className="nb-p" style={r()}>
                <Rich text={p} />
              </p>
            ))}
          </div>
          <div className="nb-robot-wrap" style={r()}>
            <RobotSketch />
          </div>
        </section>
      </div>
    </div>
  );
}
