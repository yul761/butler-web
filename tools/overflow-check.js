// Paste into the page (chrome-devtools evaluate_script sourcePath). Lists visible elements that stick out past the viewport.
// body has overflow-x:hidden, so scrollWidth alone would hide real overflow.
() => {
  const W = document.documentElement.clientWidth;
  const bad = [];
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    if (cs.position === "fixed" || cs.display === "none" || cs.visibility === "hidden") continue;
    if (el.closest("svg") && el.tagName.toLowerCase() !== "svg") continue;
    let clipped = false;
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX;
      if (o === "hidden" || o === "auto" || o === "scroll" || o === "clip") { const pr = p.getBoundingClientRect(); if (pr.right <= W + 1) { clipped = true; break; } }
    }
    if (clipped) continue;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && (r.right > W + 1 || r.left < -1)) bad.push(`${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}.${[...el.classList].join(".")} [${Math.round(r.left)},${Math.round(r.right)}]`);
  }
  return { width: W, overflow: bad.slice(0, 15), count: bad.length };
}
