#!/bin/sh
# Re-take the Now-page screenshots: tools/capture/run.sh <path to the Butler repo>
# Needs: the Butler repo with `pnpm install` done, and cwebp on PATH.
set -eu

BUTLER="${1:?usage: tools/capture/run.sh <butler-repo>}"
BUTLER="$(cd "$BUTLER" && pwd)"
HERE="$(cd "$(dirname "$0")" && pwd)"
WEB="$(cd "$HERE/../.." && pwd)"
OUT="$HERE/out"
SPEC="$BUTLER/e2e/zz-web-capture.spec.ts"
DATA="$BUTLER/e2e/zz-web-demo-data.ts"

command -v cwebp >/dev/null || { echo "cwebp not found (brew install webp)" >&2; exit 1; }
[ -e "$SPEC" ] || [ -e "$DATA" ] && { echo "$SPEC or $DATA already exists; remove it first" >&2; exit 1; }

trap 'rm -f "$SPEC" "$DATA"' EXIT INT TERM
cp "$HERE/now-capture.spec.ts" "$SPEC"
cp "$HERE/demo-data.ts" "$DATA"
mkdir -p "$OUT"
rm -f "$OUT"/now-*.png

cd "$BUTLER"
# Always rebuild the app so the screenshot shows the current UI; the hook binary only when missing.
pnpm build
[ -e build/hook/butler-hook ] || [ -e build/hook/butler-hook.exe ] || pnpm build:hook
BUTLER_WEB_OUT="$OUT" pnpm exec playwright test e2e/zz-web-capture.spec.ts --workers=1

for lang in zh en; do
  cwebp -quiet -q 88 -resize 1600 0 "$OUT/now-$lang.png" -o "$WEB/assets/now-$lang.webp"
done
ls -l "$WEB"/assets/now-*.webp
