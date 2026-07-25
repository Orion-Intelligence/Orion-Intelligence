FROM python:3.12-slim AS builder

WORKDIR /docs
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN sphinx-build -W --keep-going -b html . /site
RUN find /site -type f \( -name '*.html' -o -name '*.js' -o -name '*.txt' \) \
    -exec sed -i \
    -e 's/Genesis Technologies/Platform Operator/g' \
    -e 's/Genessis Technologies/Platform Operator/g' \
    -e 's/Genesis/Platform Operator/g' \
    -e 's/Genessis/Platform Operator/g' \
    -e 's/Orion Intelligence/Platform/g' \
    -e 's/Orion/Platform/g' \
    -e 's#https://try\.orionintelligence\.org#configured production URL#g' \
    -e 's#/tmp/orion-docs-build#/tmp/platform-docs-build#g' \
    {} +

FROM nginx:alpine
COPY --from=builder /site /usr/share/nginx/html
