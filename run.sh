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

use_compose_file() {
  if [[ "$1" == "production" ]]; then
    COMPOSE_FILE="docker-compose-production.yml"
  else
    COMPOSE_FILE="docker-compose.yml"
  fi
}

stop_docker
if [ "$1" == "stop" ]; then
    echo "Crawler service stopped"
else
    configure_env
    COMMAND=$1
    SUBCOMMAND=$2

    if [[ "$COMMAND" == "build" ]]; then
        use_compose_file "$SUBCOMMAND"
        sleep 5
        docker compose -p $PROJECT_NAME -f $COMPOSE_FILE build
    elif [[ "$COMMAND" == "production" ]]; then
        use_compose_file "production"
    else
        use_compose_file "default"
    fi

    docker network create --driver bridge shared_bridge || true
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE up -d

    echo "Server started"
fi
