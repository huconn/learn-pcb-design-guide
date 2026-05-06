#!/usr/bin/env bash
# Env-driven production build.
#
# Inputs:
#   BASE_PATH  — e.g. "/pcb" (default) or "/learn/hardware-pcb-guide"
#                  Must start with "/", must NOT end with "/".
#   SITE_URL   — read by astro.config.mjs; not used here directly.
#
# Output layout (BASE_PATH stripped of leading slash):
#   dist/<base>/...           — Astro pages (HTML/CSS/JS) and public assets
#   dist/<base>/pagefind/...  — Pagefind search index
#
# Hardcoded "/pcb/..." strings in the source (links, image paths, pagefind
# import) are rewritten to "${BASE_PATH}/..." in the built dist after the
# Astro build, so the same source can produce builds for multiple hosts.
set -euo pipefail

BASE_PATH="${BASE_PATH:-/pcb}"
BASE_NO_SLASH="${BASE_PATH#/}"

if [[ "${BASE_PATH}" != /* ]]; then
  echo "BASE_PATH must start with '/'. Got: ${BASE_PATH}" >&2
  exit 1
fi
if [[ "${BASE_PATH}" == */ ]]; then
  echo "BASE_PATH must NOT end with '/'. Got: ${BASE_PATH}" >&2
  exit 1
fi

echo "[build] BASE_PATH=${BASE_PATH}  SITE_URL=${SITE_URL:-https://hulryung.com}"

# 1) Astro build
npx astro build

# 2) Move dist contents under dist/<base>/ so deployed URLs match the base
#    (Astro 6 doesn't nest output by base path on its own.)
rm -rf .build-tmp
mv dist .build-tmp
mkdir -p "dist/${BASE_NO_SLASH}"
# Move children of .build-tmp into dist/<base>/
shopt -s dotglob
mv .build-tmp/* "dist/${BASE_NO_SLASH}/"
shopt -u dotglob
rm -rf .build-tmp

# 3) Pagefind index — site is "dist" (so URLs include the base prefix),
#    output goes under the base's pagefind directory.
npx pagefind --site dist --output-subdir "${BASE_NO_SLASH}/pagefind"

# 4) Rewrite hardcoded "/pcb/" prefix to "${BASE_PATH}/" so non-default
#    deployments resolve their own asset/link URLs. No-op when BASE_PATH=/pcb.
if [[ "${BASE_PATH}" != "/pcb" ]]; then
  echo "[build] rewriting /pcb/ → ${BASE_PATH}/ in dist"
  # Use Perl for portable in-place replacement (macOS sed differs from GNU sed).
  find "dist/${BASE_NO_SLASH}" -type f \
    \( -name "*.html" -o -name "*.js" -o -name "*.css" -o -name "*.json" -o -name "*.xml" -o -name "*.svg" -o -name "*.txt" \) \
    -print0 | xargs -0 perl -i -pe "s|/pcb/|${BASE_PATH}/|g"
fi

echo "[build] done. Output: dist/${BASE_NO_SLASH}/"
