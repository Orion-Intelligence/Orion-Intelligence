#!/bin/bash

PROJECT_NAME="trusted-search"

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
    ng build --configuration production
    cd ..
    rm -rf backend/build
    mkdir -p backend/build
    cp -r client/build/* backend/build/
}

use_compose_file() {
    if [ "$1" = "production" ]; then
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

run_test_task() {
    local url="http://127.0.0.1:8080"
    until curl -s -o /dev/null "$url"; do
        sleep 2
    done
    cd client || exit
    npm test run
    cd ..
    exit 0
}

stop_docker

if [ "$1" = "stop" ]; then
    exit 0
fi

create_parser_zip

COMMAND=$1
FLAG=$2

if [ "$COMMAND" = "build" ] && [ "$FLAG" = "-t" ]; then
    export TESTTING_ENABLED="1"
else
    export TESTTING_ENABLED="0"
fi

if [ "$COMMAND" = "build" ]; then
    docker pull python:3.11-slim
    docker volume prune -f

    case "$FLAG" in
        -c|-b|-d|-t)
            [ "$FLAG" != "-b" ] && client_build "$FLAG"
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
            exit 1
            ;;
    esac

    TESTING_ENABLED="$TESTTING_ENABLED" docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" build

    [ "$FLAG" = "-t" ] && run_test_task
elif [ "$COMMAND" = "production" ]; then
    use_compose_file "production"
else
    use_compose_file "default"
fi

docker network create --driver bridge shared_bridge 2>/dev/null || true
TESTTING_ENABLED="$TESTTING_ENABLED" docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" up -d

[ "$COMMAND" = "build" ] && [ "$FLAG" = "-p" ] && wait_for_server
