import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findExternalLoads, findBannedPhrases, findMissingAssets, findUnpairedLang, findUndefinedCssVars } from "./check.mjs";

test("external script is reported", () => assert.equal(findExternalLoads('<script src="https://cdn.x/a.js"></script>').length, 1));
test("external stylesheet is reported", () => assert.equal(findExternalLoads('<link rel="stylesheet" href="https://fonts.x/css">').length, 1));
test("external image is reported", () => assert.equal(findExternalLoads('<img src="http://x.com/a.png">').length, 1));
test("protocol-relative css url is reported", () => assert.equal(findExternalLoads("<style>a{background:url(//x.com/i.png)}</style>").length, 1));
test("fetch call is reported", () => assert.equal(findExternalLoads("<script>fetch('/x')</script>").length, 1));
test("outbound <a> link is allowed", () => assert.deepEqual(findExternalLoads('<a href="https://github.com/yul761/butler">x</a>'), []));
test("og meta absolute url is allowed", () => assert.deepEqual(findExternalLoads('<meta property="og:image" content="https://butler.statecore.io/assets/og.png">'), []));
test("local assets are allowed", () => assert.deepEqual(findExternalLoads('<img src="assets/a.webp"><link rel="icon" href="assets/favicon.png">'), []));

test("banned phrase matched in text, case-insensitive", () =>
  assert.deepEqual(findBannedPhrases("<p>Real-Time Collaboration</p>", ["real-time collaboration"]), ["real-time collaboration"]));
test("banned phrase inside attribute is ignored", () => assert.deepEqual(findBannedPhrases('<p data-x="10x">ok</p>', ["10x"]), []));
test("banned phrase inside script string is caught", () => assert.deepEqual(findBannedPhrases("<script>var t='实时协作';</script>", ["实时协作"]), ["实时协作"]));

test("missing asset reported", () => {
  const dir = mkdtempSync(join(tmpdir(), "bw-"));
  assert.deepEqual(findMissingAssets('<img src="assets/nope.webp">', dir), ["assets/nope.webp"]);
});
test("present asset passes", () => {
  const dir = mkdtempSync(join(tmpdir(), "bw-"));
  mkdirSync(join(dir, "assets"));
  writeFileSync(join(dir, "assets", "a.webp"), "");
  assert.deepEqual(findMissingAssets('<img src="assets/a.webp">', dir), []);
});

test("unpaired zh in a section reported", () => assert.deepEqual(findUnpairedLang('<section id="a"><span class="zh">中</span></section>'), ["a"]));
test("paired section passes", () => assert.deepEqual(findUnpairedLang('<section id="a"><span class="zh">中</span><span class="en">E</span></section>'), []));
test("unpaired in header reported", () => assert.deepEqual(findUnpairedLang('<header><span class="en">E</span></header>'), ["header"]));
test("class tokens like 'zhx' do not count", () => assert.deepEqual(findUnpairedLang('<section id="a"><span class="zhx">x</span></section>'), []));

test("css var used but never defined is reported", () =>
  assert.deepEqual(findUndefinedCssVars("<style>:root{--a:1px}.x{color:var(--b);margin:var(--a)}</style>"), ["--b"]));
test("css var defined anywhere passes, fallback form too", () =>
  assert.deepEqual(findUndefinedCssVars('<style>:root{--a:1px}.x{width:var(--a, 2px)}</style><li style="--v:62%"></li><style>.y{width:var(--v)}</style>'), []));
