// Static checks for index.html: the page's test suite. `node tools/check.mjs` exits 1 on any problem.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REMOTE = /^(?:https?:)?\/\//i;

/** Every resource the page would load from another origin. Outbound <a> links and <meta> values are not loads. */
export function findExternalLoads(html) {
  const out = [];
  for (const m of html.matchAll(/<(script|img|source|iframe|video|audio)\b[^>]*?\s(?:src|srcset)\s*=\s*["']([^"']+)["']/gi)) {
    if (REMOTE.test(m[2].trim())) out.push(`<${m[1]}> ${m[2]}`);
  }
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const href = /\shref\s*=\s*["']([^"']+)["']/i.exec(m[0])?.[1];
    if (href && REMOTE.test(href.trim())) out.push(`<link> ${href}`);
  }
  for (const m of html.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
    if (REMOTE.test(m[1].trim())) out.push(`url(${m[1]})`);
  }
  for (const m of html.matchAll(/@import\s+["']([^"']+)["']/gi)) {
    if (REMOTE.test(m[1].trim())) out.push(`@import ${m[1]}`);
  }
  if (/\bfetch\s*\(/.test(html)) out.push("fetch(");
  if (/\bXMLHttpRequest\b/.test(html)) out.push("XMLHttpRequest");
  if (/\bnew\s+WebSocket\b/.test(html)) out.push("WebSocket");
  return out;
}

/** Visible text plus script/style contents (copy lives in JS too); attributes are dropped with their tags. */
function textOf(html) {
  return html.replace(/<!--[\s\S]*?-->/g, " ").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
}

export function findBannedPhrases(html, terms) {
  const text = textOf(html).toLowerCase();
  return terms.filter((t) => t.trim() && text.includes(t.trim().toLowerCase()));
}

export function findMissingAssets(html, root) {
  const refs = new Set();
  for (const m of html.matchAll(/["'(]((?:\.\/)?assets\/[^"')?#\s]+)/g)) refs.add(m[1].replace(/^\.\//, ""));
  return [...refs].filter((p) => !existsSync(join(root, p)));
}

const hasClass = (attrs, name) => {
  const c = /\bclass\s*=\s*["']([^"']*)["']/i.exec(attrs)?.[1];
  return c ? c.split(/\s+/).includes(name) : false;
};

function countLang(fragment) {
  let zh = 0;
  let en = 0;
  for (const m of fragment.matchAll(/<[a-z][a-z0-9-]*\b([^>]*)>/gi)) {
    if (hasClass(m[1], "zh")) zh++;
    if (hasClass(m[1], "en")) en++;
  }
  return { zh, en };
}

/** Per <section id>, <header> and <footer>: as many .zh elements as .en ones. */
export function findUnpairedLang(html) {
  const out = [];
  for (const m of html.matchAll(/<section\b([^>]*)>([\s\S]*?)<\/section>/gi)) {
    const id = /\bid\s*=\s*["']([^"']+)["']/i.exec(m[1])?.[1] ?? "(section without id)";
    const { zh, en } = countLang(m[0]);
    if (zh !== en) out.push(id);
  }
  for (const tag of ["header", "footer"]) {
    for (const m of html.matchAll(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi"))) {
      const { zh, en } = countLang(m[0]);
      if (zh !== en) out.push(tag);
    }
  }
  return out;
}

/** CSS custom properties read with var(--x) that no declaration (in <style> or a style="" attribute) ever sets. */
export function findUndefinedCssVars(html) {
  const defined = new Set([...html.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
  const used = new Set([...html.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]));
  return [...used].filter((v) => !defined.has(v));
}

function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const html = readFileSync(join(root, "index.html"), "utf8");
  const terms = JSON.parse(readFileSync(join(root, "tools", "banned-terms.json"), "utf8"));
  const privatePath = join(root, "tools", "private-terms.txt");
  const privateTerms = existsSync(privatePath)
    ? readFileSync(privatePath, "utf8").split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"))
    : [];
  const problems = [
    ...findExternalLoads(html).map((p) => `external load: ${p}`),
    ...findBannedPhrases(html, terms).map((p) => `banned phrase: ${p}`),
    ...findBannedPhrases(html, privateTerms).map(() => "private term found (see tools/private-terms.txt)"),
    ...findMissingAssets(html, root).map((p) => `missing asset: ${p}`),
    ...findUnpairedLang(html).map((p) => `unpaired zh/en in: ${p}`),
    ...findUndefinedCssVars(html).map((v) => `undefined css var: ${v}`),
  ];
  for (const p of problems) console.log(p);
  console.log(problems.length ? `${problems.length} problem(s)` : "ok");
  process.exit(problems.length ? 1 : 0);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
