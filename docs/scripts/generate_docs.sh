#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$DOCS_DIR/.." && pwd)"
CLIENT_DIR="$REPO_ROOT/client"
TARGET_DIR="$DOCS_DIR/screenshots"

clear_docs_screenshots() {
    mkdir -p "$TARGET_DIR"
    rm -f "$TARGET_DIR"/*.png
    rm -f "$TARGET_DIR"/*.jpg
    rm -f "$TARGET_DIR"/*.jpeg
    rm -f "$TARGET_DIR"/*.webp
    rm -rf "$TARGET_DIR"/20-user-manual-screenshots-docs-runner.cy.ts
    rm -rf "$TARGET_DIR"/tmp-user-manual-screenshots-docs-runner.cy.ts
    rm -rf "$TARGET_DIR"/tmp-user-manual-screenshots-runner.cy.ts
    find "$TARGET_DIR" -mindepth 1 -maxdepth 1 -type d -name "*.cy.ts" -exec rm -rf {} +
}

cleanup() {
    true
}

if [ "${1:-}" = "--clear" ]; then
    clear_docs_screenshots
    shift
fi

if [ "$#" -gt 0 ]; then
    echo "usage: $0 [--clear]"
    exit 1
fi

python_has_pillow() {
    "$1" -c 'import PIL' >/dev/null 2>&1
}

python_has_pip() {
    "$1" -m pip --version >/dev/null 2>&1
}

postprocess_python=""
for candidate in "/tmp/codex-tts-venv/bin/python" "python3" "/usr/bin/python3"; do
    if command -v "$candidate" >/dev/null 2>&1 && python_has_pillow "$candidate"; then
        postprocess_python="$candidate"
        break
    fi
done

if [ -z "$postprocess_python" ]; then
    for candidate in "/tmp/codex-tts-venv/bin/python" "python3" "/usr/bin/python3"; do
        if command -v "$candidate" >/dev/null 2>&1 && python_has_pip "$candidate"; then
            "$candidate" -m pip install --quiet Pillow
            postprocess_python="$candidate"
            break
        fi
    done
fi

if [ -z "$postprocess_python" ]; then
    echo "No Python with Pillow or pip found for docs screenshot post-processing."
    exit 1
fi

trap cleanup EXIT

cd "$CLIENT_DIR" || exit 1
mkdir -p "$TARGET_DIR"
find "$TARGET_DIR" -mindepth 1 -maxdepth 1 -type d -name "*.cy.ts" -exec rm -rf {} +
rm -f "$TARGET_DIR"/*-20260326.png

CYPRESS_takeScreenshots=true npm test run

copied=0
while IFS= read -r -d '' screenshot_path; do
    cp "$screenshot_path" "$TARGET_DIR"/
    copied=$((copied + 1))
done < <(find "$TARGET_DIR" -path "*/user-manual/*" -type f \( -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' -o -name '*.webp' \) -print0)

if [ "$copied" -eq 0 ]; then
    echo "No docs screenshots were produced."
    exit 1
fi

(
    cd "$TARGET_DIR" || exit 1
    rm -f *-20260326.png
    for f in *.png; do
        [ -e "$f" ] || continue
        cp "$f" "${f%.png}-20260326.png"
    done
    "$postprocess_python" "$SCRIPT_DIR/postprocess_screenshots.py" *-20260326.png
    find . -maxdepth 1 -type f -name '*.png' ! -name '*-20260326.png' -delete
)

find "$TARGET_DIR" -mindepth 1 -maxdepth 1 -type d -name "*.cy.ts" -exec rm -rf {} +
trap - EXIT
cleanup
