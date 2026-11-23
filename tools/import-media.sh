#!/bin/sh
# Copy Shipherd's recorded demo media (docs/media, made by `pnpm demo:record` in the Shipherd repo) into assets/ as webp.
# Usage: tools/import-media.sh /path/to/shipherd [git-ref]
# Reads the files from <git-ref> (default origin/main) with `git show`, so the Shipherd checkout is never touched.
# Needs cwebp, gif2webp and ffmpeg on PATH (`brew install webp ffmpeg`).
set -eu
SHIPHERD=${1:?usage: tools/import-media.sh /path/to/shipherd [git-ref]}
REF=${2:-origin/main}
ASSETS=$(cd "$(dirname "$0")/.." && pwd)/assets
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

for f in demo.gif demo.zh-CN.gif epic.png epic.zh-CN.png your-turn.png your-turn.zh-CN.png; do
  git -C "$SHIPHERD" show "$REF:docs/media/$f" > "$TMP/$f"
done

for lang in en zh; do
  sfx=""; [ "$lang" = zh ] && sfx=".zh-CN"
  # Screenshots: 2560x1536 PNG -> 1600 px wide webp.
  for n in epic your-turn; do
    cwebp -quiet -q 82 -resize 1600 0 "$TMP/$n$sfx.png" -o "$ASSETS/$n-$lang.webp"
  done
  # Demo animation: lossless animated webp (smaller than lossy for UI captures).
  gif2webp -quiet -min_size "$TMP/demo$sfx.gif" -o "$ASSETS/demo-$lang.webp"
  # Still frame for prefers-reduced-motion: frame 165 is the Your turn page with its caption.
  ffmpeg -v error -y -i "$TMP/demo$sfx.gif" -vf "select='eq(n\,165)'" -frames:v 1 "$TMP/still-$lang.png"
  cwebp -quiet -q 85 "$TMP/still-$lang.png" -o "$ASSETS/demo-still-$lang.webp"
done
echo "Wrote demo, demo-still, epic and your-turn webp (en, zh) to $ASSETS. Look them over before committing."
