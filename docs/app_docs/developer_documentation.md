(developer-documentation)=
# Developer Documentation

:::{admonition} At a glance
:class: tip
This page documents **Orion Search**, plus related components (**Orion Crawler**, **Collector**, **Browser**) with a focus on:
- **What runs where** (services, ports, containers)
- **How to deploy** (local + Docker)
- **How to operate** (monitoring + troubleshooting)
:::

```{contents}
:local:
:depth: 3
```

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

Orion-Search utilizes the following key technologies and services:

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
| Web (Django) | API backend + cron | `trusted-web-main` | 8070 | App entrypoint (gunicorn/cron) |
| Elasticsearch | Search + indexing | `trusted-web-elastic` | 9400 | Single-node, persistent volume |
| Redis | Cache / queue | `trusted-web-redis` | (internal) | Password protected |
| MongoDB | Document DB | `trustly-web-mongodb` | 27020 | Secured access |
| NGINX | Reverse proxy | (varies) | 8080 | Serves static + routes |
| Traefik | Router / LB | (varies) | 9090 | Dashboard + routing |
| Swagger UI | API explorer | (varies) | 8082 | Public/internal depending on env |
| Dozzle | Logs UI | (varies) | (domain) | Real-time container logs |

:::{admonition} Tip
:class: tip
If your docs site feels “empty”, it’s usually because Sphinx **can’t discover pages** (missing `toctree`) even if the Markdown exists.
Make sure your `index.md` (or a section page) includes `toctree` entries that point to your docs files.
:::

---

## Environment Configuration

The `.env` file contains critical keys and configurations for the services.

:::{warning}
The credential values below were **redacted** for safety. Keep secrets out of documentation and out of git history.
Rotate any credential that was ever committed publicly.
:::

### Minimal safe template

:::{dropdown} Copy/paste template (redacted)
```dotenv
# Global
S_FERNET_KEY='<REDACTED>'
S_APP_BLOCK_KEY='<REDACTED>'
S_SUPER_PASSWORD='<REDACTED>'

# Elasticsearch
ELASTIC_ROOT_USERNAME='elastic'
ELASTIC_ROOT_PASSWORD='<REDACTED>'

# MongoDB
MONGO_ROOT_USERNAME='admin'
MONGO_ROOT_PASSWORD='<REDACTED>'
MONGO_DATABASE='trustly'

# Redis
REDIS_PASSWORD='<REDACTED>'

# Dozzle
DOZZLE_USERNAME=admin
DOZZLE_PASSWORD='<REDACTED>'

# Modes
API_SWAGGER="1"
PRODUCTION="0"
MAINTAINANCE="0"
PRODUCTION_DOMAIN=*
```
:::

---

## Docker Compose Services

The `docker-compose.yml` file defines the following services.

### Web

:::{admonition} Description
:class: note
Django-based backend service.
:::

- **Container Name**: `trusted-web-main`  
- **Build**: `dockerFiles/api_docker`  
- **Environment**: Configured via `.env` file  
- **Ports**: Exposed on **8070**  

:::{dropdown} Command
- Runs `gunicorn` server and cronjob manager.
:::

:::{dropdown} Operational notes
- Ensure `.env` exists **before** starting containers.
- If `collectstatic` is enabled, confirm volumes/paths for static assets match NGINX config.
:::

:::{dropdown} Key Features
- Collects static files in production.
- Runs Django cron jobs for scheduled tasks.
- Provides backend APIs for search functionality.
:::

---

### Run.sh

The `run.sh` file automates the process of starting the Orion system. It is typically used as the entry point script.

:::{dropdown} Contents
1. Ensures all services and configurations are properly initialized.
2. Runs Django migrations, collects static files, and starts the Gunicorn server.
3. Ensures the services are healthy before making them operational.
:::

**Usage**:

```bash
bash cronjobs.sh
```

**Purpose**:

- Automates system setup and initialization.
- Ensures the environment is ready for production or development.

---

### Elasticsearch

:::{admonition} Description
:class: note
Search engine and indexing service.
:::

- **Container Name**: `trusted-web-elastic`  
- **Image**: `elasticsearch:7.17.20`  
- **Ports**: Exposed on **9400**  
- **Environment**: Configured for single-node cluster.  
- **Volumes**: Persistent storage for Elasticsearch indices.  

:::{dropdown} Healthcheck
Checks cluster health.
:::

:::{dropdown} Key Features
- Full-text search and indexing.
- Optimized memory usage with JVM settings.
:::

---

### Redis

:::{admonition} Description
:class: note
In-memory data store for caching.
:::

- **Container Name**: `trusted-web-redis`  
- **Image**: `redis:7.4.0`  
- **Environment**: Password-protected access.  

:::{dropdown} Healthcheck
Verifies Redis is running.
:::

:::{dropdown} Key Features
- Caching layer to reduce database queries.
- Secured with authentication.
:::

---

### MongoDB

:::{admonition} Description
:class: note
Non-relational database for data storage.
:::

- **Container Name**: `trustly-web-mongodb`  
- **Image**: `mongo:latest`  
- **Ports**: Exposed on **27020**  
- **Environment**: Configured for secured access.  

:::{dropdown} Healthcheck
Verifies MongoDB connectivity.
:::

---

## Deployment

### Prerequisites

- Docker and Docker Compose installed.
- `.env` file configured with appropriate credentials.

### Steps to deploy

1. Clone the repository:
   ```bash
   git clone https://github.com/msmannan00/Orion-Search.git
   cd Orion-Search
   ```

2. Run the setup script:
   ```bash
   bash cronjobs.sh
   ```

3. Access the services:

:::{dropdown} Local URLs
- **Django Backend**: `http://localhost:8070`
- **Swagger UI**: `http://localhost:8082`
- **NGINX**: `http://localhost:8080`
- **Traefik Dashboard**: `http://localhost:9090`
- **Elasticsearch**: `http://localhost:9400`
- **Dozzle Logs**: `http://dozzle.localhost`
:::

:::{admonition} Recommended validation
:class: tip
After startup, confirm:
- web container is healthy / responding
- elastic cluster is green/yellow (not red)
- redis + mongodb accept authenticated connections
:::

---

## Monitoring

- Use **Dozzle** to monitor real-time logs of containers.
- Traefik's dashboard provides insights into routing and load balancing.

:::{dropdown} Common operational commands
```bash
# list containers
docker ps

# follow logs for the web container
docker logs -f trusted-web-main

# check elastic health (example)
curl -s http://localhost:9400/_cluster/health?pretty
```
:::

---

## Troubleshooting

:::{admonition} “Docs site shows only the index page”
:class: warning
This is almost always a **toctree discovery issue**. Ensure your `index.md` includes something like:
```{toctree}
:maxdepth: 2

app_docs/introduction_to_platform
app_docs/introduction_to_modules
app_docs/user_manual
app_docs/developer_documentation
api_docs/index
```
Then ensure the referenced files exist **relative to `docs/`** and omit file extensions (`.md`).
:::

:::{admonition} “Sphinx master_doc/index not found”
:class: warning
If Sphinx is looking for `index.rst` but you use Markdown, make sure:
- `master_doc = "index"`
- `source_suffix` includes `.md`
- `index.md` is inside the configured `docs/` source directory
:::

---

## Orion-Crawler Documentation

**Orion-Crawler** is a high-performance, multithreaded web crawler designed to automate the process of data collection,
particularly from Onion and other hidden networks. Built with Python, **Celery** for task distribution, and **TOR
proxies** for anonymity, it ensures scalable, distributed, and secure crawling.

### Architecture

:::{dropdown} Components (Python, Celery, Redis, MongoDB, TOR Network, Flower)
:open:
1. **Python**: Core programming language for crawling and data processing.
2. **Celery**: Task queue for parallelizing crawling jobs.
3. **Redis**: Backend for Celery task distribution and caching.
4. **MongoDB**: Stores raw crawled data.
5. **TOR Network**: Ensures crawling occurs anonymously over multiple TOR instances.
6. **Flower**: Monitoring and management tool for Celery workers.
:::

### Environment Configuration

```dotenv
S_FERNET_KEY='<REDACTED>'
S_APP_BLOCK_KEY='<REDACTED>'
REDIS_PASSWORD='<REDACTED>'
MONGO_ROOT_USERNAME='admin'
MONGO_ROOT_PASSWORD='<REDACTED>'
TOR_PASSWORD='<REDACTED>'
CELERY_WORKER_COUNT=30
FLOWER_USERNAME='admin'
FLOWER_PASSWORD='<REDACTED>'
```

### Docker Compose Services

:::{dropdown} Services summary
- **App (Crawler Service)**: `trusted-crawler-main` (runs `start_app.sh`)
- **API**: `trusted-crawler-api` (port **8000** internal)
- **Celery Worker**: `trusted-crawler-celery`
- **Flower**: `trusted-crawler-flower` (port **5555**)
- **Redis**: `trusted-crawler-redis`
- **MongoDB**: `trustly-crawler-mongodb` (port **27019**)
- **TOR Instances**: multiple `barneybuffet/tor:latest` instances
:::

---

## Orion-Collector Documentation

**Orion-Collector** is a modular data collection tool that simplifies the creation and execution of web crawling
scripts. The collector supports two primary crawling approaches:

1. **Shared Collector** (Static Crawling): Designed for websites with static content.
2. **Dynamic Collector** (Dynamic Crawling): Utilizes Selenium to interact with websites that require JavaScript
   rendering.

:::{important}
**Important**: Orion-Collector requires the **TOR Browser** to be running locally with its SOCKS5 proxy active.
:::

- **Default Proxy**: `socks5h://localhost:9150`.
- Start the TOR Browser before running Orion Collector to ensure anonymity.

### Key Components

:::{dropdown} Main Script (`main.py`)
Static Collector Example:
```python
from shared_collector.sample import sample

if __name__ == "__main__":
    url = "http://example.onion"
    html_content = get_html_via_tor(url)
    if html_content:
        parser = sample()
        data_model, sub_links = parser.parse_leak_data(html_content, url)
        print(data_model)
```
Dynamic Collector Example:
```python
from dynamic_collector.sample import sample

if __name__ == "__main__":
    url = "http://example.onion"
    sample_instance = sample()
    result = sample_instance.parse_leak_data(url, proxies={"http": "socks5://127.0.0.1:9150"})
    print(result)
```
:::

:::{dropdown} Parser Examples (`sample.py`)
Static parser:
```python
def parse_leak_data(self, html_content: str, p_data_url: str) -> Tuple[leak_data_model, Set[str]]:
    self.soup = BeautifulSoup(html_content, 'html.parser')
    cards_data = self.extract_cards(p_data_url)
    sub_links = self.extract_sub_links()
    return cards_data, sub_links
```
Dynamic parser:
```python
driver.get(p_data_url)
cards = driver.find_elements(By.CLASS_NAME, "card")
for card in cards:
    title = card.find_element(By.CLASS_NAME, "title").text
    url = card.find_element(By.CLASS_NAME, "url").get_attribute("href")
```
:::

---

## Orion-Browser Documentation

**Orion-Browser** is a native Android browser built with **Java** and **GeckoView** that integrates **Orbot** as a
library to route all browsing activity through the **Tor network**. This ensures anonymous and secure browsing,
particularly for accessing Onion websites.

### Prerequisites

- **Android Studio**: Required to open, build, and run the project.

### Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd Orion-Browser
   ```

2. Open in Android Studio:
    - Open the project folder using **Android Studio**.
    - Sync Gradle files when prompted.

3. Build and run:
    - Connect your Android device or emulator.
    - Click **Run** in Android Studio to launch the app.

:::{note}
The browser uses **Orbot** as an integrated library. There is no need to install Orbot separately.
:::

### Key Features

- **Tor Integration**: Orbot is integrated directly into the app as a library for seamless Tor network connectivity.
- **GeckoView**: Utilizes GeckoView (Mozilla's engine) for modern and reliable web rendering.
- **Easy Setup**: Simply build and start the app without additional configuration or external installations.

### Notes

- **Automatic Tor Connectivity**: The browser handles all proxy routing through the Tor network automatically using Orbot libraries.
- **Customizations**: Modify the project using Android Studio to add features as needed.

This page ends here (no trailing transition).
