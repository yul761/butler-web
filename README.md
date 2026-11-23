# shipherd-web

The landing page for [Shipherd](https://github.com/yul761/shipherd) at https://shipherd.statecore.io — a single static,
bilingual (EN / 中文) page. No build step: `index.html` plus `assets/`.

- Language: `?lang=en|zh` wins, then the visitor's last manual choice (localStorage `shipherd-lang`),
  then the browser language (`zh*` → Chinese, anything else → English).
- No runtime third-party requests: no CDN fonts, analytics or GitHub API. Everything is in `assets/`.
- The copy follows Shipherd's README and docs on `main`; the footer says which version the page describes (now 4.2).
- Deployed on Vercel. DNS: `shipherd` CNAME in Namecheap for statecore.io.

Preview locally: `python3 -m http.server 8765` and open http://localhost:8765/.

Check before committing: `node tools/check.mjs` (external loads, banned phrases, missing assets, zh/en pairs)
and `node --test tools/*.test.mjs`. Put real project or company names that must never appear on the page in
`tools/private-terms.txt`, one per line (git-ignored).

## Updating the screenshots and demo animation

The images in `assets/` (`demo-*.webp`, `demo-still-*.webp`, `epic-*.webp`, `your-turn-*.webp`, in `en` and `zh`)
are Shipherd's own demo media: the real UI with demo data (an epic "Offline mode" in a made-up `fernleaf-notes` org).
They are recorded in the Shipherd repo with `pnpm demo:record` into `docs/media/` (see Shipherd's `docs/demo-media.md`).
To bring a new recording over:

```sh
tools/import-media.sh /path/to/shipherd   # reads docs/media from origin/main with git show
```

Needs `cwebp`, `gif2webp` and `ffmpeg` on `PATH` (`brew install webp ffmpeg`). Look over the new images before
committing: only the demo names, no real paths or projects. If the recording's timing changes, check that frame 165
(the reduced-motion still) still shows the Your turn page.

`assets/og.png` is a 1200×630 screenshot of the hero's reduced-motion frame in English.
