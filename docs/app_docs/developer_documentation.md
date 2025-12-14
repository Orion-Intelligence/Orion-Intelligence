(developer-documentation)=
# Developer Documentation

:::{admonition} At a glance
:class: tip

This page documents **Orion Search**, plus related components (**Orion Crawler**, **Collector**, **Browser**) with a focus on:

- **What runs where** (services, ports, containers)
- **How to deploy** (local + Docker)
- **How to operate** (monitoring + troubleshooting)
:::

---

## Orion Search Documentation

**Orion-Search** is a Docker-based search engine platform that visualizes and searches data collected from various
sources. Built on top of **Django** and **Elasticsearch**, it provides efficient search, advanced filtering, and
customizable parsers. It also leverages **Redis** for caching, **MongoDB** for data storage, and **NGINX** for reverse
proxy, with **Traefik** for load balancing.

:::{admonition} Quick start (local)
:class: note

1. Configure your `.env` file (keep secrets out of git).
2. Run setup/start:

   ```bash
   bash cronjobs.sh
   ```

3. Open the services (see **Local URLs** under Deployment).
:::

---

## Architecture

:::{dropdown} Components overview
:open:

1. **Django**: Backend framework for managing APIs, data processing, and cron jobs.
2. **Elasticsearch**: Search and indexing service for real-time data retrieval.
3. **Redis**: In-memory caching for improved performance.
4. **MongoDB**: Database for storing non-relational data.
5. **NGINX**: Reverse proxy for serving static files and managing requests.
6. **Swagger UI**: API documentation interface.
7. **Traefik**: Load balancer and router.
8. **Dozzle**: Log viewer for monitoring container logs.
:::

### Service matrix

| Service | Role | Container | Default port(s) | Notes |
|---|---|---:|---:|---|
| Web (Django) | API backend + cron | `trusted-web-main` | 8070 | App entrypoint |
| Elasticsearch | Search + indexing | `trusted-web-elastic` | 9400 | Single-node |
| Redis | Cache | `trusted-web-redis` | internal | Auth enabled |
| MongoDB | Document DB | `trustly-web-mongodb` | 27020 | Secured |
| NGINX | Reverse proxy | varies | 8080 | Static + routing |
| Traefik | Router | varies | 9090 | Dashboard |
| Swagger UI | API docs | varies | 8082 | Optional |
| Dozzle | Logs | varies | domain | Monitoring |

---

## Environment Configuration

:::{warning}
Credentials are redacted. Never commit secrets to git.
:::

```dotenv
S_FERNET_KEY='<REDACTED>'
ELASTIC_ROOT_USERNAME='elastic'
ELASTIC_ROOT_PASSWORD='<REDACTED>'
REDIS_PASSWORD='<REDACTED>'
```

---

## Deployment

### Prerequisites
- Docker
- Docker Compose
- Configured `.env` file

### Steps

```bash
git clone https://github.com/msmannan00/Orion-Search.git
cd Orion-Search
bash cronjobs.sh
```

---

## Monitoring

- Dozzle for logs
- Traefik dashboard for routing

---

## Troubleshooting

:::{admonition} Sidebar not expanding?
:class: tip

The left sidebar expands **only for child pages defined in a `toctree`**, not for headings inside one page.
Split sections into multiple files if you want expandable navigation.
:::
