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
FRONTEND_HOST="${DOC_FRONTEND_HOST:-127.0.0.1}"
FRONTEND_PORT="${DOC_FRONTEND_PORT:-4200}"
FRONTEND_URL="http://$FRONTEND_HOST:$FRONTEND_PORT"
FRONTEND_LOG="$CLIENT_DIR/.ng-serve.log"
FRONTEND_PID_FILE="$CLIENT_DIR/.ng-serve-docs.pid"
STARTED_FRONTEND=0

clear_docs_screenshots() {
    rm -f "$TARGET_DIR"/*.png
    rm -f "$TARGET_DIR"/*.jpg
    rm -f "$TARGET_DIR"/*.jpeg
    rm -f "$TARGET_DIR"/*.webp
    rm -rf "$TARGET_DIR"/20-user-manual-screenshots-docs-runner.cy.ts
    rm -rf "$TARGET_DIR"/tmp-user-manual-screenshots-docs-runner.cy.ts
    rm -rf "$TARGET_DIR"/tmp-user-manual-screenshots-runner.cy.ts
}

frontend_ready() {
    curl -fsS "$FRONTEND_URL/" >/dev/null 2>&1
}

start_frontend_server() {
    if frontend_ready; then
        return 0
    fi

    if [ ! -x "$CLIENT_DIR/node_modules/.bin/ng" ]; then
        npm --prefix "$CLIENT_DIR" install
    fi

    echo "Starting Angular dev server on $FRONTEND_URL"
    (
        cd "$CLIENT_DIR" || exit 1
        if command -v setsid >/dev/null 2>&1; then
            setsid npx ng serve --host "$FRONTEND_HOST" --port "$FRONTEND_PORT" --allowed-hosts all --proxy-config proxy.conf.json > "$FRONTEND_LOG" 2>&1 < /dev/null &
        else
            nohup npx ng serve --host "$FRONTEND_HOST" --port "$FRONTEND_PORT" --allowed-hosts all --proxy-config proxy.conf.json > "$FRONTEND_LOG" 2>&1 < /dev/null &
        fi
        echo "$!" > "$FRONTEND_PID_FILE"
    )
    STARTED_FRONTEND=1
}

wait_for_frontend_server() {
    echo "Waiting for Angular dev server on $FRONTEND_URL"
    for _ in $(seq 1 90); do
        if frontend_ready; then
            return 0
        fi
        sleep 2
    done

    echo "Angular dev server did not become ready. Last frontend log lines:"
    tail -60 "$FRONTEND_LOG" 2>/dev/null || true
    exit 1
}

stop_frontend_server() {
    if [ "$STARTED_FRONTEND" != "1" ] || [ ! -f "$FRONTEND_PID_FILE" ]; then
        return 0
    fi

    local pid
    pid="$(cat "$FRONTEND_PID_FILE" 2>/dev/null || true)"
    rm -f "$FRONTEND_PID_FILE"
    if [ -n "$pid" ]; then
        kill -TERM "-$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true
    fi
}

cleanup() {
    rm -f "$TEMP_SPEC"
    stop_frontend_server
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
start_frontend_server
wait_for_frontend_server

cd "$CLIENT_DIR" || exit 1
npm test -- run --browser electron --config "baseUrl=$FRONTEND_URL" --spec cypress/e2e/05-user-management.cy.ts
npm test -- run --browser electron --config "baseUrl=$FRONTEND_URL" --spec cypress/e2e/08-tenant-management.cy.ts
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
