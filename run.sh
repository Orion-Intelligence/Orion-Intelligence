#!/bin/bash

PROJECT_NAME="trusted-web-main"

stop_docker() {
    docker compose -p "$PROJECT_NAME" down --remove-orphans
    rm -rf staticfiles
    docker stop trusted-web-nginx 2>/dev/null || true
    docker rm trusted-web-nginx 2>/dev/null || true
}

create_parser_zip() {
    PARSER_DIR="backend/static/.well-known/parser"
    OUTPUT_DIR="backend/static/.well-known"
    ZIP_FILE="$OUTPUT_DIR/parser_files.zip"
    if ! command -v zip &> /dev/null; then
        echo "Error: 'zip' command not found. Please install 'zip' and try again."
        exit 1
    fi
    if [ -d "$PARSER_DIR" ]; then
        [ -f "$ZIP_FILE" ] && rm -f "$ZIP_FILE"
        (cd "$PARSER_DIR" && zip -r "../parser_files.zip" .) || exit 1
    fi
}

client_build() {
    cd client || exit
    npm install
    if [ "$1" = "-p" ]; then
        ng build --configuration production
    else
        ng build --configuration production
    fi
    cd ..
}

use_compose_file() {
    if [ "$1" = "production" ]; then
        COMPOSE_FILE="docker-compose-production.yml"
    else
        COMPOSE_FILE="docker-compose.yml"
    fi
}

# --- MAIN LOGIC ---

stop_docker

if [ "$1" = "stop" ]; then
    echo "Crawler service stopped"
    exit 0
fi

create_parser_zip

COMMAND=$1
FLAG=$2

if [ "$COMMAND" = "build" ]; then
    docker pull python:3.11-slim
    docker volume prune -f

    case "$FLAG" in
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
echo "Server started"
