FROM python:3.12-slim@sha256:57cd7c3a7a273101a6485ba99423ee568157882804b1124b4dd04266317710de AS builder

WORKDIR /docs
COPY requirements.txt .
RUN pip install --no-cache-dir --require-hashes -r requirements.txt
COPY . .
RUN ORION_DOCS_PUBLIC=1 sphinx-build -W --keep-going -b html . /site

ARG DOCUMENTATION_PROJECT_NAME=Platform
ARG DOCUMENTATION_COMPANY_NAME="Platform Operator"
RUN python replace_branding.py \
    /site \
    "$DOCUMENTATION_PROJECT_NAME" \
    "$DOCUMENTATION_COMPANY_NAME"

FROM nginx:alpine@sha256:4a73073bd557c65b759505da037898b61f1be6cbcc3c2c3aeac22d2a470c1752
COPY --from=builder /site /usr/share/nginx/html
