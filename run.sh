#!/bin/bash
set -e
set -o pipefail

PROJECT_NAME="trusted-search"
ENV_FILE=".env"
LOCAL_SSL_DIR="backend/.ssl"
LOCAL_SSL_CERT="$LOCAL_SSL_DIR/localhost-cert.pem"
LOCAL_SSL_KEY="$LOCAL_SSL_DIR/localhost-key.pem"
MAINTENANCE_FLAG="backend/static/.maintenance"

stop_docker() {
    docker compose -p "$PROJECT_NAME" down --remove-orphans
    rm -rf staticfiles
    docker stop trusted-web-nginx 2>/dev/null || true
    docker rm trusted-web-nginx 2>/dev/null || true
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
    rm -rf build-next
    if [ "$1" = "-t" ]; then
        npx ng build --configuration instrumented --output-path build-next
    else
        npx ng build --configuration production --output-path build-next
    fi
    test -d build-next
    mkdir -p build
    rsync -a build-next/ build/
    rm -rf build-next
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
    local url="http://127.0.0.1/"
    local status
    until status="$(curl -s -o /dev/null -w '%{http_code}' "$url" 2>/dev/null)" \
        && { [ "$status" = "200" ] || [ "$status" = "301" ] || [ "$status" = "302" ] || [ "$status" = "503" ]; }; do
        sleep 2
    done
    sudo systemctl restart tor@default
}

enable_maintenance_mode() {
    touch "$MAINTENANCE_FLAG"
}

disable_maintenance_mode() {
    rm -f "$MAINTENANCE_FLAG"
}

wait_for_test_service() {
    local url="https://127.0.0.1:8443/api/public"
    echo "Waiting for test service to become ready..."
    until curl -fksS -o /dev/null "$url" >/dev/null 2>&1; do
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

    if [[ "$(uname)" == "Darwin" ]]; then
        local_ip="$(ipconfig getifaddr en0 || ipconfig getifaddr en1)"
    else
        local_ip="$(hostname -I | awk '{print $1}')"
    fi
    
    if [[ -z "$local_ip" ]]; then
        local_ip="$(ifconfig | awk '/inet / && $2 != "127.0.0.1" {print $2; exit}')"
    fi

    sed -i.bak '/^SWARM_URL=/d' "$ENV_FILE" 2>/dev/null || true
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
    bash docs/scripts/generate_docs.sh --clear
    exit 0
fi

if [ "$1" = "-docs" ]; then
    "$0" build -t
    bash docs/scripts/generate_docs.sh
    exit 0
fi

COMMAND=$1
FLAG=$2
EXTRA_FLAG=$3

if [ "$COMMAND" != "build" ] || [ "$FLAG" != "-p" ]; then
    stop_docker
fi

set_testing_enabled "$FLAG"

if [ "$COMMAND" = "build" ]; then
    if [ "$FLAG" = "-p" ]; then
        enable_maintenance_mode
    fi

    docker pull python:3.11-slim
    npm --prefix client install
    npm --prefix client run lint

    case "$FLAG" in
        -t)
            ensure_local_ssl_cert
            client_build "-t"
            cp nginx/nginx-testing.conf nginx/nginx.conf
            use_compose_file "-t"
            ;;
        -tb)
            ensure_local_ssl_cert
            client_build "-t"
            cp nginx/nginx-testing.conf nginx/nginx.conf
            use_compose_file "-tb"
            ;;
        -c)
            ensure_local_ssl_cert
            client_build "$FLAG"
            cp nginx/nginx-dev.conf nginx/nginx.conf
            use_compose_file "default"
            ;;
        -b)
            set_swarm_url_to_local_ip
            ensure_local_ssl_cert
            cp nginx/nginx-dev.conf nginx/nginx.conf
            use_compose_file "default"
            ;;
        -d)
            set_swarm_url_to_local_ip
            ensure_local_ssl_cert
            client_build "$FLAG"
            cp nginx/nginx-dev.conf nginx/nginx.conf
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

    if [ "$COMPOSE_FILE" = "docker-compose.yml" ]; then
        docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" build web
    else
        docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" build
    fi

elif [ "$COMMAND" = "production" ]; then
    use_compose_file "production"
else
    use_compose_file "default"
fi

docker network create --driver bridge shared_bridge 2>/dev/null || true
compose_up_args=(-d)
compose_up_services=()

if [ "$COMPOSE_FILE" = "docker-compose.yml" ]; then
    compose_up_services=(web nginx)
fi

if [ "$COMMAND" = "build" ] && [ "$FLAG" = "-p" ] && [ "$EXTRA_FLAG" = "-full" ]; then
    compose_up_args+=(--force-recreate)
fi

if [ "$COMMAND" = "build" ] && [ "$FLAG" = "-p" ]; then
    if [ ! -f client/build/assets/data/map/world.json ]; then
        echo "Missing client/build/assets/data/map/world.json"
        exit 1
    fi
fi

docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" up "${compose_up_args[@]}" "${compose_up_services[@]}"

if [ "$COMMAND" = "build" ] && [ "$FLAG" = "-p" ]; then
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" exec -T nginx nginx -t
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" exec -T nginx nginx -s reload
    wait_for_server
    disable_maintenance_mode
fi

if [ "$COMMAND" = "build" ] && { [ "$FLAG" = "-t" ] || [ "$FLAG" = "-tb" ]; }; then
    wait_for_test_service
fi

if [ "$COMMAND" = "build" ] && [ "$FLAG" = "-tb" ]; then
    run_backend_tests_protected
fi
