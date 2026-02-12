#!/bin/sh
set -e

ARANGO_CONTAINER="trusted-web-arangodb"
MONGO_CONTAINER="trustly-web-mongodb"

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
PARENT_DIR="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PARENT_DIR/.env"

ARANGO_OUT_DIR="$PARENT_DIR/backend/static/test/mocks/arango"
MONGO_OUT_DIR="$PARENT_DIR/backend/static/test/mocks/mongo"
ELASTIC_OUT_DIR="$PARENT_DIR/backend/static/test/mocks/elastic"

ARANGO_DB_NAME="orion-web"
MONGO_DB_NAME="orion-web"
ELASTIC_BASE="http://127.0.0.1:9400"

start_services() {
  cd "$PARENT_DIR"
  ./run.sh
}

read_env() {
  ARANGO_USERNAME="$(grep -E '^ARANGO_USERNAME=' "$ENV_FILE" | tail -n 1 | cut -d= -f2- | tr -d "\"'")"
  ARANGO_PASSWORD="$(grep -E '^ARANGO_PASSWORD=' "$ENV_FILE" | tail -n 1 | cut -d= -f2- | tr -d "\"'")"
  MONGO_ROOT_USERNAME="$(grep -E '^MONGO_ROOT_USERNAME=' "$ENV_FILE" | tail -n 1 | cut -d= -f2- | tr -d "\"'")"
  MONGO_ROOT_PASSWORD="$(grep -E '^MONGO_ROOT_PASSWORD=' "$ENV_FILE" | tail -n 1 | cut -d= -f2- | tr -d "\"'")"
  ELASTIC_ROOT_USERNAME="$(grep -E '^ELASTIC_ROOT_USERNAME=' "$ENV_FILE" | tail -n 1 | cut -d= -f2- | tr -d "\"'")"
  ELASTIC_ROOT_PASSWORD="$(grep -E '^ELASTIC_ROOT_PASSWORD=' "$ENV_FILE" | tail -n 1 | cut -d= -f2- | tr -d "\"'")"

  [ -z "$ARANGO_USERNAME" ] && ARANGO_USERNAME="root"
  [ -z "$ARANGO_PASSWORD" ] && exit 1
  [ -z "$MONGO_ROOT_USERNAME" ] && MONGO_ROOT_USERNAME="admin"
  [ -z "$MONGO_ROOT_PASSWORD" ] && exit 1

  if [ -n "$ELASTIC_ROOT_USERNAME" ] && [ -n "$ELASTIC_ROOT_PASSWORD" ]; then
    ES_AUTH="-u ${ELASTIC_ROOT_USERNAME}:${ELASTIC_ROOT_PASSWORD}"
  else
    ES_AUTH=""
  fi
}

wait_services() {
  until curl -fsS http://127.0.0.1:8529/_admin/server/availability >/dev/null 2>&1; do sleep 2; done
  until docker exec "$MONGO_CONTAINER" mongosh --quiet --eval 'db.runCommand({ping:1}).ok' >/dev/null 2>&1; do sleep 2; done
  until curl -fsS http://127.0.0.1:9400/_cluster/health >/dev/null 2>&1; do sleep 2; done
}

prepare_dirs() {
  rm -rf "$ARANGO_OUT_DIR" "$MONGO_OUT_DIR" "$ELASTIC_OUT_DIR"
  mkdir -p "$ARANGO_OUT_DIR" "$MONGO_OUT_DIR" "$ELASTIC_OUT_DIR"
}

export_arango() {
  docker exec "$ARANGO_CONTAINER" sh -lc 'rm -rf /tmp/arango_dump && mkdir -p /tmp/arango_dump'
  docker exec "$ARANGO_CONTAINER" arangodump \
    --server.endpoint tcp://127.0.0.1:8529 \
    --server.username "$ARANGO_USERNAME" \
    --server.password "$ARANGO_PASSWORD" \
    --server.database "$ARANGO_DB_NAME" \
    --include-system-collections true \
    --compress-output false \
    --output-directory /tmp/arango_dump
  docker cp "$ARANGO_CONTAINER":/tmp/arango_dump/. "$ARANGO_OUT_DIR"
}

export_mongo() {
  COLS="$(docker exec "$MONGO_CONTAINER" mongosh --quiet \
    --username "$MONGO_ROOT_USERNAME" \
    --password "$MONGO_ROOT_PASSWORD" \
    --authenticationDatabase admin \
    --eval "db.getSiblingDB('$MONGO_DB_NAME').getCollectionNames().join(' ')")"

  for c in $COLS; do
    docker exec "$MONGO_CONTAINER" mongoexport \
      --username "$MONGO_ROOT_USERNAME" \
      --password "$MONGO_ROOT_PASSWORD" \
      --authenticationDatabase admin \
      --db "$MONGO_DB_NAME" \
      --collection "$c" \
      --jsonArray \
      --out "/tmp/${MONGO_DB_NAME}.${c}.json"
    docker cp "$MONGO_CONTAINER":"/tmp/${MONGO_DB_NAME}.${c}.json" "$MONGO_OUT_DIR/${MONGO_DB_NAME}.${c}.json"
    docker exec "$MONGO_CONTAINER" sh -lc "rm -f '/tmp/${MONGO_DB_NAME}.${c}.json'"
  done
}

export_elastic() {
  command -v jq >/dev/null 2>&1 || exit 1

  INDICES="$(curl -fsS $ES_AUTH "$ELASTIC_BASE/_cat/indices?h=index" | awk 'NF && $1 !~ /^\./ {print $1}')"

  for idx in $INDICES; do
    curl -fsS $ES_AUTH "$ELASTIC_BASE/$idx/_mapping" > "$ELASTIC_OUT_DIR/${idx}.mapping.json"
    curl -fsS $ES_AUTH "$ELASTIC_BASE/$idx/_settings" > "$ELASTIC_OUT_DIR/${idx}.settings.json"

    fp="$ELASTIC_OUT_DIR/${idx}.data.ndjson"
    : > "$fp"

    resp="$(curl -fsS $ES_AUTH -H 'Content-Type: application/json' -XPOST "$ELASTIC_BASE/$idx/_search?scroll=2m" \
      -d '{"size":1000,"sort":["_doc"],"query":{"match_all":{}}}')"

    scroll_id="$(printf '%s' "$resp" | jq -r '._scroll_id // empty')"
    printf '%s' "$resp" | jq -c --arg idx "$idx" '.hits.hits[] | {"_index":$idx,"_id":._id,"_source":._source}' >> "$fp"
    n="$(printf '%s' "$resp" | jq -r '.hits.hits|length')"

    while [ "$n" -gt 0 ]; do
      resp="$(curl -fsS $ES_AUTH -H 'Content-Type: application/json' -XPOST "$ELASTIC_BASE/_search/scroll" \
        -d "{\"scroll\":\"2m\",\"scroll_id\":\"$scroll_id\"}")"
      scroll_id="$(printf '%s' "$resp" | jq -r '._scroll_id // empty')"
      printf '%s' "$resp" | jq -c --arg idx "$idx" '.hits.hits[] | {"_index":$idx,"_id":._id,"_source":._source}' >> "$fp"
      n="$(printf '%s' "$resp" | jq -r '.hits.hits|length')"
    done

    [ -n "$scroll_id" ] && curl -fsS $ES_AUTH -H 'Content-Type: application/json' -XDELETE "$ELASTIC_BASE/_search/scroll" \
      -d "{\"scroll_id\":[\"$scroll_id\"]}" >/dev/null 2>&1 || true
  done
}

start_services
read_env
wait_services
prepare_dirs
export_arango
export_mongo
export_elastic

find "$ARANGO_OUT_DIR" "$MONGO_OUT_DIR" "$ELASTIC_OUT_DIR" -type f -name '*.gz' -delete
