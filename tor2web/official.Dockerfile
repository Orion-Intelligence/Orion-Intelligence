FROM debian:bullseye-slim

ARG DEBIAN_FRONTEND=noninteractive
ARG TOR2WEB_REF=734416e960e4e0fb2bdb5ba3fa22fd80ee2982a6

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    git \
    openssl \
    python3 \
    python3-cryptography \
    python3-openssl \
    python3-pip \
    python3-pyasn1 \
    python3-service-identity \
    python3-setuptools \
    python3-twisted \
    python3-transaction \
    python3-zope.interface \
    tor \
 && pip3 install --no-cache-dir parsley \
 && rm -rf /var/lib/apt/lists/*

COPY tor2web/patch_t2w.py /tmp/patch_t2w.py

RUN git clone https://github.com/tor2web/Tor2web /opt/tor2web \
 && cd /opt/tor2web \
 && git checkout "${TOR2WEB_REF}" \
 && python3 /tmp/patch_t2w.py \
 && rm -f /tmp/patch_t2w.py \
 && python3 setup.py install \
 && mkdir -p /usr/share/tor2web \
 && cp -R /opt/tor2web/data /usr/share/tor2web/data

COPY tor2web/tor2web.conf /etc/tor2web.conf

RUN mkdir -p /var/lib/tor2web/logs /var/lib/tor2web/certs /var/run/tor2web
RUN openssl req -x509 -nodes -newkey rsa:2048 \
    -keyout /var/lib/tor2web/certs/tor2web-key.pem \
    -out /var/lib/tor2web/certs/tor2web-cert.pem \
    -days 3650 \
    -subj "/CN=tor2web.local" \
 && cp /var/lib/tor2web/certs/tor2web-cert.pem /var/lib/tor2web/certs/tor2web-intermediate.pem

WORKDIR /opt/tor2web

CMD ["sh", "-lc", "mkdir -p /var/lib/tor2web/logs /var/lib/tor2web/certs /var/run/tor2web && test -s /var/lib/tor2web/certs/tor2web-key.pem && test -s /var/lib/tor2web/certs/tor2web-cert.pem && exec python3 /opt/tor2web/bin/tor2web -n -c /etc/tor2web.conf"]
