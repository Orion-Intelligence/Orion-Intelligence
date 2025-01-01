#!/bin/bash

PROJECT_NAME="trusted-search"

stop_docker() {
    docker compose -p $PROJECT_NAME down --remove-orphans
}

configure_env() {
  PRODUCTION=$(grep '^PRODUCTION=' .env | cut -d '=' -f2 | tr -cd '[:digit:]')

  if [ "$PRODUCTION" = "1" ]; then
    cp nginx/nginx-prod.conf nginx/nginx.conf
  elif [ "$PRODUCTION" = "0" ]; then
    cp nginx/nginx-dev.conf nginx/nginx.conf
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
    echo "crawler service stopped"
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
    docker exec -it trusted-web-main /bin/sh -c "python manage.py migrate"
    echo "server started"
fi
