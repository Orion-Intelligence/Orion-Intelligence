# Introduction To Modules

## Introduction

This documentation provides an extensive overview of our Data Intelligence Platform, a comprehensive suite of tools and
services designed to streamline the process of discovering, collecting, indexing, and analyzing data from various open,
deep, and dark web sources. The platform is divided into two major sections:

- **Active Intelligence:** Focused on proactive data collection, indexing, and visualization using automated crawlers,
  search infrastructure, and integrated browser technology.
- **Passive Intelligence:** Geared towards whistle-blowing and anonymous data submission capabilities, leveraging
  established open-source frameworks for secure and anonymous reporting.

Each component within these sections plays a unique role, contributing to the platform’s overarching goal: enabling
researchers, OSINT (Open Source Intelligence) analysts, investigative journalists, and developers to efficiently gather
actionable intelligence from difficult-to-access sources.

---

## Active Intelligence

### Overview

Active Intelligence encompasses a set of tools that actively reach out to hidden, multilayered web services, crawl their
content, and present that data for indexing, analysis, and visualization. These tools are designed to operate in tandem,
forming an integrated pipeline where data flows from initial discovery, through processing and indexing, to final
visualization.

**Key Highlights:**

- Automated, intelligent crawling of hidden services (Onion, I2P, etc.)
- Machine learning-driven data extraction and classification
- High-performance indexing and search capabilities
- Seamless integration for custom data collection scripts
- Browser-based exploration with built-in anonymity features

The Active Intelligence suite is composed of four main submodules:

1. **Orion Crawler**
2. **Orion Search**
3. **Orion Browser**
4. **Orion Collector**

---

### Orion Crawler

**Purpose:**  
The Orion Crawler is the starting point of the active intelligence pipeline. Its primary role is to automatically
navigate through various hidden and anonymous networks (like Onion and I2P), scraping raw data from websites and forums
that are not easily accessible by conventional search engines.

**Key Features:**

- **Multithreading:** Implements Python’s concurrency capabilities and Celery distributed task queue to handle multiple
  crawl tasks in parallel, improving efficiency and throughput.
- **Machine Learning Integration:** Utilizes ML-based classification models to filter relevant content, prioritize
  high-value targets, and adaptively refine crawl strategies over time.
- **Scalable Architecture:** Easily add more workers to the Celery queue to handle increased crawling demands.
- **Modular Design:** Pluggable components allow for integration with different data sources and protocols beyond Onion
  and I2P (e.g., ZeroNet, Freenet).

**Technology Stack:**

- **Language & Framework:** Python + Celery
- **Data Storage:** Initial raw data dumps to local or distributed storage (e.g., AWS S3, MinIO, or local filesystem)
- **ML Models:** Python-based (TensorFlow/PyTorch/Scikit-learn) classification and entity extraction models

**Workflow:**

1. **Target Seed Input:** Provide a list of seed URLs or services.
2. **Distributed Task Queue:** Orion Crawler workers fetch tasks from the Celery queue.
3. **Content Extraction:** The crawler retrieves HTML, images, documents, or other file types.
4. **ML-driven Filtering:** Extracted content runs through ML models for classification, relevance scoring, and entity
   extraction.
5. **Storage & Indexing Prep:** Cleaned, structured data is stored for indexing by Orion Search.

---

### Orion Search

**Purpose:**  
Orion Search provides a powerful, fast, and scalable search interface on top of the collected and processed data. By
leveraging the indexing capabilities of Elasticsearch, it allows users to quickly query, filter, and visualize insights
from massive datasets.

**Key Features:**

- **High-Performance Indexing:** Swift ingestion of data from Orion Crawler’s output into Elasticsearch indices.
- **Advanced Querying:** Support for full-text search, keyword queries, fuzzy matches, and complex Boolean queries.
- **Faceted Navigation:** Drill down through content by tags, categories, timeframes, or any metadata field.
- **Data Visualization:** Integration with Kibana or custom dashboards for charts, graphs, and timeline views.

**Technology Stack:**

- **Search Engine:** Elasticsearch
- **Indexing Connectors:** Python-based indexing scripts that batch-process crawler output.
- **Visualization:** Kibana or custom front-end interfaces.

**Workflow:**

1. **Ingestion:** Processed data from Orion Crawler is fed into Elasticsearch.
2. **Index Refresh:** Automated index refresh intervals ensure newly ingested data is queryable with minimal delay.
3. **Query & Analysis:** Users or downstream systems query Elasticsearch for specific intelligence needs.
4. **Visualization:** Results can be displayed in interactive dashboards or integrated into analytical workflows.

---

### Orion Browser

**Purpose:**  
The Orion Browser is a specialized Android-based browser designed to function as a data harvester. While Orion Crawler
proactively fetches data programmatically, Orion Browser complements this by allowing human-driven navigation. As an
analyst browses through target websites, Orion Browser automatically indexes and scrapes encountered data, creating a
feedback loop for more in-depth exploration.

**Key Features:**

- **Android-Native Integration:** Built with Kotlin and Java, utilizing Orbot libraries for Tor network integration to
  maintain anonymity.
- **Automated Harvesting:** As the analyst navigates the site, Orion Browser extracts content, metadata, and structural
  information behind the scenes.
- **Seamless Indexing:** Harvested data is sent back to the indexing pipeline for subsequent searching and analysis.
- **Customizable Plugins:** Extend functionality through custom plugins for additional data extraction techniques or
  browser automation.

**Technology Stack:**

- **Platform:** Android
- **Languages:** Kotlin, Java
- **Privacy & Anonymity:** Orbot integration to route traffic through Tor
- **Data Extraction:** Local scraping tools integrated into the browser’s rendering engine

**Workflow:**

1. **Analyst Browsing:** User navigates dark web marketplaces, forums, or hidden services using the Orion Browser.
2. **Real-Time Extraction:** Each visited page is scraped, text and metadata are extracted.
3. **Metadata Packaging:** Structured content is packaged and securely sent to the indexing pipeline.
4. **Index Integration:** The newly harvested data appears in Orion Search after re-indexing, allowing quick retrieval
   and analysis.

---

### Orion Collector

**Purpose:**  
The Orion Collector streamlines the integration of custom collection scripts and scraping configurations. Instead of
requiring extensive setup for each new target site, developers and OSINT engineers can simply modify or submit new
scripts tailored to specific sources. The Orion Collector automates the rest, handling ingestion, extraction, and
indexing without manual reconfiguration.

**Key Features:**

- **Script-Based Customization:** Developers create or modify scraper scripts in a standardized format.
- **Pull Request Integration:** Submit a pull request with new or updated scripts; once merged, the platform
  automatically incorporates the changes.
- **Auto-Configuration:** No additional manual configuration required. The Collector dynamically loads and applies new
  scripts, ensuring smooth scaling to multiple, specialized data sources.
- **Developer-Friendly:** Clear documentation, code templates, and examples help reduce the learning curve for
  contributing engineers.

**Technology Stack:**

- **Core Language:** Python (for ingestion and script execution)
- **Version Control:** Git-based workflow to track and merge changes to scraper scripts
- **Continuous Integration (CI):** Automated testing of new scripts before deploying them into production
- **Script Templates:** YAML/JSON configurations plus Python-based scraping logic

**Workflow:**

1. **Script Creation:** Developer creates a new scraper script targeting a specific site or data type.
2. **Pull Request & Review:** Developer submits a PR. Code reviewers ensure script quality and compatibility.
3. **Merge & Deploy:** Once approved, changes are merged, and the Collector automatically loads the new script.
4. **Data Pipeline Update:** The newly configured script runs within the existing pipeline, adding its data to Orion
   Search.

---
