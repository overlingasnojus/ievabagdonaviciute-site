// Where the CV document viewer sits on screen. The flying 3D page settles exactly
// over this rectangle (Cv.tsx) and the scrollable HTML pages are laid out in it
// (Projector.tsx), so both read from this one function.

/** US Letter: 11 / 8.5. Matches PAPER in layout.ts. */
export const CV_PAGE_ASPECT = 11 / 8.5;

export function cvViewerRect(vw: number, vh: number) {
  const narrow = vw <= 820;
  const header = narrow ? 56 : 64;
  // clear of the "Back to lab" control on narrow screens
  const top = header + (narrow ? 62 : 18);
  const width = Math.min(vw * 0.92, 860);
  // below 1180px there's no room beside the pages, so keep space under them for the buttons
  const bottom = vw <= 1180 ? 74 : 18;
  return { left: (vw - width) / 2, top, width, height: vh - top - bottom };
}
