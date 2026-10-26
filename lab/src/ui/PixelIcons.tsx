// Pixel-art icons drawn from character grids. Each grid character maps to a palette
// colour ('.' is transparent); runs of the same colour on a row become one <rect>, and
// shape-rendering keeps every edge crisp at any size.

const C = {
  burgundy: '#520B2D',
  wine: '#8E2E55',
  raspberry: '#BE3E70',
  dusty: '#DFA5B7',
  pink: '#F28DB2',
  cream: '#FFF6EC',
  face: '#F6D9CF',
};

type Palette = Record<string, string>;

function PixelGrid({ rows, palette, label }: { rows: string[]; palette: Palette; label?: string }) {
  const rects: JSX.Element[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      if (ch !== '.' && palette[ch]) rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={end - x} height={1} fill={palette[ch]} />);
      x = end;
    }
  });
  return (
    <svg
      className="pixel-icon"
      viewBox={`0 0 ${rows[0].length} ${rows.length}`}
      shapeRendering="crispEdges"
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      {rects}
    </svg>
  );
}

export const OCTOCAT = [
  '...O........O...',
  '...OO......OO...',
  '...OOOOOOOOOO...',
  '..OOOOOOOOOOOO..',
  '..OccccccccccO..',
  '..OccEccccEccO..',
  'wwOcPccNNccPcOww',
  '..OccccccccccO..',
  '...OOOOOOOOOO...',
  '....OOOOOOOO....',
  '...OOOOOOOOOO...',
  '..OO.OO..OO.OO..',
  '.OO..OO..OO..OO.',
];

export const LINKEDIN = [
  '.OOOOOOOOOOOOOO.',
  'OBBBBBBBBBBBBBBO',
  'OBBccBBBBBBBBBBO',
  'OBBccBBBBBBBBBBO',
  'OBBBBBBBBBBBBBBO',
  'OBBccBBccBcccBBO',
  'OBBccBBcccccccBO',
  'OBBccBBccBBBccBO',
  'OBBccBBccBBBccBO',
  'OBBccBBccBBBccBO',
  'OBBccBBccBBBccBO',
  'OBBBBBBBBBBBBBBO',
  'OhBBBBBBBBBBBBBO',
  '.OOOOOOOOOOOOOO.',
];

export const ENVELOPE = [
  'OOOOOOOOOOOOOOO',
  'OPcccccccccccPO',
  'OcPcccccccccPcO',
  'OccPcccccccPccO',
  'OcccPcHcHcPcccO',
  'OccccHHHHHccccO',
  'OcccccHHHcccccO',
  'OccccccHccccccO',
  'OcccccccccccccO',
  'OOOOOOOOOOOOOOO',
];

export const SCHOLAR = [
  '......OOOO......',
  '....OOOOOOOO....',
  '..OOOOOOOOOOOO..',
  '....OOOOOOOO.R..',
  '.....OOOOOO..R..',
  '.....ffffff..R..',
  '....hffffffh.RR.',
  '....hffffffh....',
  '.....ffffff.....',
  '......ffff......',
  '....BBBffBBB....',
  '..BBBBBBBBBBBB..',
  '.BBBBBBBBBBBBBB.',
  '.BBBBBBBBBBBBBB.',
];

export const GitHubIcon = () => (
  <PixelGrid rows={OCTOCAT} palette={{ O: C.burgundy, c: C.cream, E: C.burgundy, P: C.pink, N: C.raspberry, w: C.dusty }} />
);
export const LinkedInIcon = () => <PixelGrid rows={LINKEDIN} palette={{ O: C.burgundy, B: C.wine, c: C.cream, h: C.raspberry }} />;
export const EmailIcon = () => <PixelGrid rows={ENVELOPE} palette={{ O: C.burgundy, c: C.cream, P: C.dusty, H: C.raspberry }} />;
export const ScholarIcon = () => <PixelGrid rows={SCHOLAR} palette={{ O: C.burgundy, R: C.raspberry, f: C.face, h: C.wine, B: C.wine }} />;
