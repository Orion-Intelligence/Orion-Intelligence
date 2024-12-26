#!/bin/bash

PROJECT_NAME="trusted-search"
stop_docker() {
    docker compose -p $PROJECT_NAME down --remove-orphans
}

configure_env(){
  PRODUCTION=$(grep '^PRODUCTION=' .env | cut -d '=' -f2 | tr -cd '[:digit:]')

  if [ "$PRODUCTION" = "1" ]; then
    cp nginx/nginx-prod.conf nginx/nginx.conf
  elif [ "$PRODUCTION" = "0" ]; then
    cp nginx/nginx-dev.conf nginx/nginx.conf
  fi
}

stop_docker
if [ "$1" == "stop" ]; then
    echo "crawler service stopped"
else
    configure_env
    if [ "$1" == "build" ]; then
        sleep 5
        docker compose -p $PROJECT_NAME build
    fi

    docker compose -p $PROJECT_NAME up
    docker exec -it trusted-web-main /bin/sh -c "python manage.py migrate"
    echo "server started"
fi

