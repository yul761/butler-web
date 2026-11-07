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

## Re-taking the Now-page screenshots

`assets/now-zh.webp` and `assets/now-en.webp` are the real Butler UI with demo data:

```sh
tools/capture/run.sh /path/to/butler
```

Needs the Butler repo with `pnpm install` done, and `cwebp` on `PATH` (`brew install webp`). The script copies
`tools/capture/now-capture.spec.ts` and `demo-data.ts` into Butler's `e2e/` (deleted again on exit), rebuilds
Butler, and runs the spec in a sandbox. The spec creates the epic, features and tickets through Butler's real IPC,
then replaces only the `now:view` and `usage:summary` handlers in that test process with the demo data, and saves
the left 1200 CSS px of a 1440×900 window per language. Nothing is added to Butler itself. The `#usage` section quotes `demoUsage`,
so change both together. Look over the new images before committing: only the demo names, no real paths.
