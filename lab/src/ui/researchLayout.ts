import { RESEARCH, type ResearchImage } from '../content';
import { WHITEBOARD } from '../scene/layout';

// One layout for the research overview, used twice: the HTML board you browse up close
// (ResearchBoard) and the canvas texture painted onto the 3D whiteboard you see from
// across the room (drawResearchBoard). Every position and size is a fraction of the
// board, so both views line up exactly and the camera approaches the same board.
//
// x/width are fractions of the board's width, y/height of its height. Type sizes,
// padding and gaps are fractions of the board's width (cqw in the CSS).

/** The writing surface the board covers, inside the frame (matches surfaces.research). */
export const BOARD_W = WHITEBOARD.w - 0.02;
export const BOARD_H = WHITEBOARD.h - 0.02;
export const BOARD_ASPECT = BOARD_W / BOARD_H;

export const GRID = { padX: 0.04, top: 0.125, bottom: 0.035, colGap: 0.028, rowGap: 0.065 };
export const HEADER = { x: 0.04, top: 0.03, title: 0.034, hint: 0.0152, hintGap: 0.016 };
export const CARD = { pad: 0.0095, gap: 0.0072, orgGap: 0.003, titleGap: 0.003, magnet: 0.0125 };
export const TILTS = [-1.1, 0.8, -0.6, 1.0, -0.8, 0.7];

/** Below this board width (CSS px) the overview drops the preview line and uses larger type. */
export const COMPACT_BELOW = 1500;
export type Density = 'full' | 'compact';

/** Share of the card's height given to its image, per density. */
export const IMAGE: Record<Density, number> = { full: 0.44, compact: 0.52 };

/** Institution labels are kept to one line so titles line up across the grid. */
export const ORG_SPACING = 0.03; // em

export const TYPE: Record<Density, { org: number; title: number; preview: number; more: number }> = {
  full: { org: 0.0076, title: 0.0119, preview: 0.0092, more: 0.012 },
  compact: { org: 0.0084, title: 0.0148, preview: 0, more: 0.0152 },
};
export const LINE = { org: 1.3, title: 1.16, preview: 1.42, more: 1.1 };

export function cardRect(i: number) {
  const w = (1 - 2 * GRID.padX - 2 * GRID.colGap) / 3;
  const h = (1 - GRID.top - GRID.bottom - GRID.rowGap) / 2;
  const col = i % 3;
  const row = Math.floor(i / 3);
  return { x: GRID.padX + col * (w + GRID.colGap), y: GRID.top + row * (h + GRID.rowGap), w, h };
}

export const FONTS = {
  org: (px: number) => `400 ${px}px "DM Mono", ui-monospace, monospace`,
  title: (px: number) => `800 ${px}px "Inter Tight", Inter, system-ui, sans-serif`,
  preview: (px: number) => `400 ${px}px Inter, system-ui, sans-serif`,
  hand: (px: number) => `700 ${px}px Caveat, cursive`,
};

/** Everything the canvas needs before it can paint: fonts and decoded images. */
export async function loadBoardAssets() {
  const fonts = [FONTS.org(20), FONTS.title(20), FONTS.preview(20), FONTS.hand(20)];
  await Promise.all(fonts.map((f) => document.fonts?.load(f).catch(() => undefined)));
  const images = new Map<string, HTMLImageElement>();
  await Promise.all(
    RESEARCH.map(async (e) => {
      const img = new Image();
      img.src = e.image.src;
      try {
        await img.decode();
        images.set(e.image.src, img);
      } catch {
        /* drawn as a blank print if it fails */
      }
    }),
  );
  return images;
}

// --- canvas painting ---------------------------------------------------------------

/** Greedy line breaking at spaces and after hyphens, as the browser does. */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const tokens = text.match(/[^\s-]+-?|\s+/g) ?? [];
  const lines: string[] = [];
  let line = '';
  for (const t of tokens) {
    if (/^\s+$/.test(t)) {
      if (line) line += ' ';
      continue;
    }
    const next = line + t;
    if (line && ctx.measureText(next.trimEnd()).width > width) {
      lines.push(line.trimEnd());
      line = t;
    } else line = next;
  }
  if (line.trim()) lines.push(line.trimEnd());
  return lines;
}

function drawFitted(ctx: CanvasRenderingContext2D, img: HTMLImageElement, meta: ResearchImage, x: number, y: number, w: number, h: number) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (meta.kind === 'figure') {
    const s = Math.min(w / iw, h / ih);
    ctx.drawImage(img, x + (w - iw * s) / 2, y + (h - ih * s) / 2, iw * s, ih * s);
    return;
  }
  const s = Math.max(w / iw, h / ih);
  const [fx, fy] = (meta.focus ?? '50% 50%').split(' ').map((v) => parseFloat(v) / 100);
  const sw = w / s;
  const sh = h / s;
  ctx.drawImage(img, (iw - sw) * fx, (ih - sh) * fy, sw, sh, x, y, w, h);
}

function magnet(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, tone: number) {
  const [a, b] = [
    ['#e9a6bb', '#b65a79'],
    ['#9a3a62', '#4a0b26'],
    ['#fbf1e1', '#cdb592'],
  ][tone % 3];
  ctx.save();
  ctx.shadowColor = 'rgba(40,10,25,0.3)';
  ctx.shadowBlur = r * 0.6;
  ctx.shadowOffsetY = r * 0.25;
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.4, 0, x, y, r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.18, a);
  g.addColorStop(1, b);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Paints the research overview into a canvas of width W (height W / BOARD_ASPECT). */
export function drawResearchBoard(canvas: HTMLCanvasElement, images: Map<string, HTMLImageElement>, density: Density) {
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width;
  const H = canvas.height;
  const u = (f: number) => f * W; // board-width units → px
  const t = TYPE[density];

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#fcfaf6');
  bg.addColorStop(1, '#f7f2ec');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // header
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#520B2D';
  ctx.font = FONTS.hand(u(HEADER.title));
  ctx.fillText('Research', u(HEADER.x), HEADER.top * H);
  const titleW = ctx.measureText('Research').width;
  ctx.fillStyle = '#BE3E70';
  ctx.font = FONTS.hand(u(HEADER.hint));
  // bottom-aligned with the title, as the HTML header's flex row does
  ctx.fillText('pick a note to read more ↘', u(HEADER.x) + titleW + u(HEADER.hintGap), HEADER.top * H + u(HEADER.title - HEADER.hint));

  RESEARCH.forEach((e, i) => {
    const r = cardRect(i);
    const x = r.x * W;
    const y = r.y * H;
    const w = r.w * W;
    const h = r.h * H;
    const pad = u(CARD.pad);

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((TILTS[i] * Math.PI) / 180);
    ctx.translate(-w / 2, -h / 2);

    ctx.save();
    ctx.shadowColor = 'rgba(60,20,35,0.16)';
    ctx.shadowBlur = u(0.009);
    ctx.shadowOffsetY = u(0.004);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    const ih = h * IMAGE[density];
    ctx.fillStyle = e.image.kind === 'figure' ? '#ffffff' : '#f7f2ee';
    ctx.fillRect(pad, pad, w - 2 * pad, ih);
    const img = images.get(e.image.src);
    if (img) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(pad, pad, w - 2 * pad, ih);
      ctx.clip();
      drawFitted(ctx, img, e.image, pad, pad, w - 2 * pad, ih);
      ctx.restore();
    }

    const tw = w - 2 * pad;
    let ty = pad + ih + u(CARD.gap);

    ctx.fillStyle = '#BE3E70';
    ctx.font = FONTS.org(u(t.org));
    if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${u(t.org) * ORG_SPACING}px`;
    ctx.fillText(e.org.toUpperCase(), pad, ty + (u(t.org) * (LINE.org - 1)) / 2);
    ty += u(t.org) * LINE.org;
    if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0px';
    ty += u(CARD.orgGap);

    ctx.fillStyle = '#520B2D';
    ctx.font = FONTS.title(u(t.title));
    for (const l of wrap(ctx, e.title, tw)) {
      ctx.fillText(l, pad, ty + (u(t.title) * (LINE.title - 1)) / 2);
      ty += u(t.title) * LINE.title;
    }
    ty += u(CARD.titleGap);

    if (t.preview) {
      ctx.fillStyle = '#5e1a3a';
      ctx.font = FONTS.preview(u(t.preview));
      for (const l of wrap(ctx, e.preview, tw)) {
        ctx.fillText(l, pad, ty + (u(t.preview) * (LINE.preview - 1)) / 2);
        ty += u(t.preview) * LINE.preview;
      }
    }

    ctx.fillStyle = '#BE3E70';
    ctx.font = FONTS.hand(u(t.more));
    ctx.textBaseline = 'bottom';
    ctx.fillText('Read more →', pad, h - pad);
    ctx.textBaseline = 'top';
    ctx.restore();

    magnet(ctx, x + w / 2, y, u(CARD.magnet) / 2, i);
  });
}
