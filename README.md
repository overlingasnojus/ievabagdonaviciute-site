# ievabagdonaviciute.com

Plain HTML + CSS rebuild of the original WordPress/Elementor site. No build step, no framework, no jQuery.
The CSS mirrors the Elementor settings (percent widths, vh heights, 1024/767 breakpoints), so the layout matches the original at every screen width, not just desktop. Like the original, only the home page has the logo header.

## Structure

```
index.html                         Home (one-page portfolio)
blog-posts/index.html              Blog list
what-effective-leadership-…/       Post 1   (same URL slugs as WordPress)
digital-marketing-is-…/            Post 2
assets/css/style.css               All styles (one file, commented by section)
assets/img/                        Images + the same srcset size variants the original serves
download-images.sh                 One-time image pull from the live WP site
```

## First run

```bash
bash download-images.sh   # pulls all 54 image files (16 images + srcset variants) into assets/img/ (do this before WP goes offline)
git init && git add . && git commit -m "Static rebuild"
```

Preview locally with any static server, e.g. `npx serve .` or `python3 -m http.server`.
The pages use folder-style links (`blog-posts/`), so open them through a server, not by double-clicking the files.

## Deploy

- **GitHub Pages:** push the repo, then Settings → Pages → deploy from `main` / root.
- **Netlify / Vercel / Cloudflare Pages:** connect the repo; no build command; publish directory `/`.
- To keep the domain, point `ievabagdonaviciute.com` DNS at the new host. For GitHub Pages, also add a `CNAME` file containing the domain.

## Editing

- **Colours and fonts:** CSS variables at the top of `style.css` (`--accent: #009fbb`, `--dark: #0e1013`).
- **New experience entry:** copy one `<section class="exp-row …">` block in `index.html`.
- **New blog post:** copy one post folder, change the title, hero image and body, then add a card in `blog-posts/index.html`.

## External dependencies

- Google Fonts: Montserrat and Delicious Handrawn.
- The small scroll animation under the hero is the same Lottie file as before, loaded from `lottie.host` through the dotLottie player on unpkg. To drop it, delete the `<section class="lottie">` block and the script tag.

## Known content typos carried over from the original

These were left exactly as on the live site, since the goal was an identical copy:
"May 205" (Microsoft dates), "Undergrafuate" (×2), "Managament", "controller by PLC",
"Code-Academy::", and "academic integritydetecting fat deposits…" in the ECE120 entry.
