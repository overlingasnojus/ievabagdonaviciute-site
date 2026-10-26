import type { SectionId } from '../content';

// Every animated quantity is a 0→1 progress value. GSAP tweens these numbers; the
// scene components turn them into transforms each frame by interpolating between
// fixed rest poses and destination poses. Because poses are always recomputed from
// their rest values, any number of open/close cycles returns objects exactly home.

export const anim = {
  cam: { t: 0, section: null as SectionId | null },
  ui: { intro: 0, content: 0, dim: 0, veil: 0 },
  about: { slide: 0, float: 0, cover: 0, settle: 0, turn: 0 },
  research: { sketch: 0 },
  projects: { glow: 0, boot: 0 },
  beyond: { wake: 0, stretch: 0, shift: 0, rise: 0, cover: 0 },
  cv: { drawer: 0, lift: 0, fly: 0 },
  /**
   * How lively the room's idle motion is: 1 in the overview, easing to 0 while a section
   * is open or when reduced motion is requested. Updated by AmbientDriver.
   */
  ambient: { level: 1 },
  /** Smoothed hover highlight per section, 0→1. */
  hover: { about: 0, research: 0, projects: 0, beyond: 0, cv: 0 } as Record<SectionId, number>,
};

export function resetSectionAnim(id: SectionId) {
  const group = anim[id] as Record<string, number>;
  for (const k of Object.keys(group)) group[k] = 0;
}
