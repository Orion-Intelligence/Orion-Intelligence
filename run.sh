#!/bin/bash

PROJECT_NAME="trusted-search"

stop_docker() {
    docker compose -p $PROJECT_NAME down --remove-orphans
    rm -rf staticfiles
}

#configure_env() {
#  PRODUCTION=$(grep '^PRODUCTION=' .env | cut -d '=' -f2 | tr -cd '[:digit:]')
#
#  if [ "$PRODUCTION" = "1" ]; then
#    cp nginx/nginx-prod.conf nginx/nginx.conf
##    update_swagger_config "orion.genesistechnologies.org" "https"
#  elif [ "$PRODUCTION" = "0" ]; then
#    cp nginx/nginx-dev.conf nginx/nginx.conf
#    update_swagger_config "localhost:8080" "http"
#  else
#    echo "Invalid PRODUCTION value in .env. Defaulting to development."
#    update_swagger_config "localhost:8080" "http"
#  fi
#}

use_compose_file() {
  if [[ "$1" == "production" ]]; then
    COMPOSE_FILE="docker-compose-production.yml"
  else
    COMPOSE_FILE="docker-compose.yml"
  fi
}

#update_swagger_config() {
#  HOST=$1
#  SCHEME=$2
#  SWAGGER_FILE="swagconfig/swagconfig.json"
#
#  if [ -f "$SWAGGER_FILE" ]; then
#    echo "Updating Swagger configuration with host: $HOST and schemes: $SCHEME"
#    sed -i "s/\"host\": \".*\"/\"host\": \"$HOST\"/" "$SWAGGER_FILE"
#    sed -i "s/\"schemes\": \[.*\]/\"schemes\": [\"$SCHEME\"]/" "$SWAGGER_FILE"
#  else
#    echo "Swagger configuration file not found: $SWAGGER_FILE"
#    exit 1
#  fi
#}

stop_docker
if [ "$1" == "stop" ]; then
    echo "Crawler service stopped"
else
#    configure_env
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
    docker compose -p $PROJECT_NAME -f $COMPOSE_FILE up
    docker exec -it trusted-web-main /bin/sh -c "python manage.py migrate"

    echo "Server started"
fi
