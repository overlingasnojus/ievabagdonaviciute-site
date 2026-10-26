import * as THREE from 'three';
import { PALETTE as P } from './layout';

// Small hand-coded pixel textures drawn on canvases and sampled with nearest-neighbour
// filtering, so every surface keeps crisp, chunky pixels at any distance.

export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

function pixelTexture(w: number, h: number, draw: Draw, repeat?: [number, number]) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
  }
  return tex;
}

const memo = <T,>(make: () => T) => {
  let v: T | undefined;
  return () => (v ??= make());
};

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
}

function shade(hex: string, amt: number) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, amt);
  return `#${c.getHexString()}`;
}

function speckle(ctx: CanvasRenderingContext2D, w: number, h: number, colors: string[], density: number, seed: number) {
  const r = rng(seed);
  for (let i = 0; i < w * h * density; i++) px(ctx, Math.floor(r() * w), Math.floor(r() * h), 1, 1, colors[Math.floor(r() * colors.length)]);
}

// 3×5 pixel font for the handful of hand-lettered details in the room.
const GLYPH_ROWS: Record<string, string[]> = {
  A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['.##', '#..', '#..', '#..', '.##'],
  D: ['##.', '#.#', '#.#', '#.#', '##.'], E: ['###', '#..', '##.', '#..', '###'], G: ['.##', '#..', '#.#', '#.#', '.##'],
  H: ['#.#', '#.#', '###', '#.#', '#.#'], I: ['###', '.#.', '.#.', '.#.', '###'], L: ['#..', '#..', '#..', '#..', '###'],
  M: ['#.#', '###', '###', '#.#', '#.#'], O: ['.#.', '#.#', '#.#', '#.#', '.#.'], P: ['##.', '#.#', '##.', '#..', '#..'],
  R: ['##.', '#.#', '##.', '#.#', '#.#'], S: ['.##', '#..', '.#.', '..#', '##.'], T: ['###', '.#.', '.#.', '.#.', '.#.'],
  W: ['#.#', '#.#', '###', '###', '#.#'], U: ['#.#', '#.#', '#.#', '#.#', '###'],
};
const GLYPHS = Object.fromEntries(Object.entries(GLYPH_ROWS).map(([k, rows]) => [k, rows.join('')]));

function pixelText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, s: number, color: string) {
  ctx.fillStyle = color;
  let cx = x;
  for (const ch of text.toUpperCase()) {
    const g = GLYPHS[ch];
    if (g) {
      for (let i = 0; i < 15; i++) {
        const gx = i % 3;
        const gy = Math.floor(i / 3);
        if (g[i] === '#') ctx.fillRect(cx + gx * s, y + gy * s, s, s);
      }
    }
    cx += 4 * s;
  }
}

function pixelLine(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, c: string) {
  ctx.fillStyle = c;
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= n; i++) ctx.fillRect(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), 1, 1);
}

function pixelHeart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, c: string) {
  const rows = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
  ctx.fillStyle = c;
  rows.forEach((r, j) => [...r].forEach((ch, i) => ch === '#' && ctx.fillRect(x + i * s, y + j * s, s, s)));
}

// --- room surfaces -------------------------------------------------------------

export const floorTexture = memo(() =>
  pixelTexture(
    64,
    64,
    (ctx) => {
      const r = rng(7);
      for (let ty = 0; ty < 4; ty++)
        for (let tx = 0; tx < 4; tx++) {
          const base = (tx + ty) % 2 ? '#FBF1E8' : '#F7E6E3';
          px(ctx, tx * 16, ty * 16, 16, 16, base);
          for (let i = 0; i < 14; i++) px(ctx, tx * 16 + Math.floor(r() * 15), ty * 16 + Math.floor(r() * 15), 1, 1, shade(base, -0.025));
          px(ctx, tx * 16 + 1, ty * 16 + 1, 14, 1, shade(base, 0.02));
          px(ctx, tx * 16, ty * 16 + 15, 16, 1, '#EAD4CE');
          px(ctx, tx * 16 + 15, ty * 16, 1, 16, '#EAD4CE');
        }
    },
    [3, 3],
  ),
);

export const wallTexture = memo(() =>
  pixelTexture(
    64,
    64,
    (ctx) => {
      // Painted tongue-and-groove boards: soft grain streaks, a lit edge and a shadowed groove.
      px(ctx, 0, 0, 64, 64, P.wallPink);
      const r = rng(3);
      for (let b = 0; b < 8; b++) {
        const x0 = b * 8;
        const tone = (r() - 0.5) * 0.02;
        px(ctx, x0, 0, 8, 64, shade(P.wallPink, tone));
        for (let i = 0; i < 6; i++) {
          const gx = x0 + 1 + Math.floor(r() * 6);
          const gy = Math.floor(r() * 64);
          px(ctx, gx, gy, 1, 4 + Math.floor(r() * 10), shade(P.wallPink, tone - 0.018));
        }
        px(ctx, x0, 0, 1, 64, shade(P.wallPink, 0.035));
        px(ctx, x0 + 7, 0, 1, 64, P.wallPinkDark);
        px(ctx, x0 + 6, 0, 1, 64, shade(P.wallPink, -0.012));
      }
      speckle(ctx, 64, 64, [shade(P.wallPink, -0.02), shade(P.wallPink, 0.015)], 0.05, 4);
    },
    [4, 1],
  ),
);

export const wallOuterTexture = memo(() =>
  pixelTexture(8, 8, (ctx) => {
    px(ctx, 0, 0, 8, 8, '#EBC4CF');
    speckle(ctx, 8, 8, ['#E3B8C4'], 0.2, 5);
  }),
);

export const whiteboardBase = memo(() =>
  pixelTexture(180, 100, (ctx, w, h) => {
    px(ctx, 0, 0, w, h, '#FCFBF8');
    speckle(ctx, w, h, ['#F3F0EC', '#F6F4F1'], 0.05, 11);
    // a faint wipe mark
    for (let i = 0; i < 40; i++) px(ctx, 120 + i, 70 + Math.round(Math.sin(i / 5) * 2), 1, 1, '#EFECE8');
  }),
);

/** Transparent layer of doodles that fades away when the board becomes an interface. */
export const whiteboardSketch = memo(() =>
  pixelTexture(180, 100, (ctx) => {
    const ink = '#5A3448';
    const pink = P.raspberry;
    ['IDEAS', 'ROBOTS', 'PEOPLE', 'A BRIGHTER', 'TOMORROW'].forEach((t, i) => pixelText(ctx, t, 8, 9 + i * 13, 2, ink));
    // arrows between words
    pixelLine(ctx, 50, 14, 58, 14, pink);
    pixelLine(ctx, 56, 12, 58, 14, pink);
    pixelLine(ctx, 56, 16, 58, 14, pink);
    // cat doodle
    const cx = 92;
    const cy = 30;
    pixelLine(ctx, cx, cy, cx + 4, cy - 7, ink);
    pixelLine(ctx, cx + 4, cy - 7, cx + 9, cy - 2, ink);
    pixelLine(ctx, cx + 9, cy - 2, cx + 17, cy - 2, ink);
    pixelLine(ctx, cx + 17, cy - 2, cx + 22, cy - 7, ink);
    pixelLine(ctx, cx + 22, cy - 7, cx + 26, cy, ink);
    pixelLine(ctx, cx + 26, cy, cx + 26, cy + 12, ink);
    pixelLine(ctx, cx, cy, cx, cy + 12, ink);
    pixelLine(ctx, cx, cy + 12, cx + 4, cy + 16, ink);
    pixelLine(ctx, cx + 4, cy + 16, cx + 22, cy + 16, ink);
    pixelLine(ctx, cx + 22, cy + 16, cx + 26, cy + 12, ink);
    px(ctx, cx + 7, cy + 5, 2, 2, ink);
    px(ctx, cx + 17, cy + 5, 2, 2, ink);
    pixelLine(ctx, cx + 11, cy + 10, cx + 13, cy + 11, ink);
    pixelLine(ctx, cx + 13, cy + 11, cx + 15, cy + 10, ink);
    // little arm schematic
    pixelLine(ctx, 132, 82, 140, 82, ink);
    pixelLine(ctx, 136, 82, 140, 66, ink);
    pixelLine(ctx, 140, 66, 156, 58, ink);
    pixelLine(ctx, 156, 58, 160, 64, ink);
    ctx.fillStyle = pink;
    [[140, 66], [156, 58], [136, 82]].forEach(([x, y]) => ctx.fillRect(x - 1, y - 1, 3, 3));
    // boxes and connectors
    ctx.strokeStyle = ink;
    [[96, 62, 18, 10], [96, 80, 18, 10]].forEach(([x, y, w, h]) => {
      pixelLine(ctx, x, y, x + w, y, ink);
      pixelLine(ctx, x, y + h, x + w, y + h, ink);
      pixelLine(ctx, x, y, x, y + h, ink);
      pixelLine(ctx, x + w, y, x + w, y + h, ink);
    });
    pixelLine(ctx, 105, 72, 105, 80, pink);
    pixelHeart(ctx, 68, 64, 2, pink);
    // sticky notes
    const notes: [number, number, string][] = [[140, 8, '#F7C6D4'], [158, 14, '#FBE7A8'], [146, 30, '#CDE6C5'], [70, 82, '#F7C6D4']];
    for (const [x, y, c] of notes) {
      px(ctx, x + 1, y + 1, 13, 12, 'rgba(0,0,0,0.08)');
      px(ctx, x, y, 13, 12, c);
      px(ctx, x, y, 13, 2, shade(c, -0.06));
      for (let l = 0; l < 3; l++) px(ctx, x + 2, y + 4 + l * 3, 7 + ((l * 3) % 4), 1, shade(c, -0.25));
    }
  }),
);

function codeLines(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  const r = rng(seed);
  const colors = ['#F28DB2', '#9FD3E0', '#F2E8D8', '#B7E08F', '#F6C177', '#C9A7E8'];
  px(ctx, 0, 0, w, h, P.screen);
  for (let y = 3; y < h - 2; y += 4) {
    let x = 3 + Math.floor(r() * 3) * 4;
    px(ctx, 1, y, 1, 2, '#5A3A4A');
    const segs = 1 + Math.floor(r() * 4);
    for (let s = 0; s < segs && x < w - 6; s++) {
      const len = 3 + Math.floor(r() * 14);
      px(ctx, x, y, Math.min(len, w - x - 3), 2, colors[Math.floor(r() * colors.length)]);
      x += len + 2;
    }
  }
}

export const codeTexture = memo(() => {
  const t = pixelTexture(96, 96, (ctx, w, h) => codeLines(ctx, w, h, 21));
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 0.6);
  return t;
});

export const smallCodeTexture = memo(() => {
  const t = pixelTexture(64, 64, (ctx, w, h) => codeLines(ctx, w, h, 33));
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 0.7);
  return t;
});

export const armDiagramTexture = memo(() =>
  pixelTexture(64, 40, (ctx, w, h) => {
    px(ctx, 0, 0, w, h, P.screen);
    const c = '#F28DB2';
    pixelLine(ctx, 20, 34, 44, 34, '#7A5A6A');
    pixelLine(ctx, 30, 34, 30, 22, c);
    pixelLine(ctx, 30, 22, 42, 12, c);
    pixelLine(ctx, 42, 12, 50, 18, c);
    [[30, 22], [42, 12], [30, 34]].forEach(([x, y]) => px(ctx, x - 1, y - 1, 3, 3, '#9FD3E0'));
    for (let i = 0; i < 6; i++) px(ctx, 4, 6 + i * 4, 8 + ((i * 5) % 7), 2, ['#9FD3E0', '#F2E8D8', '#B7E08F'][i % 3]);
  }),
);

export const rugTexture = memo(() =>
  pixelTexture(120, 88, (ctx, w, h) => {
    px(ctx, 0, 0, w, h, '#B84D74');
    px(ctx, 3, 3, w - 6, h - 6, '#E4A1B6');
    px(ctx, 6, 6, w - 12, h - 12, '#EDB5C6');
    // woven texture: alternating warp/weft shading
    for (let y = 6; y < h - 6; y++)
      for (let x = 6; x < w - 6; x++) if ((x + (y >> 1)) % 2 === 0) px(ctx, x, y, 1, 1, '#E8ACBF');
    speckle(ctx, w, h, ['#E09AB0', '#F2C2D0'], 0.05, 12);
    for (let x = 10; x < w - 10; x += 6) px(ctx, x, 9, 3, 2, '#C96A8C');
    for (let x = 10; x < w - 10; x += 6) px(ctx, x, h - 11, 3, 2, '#C96A8C');
    for (let y = 18; y < h - 14; y += 16)
      for (let x = 18; x < w - 14; x += 20) {
        px(ctx, x + 2, y, 2, 2, '#C96A8C');
        px(ctx, x, y + 2, 6, 2, '#C96A8C');
        px(ctx, x + 2, y + 4, 2, 2, '#C96A8C');
      }
  }),
);

export const posterTexture = memo(() =>
  pixelTexture(20, 26, (ctx, w, h) => {
    px(ctx, 0, 0, w, h, '#FBF4EA');
    px(ctx, 1, 1, w - 2, h - 2, '#F6DFE5');
    pixelHeart(ctx, 3, 6, 2, P.raspberry);
    px(ctx, 4, 20, 12, 1, '#D99AAD');
    px(ctx, 6, 22, 8, 1, '#D99AAD');
  }),
);

export const posterTexture2 = memo(() =>
  pixelTexture(20, 26, (ctx, w, h) => {
    px(ctx, 0, 0, w, h, '#FBF4EA');
    px(ctx, 1, 1, w - 2, h - 2, '#FBEFE3');
    // tiny robot head
    px(ctx, 5, 6, 10, 8, '#F7F5F2');
    px(ctx, 6, 7, 8, 5, P.screen);
    px(ctx, 7, 9, 2, 2, '#F28DB2');
    px(ctx, 11, 9, 2, 2, '#F28DB2');
    px(ctx, 9, 3, 2, 3, P.metal);
    px(ctx, 8, 2, 4, 1, P.raspberry);
    for (let i = 0; i < 3; i++) px(ctx, 4, 17 + i * 2, 12 - i * 3, 1, '#D99AAD');
  }),
);

export const keyboardTexture = memo(() =>
  pixelTexture(36, 12, (ctx, w, h) => {
    px(ctx, 0, 0, w, h, '#3A3440');
    for (let y = 1; y < h - 1; y += 3) for (let x = 1; x < w - 1; x += 3) px(ctx, x, y, 2, 2, y === 10 && x > 9 && x < 26 ? '#E9E3EA' : '#D6D0D8');
    px(ctx, 10, 10, 15, 2, '#E9E3EA');
  }),
);

export const spineBands = memo(() =>
  pixelTexture(4, 24, (ctx, w, h) => {
    px(ctx, 0, 0, w, h, '#FFFFFF');
    px(ctx, 0, 3, w, 1, '#C8C2C4');
    px(ctx, 0, 19, w, 2, '#C8C2C4');
    px(ctx, 1, 9, 2, 5, '#E8E2E4');
  }),
);

export const pageEdges = memo(() =>
  pixelTexture(8, 8, (ctx) => {
    for (let y = 0; y < 8; y++) px(ctx, 0, y, 8, 1, y % 2 ? '#EFE5D3' : '#FBF5EA');
  }),
);

export const NOTEBOOK_ROSE = '#B9677E';

export const notebookCover = memo(() =>
  pixelTexture(62, 82, (ctx, w, h) => {
    // Dusty-rose cloth cover with a woven pixel texture, a debossed label and a heart.
    px(ctx, 0, 0, w, h, NOTEBOOK_ROSE);
    const r = rng(17);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) if ((x + y) % 2 === 0 && r() < 0.35) px(ctx, x, y, 1, 1, shade(NOTEBOOK_ROSE, (r() - 0.5) * 0.05));
    px(ctx, 0, 0, w, 1, shade(NOTEBOOK_ROSE, 0.05));
    px(ctx, 0, h - 1, w, 1, shade(NOTEBOOK_ROSE, -0.06));
    px(ctx, 0, 0, 5, h, shade(NOTEBOOK_ROSE, -0.07));
    px(ctx, 5, 0, 1, h, shade(NOTEBOOK_ROSE, -0.1));
    px(ctx, 15, 15, 36, 18, shade(NOTEBOOK_ROSE, -0.05));
    px(ctx, 16, 16, 34, 16, '#F6E9DE');
    px(ctx, 20, 21, 26, 2, '#D9A3B2');
    px(ctx, 20, 26, 18, 2, '#D9A3B2');
    pixelHeart(ctx, 26, 50, 2, '#F6E9DE');
    px(ctx, 50, 68, 6, 6, '#E9B872');
  }),
);

export const notebookSpine = memo(() =>
  pixelTexture(12, 80, (ctx, w, h) => {
    px(ctx, 0, 0, w, h, shade(NOTEBOOK_ROSE, -0.08));
    for (let y = 0; y < h; y += 2) px(ctx, 0, y, w, 1, shade(NOTEBOOK_ROSE, -0.1));
    px(ctx, 0, 8, w, 2, '#E9B872');
    px(ctx, 0, h - 10, w, 2, '#E9B872');
    px(ctx, 2, 26, 8, 28, '#F6E9DE');
    px(ctx, 4, 30, 4, 20, NOTEBOOK_ROSE);
  }),
);

export const notebookPage = memo(() =>
  pixelTexture(96, 128, (ctx, w, h) => {
    // Warm ivory paper: a fine fibre grain and a slightly warmer edge.
    px(ctx, 0, 0, w, h, '#FCF6EC');
    speckle(ctx, w, h, ['#F8EFE2', '#FEFAF4'], 0.12, 29);
    speckle(ctx, w, h, ['#F3E7D6'], 0.015, 31);
    for (let i = 0; i < 2; i++) {
      px(ctx, 0, i, w, 1, shade('#FCF6EC', -0.015 + i * 0.007));
      px(ctx, 0, h - 1 - i, w, 1, shade('#FCF6EC', -0.015 + i * 0.007));
    }
  }),
);

/** Pink index tab reading ABOUT, letters stacked top to bottom. */
export const aboutTab = memo(() =>
  pixelTexture(7, 33, (ctx, w, h) => {
    px(ctx, 0, 0, w, h, '#EDB3C3');
    px(ctx, w - 1, 0, 1, h, '#D995A9');
    [...'ABOUT'].forEach((ch, i) => pixelText(ctx, ch, 2, 2 + i * 6, 1, P.burgundy));
  }),
);

export const scrapbookCover = memo(() =>
  pixelTexture(28, 32, (ctx, w, h) => {
    px(ctx, 0, 0, w, h, '#D6AE86');
    speckle(ctx, w, h, ['#CBA27A', '#DDB993'], 0.15, 23);
    px(ctx, 6, 7, 16, 18, '#FFFFFF');
    px(ctx, 8, 9, 12, 11, '#F2A9BF');
    px(ctx, 8, 15, 12, 5, '#9DBBB0');
    px(ctx, 13, 11, 3, 3, '#FBE7A8');
    px(ctx, 3, 4, 10, 3, 'rgba(232,140,170,0.9)');
    px(ctx, 17, 23, 9, 3, 'rgba(159,211,224,0.9)');
    pixelHeart(ctx, 2, 26, 1, P.raspberry);
  }),
);

export const scrapbookPage = memo(() =>
  pixelTexture(28, 32, (ctx, w, h) => {
    px(ctx, 0, 0, w, h, '#FBF4EA');
    for (let y = 2; y < h; y += 3) for (let x = 2; x < w; x += 3) px(ctx, x, y, 1, 1, '#EBDDD4');
  }),
);

export const pawTexture = memo(() =>
  pixelTexture(10, 10, (ctx) => {
    ctx.clearRect(0, 0, 10, 10);
    const c = '#E8A3B9';
    px(ctx, 3, 5, 4, 4, c);
    px(ctx, 1, 3, 2, 2, c);
    px(ctx, 7, 3, 2, 2, c);
    px(ctx, 3, 1, 2, 2, c);
    px(ctx, 5, 1, 2, 2, c);
  }),
);

export const robotFaceTexture = memo(() =>
  pixelTexture(16, 10, (ctx, w, h) => {
    px(ctx, 0, 0, w, h, '#1F1A22');
    px(ctx, 1, 1, w - 2, 1, '#2C2530');
  }),
);

export const laptopTexture = memo(() =>
  pixelTexture(32, 20, (ctx, w, h) => {
    codeLines(ctx, w, h, 41);
    px(ctx, 18, 3, 12, 14, '#2E1A26');
    pixelLine(ctx, 20, 14, 28, 14, '#F28DB2');
    pixelLine(ctx, 20, 14, 24, 6, '#9FD3E0');
    pixelLine(ctx, 24, 6, 28, 10, '#F6C177');
  }),
);

// --- soft gradients (linear filtering: these are lighting, not pixel art) -------

function softTexture(w: number, h: number, draw: Draw) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d')!, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Radial falloff used for contact shadows under objects. */
export const blobTexture = memo(() =>
  softTexture(64, 64, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(70,20,40,0.55)');
    g.addColorStop(0.55, 'rgba(70,20,40,0.22)');
    g.addColorStop(1, 'rgba(70,20,40,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }),
);

/** Linear falloff for ambient occlusion along wall seams; dark at v = 0. */
export const seamTexture = memo(() =>
  softTexture(4, 64, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, h, 0, 0);
    g.addColorStop(0, 'rgba(90,30,55,0.42)');
    g.addColorStop(0.35, 'rgba(90,30,55,0.14)');
    g.addColorStop(1, 'rgba(90,30,55,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }),
);

/** Shadow in the notebook gutter. */
export const gutterTexture = memo(() =>
  softTexture(64, 4, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(120,70,60,0)');
    g.addColorStop(0.42, 'rgba(120,70,60,0.22)');
    g.addColorStop(0.5, 'rgba(110,60,55,0.34)');
    g.addColorStop(0.58, 'rgba(120,70,60,0.22)');
    g.addColorStop(1, 'rgba(120,70,60,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }),
);

export const leafTexture = memo(() =>
  pixelTexture(12, 20, (ctx, w, h) => {
    px(ctx, 0, 0, w, h, '#5C9A47');
    for (let y = 0; y < h; y++) {
      const t = y / h;
      px(ctx, 0, y, w, 1, shade('#5C9A47', 0.05 - t * 0.09));
    }
    px(ctx, 5, 0, 2, h, '#8CC06A');
    for (let y = 3; y < h - 2; y += 4) {
      px(ctx, 2, y + 1, 3, 1, '#78AD5A');
      px(ctx, 7, y + 1, 3, 1, '#78AD5A');
    }
    px(ctx, 0, 0, 1, h, '#3F7A36');
    px(ctx, w - 1, 0, 1, h, '#3F7A36');
  }),
);

// --- window view, three parallax layers ------------------------------------------

export const skyLayer = memo(() =>
  pixelTexture(128, 112, (ctx, w, h) => {
    // warm late-afternoon sky
    const bands = ['#A9D3EC', '#B8DBEE', '#C9E2EE', '#D9E7EA', '#EAE9E1', '#F6E4D2', '#FBDCC4'];
    const bh = Math.ceil(h / bands.length);
    bands.forEach((c, i) => px(ctx, 0, i * bh, w, bh, c));
    for (let i = 1; i < bands.length; i++) for (let x = 0; x < w; x += 2) px(ctx, x + (i % 2), i * bh - 1, 1, 1, bands[i]);
    const cloud = (x: number, y: number, s: number) => {
      px(ctx, x + 3 * s, y, 8 * s, 2 * s, '#FFFFFF');
      px(ctx, x, y + 2 * s, 16 * s, 3 * s, '#FFFFFF');
      px(ctx, x + 2 * s, y + 5 * s, 13 * s, 1 * s, '#F4E9EC');
    };
    cloud(12, 18, 1);
    cloud(70, 10, 2);
    cloud(40, 46, 1);
    cloud(96, 52, 1);
  }),
);

export const campusLayer = memo(() =>
  pixelTexture(144, 108, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    // far hills
    for (let x = 0; x < w; x++) {
      const y1 = 58 + Math.round(Math.sin(x / 11) * 4 + Math.sin(x / 5) * 1.5);
      px(ctx, x, y1, 1, h - y1, '#A9BFB2');
      const y2 = 66 + Math.round(Math.sin(x / 15 + 2) * 3);
      px(ctx, x, y2, 1, h - y2, '#8FAE9B');
    }
    // the tower, after Stanford's Hoover Tower
    const tx = 66;
    px(ctx, tx, 26, 14, 48, '#F2E3C7');
    px(ctx, tx + 10, 26, 4, 48, '#DCC8A6');
    px(ctx, tx - 1, 24, 16, 3, '#E7D5B5');
    for (let y = 30; y < 70; y += 6) {
      px(ctx, tx + 3, y, 2, 3, '#B9A27E');
      px(ctx, tx + 8, y, 2, 3, '#B9A27E');
    }
    px(ctx, tx + 1, 17, 12, 7, '#F2E3C7');
    px(ctx, tx + 3, 18, 2, 5, '#B9A27E');
    px(ctx, tx + 8, 18, 2, 5, '#B9A27E');
    px(ctx, tx + 2, 11, 10, 6, '#C9533F');
    px(ctx, tx + 3, 9, 8, 2, '#C9533F');
    px(ctx, tx + 5, 7, 4, 2, '#B4432F');
    px(ctx, tx + 6, 3, 2, 4, '#8C3A2C');
    px(ctx, tx + 9, 11, 3, 6, '#B4432F');
    // sandstone buildings with red tile roofs and arcades
    const building = (x: number, y: number, bw: number) => {
      px(ctx, x, y, bw, 82 - y, '#F2E3C7');
      px(ctx, x - 2, y - 3, bw + 4, 3, '#C9533F');
      px(ctx, x - 1, y - 4, bw + 2, 1, '#B4432F');
      for (let ax = x + 2; ax < x + bw - 2; ax += 5) {
        px(ctx, ax, y + 4, 3, 5, '#B9A27E');
        px(ctx, ax, y + 4, 3, 1, '#A88F6B');
      }
    };
    building(30, 70, 30);
    building(84, 70, 34);
    building(4, 74, 20);
    building(122, 74, 22);
    // oaks and palms
    const r = rng(14);
    const tree = (cx: number, cy: number, rad: number, cols: string[]) => {
      for (let i = 0; i < rad * rad * 3; i++) {
        const a = r() * Math.PI * 2;
        const d = Math.sqrt(r()) * rad;
        px(ctx, Math.round(cx + Math.cos(a) * d * 1.3), Math.round(cy + Math.sin(a) * d * 0.8), 2, 2, cols[Math.floor(r() * cols.length)]);
      }
    };
    [[24, 76, 7], [62, 80, 6], [106, 78, 8], [138, 80, 6]].forEach(([x, y, rad]) => tree(x, y, rad, ['#6E9460', '#5E8656', '#7FA36E']));
    px(ctx, 0, 84, w, h - 84, '#7FA36E');
    speckle(ctx, w, 24, ['#6E9460'], 0.08, 4);
    for (let x = 0; x < w; x++) for (let y = 84; y < h; y++) if (r() < 0.06) px(ctx, x, y, 1, 1, '#6E9460');
  }),
);

export const blossomLayer = memo(() =>
  pixelTexture(96, 108, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const r = rng(9);
    const blossom = ['#F7C6D4', '#F2A9BF', '#FBDDE5', '#E98AA8', '#FFFFFF', '#F4B6C8'];
    const branch = (x0: number, y0: number, x1: number, y1: number) => pixelLine(ctx, x0, y0, x1, y1, '#6B4A3E');
    const cluster = (cx: number, cy: number, rad: number) => {
      for (let i = 0; i < rad * rad * 3; i++) {
        const a = r() * Math.PI * 2;
        const d = Math.sqrt(r()) * rad;
        px(ctx, Math.round(cx + Math.cos(a) * d * 1.2), Math.round(cy + Math.sin(a) * d * 0.85), 2, 2, blossom[Math.floor(r() * blossom.length)]);
      }
    };
    // trunk on the right edge and a branch reaching in from the top left
    px(ctx, 86, 30, 5, h - 30, '#6B4A3E');
    px(ctx, 89, 30, 2, h - 30, '#57392F');
    branch(88, 40, 66, 22);
    branch(88, 60, 70, 52);
    branch(0, 10, 26, 18);
    branch(10, 13, 18, 30);
    cluster(92, 22, 14);
    cluster(68, 22, 9);
    cluster(72, 50, 8);
    cluster(90, 70, 10);
    cluster(14, 12, 12);
    cluster(20, 30, 7);
    // petals drifting
    for (let i = 0; i < 14; i++) px(ctx, Math.floor(r() * w), Math.floor(30 + r() * 70), 1, 1, '#F7C6D4');
  }),
);
