import type { Project } from '../content';

// Pixel icons for the Projects desktop, drawn from 16×16 character grids. Each icon
// is a stack of layers; the layers that move on hover (see .dt-icon in the CSS) are
// separate <g> groups: the solar panel turns toward a sun, the arm's upper link
// waves, the trophy sparkles and the folder's front flap opens.

const COLORS: Record<string, string> = {
  B: '#520B2D', // burgundy outline
  W: '#8E2E55', // wine
  R: '#BE3E70', // raspberry
  P: '#F2A9BF', // pink
  D: '#DFA5B7', // dusty pink
  C: '#FFF6EC', // cream
  Y: '#E9B44C', // gold
  y: '#C98A2E', // dark gold
  N: '#7A4A2A', // seed brown
  G: '#5C9A47', // leaf
  g: '#3F7A36', // dark leaf
  S: '#9FD3E0', // panel blue
  K: '#6E6772', // metal
  w: '#FFFFFF', // sparkle
};

function Layer({ rows, className }: { rows: string[]; className?: string }) {
  const rects: JSX.Element[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      if (ch !== '.') rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={end - x} height={1} fill={COLORS[ch]} />);
      x = end;
    }
  });
  return <g className={className}>{rects}</g>;
}

const TERMINAL = [
  '................',
  'BBBBBBBBBBBB....',
  'BRRRRRRRRRRB....',
  'BCCCCCCCCCCB....',
  'BCBCCCCCCCCB....',
  'BCCBCCCCCCCB....',
  'BCBCCBBBCCCB....',
  'BCCCCCCCCCCB....',
  'BCCCCCCCCCCB....',
  'BBBBBBBBBBBB....',
  '....BBBB........',
  '..BBBBBBBB......',
  '................',
  '................',
  '................',
  '................',
];
const TROPHY = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '..........YYYYY.',
  '.........YYYYYYY',
  '.........Y.YYY.Y',
  '..........YYYYY.',
  '...........YYY..',
  '............Y...',
  '...........yyy..',
  '..........yyyyy.',
  '................',
];
const SPARKLE = [
  '................',
  '................',
  '................',
  '................',
  '..............w.',
  '.............www',
  '..............w.',
  '................',
  '................',
  '................',
  '................',
  '........w.......',
  '.......www......',
  '........w.......',
  '................',
  '................',
];

const SUNFLOWER = [
  '................',
  '..Y.Y...........',
  '.YYYYY..........',
  'YYNNNYY.........',
  '.YNNNY..........',
  'YYNNNYY.........',
  '.YYYYY..........',
  '..Y.Y...........',
  '...G............',
  '...G.GG.........',
  '..GGGG..........',
  '...G............',
  '...G............',
  '...G............',
  'gggggggggggggggg',
  '................',
];
const SUN = [
  '...........Y.Y.Y',
  '............YYY.',
  '...........YYYYY',
  '............YYY.',
  '...........Y.Y.Y',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
];
const POST = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '...........K....',
  '...........K....',
  '...........K....',
  '...........K....',
  '..........KKK...',
  '................',
  '................',
];
const PANEL = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '........KKKKKKK.',
  '........KSSKSSK.',
  '........KSSKSSK.',
  '........KKKKKKK.',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
];

const ARM_BASE = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '.......DD.......',
  '.......DD.......',
  '.......DD.......',
  '.......DD.......',
  '......RRRR......',
  '.....WWWWWW.....',
  '....WWWWWWWW....',
  '....BBBBBBBB....',
];
const ARM_UPPER = [
  '................',
  '................',
  '............B.B.',
  '............BBB.',
  '...........DD...',
  '..........DD....',
  '.........DD.....',
  '.......RRD......',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
];

const FOLDER_BACK = [
  '................',
  '................',
  '................',
  '.BBBB...........',
  'BDDDDBBBBBBBBBB.',
  'BDDDDDDDDDDDDDB.',
  'BDDDDDDDDDDDDDB.',
  'BDDDDDDDDDDDDDB.',
  'BDDDDDDDDDDDDDB.',
  'BDDDDDDDDDDDDDB.',
  'BDDDDDDDDDDDDDB.',
  'BDDDDDDDDDDDDDB.',
  'BDDDDDDDDDDDDDB.',
  'BBBBBBBBBBBBBBB.',
  '................',
  '................',
];
const FOLDER_PAPER = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '...CCCCCCCCC....',
  '...CKKKKKCCC....',
  '...CCCCCCCCC....',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
];
const FOLDER_FRONT = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  'BBBBBBBBBBBBBBB.',
  'BPPPPPPPPPPPPPB.',
  'BPPPPPPPPPPPPPB.',
  'BPPPPPPPPPPPPPB.',
  'BPPPPPPRRPPPPPB.',
  'BPPPPPPPPPPPPPB.',
  'BBBBBBBBBBBBBBB.',
  '................',
  '................',
];

export function ProjectIcon({ kind }: { kind: Project['icon'] }) {
  return (
    <svg className="dt-art" data-kind={kind} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
      {kind === 'hackathon' && (
        <>
          <Layer rows={TERMINAL} />
          <Layer rows={TROPHY} className="trophy" />
          <Layer rows={SPARKLE} className="sparkle" />
        </>
      )}
      {kind === 'flower' && (
        <>
          <Layer rows={SUN} className="sun" />
          <Layer rows={SUNFLOWER} />
          <Layer rows={POST} />
          <Layer rows={PANEL} className="panel" />
        </>
      )}
      {kind === 'arm' && (
        <>
          <Layer rows={ARM_BASE} />
          <Layer rows={ARM_UPPER} className="upper" />
        </>
      )}
      {kind === 'folder' && (
        <>
          <Layer rows={FOLDER_BACK} />
          <Layer rows={FOLDER_PAPER} />
          <Layer rows={FOLDER_FRONT} className="flap" />
        </>
      )}
    </svg>
  );
}

const TROPHY_BADGE = [
  '..YYYYYY..',
  'YYYYYYYYYY',
  'Y.YYYYYY.Y',
  '.YYYYYYYY.',
  '..YYYYYY..',
  '....YY....',
  '...yyyy...',
  '..yyyyyy..',
];

/** Small pixel trophy used on award badges. */
export function TrophyPixel() {
  return (
    <svg className="dt-trophy" viewBox="0 0 10 8" shapeRendering="crispEdges" aria-hidden="true">
      <Layer rows={TROPHY_BADGE} />
    </svg>
  );
}

const FILE = [
  'BBBBBBB...',
  'BCCCCCBB..',
  'BCCCCCBCB.',
  'BCKKKCBBBB',
  'BCCCCCCCCB',
  'BCKKKKKKCB',
  'BCCCCCCCCB',
  'BCKKKKKCCB',
  'BCCCCCCCCB',
  'BCRRCCCCCB',
  'BCCCCCCCCB',
  'BBBBBBBBBB',
];

/** Pixel document icon for files inside a folder window. */
export function FilePixel() {
  return (
    <svg className="dt-file-art" viewBox="0 0 10 12" shapeRendering="crispEdges" aria-hidden="true">
      <Layer rows={FILE} />
    </svg>
  );
}

/** Tiny pixel heart for the taskbar's start button. */
export function HeartPixel() {
  return (
    <svg className="dt-heart" viewBox="0 0 7 6" shapeRendering="crispEdges" aria-hidden="true">
      <Layer rows={['.RR.RR.', 'RRRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...']} />
    </svg>
  );
}
