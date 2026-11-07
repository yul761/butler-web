# butler-web

The landing page for [Butler](https://github.com/yul761/butler) at https://butler.statecore.io — a single static,
bilingual (EN / 中文) page. No build step: `index.html` plus `assets/`.

- Language: `?lang=en|zh` wins, then the visitor's last manual choice (localStorage `butler-lang`),
  then the browser language (`zh*` → Chinese, anything else → English).
- No runtime third-party requests: no CDN fonts, analytics or GitHub API. Everything is in `assets/`.
- Deployed on Vercel. DNS: `butler` CNAME in Namecheap for statecore.io.

Preview locally: `python3 -m http.server 8765` and open http://localhost:8765/.

Check before committing: `node tools/check.mjs` (external loads, banned phrases, missing assets, zh/en pairs)
and `node --test tools/*.test.mjs`. Put real project or company names that must never appear on the page in
`tools/private-terms.txt`, one per line (git-ignored).
