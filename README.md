[![Codacy Badge](https://app.codacy.com/project/badge/Grade/a1f302d35c0f4f8c9293acabc5086512)](https://app.codacy.com/gh/msmannan00/Orion-Search/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![CodeQL Analysis](https://github.com/msmannan00/Genesis-Search/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/msmannan00/Genesis-Search/actions/workflows/github-code-scanning/codeql)
[![MDN HTTP Observatory](https://img.shields.io/badge/observatory-A%2B-brightgreen)](https://developer.mozilla.org/en-US/observatory/analyze?host=orion.genesistechnologies.org)
[![Security Headers](https://img.shields.io/badge/security%20headers-A%2B-brightgreen)](https://securityheaders.com/?q=https%3A%2F%2Forion.genesistechnologies.org%2F&followRedirects=on)
[![SSLLabs](https://img.shields.io/static/v1?label=SSLLabs&message=A%2B&color=brightgreen)](https://www.ssllabs.com/ssltest/analyze.html?d=orion.genesistechnologies.org&latest)
[![PageSpeed Insights](https://img.shields.io/badge/PageSpeed%20Insights-100%25-brightgreen)](https://pagespeed.web.dev/analysis/https-orion-genesistechnologies-org/hfe5h3u485?form_factor=desktop)

![homepage](https://github.com/user-attachments/assets/37fcf444-40be-46c9-8bd8-45a22d824141)

# Orion Platform
DOCUMENTATION  https://orion-search.readthedocs.io

<br>
Orion Platform is a comprehensive, web-based solution that combines the functionality of a browser, search engine, crawler, and data aggregation tools to empower OSINT (Open Source Intelligence) experts. Built on top of Docker, Orion provides a user-friendly interface to explore, search, and visualize data extracted by its powerful Orion Crawler.<br><br>

The platform integrates seamlessly with machine learning models, enhancing search relevance and enabling advanced content analysis. Orion supports a broad range of functionalities, including the ability to search, filter, and visualize data across multiple categories, making it an invaluable tool for data exploration and intelligence gathering.<br>

Designed with flexibility and scalability in mind, Orion enables OSINT experts to feed data directly into the platform, ensuring up-to-date and comprehensive datasets. Whether for investigative research, competitive analysis, or general information gathering, Orion provides a unified ecosystem that enhances the workflow of professionals who rely on actionable insights.<br>
<br>

## 1. Repository Quality and Build Status
| Repository                                     | Codacy                                                                                   | CodeQL                                                                                               | MDN HTTP Observatory                                                                                          | Security Headers                                                                                             | SSLLabs                                                                                                      |
|-----------------------------------------------|-----------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|
| [Orion Search](https://github.com/msmannan00/Orion-Search)   | ![Codacy Badge](https://app.codacy.com/project/badge/Grade/a1f302d35c0f4f8c9293acabc5086512) | ![CodeQL](https://github.com/msmannan00/Orion-Search/actions/workflows/github-code-scanning/codeql/badge.svg)   | [![Status](https://img.shields.io/badge/observatory-A%2B-brightgreen)](https://developer.mozilla.org/en-US/observatory/analyze?host=orion.genesistechnologies.org) | [![Status](https://img.shields.io/badge/security%20headers-A%2B-brightgreen)](https://securityheaders.com/?q=https%3A%2F%2Forion.genesistechnologies.org%2F&followRedirects=on) | [![Status](https://img.shields.io/static/v1?label=SSLLabs&message=A%2B&color=%3CCOLOR%3E)](https://www.ssllabs.com/ssltest/analyze.html?d=orion.genesistechnologies.org&latest) |
| [Orion Crawler](https://github.com/msmannan00/Orion-Crawler) | ![Codacy Badge](https://app.codacy.com/project/badge/Grade/94c252c8ce904c4cbbc4146a463b4d9e) | ![CodeQL](https://github.com/msmannan00/Orion-Crawler/actions/workflows/github-code-scanning/codeql/badge.svg) | -                                                                                                            | -                                                                                                            | -                                                                                                           |
| [Orion Collector](https://github.com/msmannan00/Orion-Collector) | ![Codacy Badge](https://app.codacy.com/project/badge/Grade/a1f302d35c0f4f8c9293acabc5086512) | ![CodeQL](https://github.com/msmannan00/Orion-Collector/actions/workflows/github-code-scanning/codeql/badge.svg) | -                                                                                                            | -                                                                                                            | -                                                                                                           |
| [Globaleaks Canary](https://github.com/msmannan00/Globaleaks-Canary) | ![Codacy Badge](https://app.codacy.com/project/badge/Grade/1e26f9b0bf504a2e8c5bf0fb22cf9e0b) | -                                                                                                   | -                                                                                                            | -                                                                                                            | -                                                                                                           |
| [Orion Browser](https://github.com/msmannan00/Orion-Browser) | ![Codacy Badge](https://app.codacy.com/project/badge/Grade/94c252c8ce904c4cbbc4146a463b4d9e) | ![CodeQL](https://github.com/msmannan00/Orion-Browser/actions/workflows/github-code-scanning/codeql/badge.svg) | -                                                                                                            | -                                                                                                            | -                                                                                                           |

## 2. Technology Stack

The Orion platform is built using various technologies to provide optimal search capabilities and data handling. Below is the list of libraries and frameworks used:

![MongoDB](https://badgen.net/badge/search-crawler/MongoDB/green)
![Redis](https://badgen.net/badge/search-crawler/Redis/red)
![Celery](https://badgen.net/badge/crawler/Celery/red)
![Python](https://badgen.net/badge/search-crawler/Python/blue)
![Tor](https://badgen.net/badge/search-crawler/Tor/purple)
![Traefik](https://badgen.net/badge/search/Traefik/orange)
![elastic](https://badgen.net/badge/search/elastic/pink)
![java](https://badgen.net/badge/browser/java/cyan)
![kotlin](https://badgen.net/badge/browser/kotlin/yellow)

## 3. Associated Repositories

| Repository                                                                 | Description                                                                                                 | Stats                                                                                                     |
|----------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|
| [Orion Browser](https://github.com/msmannan00/Orion-Browser)               | A harvester-based browser used to scrape data as you browse.                                             | ![Stars](https://img.shields.io/github/stars/msmannan00/Orion-Browser?style=social) ![Forks](https://img.shields.io/github/forks/msmannan00/Orion-Browser?style=social) |
| [Orion Crawler](https://github.com/msmannan00/Orion-Crawler)               | Used for monitoring and continuously crawling the hidden web.                                            | ![Stars](https://img.shields.io/github/stars/msmannan00/Orion-Crawler?style=social) ![Forks](https://img.shields.io/github/forks/msmannan00/Orion-Crawler?style=social) |
| [Orion Search](https://github.com/msmannan00/Orion-Search)                 | A platform to visualize extracted data.                                                                 | ![Stars](https://img.shields.io/github/stars/msmannan00/Orion-Search?style=social) ![Forks](https://img.shields.io/github/forks/msmannan00/Orion-Search?style=social) |
| [Orion Collector](https://github.com/msmannan00/Orion-Collector)           | Simplifies the task of creating custom crawling scripts for multiple websites.                          | ![Stars](https://img.shields.io/github/stars/msmannan00/Orion-Collector?style=social) ![Forks](https://img.shields.io/github/forks/msmannan00/Orion-Collector?style=social) |
| [Globaleaks Canary](https://github.com/msmannan00/Globaleaks-Canary)       | A tool for passive intelligence and whistleblowing.                                                     | ![Stars](https://img.shields.io/github/stars/msmannan00/Globaleaks-Canary?style=social) ![Forks](https://img.shields.io/github/forks/msmannan00/Globaleaks-Canary?style=social) |


## 4. Data Extraction Techniques
This is a comprehensive flow diagram illustrating the functioning of the multithreaded crawler. It outlines the entire process, from initializing threads and managing task distribution to efficiently retrieving and processing data from multiple sources concurrently. The diagram highlights key components, such as task queues, thread synchronization mechanisms, and data handling workflows, providing a clear and detailed representation of the crawler's architecture and operational flow

![image(1)](https://github.com/user-attachments/assets/696cf009-a0f3-4995-91fe-58e53b128825)


## 5. Deep Data Linting Roadmap
This document outlines the proposed solution and future roadmap for deep data linting, focusing on integrating insights from multiple sources into a unified platform. The solution emphasizes advanced data validation, cross-source correlation, and seamless integration to ensure comprehensive data quality checks. The roadmap highlights phased development, scalability enhancements, and feature expansions aimed at providing a robust and centralized approach to data insight and linting

![linting(2)](https://github.com/user-attachments/assets/ce1885dc-e701-45f6-89ab-9f412b057373)

## 6. Browser Support

Orion Browser is an Android application designed to provide a secure, private browsing experience by leveraging onion routing technology. This browser empowers users to access hidden web content anonymously, unblock restricted sites, and browse freely while safeguarding their online identity.

![JPJ pdf](https://github.com/user-attachments/assets/399fd130-988d-4e0d-acef-2f60d6220a81)

## 🌟Contribution

We welcome contributions to improve Orion Search. If you'd like to contribute, please fork the repository and submit a pull request.

### Steps to Contribute

1. Fork the repository.  
2. Create a new feature branch (`git checkout -b feature-branch`).  
3. Commit your changes (`git commit -m 'Add some feature'`).  
4. Push to the branch (`git push origin feature-branch`).  
5. Create a new Pull Request.

## License

Orion Search is licensed under the [MIT License](LICENSE).

## Disclaimer

This project is intended for research purposes only. The authors of Orion Search do not support or endorse illegal activities, and users of this project are responsible for ensuring their actions comply with the law.

## GitHub Repository

GitHub Repository URL: [https://github.com/msmannan00/Orion-Search.git](https://github.com/msmannan00/Orion-Search)

## Project Information

https://www.canva.com/design/DAF8Sa8KkDE/1H8z3RVausdHIMcE98Kvfg/edit

## Documentation

https://orion-search.readthedocs.io
