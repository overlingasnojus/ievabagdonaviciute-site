# ievabagdonaviciute.com

The homepage is an interactive 3D lab built with React, three.js and Vite. Its source lives in
[`lab/`](lab/). GitHub Pages serves this repository's root on `main`, so the built site is
committed here at the root.

## Updating the site

```bash
cd lab
npm install
npm run dev          # work on it locally
npm run build:site   # build into the repo root (index.html, static/, about/, CV PDF)
```

Then commit and push to `main`. The site updates about a minute later.

See [`lab/README.md`](lab/README.md) for where content, layout and animations live.

## What's at the root

| Path | What it is |
|---|---|
| `index.html`, `static/`, `about/`, `favicon.svg`, `ieva-bagdonaviciute-cv.pdf` | Built output from `lab/` (don't edit by hand) |
| `blog-posts/` and the two post folders | Blog posts from the previous site, still served at their old URLs |
| `assets/` | Styles and images used by those blog posts |
| `CNAME`, `.nojekyll` | GitHub Pages custom domain and plain static serving |
