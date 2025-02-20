#!/bin/bash

PROJECT_NAME="trusted-search"

stop_docker() {
    docker compose -p "$PROJECT_NAME" down --remove-orphans
    rm -rf staticfiles
}

create_parser_zip() {
    PARSER_DIR="backend/static/.well-known/parser"
    OUTPUT_DIR="backend/static/.well-known"
    ZIP_FILE="$OUTPUT_DIR/parser_files.zip"
    if [ -d "$PARSER_DIR" ]; then
        echo "Creating $ZIP_FILE..."
        [ -f "$ZIP_FILE" ] && rm -f "$ZIP_FILE"
        (cd "$PARSER_DIR" && zip -r "../parser_files.zip" .)
        echo "$ZIP_FILE created successfully in $OUTPUT_DIR."
    else
        echo "Directory $PARSER_DIR does not exist."
    fi
}

client_build() {
    cd client || exit
    npm run build
    cd ..
}

use_compose_file() {
    if [[ "$1" == "production" ]]; then
        COMPOSE_FILE="docker-compose-production.yml"
    else
        COMPOSE_FILE="docker-compose.yml"
    fi
}

stop_docker
create_parser_zip

if [ "$1" == "stop" ]; then
    echo "Crawler service stopped"
else
    COMMAND=$1
    FLAG=$2

    if [[ "$COMMAND" == "build" ]]; then
        docker pull python:3.11-slim
        docker volume prune -f

        case "$FLAG" in
            -c)
                client_build
                cp nginx/nginx-dev.conf nginx/nginx.conf
                use_compose_file "default"
                ;;
            -b)
                cp nginx/nginx-dev.conf nginx/nginx.conf
                use_compose_file "default"
                ;;
            -d)
                client_build
                cp nginx/nginx-dev.conf nginx/nginx.conf
                use_compose_file "default"
                ;;
            -p)
                use_compose_file "production"
                cp nginx/nginx-prod.conf nginx/nginx.conf
                ;;
            *)
                exit 1
                ;;
        esac

        docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" build
    elif [[ "$COMMAND" == "production" ]]; then
        use_compose_file "production"
    else
        use_compose_file "default"
    fi

    docker network create --driver bridge shared_bridge || true
    docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" up -d
    echo "Server started"
fi