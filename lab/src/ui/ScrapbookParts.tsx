// Scrapbook decorations: pixel stickers (with a white die-cut edge from the CSS) and
// hand-drawn doodles. Each is small and self-contained; Scrapbook.tsx places them.

const C: Record<string, string> = {
  B: '#520B2D', // burgundy
  W: '#8E2E55', // wine
  R: '#BE3E70', // raspberry
  P: '#F2A9BF', // pink
  D: '#DFA5B7', // dusty pink
  c: '#FFF6EC', // cream
  Y: '#E9B44C', // gold
  y: '#C98A2E', // dark gold
  G: '#6E9460', // sage
  g: '#4F7A47', // dark sage
  N: '#8A5A3C', // brown
  n: '#6B4430', // dark brown
  K: '#8A8290', // grey
  w: '#FFFFFF',
  S: '#BFD9E2', // sky
};

function Pixels({ rows }: { rows: string[] }) {
  const rects: JSX.Element[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      if (ch !== '.') rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={end - x} height={1} fill={C[ch]} />);
      x = end;
    }
  });
  return <>{rects}</>;
}

const STICKERS = {
  camera: ['...WWWW.........', '..WWWWWW.....P..', '.BBBBBBBBBBBBBB.', '.BRRRRRRRRRRRYB.', '.BRRRBBBBBBRRRB.', '.BRRBcccccBRRRB.', '.BRRBccBBcBRRRB.', '.BRRBccBBcBRRRB.', '.BRRBcccccBRRRB.', '.BRRRBBBBBRRRRB.', '.BBBBBBBBBBBBBB.'],
  play: ['.RRRRRRRR.', 'RRRRRRRRRR', 'RRRwRRRRRR', 'RRRwwRRRRR', 'RRRwwwRRRR', 'RRRwwwwRRR', 'RRRwwwRRRR', 'RRRwwRRRRR', 'RRRwRRRRRR', '.RRRRRRRR.'],
  bubble: ['..cccccccc..', '.cccccccccc.', 'cccccccccccc', 'ccBccBccBccc', 'cccccccccccc', '.cccccccccc.', '..cccccccc..', '..cc........', '.cc.........'],
  sparkle: ['...Y...', '...Y...', '..YYY..', 'YYYwYYY', '..YYY..', '...Y...', '...Y...'],
  mic: ['.KKKK.', 'KKwKKK', 'KwKKwK', 'KKKwKK', 'KwKKwK', '.KKKK.', '..BB..', '..BB..', '..RR..', '..BB..', '..BB..', '..BB..', '.BBBB.'],
  note: ['...BBBB', '...BBBB', '...B..B', '...B..B', '...B..B', '...B..B', '.BBB.BB', 'BBBBBBB', 'BBB.BBB', '.B.....'],
  star: ['....Y....', '...YYY...', 'YYYYYYYYY', '.YYYYYYY.', '..YYYYY..', '..YYyYY..', '.YYY.YYY.', '.YY...YY.'],
  heart: ['.RR.RR.', 'RRRRRRR', 'RRwRRRR', '.RRRRR.', '..RRR..', '...R...'],
  boot: ['..NNNN....', '..NNNN....', '..NccN....', '..NNNN....', '..NNNNNN..', '.NNNNNNNN.', 'NNNNNNNNNN', 'nnnnnnnnnn', 'n.n.n.n.n.'],
  leaf: ['.....GG', '...GGGG', '..GGgGG', '.GGgGG.', 'GGgGG..', 'GgGG...', 'gGG....', 'g......'],
  mountain: ['.......c......', '......ccc.....', '.....cKKKc....', '....KKKKKKK...', '...KKKKKKKKK..', '..KKKKgKKKKKK.', '.KKKgggKKKKKKK', 'GGGGGGGGGGGGGG'],
} as const;

export type StickerKind = keyof typeof STICKERS;

export function Sticker({ kind }: { kind: StickerKind }) {
  const rows = STICKERS[kind] as readonly string[];
  return (
    <svg className="sb-sticker-art" viewBox={`0 0 ${rows[0].length} ${rows.length}`} shapeRendering="crispEdges" aria-hidden="true">
      <Pixels rows={[...rows]} />
    </svg>
  );
}

const ink = { fill: 'none', stroke: '#C66F8E', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const DOODLES = {
  // a curved arrow sweeping down and to the right
  arrow: { box: '0 0 90 60', d: <path d="M6 10 C 30 4, 64 14, 76 46 M64 38 L77 48 L82 33" {...ink} /> },
  arrowLeft: { box: '0 0 90 60', d: <path d="M84 10 C 60 4, 26 14, 14 46 M26 38 L13 48 L8 33" {...ink} /> },
  arrowUp: { box: '0 0 60 70', d: <path d="M40 64 C 20 54, 14 32, 26 8 M16 16 L26 6 L33 18" {...ink} /> },
  heart: { box: '0 0 30 28', d: <path d="M15 25 C 5 18, 2 12, 6 7 C 9 3, 13 4, 15 9 C 17 4, 21 3, 24 7 C 28 12, 25 18, 15 25 Z" {...ink} /> },
  star: { box: '0 0 30 30', d: <path d="M15 3 L18 12 L27 12 L20 18 L23 27 L15 21 L7 27 L10 18 L3 12 L12 12 Z" {...ink} /> },
  sparkles: { box: '0 0 40 40', d: <path d="M12 4 L12 16 M6 10 L18 10 M30 20 L30 30 M25 25 L35 25 M10 30 L10 34 M8 32 L12 32" {...ink} /> },
  squiggle: { box: '0 0 120 14', d: <path d="M3 8 Q 13 2, 23 8 T 43 8 T 63 8 T 83 8 T 103 8 T 117 7" {...ink} /> },
  notes: {
    box: '0 0 70 56',
    d: (
      <g {...ink}>
        <path d="M14 42 L14 12 L34 7 L34 36 M14 18 L34 13" />
        <ellipse cx="10" cy="43" rx="5" ry="4" />
        <ellipse cx="30" cy="37" rx="5" ry="4" />
        <path d="M56 30 L56 8 Q 62 12, 66 20" />
        <ellipse cx="52" cy="31" rx="5" ry="4" />
      </g>
    ),
  },
  mountains: {
    box: '0 0 130 60',
    d: (
      <g {...ink}>
        <path d="M4 54 L34 16 L50 34 L72 8 L104 54" />
        <path d="M64 19 L72 8 L80 19 L75 17 L72 21 L68 17 Z" />
        <circle cx="114" cy="12" r="6" />
      </g>
    ),
  },
  // a winding dashed trail
  trail: { box: '0 0 200 90', d: <path d="M4 84 C 40 84, 40 56, 76 58 S 120 74, 140 46 S 170 10, 196 8" {...ink} strokeDasharray="4 6" /> },
} as const;

export type DoodleKind = keyof typeof DOODLES;

export function Doodle({ kind }: { kind: DoodleKind }) {
  const d = DOODLES[kind];
  return (
    <svg className="sb-doodle-art" viewBox={d.box} aria-hidden="true">
      {d.d}
    </svg>
  );
}

/** A small paper clip for the edge of a print. */
export function PaperClip() {
  return (
    <svg className="sb-clip" viewBox="0 0 20 54" aria-hidden="true">
      <path d="M6 46 L6 10 Q 6 4, 11 4 Q 16 4, 16 10 L16 40 Q 16 48, 10 48 Q 3 48, 3 40 L3 16" fill="none" stroke="#A9A2AE" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
