# Ieva's lab: interactive portfolio (v1)

A cozy pink robotics lab built as a real 3D scene (React, TypeScript, Vite, React Three Fiber, GSAP).
Visitors open five sections by clicking an object in the room, a hotspot label, or the numbered buttons.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in dist/ (relative paths, works from any folder)
```

## Where things live

| What | File |
|---|---|
| Section copy and placeholders, CV PDF link | `src/content.ts` |
| Section HTML surfaces | `src/ui/SectionLayer.tsx` |
| Page styles | `src/styles.css` |
| Room layout, object positions, camera shots, hotspot anchors | `src/scene/layout.ts` |
| Open/close state machine and animation timelines | `src/state/nav.ts` |
| Pixel textures (drawn in code, no image files) | `src/scene/textures.ts` |

## Updating the CV

The CV section shows the real PDF pages as images, so updating it takes two steps:

1. Replace `public/ieva-bagdonaviciute-cv.pdf`.
2. Re-render the pages to `public/cv/page-1.png`, `page-2.png`, and so on, at 2.5× (1530 px wide).
   On a Mac you can do this with PDFKit; any PDF-to-PNG tool works. If the page count changes,
   update `PLACEHOLDERS.cv.pages` in `src/content.ts`.

Then run `npm run build:site`.

## How the animation works

Every animated quantity is a 0–1 progress value in `src/state/anim.ts`. One GSAP timeline per section
tweens those values, and closing plays the same timeline in reverse. The scene components rebuild each
pose from fixed rest poses every frame, so objects always return exactly home. A request made
mid-transition is queued (the latest request wins) and reached by returning through the overview first.
