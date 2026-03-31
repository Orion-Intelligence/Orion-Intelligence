#!/bin/bash
set -e
set -o pipefail

PROJECT_NAME="trusted-search"
ENV_FILE=".env"
LOCAL_SSL_DIR="backend/.ssl"
LOCAL_SSL_CERT="$LOCAL_SSL_DIR/localhost-cert.pem"
LOCAL_SSL_KEY="$LOCAL_SSL_DIR/localhost-key.pem"

stop_docker() {
    docker compose -p "$PROJECT_NAME" down --remove-orphans
    rm -rf staticfiles
    docker stop trusted-web-nginx 2>/dev/null || true
    docker rm trusted-web-nginx 2>/dev/null || true
}

create_parser_zip() {
    PARSER_DIR="backend/static/.well-known/parser_files"
    OUTPUT_DIR="backend/static/.well-known"
    ZIP_FILE="$OUTPUT_DIR/parser_files.zip"
    if ! command -v zip &> /dev/null; then
        echo "Error: 'zip' command not found. Please install 'zip' and try again."
        exit 1
    fi
    [ -f "$ZIP_FILE" ] && rm -f "$ZIP_FILE"
    if [ -d "$PARSER_DIR" ]; then
        (cd "$PARSER_DIR" && zip -r "../parser_files.zip" .) || exit 1
    fi
}

ensure_local_ssl_cert() {
    mkdir -p "$LOCAL_SSL_DIR"
    if [ -f "$LOCAL_SSL_CERT" ] && [ -f "$LOCAL_SSL_KEY" ]; then
        return 0
    fi

    openssl req -x509 -newkey rsa:2048 -nodes \
        -keyout "$LOCAL_SSL_KEY" \
        -out "$LOCAL_SSL_CERT" \
        -days 365 \
        -subj "/CN=localhost"
}

client_build() {
    cd client || exit
        npm install
    npm run lint
    rm -rf build
    if [ "$1" = "-t" ]; then
        npx ng build --configuration instrumented
    else
        npx ng build --configuration production
    fi
    test -d build
    cd ..
    rm -rf backend/build
    mkdir -p backend/build
    cp -r client/build/* backend/build/
}

use_compose_file() {
    if [ "$1" = "-t" ] || [ "$1" = "-tb" ]; then
        COMPOSE_FILE="docker-compose-testing.yml"
    elif [ "$1" = "production" ]; then
        COMPOSE_FILE="docker-compose-production.yml"
    else
        COMPOSE_FILE="docker-compose.yml"
    fi
}

wait_for_server() {
    local url="https://try.orionintelligence.org"
    until curl -s -o /dev/null "$url"; do
        sleep 2
    done
    sudo systemctl restart tor@default
}

wait_for_test_service() {
    local url="http://127.0.0.1:8080/api/public"
    echo "Waiting for test service to become ready..."
    until curl -fsS -o /dev/null "$url" >/dev/null 2>&1; do
        sleep 2
    done
}

run_backend_tests_protected() {
    if [ "${SKIP_BACKEND_TESTS:-0}" = "1" ]; then
        echo "Skipping backend tests because SKIP_BACKEND_TESTS=1"
        return 0
    fi

    local test_timeout="${BACKEND_TEST_TIMEOUT:-1800}"
    local pytest_cmd='cd /app && python -m pytest -q tests --maxfail=1 --disable-warnings'

    echo "Running backend tests in isolated protected test container..."
    if command -v timeout >/dev/null 2>&1; then
        timeout "$test_timeout" docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" run --rm --no-deps -T \
            -e TESTING_ENABLED=1 -e PYTHONPATH=/app web sh -lc "$pytest_cmd"
    else
        docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" run --rm --no-deps -T \
            -e TESTING_ENABLED=1 -e PYTHONPATH=/app web sh -lc "$pytest_cmd"
    fi
}

run_test_task() {
    cd client || exit
    npm test run
    cd ..
    exit 0
}

clear_docs_screenshots() {
    local target_dir="docs/screenshots"
    rm -f "$target_dir"/*.png
    rm -f "$target_dir"/*.jpg
    rm -f "$target_dir"/*.jpeg
    rm -f "$target_dir"/*.webp
    rm -rf "$target_dir"/20-user-manual-screenshots-docs-runner.cy.ts
    rm -rf "$target_dir"/tmp-user-manual-screenshots-docs-runner.cy.ts
    rm -rf "$target_dir"/tmp-user-manual-screenshots-runner.cy.ts
}

generate_docs() {
    local target_dir="../docs/screenshots"
    local browser="${DOC_SCREENSHOT_BROWSER:-electron}"
    local temp_spec_dir="cypress/doc"
    local temp_spec="$temp_spec_dir/tmp-user-manual-screenshots-docs-runner.cy.ts"
    local nested_dir="$target_dir/tmp-user-manual-screenshots-docs-runner.cy.ts"
    local legacy_nested_dir="$target_dir/tmp-user-manual-screenshots-runner.cy.ts"
    local postprocess_python="python3"
    local chromium_binary=""

    if [ -x "/tmp/codex-tts-venv/bin/python" ]; then
        postprocess_python="/tmp/codex-tts-venv/bin/python"
    fi

    if [ "$postprocess_python" = "python3" ]; then
        python3 -m pip install --quiet Pillow
    fi

    if [ -x "/snap/chromium/current/usr/lib/chromium-browser/chrome" ]; then
        chromium_binary="/snap/chromium/current/usr/lib/chromium-browser/chrome"
    elif [ -x "/snap/chromium/3390/usr/lib/chromium-browser/chrome" ]; then
        chromium_binary="/snap/chromium/3390/usr/lib/chromium-browser/chrome"
    fi

    if [ -n "$chromium_binary" ]; then
        browser="$chromium_binary"
    fi

    cd client || exit
    npm test -- run --browser electron --config baseUrl="http://127.0.0.1:8080" --spec cypress/e2e/08-tenant-management.cy.ts
    mkdir -p "$target_dir"
    rm -rf "$nested_dir"
    rm -rf "$legacy_nested_dir"
    mkdir -p "$temp_spec_dir"
    cat > "$temp_spec" <<'EOF'
import '../../../docs/e2e/user-manual-screenshots.cy';
EOF

    trap 'rm -f "$temp_spec"' EXIT
    npm test -- run --browser "$browser" \
        --config 'baseUrl=http://127.0.0.1:8080,specPattern=["cypress/e2e/**/*.cy.ts","cypress/doc/**/*.cy.ts"]' \
        --spec "$temp_spec"
    rm -f "$temp_spec"
    trap - EXIT

    find "$target_dir" -path "*/user-manual/*" -type f \( -name '*.png' -o -name '*.jpg' -o -name '*.jpeg' -o -name '*.webp' \) -exec cp {} "$target_dir"/ \;
    (
        cd "$target_dir" || exit 1
        rm -f *-20260326.png
        for f in *.png; do
            [ -e "$f" ] || continue
            cp "$f" "${f%.png}-20260326.png"
        done
        "$postprocess_python" ../scripts/postprocess_screenshots.py *-20260326.png
        find . -maxdepth 1 -type f -name '*.png' ! -name '*-20260326.png' -delete
    )
    rm -rf "$nested_dir"
    rm -rf "$legacy_nested_dir"

    cd ..
}

set_testing_enabled() {
    sed -i '/^TESTING_ENABLED=/d' "$ENV_FILE" 2>/dev/null || true
    if [ "$1" = "-t" ] || [ "$1" = "-tb" ]; then
        echo 'TESTING_ENABLED="1"' >> "$ENV_FILE"
    else
        echo 'TESTING_ENABLED="0"' >> "$ENV_FILE"
    fi
}

set_swarm_url_to_local_ip() {
    local local_ip
    local_ip="$(hostname -I | awk '{print $1}')"
    sed -i '/^SWARM_URL=/d' "$ENV_FILE" 2>/dev/null || true
    echo "SWARM_URL=http://$local_ip:5132" >> "$ENV_FILE"
}

if [ "$1" = "-ip" ]; then
    set_swarm_url_to_local_ip
    shift
fi

if [ "$1" = "stop" ]; then
    stop_docker
    echo "Orion Intelligence service stopped"
    exit 0
fi

if [ "$1" = "-doc" ]; then
    "$0" build -t
    clear_docs_screenshots
    generate_docs
    exit 0
fi

if [ "$1" = "-docs" ]; then
    "$0" build -t
    generate_docs
    exit 0
fi

stop_docker

create_parser_zip

COMMAND=$1
FLAG=$2

set_testing_enabled "$FLAG"

if [ "$COMMAND" = "build" ]; then
    docker pull python:3.11-slim
    npm --prefix client install
    npm --prefix client run lint

    case "$FLAG" in
        -t)
            client_build "-t"
            cp nginx/nginx-dev.conf nginx/nginx.conf
            use_compose_file "-t"
            ;;
        -tb)
            client_build "-t"
            cp nginx/nginx-dev.conf nginx/nginx.conf
            use_compose_file "-tb"
            ;;
        -c)
            client_build "$FLAG"
            cp nginx/nginx-dev.conf nginx/nginx.conf
            use_compose_file "default"
            ;;
        -b)
            set_swarm_url_to_local_ip
            ensure_local_ssl_cert
            cp nginx/nginx-dev-ssl.conf nginx/nginx.conf
            use_compose_file "default"
            ;;
        -d)
            set_swarm_url_to_local_ip
            ensure_local_ssl_cert
            client_build "$FLAG"
            cp nginx/nginx-dev-ssl.conf nginx/nginx.conf
            use_compose_file "default"
            ;;
        -p)
            client_build "$FLAG"
            use_compose_file "production"
            cp nginx/nginx-prod.conf nginx/nginx.conf
            sudo mkdir -p /srv/elasticsearch/data
            sudo chown -R 1000:1000 /srv/elasticsearch/data
            export ELASTIC_ROOT_IP="37.27.128.168"
            ;;
        *)
            echo "Unknown build flag: $FLAG"
            exit 1
            ;;
    esac

    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" build

elif [ "$COMMAND" = "production" ]; then
    use_compose_file "production"
else
    use_compose_file "default"
fi

docker network create --driver bridge shared_bridge 2>/dev/null || true
docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" up -d

if [ "$COMMAND" = "build" ] && [ "$FLAG" = "-p" ]; then
    wait_for_server
fi

if [ "$COMMAND" = "build" ] && { [ "$FLAG" = "-t" ] || [ "$FLAG" = "-tb" ]; }; then
    wait_for_test_service
fi

if [ "$COMMAND" = "build" ] && [ "$FLAG" = "-tb" ]; then
    run_backend_tests_protected
fi
