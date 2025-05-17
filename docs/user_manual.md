# User Documentation
## Introduction

let's take a look at the admin panel, designed exclusively for administrative users. This section is purpose-built to allow administrators to configure settings, monitor system performance, and oversee user activities. The diagram below illustrates the secure and straightforward login process for the admin panel, which is restricted solely to authorized personnel. Unlike user-facing components of the platform, the admin panel offers advanced tools and features that provide full control over the system's functionality, ensuring smooth and efficient management of operations.

![screencapture-orion-genesistechnologies-org-login-2025-04-14-14_35_29-modified](https://github.com/user-attachments/assets/6558f18f-eaa8-455d-83b5-c68b9371ddc2)

## Homepage Page

The Orion Platform's main interface is designed with user-friendliness in mind, offering intuitive and streamlined access to its wide range of features. It seamlessly integrates with advanced machine learning models, significantly enhancing search accuracy and enabling deeper, more intelligent content analysis. Users can efficiently search, filter, and visualize data across multiple categories, making data exploration both effective and insightful. With its robust capabilities, Orion empowers users to uncover patterns, trends, and correlations within vast datasets. This makes it an ideal solution for professionals seeking actionable insights and informed decision-making. The platform's versatility and performance ensure it meets the needs of various industries and use cases.

![homepage](https://github.com/user-attachments/assets/4f44383c-5d39-41a3-bf33-f9eab2ba17e8)

## Directory Page
Here’s an overview of the interface components

### Navbar Filter

The navigation bar is now positioned on the left side of the page for improved accessibility and a more streamlined workflow. It consists of the following main menu items:

1. **Homepage:** Navigates back to the platform’s main page, serving as a central hub for all primary operations.
It allows users to quickly restart their workflow or re-access key features without losing progress or context.

2. **General Intelligence:** Provides comprehensive access to aggregated intelligence data from various sources.
This feature enables users to conduct broad, high-level analysis to better understand emerging threats and trends.

3. **Data Breach:** Displays detailed reports of identified data breaches affecting different platforms and sectors.
Users can view information on compromised credentials, leaked sensitive data, and impacted entities.

4. **Defacement:** Presents findings related to website defacement incidents detected by the monitoring system.
It includes insights into affected domains, attacker signatures, and the nature of the defacement.

5. **Social:**  Monitors threat intelligence shared across social platforms, particularly Telegram.
The system integrates with Telegram channels to automatically fetch and display relevant threat data.
This feature helps identify early indicators of cyber threats, ongoing attacks, or planned activities by malicious actors.

6. **Live APIs:** Offers real-time data streams through APIs, facilitating integration with external systems and tools.
This feature supports continuous monitoring and enables timely responses to evolving cybersecurity events.

7. **Data Dumps:**  Provides access to large collections of compromised data gathered from various underground and open sources.
These data dumps often include leaked databases, user credentials, email lists, financial records, or other sensitive information.

      In this module, the system actively collects data from:

   - Telegram channels: Extracts downloadable files and shared dump links related to breaches or leaks.

    - Websites and forums: Scrapes or downloads publicly available or dark web-hosted data dumps posted by malicious actors.

    - Other open-source intelligence (OSINT) platforms: Tracks and organizes dump-related information for quick analysis.

8. **CTI Graph:** The CTI (Cyber Threat Intelligence) module offers a graph-based view that visualizes complex relationships between key cyber threat entities such as threat actors, malware families, TTPs (tactics, techniques, and procedures), IP addresses, domains, file hashes, and affected organizations. By mapping these connections visually, the module enables users to understand how threats are interlinked, attribute attacks to known groups, and correlate indicators of compromise (IOCs) with previous incidents. This enhances threat hunting, improves situational awareness, and accelerates investigations. The CTI graph integrates intelligence from sources like MITRE ATT&CK, dark web monitoring, and internal alerts to provide contextual, actionable insights.

9. **Link:** This module displays links associated with recent data dumps collected from platforms monitored sources. These links typically point to external locations where leaked or compromised data is hosted. By centralizing these dump-related URLs, the platform allows users to quickly access and analyze the raw data or files being circulated in the threat landscape. This feature supports ongoing monitoring of dump activity and helps identify the nature and scope of leaked content.

10. **Documentation:** This section provides comprehensive documentation for all users of the platform. It includes a detailed user manual, explanations about the platform’s features and modules, and developer documentation to guide technical users through integration, API usage, and system architecture. This module ensures that both end-users and developers can easily understand and utilize the platform's full capabilities.

![nav](https://github.com/user-attachments/assets/a61f3546-413b-47f9-8dd5-9a468564a36f)

## Homepage

The home page acts as the central hub of the platform, providing users with easy access to the core functionalities. On the left, there is a sidebar designed for users to quickly navigate to specific sections, streamlining the process of data retrieval. Below the sidebar, the page is divided into two main sections: the General Index and the Leaked Index. The Generic Index offers a broad overview of the collected data, summarizing standard findings for users. In contrast, the Leaked Index focuses on sensitive or critical information, enabling users to easily identify and prioritize high-priority data. This well-organized structure ensures that users have an intuitive and efficient experience.

### Key Features
- The **search bar** at the top of the interface allows users to quickly and efficiently find specific pieces of information. It supports keyword-based queries, making the process of locating data fast and straightforward. This feature enhances productivity by reducing the time spent on manual searching.

- The **Generic Index** offers a summarized view of the broad data collected from various sources. It presents standard findings in an organized format, giving users a quick understanding of general trends. This helps in forming a base for more detailed analysis and decision-making.

- The **Leaked Index** highlights data that is sensitive, confidential, or potentially compromised. It brings attention to high-priority information such as leaked credentials, making it easier for users to act quickly. This ensures critical threats are addressed before they escalate.

- The **structured layout** of the platform breaks the interface into clear, logical sections for better usability. This design allows users to navigate smoothly through different features without confusion. It creates a more intuitive and efficient experience for both new and experienced users.

![cetagories-modified](https://github.com/user-attachments/assets/4202e48f-4965-40b4-ac53-df3ee6c4f81a)


The home page features a prominent search bar positioned at the top, designed to let users quickly input data for either viewing or initiating a crawl process. This search bar acts as the central entry point for user interaction, streamlining access to the platform’s core functions. Just below the search bar, the page is neatly divided into two primary categories, each representing a key area of focus within the system. These categories help organize the data in a clear and logical manner, allowing users to easily navigate and analyze the content. This structured layout ensures an efficient and user-friendly experience right from the start.

### Categories Filter
Selecting "Analytics" from the navigation bar takes users to a detailed view that mirrors the two main categories already shown on the home page. This section is designed to provide a focused look at the platform’s collected data and analytical results. It presents information in a structured format, allowing users to explore key insights efficiently. The clear layout supports streamlined analysis and quick interpretation of complex data.

1. #### Generic Index
   
![generic index-modified](https://github.com/user-attachments/assets/36155cf7-e710-4739-b62b-24a550402444)


The "Generic Index" category displays information related to the crawling process, providing users with insights into various states of the fetched data. These states represent different aspects of the crawling operation, each offering valuable details. By reviewing the data systematically, one state at a time, users can gain a comprehensive understanding of the progress and status of the crawl. This structure ensures users can focus on specific areas of interest without being overwhelmed by unnecessary information.

- **Document Count:** This section provides detailed information about the results obtained after the data is fetched, focusing on the total document count. It displays the total number of documents retrieved from the crawl, presented as a single count value for clarity. This summary helps users quickly understand the volume of data collected and gauge the breadth of the crawl. It offers a snapshot of how extensive the data collection process has been.

- **Most Recent Date:** This state informs users about the most recent updates to the crawled data, ensuring they are kept up-to-date with the latest information available. It displays the most recent entries in the dataset, helping users quickly identify any new data that has been fetched. This is especially useful for tracking changes and monitoring updates in near real-time.

- **Oldes Update:** This section displays information about the oldest updates in the data, indicating when the data was last fetched in the past. By showing the oldest updates, users can track long-term changes and identify any outdated or irrelevant data. This is useful for distinguishing between fresh data and data that may no longer be applicable or valid.

- **Update five days:**   This section provides information about the updates from the last five days, allowing users to focus on recent changes that are highly relevant. By highlighting data updates within the past five days, this feature helps users quickly analyze recent changes without sifting through older, less relevant data. It ensures the focus remains on the most up-to-date information.

- **Update Nine days:**  This section provides insights into the updates from the last nine days, offering users a view of changes over a slightly longer period. It helps users monitor data for any significant changes or trends that may have developed in the past week or so. This feature is useful for tracking medium-term updates that may not be as immediate but are still important for ongoing analysis.
- 
- **Average Score:**  This section displays the average score count of the results, providing users with an overall assessment of the data quality. The average score metric is important for evaluating how well the crawling process performed in terms of the relevance and quality of the data fetched. It allows users to assess the overall effectiveness of the crawling process and decide whether further adjustments are needed.

- **URL/Documents:** This section shows the count of URLs being extracted from the sites during the crawl, offering a clear view of the total number of URLs found. By displaying the URL count, users can gauge how many web pages were captured during the crawl, helping them understand the extent of the data sourced. This metric is particularly useful for analyzing the scale of the crawling operation.
- 
- **Archive/Documents:**  This refers to the number of archived URLs found on each website, allowing users to assess the historical relevance of the crawled data. The archived URLs give insight into the longevity and preservation of online content, helping users understand how much of the data being crawled has been preserved over time. This is valuable for monitoring the ongoing availability of older content.
- 
- **Email/Documents:**  This section will show the number of email addresses found within the crawled data, helping users identify key communication points. By tracking the emails found during the crawl, users can extract important contact details for analysis. This is crucial for identifying potential communication channels and understanding the nature of the content within the dataset.
-  
- **Phone/Documents:** This section indicates how many phone numbers were fetched from each site during the crawl, providing users with detailed contact information. By tracking phone numbers, users can understand the level of personal or business contact data within the dataset. This feature allows for a deeper analysis of how connected or widespread the data is across different platforms.
- 
- **Clearnet/Document:** This section informs users about the clearnet-type URLs that were captured during the crawl. On average, each clearnet link provides around four URLs, which belong to the standard public internet network. This section helps users understand the volume of accessible, non-hidden data collected, which is essential for distinguishing between regular web content and more obscure or private data.

- **Common Type:** These are the general types of data supported by the network, helping users categorize the different types of content collected. This section ensures that users can easily understand the variety and scope of data being gathered from diverse sources. It also helps in organizing the data into recognizable categories, making analysis more straightforward and manageable.
- 
![image](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/generalindex.png)

In this diagram, the values displayed within the boxes represent the crawling data, which is updated daily. Each box contains two sets of numbers: the top numbers indicate the results of daily data updates, while the bottom numbers represent updates on a weekly basis.

2. #### Leaked Index

![leaked index-modified](https://github.com/user-attachments/assets/199958b0-9477-443f-9220-743dbe6ffc43)

The Leaked Index offers detailed insights into the various states of leaked data within the dataset, specifically targeting sensitive or confidential information. It helps users identify critical data that has been exposed, making it easier to track potential risks or security breaches. By providing a clear overview of the leaked data, this index allows for more focused analysis and prioritization of high-risk information. This feature is essential for ensuring that important threats are detected and addressed promptly.

3. ### Defacement
The Defacement category allows users to deeply analyze data related to websites that have been compromised or visually altered by attackers. Within this section, users can:

- View the total number of websites that have been hacked or defaced, giving a comprehensive overview of the scale of such incidents. This helps to quantify the number of attacks and monitor the impact on the web ecosystem.

- Identify and filter fake or fraudulent websites among the defaced entries, ensuring that users can focus on legitimate threats and exclude irrelevant or misleading data.

- Review technical metrics, such as the server response speed at the time the defacement was detected, offering insights into how server performance may have been affected by the attack.

This category provides essential insights into the nature and scale of web defacement incidents, enabling users to track emerging threats in real time. By understanding the specific vulnerabilities that led to these attacks, users can assess the overall security posture of affected web servers. Furthermore, this information helps in improving website defense strategies and mitigating future risks associated with web defacements.

![defecement-modified](https://github.com/user-attachments/assets/ecf0f26a-49e4-4dcc-89ee-91a32a78cec3)



## General Index
This is the second option in the navigation bar, designed to give users easy access to a wide range of data categories. When a user performs a search using the search bar, the results are automatically displayed based on the query, providing tailored information for efficient exploration. Within the "General Intelligence" dropdown menu, accessible through the second navigation option, several subcategories become available, allowing users to delve deeper into specific areas of interest. These subcategories include General, Forums, News, Stolen Data, Drugs, Hacking, Marketplaces, Cryptocurrencies, and Leaks, each containing relevant data for the user to explore. Depending on the search query, users can view data associated with any of these categories, providing them with focused and detailed information. In the following sections, we will explore each of these subcategories individually to offer a better understanding of their contents and how users can leverage them effectively.

![General Intelligence-modified (1)](https://github.com/user-attachments/assets/1785f777-2f85-481e-bafe-79ad37b2c6d1)

### All
The "All" category offers a comprehensive and unified view of intelligence data, consolidating information from every subcategory under the General Intelligence section. This enables users to access a broad range of data in one place, making it easier to analyze and compare information across various categories. The "All" category serves as a centralized hub for quickly reviewing the full spectrum of collected intelligence.

1. ### General
This section houses a diverse collection of uncategorized intelligence data, encompassing various findings that don’t fit neatly into the more specific categories outlined elsewhere. It includes miscellaneous insights and discoveries gathered from different sources, providing users with a broader scope of information. This section ensures that no valuable data goes overlooked, even if it doesn't fall under a specific category.

2. ### Forums
In a forum, various platforms can be utilized, such as blogs, websites, or media channels, to facilitate discussions around the data. These platforms provide spaces for users to share insights, ask questions, and engage in conversations about the relevant information. The forum serves as an interactive space where individuals can contribute their knowledge and collaborate on the topic.

3. ### News
The news section allows users to view any news related to the data, provided there is relevant coverage available. It keeps users updated with the latest developments and trends related to the searched data. This section ensures users stay informed about any significant news that may impact their analysis or understanding.

4. ### Stolen Data
This section lists data breaches that involve the theft of sensitive personal, financial, or business information. It includes incidents where credentials, credit card dumps, and other confidential data have been exposed, often being sold or shared on underground platforms. Users can explore the extent of these breaches and gain insights into the compromised data to assess potential risks.

5. ### Drugs
This section monitors and displays listings related to the sale or trade of illegal drugs across dark web marketplaces, providing a comprehensive overview of illicit activity in this area. By tracking these listings, it helps law enforcement and monitoring teams stay informed about emerging drug trends, enabling more effective intervention. The data serves as a valuable resource for identifying new patterns and taking action against illegal drug distribution.

6. ### Hacking
Provides valuable insights into hacking-related content, including tutorials on website exploits, malware development, and discussions or sales of vulnerabilities within hacker communities. It offers a closer look at the tools and techniques being shared, helping security teams stay informed about potential threats. Monitoring this data is crucial for understanding evolving hacking methods and strengthening cybersecurity defenses.

7. ### Marketplaces
Tracks online marketplaces (especially on the dark web) where illicit goods and services are traded. This includes weapons, fake documents, stolen data, malware, etc.

8. ### Cryptocurrencies
Analyzes cryptocurrency-related intelligence including illicit transactions, wallets linked to cybercrime, and usage of crypto for money laundering or ransom payments.

9. ### Leaks
Focuses on leaked documents, databases, or credentials published online. These could include government files, internal company data, or proprietary tools that have been exposed.

## DataBreach
The Data Breach section in the navigation bar includes two subcategories:

![Databreach-modified](https://github.com/user-attachments/assets/26878091-cb9f-4839-bd47-51c045920748)

1. ### Databases
This section contains detailed records of actual data breaches, offering in-depth information about compromised credentials, personal details, and other sensitive content. It compiles data gathered from multiple sources, providing a clear picture of the extent and nature of each breach. This helps users assess the impact of these breaches and understand the type of sensitive information that was exposed.

![databasebreach-modified](https://github.com/user-attachments/assets/29c0fd5b-56bb-4b90-b79f-196f77186362)


2. ### Track
This section provides breach-related information tracked from forums. It is primarily used for monitoring discussions and mentions of potential breaches across underground communities. Note: This section does not contain actual breached data — it only displays references or claims gathered from forum sources.
![tracking-modified](https://github.com/user-attachments/assets/657279c5-e9e3-441e-9dd0-c691dc535d86)


## Defacement
The Defacement section provides access to an archive list of websites that have been compromised or defaced. This section maintains a structured table that records detailed information about each hacked website, including:

- Serial Number – Unique identifier for each record.

- Base URL – The domain or main address associated with the defaced site.

- Data Source URL – Link to where the defaced content or evidence is archived.

- Attacker(s) Name – The individual or group responsible for the defacement.

- Team Name (if applicable) – Name of the hacker team involved, if any.

- Web Server Information – Type of web server that was running on the affected site (e.g., Apache, Nginx, etc.).

- Date of Defacement – The date when the defacement occurred.

- Defaced Web URL – Direct link to the defaced website or the affected page.

- This module is designed to provide a centralized and searchable database of defaced websites, enabling security teams and analysts to monitor and investigate web-based attacks efficiently.

![archive-modified](https://github.com/user-attachments/assets/fcc2876a-449f-4792-bb13-45dc482cad11)

## Social

The Social module is designed to monitor and analyze threat intelligence shared across social media and messaging platforms, with a primary focus on Telegram—a widely used channel among cybercriminal groups for sharing illicit information. This module integrates directly with selected Telegram channels, groups, and bots that are known to circulate cyber threat data, including leaked credentials, data dumps, malware samples, and discussions of planned cyberattacks.

![social-modified](https://github.com/user-attachments/assets/e1180853-35b6-4123-af06-4940fa1d17e5)


## Live APIs

The Live APIs section provides users with real-time investigative tools. Within this section:

### Email Lookup: 
By selecting the email option, users can input any email address to retrieve related breach information. This tool helps identify where and how the data associated with the entered email may have been leaked or exposed, offering valuable insights into potential security incidents or data breaches.

### Breach Records: 
Below the lookup interface, a list of data breach records is displayed. These records offer additional context and reference points, allowing users to explore known breaches and validate the exposure of specific information.


![apilive-modified](https://github.com/user-attachments/assets/6019f8ca-ba2d-4f70-9596-506639773d84)

## Data Dump
Provides access to large collections of compromised data gathered from various underground and open sources.
These data dumps often include leaked databases, user credentials, email lists, financial records, or other sensitive information.

 - Data is collected from:

 - Telegram channels (shared files or links)

 - Dark web forums and sites

 - Open-source leak platforms

The platform categorizes and indexes this information for further analysis and correlation with threat activity.


## Fillter and Analytics
On the left side of the page, there are two options: Analytics and Filter.
![analytics-modified (1)](https://github.com/user-attachments/assets/90e59067-d5ca-4eed-a404-7a67d6435558)

### Analytics: 
This section provides insights related to any search performed using the navigation bar. It displays the count of results corresponding to the selected navigation options.

The first two tables in the Analytics section are:

Keyword Insights Table – This table presents data based on the keywords used during the search.

General Coverage of Results Table – This table provides an overview of the general distribution of the search results.


### Keyword Insight: 
This section highlights the fetch results related to the entered search word. It provides detailed insights, including:

The number of keywords identified during the crawl.
The total count of documents fetched containing those keywords.
The number of links or pages retrieved that are associated with the keywords. These observations offer a clear understanding of how the data is gathered and processed, ensuring that users can analyze the results efficiently and make informed decisions based on the displayed metrics.

![keywords-modified](https://github.com/user-attachments/assets/4d39a666-3473-4fbc-b15c-0e63cb86b1a8)

### Results General Coverage
Below this, the "General Coverage" section displays the results in a structured format.

It first shows the total number of items found during the search.
Then, it provides a breakdown of active and inactive items, along with the results for seldom active items, offering a clear summary of the data.

![results-modified](https://github.com/user-attachments/assets/0bbedfd0-ad5c-4061-8689-60f238053af4)

Below the two tables mentioned above, we have detailed data associated with each category, such as URLs, titles, and networks. For instance, if the data includes URLs, it displays which specific URLs are available; if it includes titles, it shows the corresponding records; and if networks are present, it indicates the different types of networks appearing in the search results.

Each variable can be expanded through a dropdown menu, which reveals separate and specific results related to that particular variable from the entire search dataset.

![search results-modified](https://github.com/user-attachments/assets/e29ae344-48d9-4b35-8cba-1c265ae0bb7a)

### Filters

The second option alongside Analytics is the Filter menu. When we click on it, an extended submenu appears. This submenu contains two additional options.
Clicking on this icon applies a standard filter to the data, helping users narrow down their search. It streamlines the process of refining results for more targeted insights.

![fillter-modified](https://github.com/user-attachments/assets/e51e73eb-cb51-4187-9466-d0fb18b7b66b)

### Network Types
Onion: Dark web links.

I2P: Invisible Internet Project links.

Clearnet: Surface web links.

![network type-modified](https://github.com/user-attachments/assets/0844c5b1-8f61-4918-bed6-bb7245f0a5bf)

### Enable Safe Search Button

The Safe Search feature enhances user safety by filtering out inappropriate or explicit content. To enable this feature:
1. - Locate the Safe Search button.
2. - Click the button to activate safe browsing.

![safe search-modified](https://github.com/user-attachments/assets/e7ad92a7-524c-4f67-837c-9566af73b805)





### Search Results

When you enter any keywords into the search bar and press enter, the system processes the input and retrieves relevant data. It then displays the search results that match the specified keywords. This allows users to efficiently find information based on their search criteria. The results are presented in an organized format for easy analysis.

![search](https://github.com/user-attachments/assets/b3823643-6489-4904-87b7-158a85926c0a)

When performing a search, the results are shown in a split view, helping organize the information more effectively. This layout separates different data sets, making it easier for users to focus on specific results. By displaying the data side by side, it allows for quick comparison and detailed analysis. The split view enhances the user experience by simplifying the navigation of search results. Below the search bar overall fetch results related to the keyword.


![resultfinal](https://github.com/user-attachments/assets/55cd18cd-1983-48ff-b8eb-970e048f36f4)


The detailed view of a search result provides essential information to help users assess the nature of a website before accessing it.  This is followed by the website topic, which typically reflects the site's purpose—such as a forum, leak site, or cryptocurrency platform.
When a user clicks on a specific section of the result, a separate menu appears, offering various features related to the selected site. This menu is designed for quick access to useful tools, including:

**Download:** Allows the user to download available site content

**Translator:** Converts the content into different languages

**Print:** Enables printing of the current view or content

**Share Link:** Copies the site’s URL for easy sharing

**Open in New Tab:** Loads the site in a separate browser tab for convenience.

In addition to the mentioned details, this section also displays the publish date, network type, last update date, relevant tags, and the status of the link. The status indicates whether the link is currently active or inactive, helping users quickly determine if the site is accessible.

Towards the end, there is a complete menu table available, where several additional elements can be viewed, such as:
#### Section Tab
The "Section" tab provides a detailed view of the various sections of the website, highlighting the specific parts being extracted during the data crawling process. This feature helps users identify and understand the structure of the website within the fetched data. 

#### Content Tab
Next to it is the content tab, which provides access to all the raw content crawled from the respective site. Clicking on it displays the extracted data in its unprocessed form, allowing for a deeper analysis of the information gathered.

![image](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/content1.png)

#### Images
In the Images menu, it displays the number of images related to that particular result.

#### Content Type
Next, we have the Content Type section, which shows the types of content associated with that particular result.

#### Clear Net
After that, there is the Clearnet option, which displays all the links related to the Clearnet that are associated with the selected result.

![clearnetlinks](https://github.com/user-attachments/assets/edeabeab-f64b-4548-af5f-93632e491955)

#### Person

Then we have the Person option, which displays the names of individuals associated with the selected search result.

![person](https://github.com/user-attachments/assets/fe2aa912-52ff-4d50-a0c4-8d7db734a40b)



## Overview and Additional Features
This provides an overview of the original scope of our project. Moving forward, we would like to highlight some additional features and elements that we have specifically developed for our client. Along with Orion, which serves as our core platform, we have integrated three other platforms to address various needs. The first is Dozzel, which caters to a particular set of functionalities; the second is Swagger, a tool that helps us manage and test APIs; and the third is Flower, a platform designed for monitoring and managing tasks. Each of these platforms serves a unique purpose, enhancing the overall system and offering greater flexibility and efficiency for the client.

### Dozzel
We have added an extra API to the server to provide insights into server usage. This API tracks the processing activities within the system or software, particularly where machine learning algorithms are running.

- Additionally, it provides detailed logs, monitors system stability, and highlights areas where bugs or issues have occurred.

- It also offers real-time updates on system performance, helps identify potential bottlenecks, and ensures a proactive approach to system optimization and troubleshooting.
- It is providing us data without a server.

![WhatsApp Image 2025-01-14 at 11 24 32 PM](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/dozzle.png)

### Swagger.org
After this, we move on to Swagger, which plays a critical role by essentially handling the actual backend operations. Earlier, we discussed Orion, a comprehensive front-side software that provided us with the ability to view and analyze all the data effectively. Orion serves as the interface for interacting with the data, making it user-friendly and accessible. On the other hand, Swagger allows us to dive deeper into the backend processes, giving insights into how the data is being handled and processed behind the scenes. This distinction between front-end visualization and backend operation highlights the complementary roles of Orion and Swagger in managing and understanding the system's functionality.

![WhatsApp Image 2025-01-14 at 11 26 16 PM (1)](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/swegger.png)

In Swagger, we have several APIs that we can directly use for testing. The biggest advantage of Swagger's APIs is that if you don't want to use our system, you can still run Swagger's APIs on your own system and utilize them.

Swagger operates on our HTTP scheme and provides three main APIs:

**GET/api/directory:** This API allows us to view a list of all available APIs.
**GET /api/insight:** This API provides key insights, which are the results we saw on Orion's front page.
**GET /api/search:** This API enables us to view the search results, showing what we find in response to our search queries.

![image](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/swegger1.png)

### Models
After this, on the same page, we have several models that are active, including DirectoryResponse, Directory, InsightResponse, GenericModel, LeakModel, SearchResponse, SearchResult, and ErrorResponse.

![image](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/models.png)

To run Swagger, we have been provided with its link. Below, the keys for it are mentioned.

https://swagger.orion.genesistechnologies.org:9443/

### Flower
Next, we have the third tool, called Flowers. This tool helps in situations where we are running multiple crawlers, such as 40 at a time, and some of them either break down or get stuck. It allows us to monitor and debug the crawlers effectively.

Key features of the tool

- Identify which crawler is hitting how many sites simultaneously.
- Monitor how many links each crawler is extracting and bringing back.
- Debug issues such as broken or stuck crawlers during operation.
  
![image](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/flowers.png)

In this way, if we need to access a system, a key is required for that system. With the help of this key, we can access its features or resources. These keys related to open sources, specifically TRAEFIK KEYS, DEMO KEYS, and PRODUCTION MODE. These three concepts help us manage demo server access and control features in production.


### Keys
**TRAEFIK KEYS**
1. TRAEFIK_USERNAME=admin
2. TRAEFIK_PASSWORD='SHnTUYTIaz7ahQrVeMHVzK4y7PUGXb9VCp3bTYtaLPrUuE8am2ahVjk2dKYzw3C8'

**Description:** These keys are used for both Flower and Dozzle. They allow access to the demo server, enabling users to use it for demonstration purposes.

**DEMO KEYS**
1. DEMO_USERNAME=demo
2. DEMO_PASSWORD='TYdycoDuU9U6N6f2B7N8GsxpG3AkkSaOrlX8WBOwJgke3UNYCjgd3owwObGdPrsw'

**Description:** Demo keys are used to provide users with a demo version of the service. By using these keys, users can access a limited, demo server environment to explore features.

**PRODUCTION MODE**
1. DEMO="0"
2. API_SWAGGER="1"
3. PRODUCTION="0"
4. MAINTAINANCE="0"

**Description:** In production mode, we use environmental variables to control and manage the system. This setup is crucial for optimizing performance and making production decisions.


### Control Management System
All these configurations fall under a centralized control management system, which helps in controlling both demo and production environments.
You can use these keys and configurations for demo purposes or to manage a live, production environment.
