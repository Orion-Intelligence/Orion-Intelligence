#!/bin/bash

PROJECT_NAME="trusted-search"

stop_docker() {
    docker compose -p $PROJECT_NAME down --remove-orphans
    rm -rf staticfiles
}

configure_env() {
  PRODUCTION=$(grep '^PRODUCTION=' .env | cut -d '=' -f2 | tr -cd '[:digit:]')

  if [ "$PRODUCTION" = "1" ]; then
    cp nginx/nginx-prod.conf nginx/nginx.conf
    find static/ -type f -name "*.html" -o -name "*.css" -o -name "*.js" -o -name "*.json" | while read file; do gzip -9 -c "$file" > "$file.gz"; done
    find static/ -type f -name "*.html" -o -name "*.css" -o -name "*.js" -o -name "*.json" | while read file; do brotli -9 -c "$file" > "$file.br"; done

  elif [ "$PRODUCTION" = "0" ]; then
    cp nginx/nginx-dev.conf nginx/nginx.conf
  else
    echo "Invalid PRODUCTION value in .env. Defaulting to development."
  fi
}

create_parser_zip() {
    PARSER_DIR="backend/static/trustly/.well-known/parser"
    OUTPUT_DIR="backend/static/trustly/.well-known"
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
    configure_env
    COMMAND=$1
    SUBCOMMAND=$2

    if [[ "$COMMAND" == "build" ]]; then
        docker pull python:3.11-slim
        docker volume prune -f
        use_compose_file "$SUBCOMMAND"
        sleep 5
        docker compose -p $PROJECT_NAME -f $COMPOSE_FILE build
    elif [[ "$COMMAND" == "production" ]]; then
        use_compose_file "production"
    else
        use_compose_file "default"
    fi

    docker network create --driver bridge shared_bridge || true
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE up
    echo "Server started"
fi
