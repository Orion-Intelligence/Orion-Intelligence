FROM python:3.12-slim@sha256:57cd7c3a7a273101a6485ba99423ee568157882804b1124b4dd04266317710de AS builder

WORKDIR /docs
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN if [ -d screenshots-neutral ] && ls screenshots-neutral/*.png >/dev/null 2>&1; then \
        cp -f screenshots-neutral/*.png screenshots/; \
    else \
        echo "WARNING: docs/screenshots-neutral missing/empty - self-hosted /documentation will ship REAL branded screenshots. Run docs/scripts/generate_docs.sh and commit docs/screenshots-neutral/." >&2; \
    fi
RUN ORION_DOCS_PUBLIC=1 sphinx-build -W --keep-going -b html . /site
RUN if [ -f /site/searchindex.js ]; then sed -i 's/Orion Intelligence/Threat Intelligence Platform/g; s/Orion/Threat Intelligence Platform/g; s/orion/threat intelligence platform/g' /site/searchindex.js; fi
RUN rm -f /site/_static/readme-*.svg

FROM nginx:alpine@sha256:4a73073bd557c65b759505da037898b61f1be6cbcc3c2c3aeac22d2a470c1752
COPY --from=builder /site /usr/share/nginx/html
