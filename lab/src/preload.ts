import { ABOUT, BEYOND } from './content';

// Fonts the section surfaces use, loaded at startup rather than on first use, so text
// never appears in a fallback font and then reflows when the real one arrives.
const FONTS = [
  '700 16px Fraunces',
  '500 16px Nunito',
  '800 16px Nunito',
  '700 16px Caveat',
  '400 16px "DM Mono"',
  '500 16px "DM Mono"',
  '400 16px Inter',
  '700 16px "Inter Tight"',
  '800 16px "Inter Tight"',
  '400 16px Silkscreen',
];

async function decode(src: string) {
  const img = new Image();
  img.src = src;
  await img.decode().catch(() => undefined);
}

const fontsReady = Promise.all(FONTS.map((f) => document.fonts?.load(f).catch(() => undefined)));

/** Resolves once the notebook's fonts and portrait are ready to show. */
export const aboutReady: Promise<void> = Promise.all([fontsReady, decode(ABOUT.photo.src)]).then(() => undefined);

/**
 * Resolves once every scrapbook photo and video poster is decoded, so each chapter's
 * spread is complete the moment a page turns to it. Started after the page settles.
 */
export const beyondReady: Promise<void> = new Promise<void>((resolve) => {
  const start = () =>
    Promise.all([
      fontsReady,
      ...BEYOND.chapters.flatMap((c) => c.media.map((m) => decode(m.kind === 'video' ? m.poster! : m.src))),
    ]).then(() => resolve());
  if ('requestIdleCallback' in window) window.requestIdleCallback(() => start(), { timeout: 2500 });
  else setTimeout(start, 1200);
});
