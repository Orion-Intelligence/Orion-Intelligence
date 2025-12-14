(developer-documentation)=
# Developer Documentation

:::{warning}
This page previously included **real credentials** in examples. They are **redacted** here.
If these were ever committed publicly, **rotate all secrets immediately** and purge them from git history.
:::

## Orion Search Documentation

**Orion-Search** is a Docker-based search engine platform that visualizes and searches data collected from various
sources. Built on top of **Django** and **Elasticsearch**, it provides efficient search, advanced filtering, and
customizable parsers. It also leverages **Redis** for caching, **MongoDB** for data storage, and **NGINX** for reverse
proxy, with **Traefik** for load balancing.

---

## Architecture

Orion-Search utilizes the following key technologies and services:

1. **Django**: Backend framework for managing APIs, data processing, and cron jobs.
2. **Elasticsearch**: Search and indexing service for real-time data retrieval.
3. **Redis**: In-memory caching for improved performance.
4. **MongoDB**: Database for storing non-relational data.
5. **NGINX**: Reverse proxy for serving static files and managing requests.
6. **Swagger UI**: API documentation interface.
7. **Traefik**: Load balancer and router.
8. **Dozzle**: Log viewer for monitoring container logs.

---

## Environment Configuration

The `.env` file contains critical keys and configurations for the services:

### Global Keys

```plaintext
S_FERNET_KEY='<REDACTED>'
S_APP_BLOCK_KEY='<REDACTED>'
S_SUPER_PASSWORD='<REDACTED>'
```

### Elasticsearch Keys

```plaintext
ELASTIC_ROOT_USERNAME='elastic'
ELASTIC_ROOT_PASSWORD='<REDACTED>'
```

### MongoDB Keys

```plaintext
MONGO_ROOT_USERNAME='admin'
MONGO_ROOT_PASSWORD='<REDACTED>'
MONGO_DATABASE='trustly'
```

### Redis Keys

```plaintext
REDIS_PASSWORD='<REDACTED>'
```

### Logs

```plaintext
DOZZLE_USERNAME=admin
DOZZLE_PASSWORD='<REDACTED>'
```

### System Modes

```plaintext
API_SWAGGER="1"
PRODUCTION="0"
MAINTAINANCE="0"
PRODUCTION_DOMAIN=*
```

---

## Docker Compose Services

The `docker-compose.yml` file defines the following services:

### 1. **Web**

**Description**: Django-based backend service.  
**Container Name**: `trusted-web-main`  
**Build**: `dockerFiles/api_docker`  
**Environment**: Configured via `.env` file  
**Ports**: Exposed on **8070**  
**Command**:

- Runs `gunicorn` server and cronjob manager.

**Key Features**:

- Collects static files in production.
- Runs Django cron jobs for scheduled tasks.
- Provides backend APIs for search functionality.

---

### 2. **Run.sh**

The `run.sh` file automates the process of starting the Orion system. It is typically used as the entry point script.

**Contents**:

1. Ensures all services and configurations are properly initialized.
2. Runs Django migrations, collects static files, and starts the Gunicorn server.
3. Ensures the services are healthy before making them operational.

**Usage**:

```bash
bash cronjobs.sh
```

**Purpose**:

- Automates system setup and initialization.
- Ensures the environment is ready for production or development.

---

### 3. **Elasticsearch**

**Description**: Search engine and indexing service.  
**Container Name**: `trusted-web-elastic`  
**Image**: `elasticsearch:7.17.20`  
**Ports**: Exposed on **9400**  
**Environment**: Configured for single-node cluster.  
**Volumes**: Persistent storage for Elasticsearch indices.  
**Healthcheck**: Checks cluster health.

**Key Features**:

- Full-text search and indexing.
- Optimized memory usage with JVM settings.

---

### 4. **Redis**

**Description**: In-memory data store for caching.  
**Container Name**: `trusted-web-redis`  
**Image**: `redis:7.4.0`  
**Environment**: Password-protected access.  
**Healthcheck**: Verifies Redis is running.

**Key Features**:

- Caching layer to reduce database queries.
- Secured with authentication.

---

### 5. **MongoDB**

**Description**: Non-relational database for data storage.  
**Container Name**: `trustly-web-mongodb`  
**Image**: `mongo:latest`  
**Ports**: Exposed on **27020**  
**Environment**: Configured for secured access.  
**Healthcheck**: Verifies MongoDB connectivity.

---

## Deployment

### Prerequisites

- Docker and Docker Compose installed.
- `.env` file configured with appropriate credentials.

### Steps to Deploy

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
    - **Django Backend**: `http://localhost:8070`
    - **Swagger UI**: `http://localhost:8082`
    - **NGINX**: `http://localhost:8080`
    - **Traefik Dashboard**: `http://localhost:9090`
    - **Elasticsearch**: `http://localhost:9400`
    - **Dozzle Logs**: `http://dozzle.localhost`

---

## Monitoring

- Use **Dozzle** to monitor real-time logs of containers.
- Traefik's dashboard provides insights into routing and load balancing.

---

## Notes

- **Health Checks**: Services include health checks for reliability and automated restarts.
- **Static Files**: Managed via Django and NGINX for optimized delivery.
- **Scalability**: Traefik enables scaling by load balancing across containers.
- **Run.sh**: Simplifies deployment and system initialization.

---

## Orion-Crawler Documentation

**Orion-Crawler** is a high-performance, multithreaded web crawler designed to automate the process of data collection,
particularly from Onion and other hidden networks. Built with Python, **Celery** for task distribution, and **TOR
proxies** for anonymity, it ensures scalable, distributed, and secure crawling.

---

## Architecture

Orion-Crawler integrates the following components and technologies:

1. **Python**: Core programming language for crawling and data processing.
2. **Celery**: Task queue for parallelizing crawling jobs.
3. **Redis**: Backend for Celery task distribution and caching.
4. **MongoDB**: Stores raw crawled data.
5. **TOR Network**: Ensures crawling occurs anonymously over multiple TOR instances.
6. **Flower**: Monitoring and management tool for Celery workers.

---

## Environment Configuration

The `.env` file contains critical keys for secure and efficient operation:

### General Keys

```plaintext
S_FERNET_KEY='<REDACTED>'
S_APP_BLOCK_KEY='<REDACTED>'
REDIS_PASSWORD='<REDACTED>'
```

### MongoDB Keys

```plaintext
MONGO_ROOT_USERNAME='admin'
MONGO_ROOT_PASSWORD='<REDACTED>'
```

### TOR Keys

```plaintext
TOR_PASSWORD='<REDACTED>'
```

### Celery Keys

```plaintext
CELERY_WORKER_COUNT=30
```

### Flower Keys

```plaintext
FLOWER_USERNAME='admin'
FLOWER_PASSWORD='<REDACTED>'
```

---

## Docker Compose Services

The `docker-compose.yml` defines the following services:

### 1. **App (Crawler Service)**

**Description**: Main crawler service responsible for crawling and data extraction.  
**Container Name**: `trusted-crawler-main`  
**Build**: `dockerFiles/app_docker`  
**Depends On**: MongoDB, Redis, and TOR proxies.  
**Environment**: Configured via `.env` file.  
**Command**:  
Runs the crawler entrypoint script `start_app.sh`.

**Key Features**:

- Executes crawling jobs using multithreading.
- Handles data storage into MongoDB.
- Maintains scalability through Celery task queues.

---

### 2. **API**

**Description**: Exposes a RESTful API to interact with crawler results.  
**Container Name**: `trusted-crawler-api`  
**Build**: `dockerFiles/api_docker`  
**Ports**: Runs on port **8000** internally.  
**Healthcheck**: Verifies connectivity to the API endpoint.

**Key Features**:

- Allows querying of crawled data.
- Manages API requests efficiently.

---

### 3. **Celery Worker**

**Description**: Task queue worker for executing crawl tasks.  
**Container Name**: `trusted-crawler-celery`  
**Command**:

```bash
celery -A crawler.crawler_services.celery_manager worker --loglevel=DEBUG --concurrency=${CELERY_WORKER_COUNT}
```

**Key Features**:

- Processes crawl tasks asynchronously.
- Distributes workload among workers.

---

### 4. **Flower**

**Description**: Celery monitoring tool to observe task execution.  
**Container Name**: `trusted-crawler-flower`  
**Ports**: Exposed on **5555**.  
**Key Features**:

- Monitors Celery worker status.
- Provides an intuitive dashboard for managing tasks.

---

### 5. **Redis**

**Description**: In-memory task queue and cache.  
**Container Name**: `trusted-crawler-redis`  
**Image**: `redis:7.4.0`  
**Environment**: Password-protected access.

---

### 6. **MongoDB**

**Description**: Database for storing crawled data.  
**Container Name**: `trustly-crawler-mongodb`  
**Ports**: Exposed on **27019**.  
**Command**: Initializes MongoDB with root credentials.

---

### 7. **TOR Instances**

**Description**: Multiple TOR proxies for anonymous crawling.  
**Images**: `barneybuffet/tor:latest`  
**Ports**: Configured for each instance with separate ports (e.g., 9152, 9153).  
**Healthcheck**: Verifies TOR proxy connectivity.

**Key Features**:

- Ensures anonymity through TOR proxy routing.
- Runs up to **10 TOR instances** for load balancing.

---

## Run.sh Script

The `run.sh` script automates the startup of the Orion-Crawler system. It performs the following tasks:

1. Starts essential services (MongoDB, Redis, and TOR instances).
2. Launches Celery workers and the Flower monitoring dashboard.
3. Ensures the main crawler app and API are operational.

**Usage**:

```bash
bash cronjobs.sh
```

**Purpose**:

- Simplifies deployment.
- Ensures all dependencies and services start in the correct sequence.

---

## Requirements

The `requirements.txt` file lists dependencies needed for the crawler:

- **Celery**: Distributed task execution.
- **TOR**: Anonymous browsing via Stem and PySocks.
- **MongoDB**: Data persistence through `pymongo`.
- **Elasticsearch**: Integration for indexing results.
- **Numpy/Pandas**: Data manipulation.
- **Scikit-learn/Gensim**: Machine learning utilities for content extraction.

---

## Deployment

### Prerequisites

- Docker and Docker Compose installed.
- `.env` file configured with appropriate credentials.

### Steps to Deploy

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd Orion-Crawler
   ```

2. Run the setup script:
   ```bash
   bash cronjobs.sh
   ```

3. Access the services:
    - **API**: `http://localhost:8000`
    - **Flower Dashboard**: `http://localhost:5555`
    - **MongoDB**: Accessible on `27019`.

---

## Monitoring

- **Flower**: Monitor task execution and worker status at `http://localhost:5555`.
- **TOR Health**: Each TOR instance includes health checks for proxy connectivity.

---

## Notes

- **Anonymity**: TOR instances ensure anonymous crawling.
- **Scalability**: Celery allows adding more workers to handle large-scale crawling.
- **Performance**: Redis optimizes task queue management and data caching.

---

## Orion-Collector Documentation

**Orion-Collector** is a modular data collection tool that simplifies the creation and execution of web crawling
scripts. The collector supports two primary crawling approaches:

1. **Shared Collector** (Static Crawling): Designed for websites with static content.
2. **Dynamic Collector** (Dynamic Crawling): Utilizes Selenium to interact with websites that require JavaScript
   rendering.

---

## Workflow

The Orion-Collector workflow is straightforward, allowing developers to add new crawling scripts with minimal effort.
The process is as follows:

1. **Shared Collector**:
    - Add the target **URL** to the **`main.py`** file.
    - Modify the static parsing script (`sample.py`) to define how data should be extracted.

2. **Dynamic Collector**:
    - Write a Selenium-based crawling script for the target website.
    - Replace the base URL string with the actual URL being worked on.

3. **Pull Request**:
    - Rename the modified script file with the **host URL** of the target website.
    - Create a pull request for review and integration into the main repository.

---

## TOR Browser Requirement

**Important**: Orion-Collector requires the **TOR Browser** to be running locally with its SOCKS5 proxy active.

- **Default Proxy**: `socks5h://localhost:9150`.
- Start the TOR Browser before running Orion Collector to ensure anonymity.

---

## Key Components

### 1. **Main Script (`main.py`)**

The **`main.py`** file serves as the entry point for Orion Collector. Developers add the target URL here and specify the
type of collector.

#### Static Collector Example (Shared Collector)

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

- **Purpose**: Fetches the target page using TOR and passes the HTML to the `sample.py` parser.

#### Dynamic Collector Example

```python
from dynamic_collector.sample import sample

if __name__ == "__main__":
    url = "http://example.onion"
    sample_instance = sample()
    result = sample_instance.parse_leak_data(url, proxies={"http": "socks5://127.0.0.1:9150"})
    print(result)
```

- **Purpose**: Uses Selenium to load JavaScript-rendered pages via TOR proxies.

---

### 2. **Static Parser (`sample.py`)**

The `sample.py` script extracts data from static pages using **BeautifulSoup**.

**Example**:

```python
def parse_leak_data(self, html_content: str, p_data_url: str) -> Tuple[leak_data_model, Set[str]]:
    self.soup = BeautifulSoup(html_content, 'html.parser')
    cards_data = self.extract_cards(p_data_url)
    sub_links = self.extract_sub_links()
    return cards_data, sub_links
```

- Parses cards, sub-links, and content sections.

---

### 3. **Dynamic Parser (`sample.py`)**

The dynamic parser uses **Selenium** to interact with JavaScript-heavy pages.

**Example**:

```python
driver.get(p_data_url)
cards = driver.find_elements(By.CLASS_NAME, "card")
for card in cards:
    title = card.find_element(By.CLASS_NAME, "title").text
    url = card.find_element(By.CLASS_NAME, "url").get_attribute("href")
```

- Extracts data by interacting with page elements.

---

## Steps to Add a New Collector

Follow these steps to integrate a new website:

1. **Add URL**: Update the `main.py` file with the target URL.
2. **Static Collector**: Modify the `sample.py` script under `shared_collector`.
3. **Dynamic Collector**: Write a Selenium script under `dynamic_collector`. Replace placeholders with actual page
   elements.
4. **Rename Script**: Save the script with the **host URL** as the filename.
5. **Submit Pull Request**:
    - Commit changes with a descriptive message.
    - Submit a pull request for review.

**Example**: If working on `example.onion`, save the script as `example_onion.py`.

---

## Deployment

### Prerequisites

- **TOR Browser** running locally with SOCKS5 proxy (`localhost:9150`).
- Docker and Docker Compose installed (optional).

### Steps to Deploy

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd Orion-Collector
   ```

2. Start the collector:
   ```bash
   python main.py
   ```

3. Monitor progress and logs.

---

## Notes

- **Static Collectors**: Use **BeautifulSoup** for HTML parsing.
- **Dynamic Collectors**: Use **Selenium** for sites requiring JavaScript rendering.
- **TOR Integration**: Ensures anonymity when accessing target websites.
- **Pull Requests**: Always include a renamed sample script file with the host URL.

---

## Example Workflow

### Shared Collector

1. Add URL to `main.py`.
2. Modify `sample.py` under `shared_collector`.
3. Run `python main.py`.

### Dynamic Collector

1. Add URL to `main.py`.
2. Write Selenium script under `dynamic_collector/sample.py`.
3. Replace base URL placeholders with actual URLs.
4. Run `python main.py`.

---

## Orion-Browser Documentation

**Orion-Browser** is a native Android browser built with **Java** and **GeckoView** that integrates **Orbot** as a
library to route all browsing activity through the **Tor network**. This ensures anonymous and secure browsing,
particularly for accessing Onion websites.

---

## Prerequisites

1. **Android Studio**: Required to open, build, and run the project.

---

## Setup Instructions

1. **Clone the Repository**:
   ```bash
   git clone <repo-url>
   cd Orion-Browser
   ```

2. **Open in Android Studio**:
    - Open the project folder using **Android Studio**.
    - Sync Gradle files when prompted.

3. **Build and Run**:
    - Connect your Android device or emulator.
    - Click **Run** in Android Studio to launch the app.

**Note**: The browser uses **Orbot** as an integrated library. There is no need to install Orbot separately.

---

## Key Features

- **Tor Integration**: Orbot is integrated directly into the app as a library for seamless Tor network connectivity.
- **GeckoView**: Utilizes GeckoView (Mozilla's engine) for modern and reliable web rendering.
- **Easy Setup**: Simply build and start the app without additional configuration or external installations.

---

## Notes

- **Automatic Tor Connectivity**: The browser handles all proxy routing through the Tor network automatically using
  Orbot libraries.
- **Customizations**: Modify the project using Android Studio to add features as needed.

---

---

:::{admonition} Note on sidebar expand/collapse
:class: tip

The left sidebar only expands for **child pages listed in a `toctree`**. Headings (`##`, `###`) inside this single page
do **not** become expandable sidebar items. If you want expandable navigation, split this document into multiple `.md`
files and reference them from your `index.md` (or a section page) using `toctree`.
:::