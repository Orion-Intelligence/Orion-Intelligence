FROM python:3.12-slim AS builder

WORKDIR /docs
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN sphinx-build -W --keep-going -b html . /site

ARG DOCUMENTATION_PROJECT_NAME=Platform
ARG DOCUMENTATION_COMPANY_NAME="Platform Operator"
RUN python replace_branding.py \
    /site \
    "$DOCUMENTATION_PROJECT_NAME" \
    "$DOCUMENTATION_COMPANY_NAME"

FROM nginx:alpine
COPY --from=builder /site /usr/share/nginx/html
