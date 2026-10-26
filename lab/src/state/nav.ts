import { useSyncExternalStore } from 'react';
import gsap from 'gsap';
import type { SectionId } from '../content';
import { anim, resetSectionAnim } from './anim';

// Navigation state machine.
//
//   overview ──open──▶ opening(s) ──▶ open(s) ──close──▶ closing(s) ──▶ overview
//
// Exactly one GSAP timeline exists at a time. Closing is that same timeline played in
// reverse, so every object retraces its path back to its rest pose. A request made
// mid-transition is stored as the single `pending` destination (latest wins) and is
// reached by first returning through the overview.

export type Phase = 'overview' | 'opening' | 'open' | 'closing';

export interface NavState {
  phase: Phase;
  section: SectionId | null;
  hovered: SectionId | null;
  reducedMotion: boolean;
}

const motionQuery = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

let state: NavState = {
  phase: 'overview',
  section: null,
  hovered: null,
  reducedMotion: motionQuery?.matches ?? false,
};
const listeners = new Set<() => void>();

function set(patch: Partial<NavState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

motionQuery?.addEventListener('change', (e) => set({ reducedMotion: e.matches }));

export function getNav() {
  return state;
}

export function useNav() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

export function setHovered(id: SectionId | null) {
  if (state.hovered !== id) set({ hovered: id });
}

// ---------------------------------------------------------------------------

/** `undefined` = nothing queued; `null` = stay in overview; otherwise a section. */
let pending: SectionId | null | undefined;
let timeline: gsap.core.Timeline | null = null;
let returnFocusTo: HTMLElement | null = null;

export function requestSection(target: SectionId | null, trigger?: HTMLElement | null) {
  const { phase, section } = state;
  if (trigger && target) returnFocusTo = trigger;

  switch (phase) {
    case 'overview':
      if (target) open(target);
      return;
    case 'opening':
    case 'open':
      if (target === section) {
        pending = undefined;
        return;
      }
      pending = target ?? undefined;
      close();
      return;
    case 'closing':
      if (target === section) {
        // Changed their mind: carry on opening from wherever the reverse got to.
        pending = undefined;
        set({ phase: 'opening' });
        timeline!.timeScale(1).play();
      } else {
        pending = target ?? undefined;
      }
  }
}

export function takeReturnFocus() {
  const el = returnFocusTo;
  returnFocusTo = null;
  return el;
}

function open(id: SectionId) {
  resetSectionAnim(id);
  anim.cam.section = id;
  timeline = (state.reducedMotion ? buildReduced : BUILDERS[id])();
  timeline.eventCallback('onComplete', () => {
    set({ phase: 'open' });
    if (pending !== undefined) close();
  });
  timeline.eventCallback('onReverseComplete', () => finishClose(id));
  set({ phase: 'opening', section: id });
  timeline.play();
}

function close() {
  if (!timeline) return;
  set({ phase: 'closing' });
  timeline.timeScale(state.reducedMotion ? 1 : 1.3).reverse();
}

function finishClose(id: SectionId) {
  timeline?.kill();
  timeline = null;
  resetSectionAnim(id);
  anim.cam.t = 0;
  anim.cam.section = null;
  Object.assign(anim.ui, { intro: 0, content: 0, dim: 0, veil: 0 });
  set({ phase: 'overview', section: null });

  const next = pending;
  pending = undefined;
  if (next) open(next);
}

// --- timelines ---------------------------------------------------------------
// Durations are seconds. Stages overlap so each opening reads as one gesture.

const CAMERA_TRAVEL = 1.55;

function base() {
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
  tl.to(anim.ui, { intro: 1, duration: 0.4, ease: 'power1.out' }, 0);
  return tl;
}

function travel(tl: gsap.core.Timeline, at = 0.1) {
  tl.to(anim.cam, { t: 1, duration: CAMERA_TRAVEL, ease: 'power2.inOut' }, at);
}

function reveal(tl: gsap.core.Timeline, at: number | string, duration = 0.35) {
  tl.to(anim.ui, { content: 1, duration, ease: 'power1.out' }, at);
}

const BUILDERS: Record<SectionId, () => gsap.core.Timeline> = {
  about() {
    const a = anim.about;
    const tl = base();
    travel(tl);
    tl.to(a, { slide: 1, duration: 0.6, ease: 'power2.out' }, 0.45);
    tl.to(a, { float: 1, duration: 0.9 }, 0.9);
    tl.to(a, { cover: 1, duration: 0.75, ease: 'power3.inOut' }, 1.7);
    tl.to(a, { settle: 1, duration: 0.5, ease: 'sine.out' }, 2.2);
    // the photo and paragraphs fade onto the pages one after another
    reveal(tl, 2.25, 1.1);
    return tl;
  },
  research() {
    const tl = base();
    travel(tl);
    // the board already shows the research; its live HTML version fades in on top
    reveal(tl, 1.4, 0.4);
    return tl;
  },
  projects() {
    const p = anim.projects;
    const tl = base();
    travel(tl);
    tl.to(p, { glow: 1, duration: 0.5, ease: 'power1.out' }, 1.15);
    reveal(tl, 1.45);
    // "Opening Ieva's workspace…" with its loading bar, then the desktop
    tl.to(p, { boot: 1, duration: 1.2, ease: 'power1.inOut' }, 1.5);
    return tl;
  },
  beyond() {
    const b = anim.beyond;
    const tl = base();
    travel(tl);
    tl.to(b, { wake: 1, duration: 0.55, ease: 'power2.out' }, 0.6);
    tl.to(b, { stretch: 1, duration: 0.75, ease: 'sine.inOut' }, 1.0);
    tl.to(b, { shift: 1, duration: 0.55 }, 1.45);
    tl.to(b, { rise: 1, duration: 0.65 }, 1.8);
    tl.to(b, { cover: 1, duration: 0.65, ease: 'power3.inOut' }, 2.3);
    reveal(tl, 2.75);
    return tl;
  },
  cv() {
    const c = anim.cv;
    const tl = base();
    // The camera intentionally does not move for the CV.
    tl.to(anim.ui, { dim: 1, duration: 0.9, ease: 'power1.inOut' }, 0.1);
    tl.to(c, { drawer: 1, duration: 0.7, ease: 'power2.out' }, 0.1);
    tl.to(c, { lift: 1, duration: 0.45, ease: 'power2.out' }, 0.6);
    tl.to(c, { fly: 1, duration: 1.15, ease: 'power2.inOut' }, 0.95);
    reveal(tl, 2.0);
    return tl;
  },
};

/** Reduced motion: a short fade covers an instant jump to the destination. */
function buildReduced() {
  const id = anim.cam.section!;
  const tl = gsap.timeline({ paused: true });
  tl.to(anim.ui, { veil: 1, intro: 1, duration: 0.18, ease: 'none' });
  const group = anim[id] as Record<string, number>;
  const done = Object.fromEntries(Object.keys(group).map((k) => [k, 1]));
  tl.set(group, done);
  tl.set(anim.cam, { t: id === 'cv' ? 0 : 1 });
  if (id === 'cv') tl.set(anim.ui, { dim: 1 });
  tl.to(anim.ui, { veil: 0, duration: 0.22, ease: 'none' });
  tl.to(anim.ui, { content: 1, duration: 0.2, ease: 'none' });
  return tl;
}
