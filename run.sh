#!/bin/bash
set -e
set -o pipefail

PROJECT_NAME="trusted-search"
ENV_FILE=".env"

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
    if [ "$1" = "-t" ]; then
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
    local url="http://127.0.0.1:8080"
    until curl -s -o /dev/null "$url"; do
        sleep 2
    done
}

run_test_task() {
    cd client || exit
    npm test run
    cd ..
    exit 0
}

set_testing_enabled() {
    sed -i '/^TESTING_ENABLED=/d' "$ENV_FILE" 2>/dev/null || true
    if [ "$1" = "-t" ]; then
        echo 'TESTING_ENABLED="1"' >> "$ENV_FILE"
    else
        echo 'TESTING_ENABLED="0"' >> "$ENV_FILE"
    fi
}

stop_docker

if [ "$1" = "stop" ]; then
    echo "Orion Intelligence service stopped"
    exit 0
fi

create_parser_zip

COMMAND=$1
FLAG=$2

set_testing_enabled "$FLAG"

if [ "$COMMAND" = "build" ]; then
    docker pull python:3.11-slim
    npm --prefix client run lint

    case "$FLAG" in
        -t)
            client_build "-t"
            cp nginx/nginx-dev.conf nginx/nginx.conf
            use_compose_file "-t"
            ;;
        -c)
            client_build "$FLAG"
            cp nginx/nginx-dev.conf nginx/nginx.conf
            use_compose_file "default"
            ;;
        -b)
            cp nginx/nginx-dev.conf nginx/nginx.conf
            use_compose_file "default"
            ;;
        -d)
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

    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" build

elif [ "$COMMAND" = "production" ]; then
    use_compose_file "production"
else
    use_compose_file "default"
fi

docker network create --driver bridge shared_bridge 2>/dev/null || true
docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" up

if [ "$COMMAND" = "build" ] && [ "$FLAG" = "-p" ]; then
    wait_for_server
fi

if [ "$COMMAND" = "build" ] && [ "$FLAG" = "-t" ]; then
    wait_for_test_service
fi
