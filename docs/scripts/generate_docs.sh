#!/bin/bash
set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$DOCS_DIR/.." && pwd)"
CLIENT_DIR="$REPO_ROOT/client"
TARGET_DIR="$DOCS_DIR/screenshots"
TEMP_SPEC_REL="cypress/doc/tmp-user-manual-screenshots-docs-runner.cy.ts"
TEMP_SPEC_DIR="$CLIENT_DIR/cypress/doc"
TEMP_SPEC="$CLIENT_DIR/$TEMP_SPEC_REL"
NESTED_DIR="$TARGET_DIR/tmp-user-manual-screenshots-docs-runner.cy.ts"
LEGACY_NESTED_DIR="$TARGET_DIR/tmp-user-manual-screenshots-runner.cy.ts"
FRONTEND_URL="${DOC_FRONTEND_URL:-http://127.0.0.1:8080}"

clear_docs_screenshots() {
    rm -f "$TARGET_DIR"/*.png
    rm -f "$TARGET_DIR"/*.jpg
    rm -f "$TARGET_DIR"/*.jpeg
    rm -f "$TARGET_DIR"/*.webp
    rm -rf "$TARGET_DIR"/20-user-manual-screenshots-docs-runner.cy.ts
    rm -rf "$TARGET_DIR"/tmp-user-manual-screenshots-docs-runner.cy.ts
    rm -rf "$TARGET_DIR"/tmp-user-manual-screenshots-runner.cy.ts
}

cleanup() {
    rm -f "$TEMP_SPEC"
}

if [ "${1:-}" = "--clear" ]; then
    clear_docs_screenshots
    shift
fi

if [ "$#" -gt 0 ]; then
    echo "usage: $0 [--clear]"
    exit 1
fi

browser="${DOC_SCREENSHOT_BROWSER:-electron}"
chromium_binary=""

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

if [ -x "/snap/chromium/current/usr/lib/chromium-browser/chrome" ]; then
    chromium_binary="/snap/chromium/current/usr/lib/chromium-browser/chrome"
elif [ -x "/snap/chromium/3390/usr/lib/chromium-browser/chrome" ]; then
    chromium_binary="/snap/chromium/3390/usr/lib/chromium-browser/chrome"
fi

if [ -n "$chromium_binary" ]; then
    browser="$chromium_binary"
fi

trap cleanup EXIT

cd "$CLIENT_DIR" || exit 1
npm test -- run --browser electron --config "baseUrl=$FRONTEND_URL" --spec cypress/e2e/05-user-management.cy.ts
npm test -- run --browser electron --config "baseUrl=$FRONTEND_URL" --spec cypress/e2e/10-tenant-management.cy.ts
mkdir -p "$TARGET_DIR"
rm -rf "$NESTED_DIR"
rm -rf "$LEGACY_NESTED_DIR"
mkdir -p "$TEMP_SPEC_DIR"
cat > "$TEMP_SPEC" <<'EOF'
import '../../../docs/e2e/user-manual-screenshots.cy';
EOF

npm test -- run --browser "$browser" \
    --config "baseUrl=$FRONTEND_URL,specPattern=[\"cypress/e2e/**/*.cy.ts\",\"cypress/doc/**/*.cy.ts\"]" \
    --spec "$TEMP_SPEC_REL"
rm -f "$TEMP_SPEC"

find "$TARGET_DIR" -path "*/user-manual/*" -type f \( -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' -o -name '*.webp' \) -exec cp {} "$TARGET_DIR"/ \;
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
rm -rf "$NESTED_DIR"
rm -rf "$LEGACY_NESTED_DIR"
trap - EXIT
cleanup
