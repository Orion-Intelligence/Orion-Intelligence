# User Documentation
## Introduction

let's take a look at the admin panel, designed exclusively for administrative users. This section is purpose-built to allow administrators to configure settings, monitor system performance, and oversee user activities. The diagram below illustrates the secure and straightforward login process for the admin panel, which is restricted solely to authorized personnel. Unlike user-facing components of the platform, the admin panel offers advanced tools and features that provide full control over the system's functionality, ensuring smooth and efficient management of operations.

![screencapture-orion-genesistechnologies-org-login-2025-04-14-14_35_29-modified](https://github.com/user-attachments/assets/2ef36bad-3558-45f4-924b-f55758aebdc6)

## Homepage Page

The Orion Platform's main interface offers users straightforward access to its features. It integrates with machine learning models to improve search accuracy and enable advanced content analysis. Orion provides a variety of functions, such as searching, filtering, and visualizing data across multiple categories, making it a powerful tool for exploring data and gathering insights.

![screencapture-orion-genesistechnologies-org-dashboard-home-2025-04-14-14_27_53](https://github.com/user-attachments/assets/b4847177-1d89-4eec-9dbc-e564db98d72f)


## Directory Page
Here’s an overview of the interface components

### Navbar Filter

The navigation bar is now positioned on the left side of the page for improved accessibility and a more streamlined workflow. It consists of the following main menu items:

1. **Homepage:** Navigates back to the main page, allowing users to restart their workflow or access key features quickly and efficiently without losing context.

2. **General Intelligence:** Provides access to collected intelligence data for broad analysis and understanding of the threat landscape.

3. **Data Breach:** Displays information about identified data breaches, highlighting compromised credentials or sensitive data.

4. **Defacement:** Shows reports of website defacement activities detected by the system.

5. **Live APIs:** Offers real-time data feeds and APIs for integration and continuous monitoring.


![image](https://github.com/user-attachments/assets/df167528-6a49-4db2-9d1c-0ee020d779cd)

The home page acts as the central hub of the platform, providing users with easy access to the core functionalities. On the left, there is a sidebar designed for users to quickly navigate to specific sections, streamlining the process of data retrieval. Below the sidebar, the page is divided into two main sections: the General Index and the Leaked Index. The General Index offers a broad overview of the collected data, summarizing standard findings for users. In contrast, the Leaked Index focuses on sensitive or critical information, enabling users to easily identify and prioritize high-priority data. This well-organized structure ensures that users have an intuitive and efficient experience.

### Key Features
- The **search bar** at the top allows for quick and efficient searching of specific information.
- The **General Index** provides an overview of the broad data collected, offering a summary of standard findings.
The **Leaked Index** highlights sensitive or critical information, helping users quickly identify and prioritize high-priority data.
The **structured layout** divides the page into sections, ensuring an intuitive and efficient user experience.

![image](https://github.com/user-attachments/assets/e7d9c310-0dde-4eb1-a18b-9c4958995d44)


The home page features a prominent search bar at the top, allowing users to input data for viewing or crawling. Below the search bar, the page is organized into two primary categories. These categories structure the platform’s core data for easy access and analysis.

### Categories Filter
Selecting "Analytics" from the navigation bar displays two categories already available on the home page. This section provides a clear view of the platform’s data results. It is organized into two main categories for streamlined analysis.

1. #### General Index
   
![image](https://github.com/user-attachments/assets/19119c1e-a19d-423b-80d0-0de5b295e6f7)

The "General Index" category displays information related to the crawling process, allowing users to observe various states. These states represent different aspects of the fetched data. Users can review the data systematically, one state at a time.

- **Document Count:** This section provides detailed information about the results obtained after fetching the data, focusing on the document count. It displays the total number of documents retrieved, presented as a single count value. This summary helps users quickly understand the volume of data collected.

- **Most Recent Date:** This state will inform us about the most recent updates to our crawled data, ensuring users stay up-to-date with the latest information. It helps quickly identify new entries in the dataset.

- **Oldes Update:** This section will display the results related to the oldest updates in the data, showing when the data was fetched in the past. This is useful for tracking long-term changes or identifying outdated information.

- **Update five days:**   This section will provide information about the updates from the last 5 days,It helps users focus on the most relevant and recent data.

- **Update Nine days:**  This section will provide information about the updates from the last 9 days, allowing users to monitor a slightly longer period for any significant changes.
- **Average Score:**  An average score count of our results will be displayed here, helping users assess the overall quality of the fetched data. This metric is valuable for evaluating the effectiveness of the crawling process.

- **URL/Documents:** The count of URLs being extracted from sites will be displayed here, offering a clear view of the total number of URLs found. This helps users understand the volume of data being sourced from different websites.
- **Archive/Documents:**  This refers to how many archived URLs were found on each website, allowing users to assess the historical relevance of the crawled data. It provides insight into the longevity and preservation of online content.
- **Email/Documents:**  This section will show us the number of emails in our fetched data, assisting in identifying key communication points within the dataset. 
- **Phone/Documents:** The phone section will indicate how many phone numbers are being fetched from every site, offering a detailed count of contact information in the data.
- **Clearnet/Document:** This section informs us about the clearnet-type URLs being displayed. On average, each link provides around 4 URLs, which belong to the clearnet, a standard type of network.
- **Common Type:** These are the general types supported by our network, helping categorize the different types of content available. This section ensures users can understand the variety and scope of data collected from different sources.

![image](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/generalindex.png)

In this diagram, the values displayed within the boxes represent the crawling data, which is updated daily. Each box contains two sets of numbers: the top numbers indicate the results of daily data updates, while the bottom numbers represent updates on a weekly basis.

2. #### Leaked Index

![image](https://github.com/user-attachments/assets/5aeadffd-aff5-4644-be1a-187c7870fbf9)

The Leaked Index provides detailed information about the states of leaked data related to the specific information being sought. It helps identify and track sensitive or critical data within the dataset.

3. ### Defacement
The Defacement category allows users to analyze data related to websites that have been compromised or defaced. Within this section, users can:
- View the total number of websites that have been hacked or visually altered by attackers.
- Identify and filter fake or fraudulent websites among the defaced entries.
- Review technical metrics such as the server response speed at the time the defacement was detected.
This category provides valuable insights into the nature and scale of web defacement incidents, enabling users to monitor emerging threats and evaluate the performance and vulnerabilities of affected web servers.

![image](https://github.com/user-attachments/assets/7e3b3c44-c89f-4110-aa85-c3da379df6f1)


### Links Filter
This is the second option in our navigation bar, offering a comprehensive view of all the links/URLs that appear in the search results. These links represent the complete URLs, primarily consisting of the main index pages from the crawled websites. By displaying these URLs, the section provides an overview of the websites that have been explored. It also enables users to track the total number of websites crawled so far, giving a clear picture of the platform’s data collection progress. This feature is useful for reviewing the breadth of data gathered through the crawling process.

![image](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/linktab.png)

On this page, the live onion search table includes various elements that we will discuss individually. Each element plays a crucial role in the search and data retrieval process.

In the first row, we have URLs, followed by the network type.

#### Network Types

- **Onion:** Dark web links.

- **I2P:** Invisible Internet Project links.

- **Clearnet:** Surface web links.

![image](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/networklink.png)


### Index Menu

The Index Menu includes two categories:

- **General Index**  This section allows us to view all the links crawled in general mode, providing a broad overview of all indexed URLs. It helps track and manage the overall set of data collected during the crawling process.

- **Leaked Index**  In this section, we can view only the links containing leaked data, filtering out non-relevant results. This allows users to focus on sensitive or critical information, streamlining the analysis of potentially high-risk data.

![image](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/index.png)

#### Content Option Bar
The content bar offers 10 different options, enabling users to view links based on their specific selection. By default, it is set to the "General" option, displaying a broad range of links. Users can open the dropdown menu to choose from a variety of categories or filters, allowing them to tailor the content to their needs. This feature enhances navigation and makes it easier to access relevant data. It ensures a flexible and user-friendly experience for viewing links.

![image](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/content.png)

#### Filter
Next to the content option, there is a small filter icon. Clicking on this icon applies a standard filter to the data, helping users narrow down their search. It streamlines the process of refining results for more targeted insights.

![11111](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/filter.png)



### Onion Crawl Statistics

![image](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/crawlstatistics.png)


The Live Onion Search Table presents real-time search results in an organized, easy-to-read format. It allows users to quickly view and analyze data as it is fetched.
| Column        | Description                              |
|-------------|------------------------------------------|
| **ID**      | Unique identifier for each result.       |
| **Service URLs**   | URLs of the services found. |
| **Status** | Indicates the data category (e.g., leaked, forums, cryptocurrency, general). |
| **URL**   | Displays whether the URL is active or inactive. |
| **Leak Status**   | Specifies whether the leak is active or inactive. |
| **Network Type**   | Indicates the type of network (e.g., Onion, I2P, Clearnet). |


## Orion Search

### Search Results

When you enter any keywords into the search bar and press enter, the system processes the input and retrieves relevant data. It then displays the search results that match the specified keywords. This allows users to efficiently find information based on their search criteria. The results are presented in an organized format for easy analysis.

![image](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/searchtype.png)

When performing a search, the results are shown in a split view, helping organize the information more effectively. This layout separates different data sets, making it easier for users to focus on specific results. By displaying the data side by side, it allows for quick comparison and detailed analysis. The split view enhances the user experience by simplifying the navigation of search results.

![screencapture-orion-genesistechnologies-org-search-2025-01-08-22_52_19](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/searchresult.png)

### Top Bar Options

We have a total of 6 classifiers here.The top bar, displayed post-search, includes the following options:

- **All:** Shows overall data related to the entered keyword.
 
- **Monitor:** We are shown a separate script for each site.

- **Forums:** Displays forum-related results.

- **News:** Highlights news items.

- **Emails:** Lists email-related results.

![image](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/datasearch.png)

This will provide us with the overall fetch results related to the keyword.

![image](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/foundresults.png)

### Enable Safe Search Button

The Safe Search feature enhances user safety by filtering out inappropriate or explicit content. To enable this feature:
1. - Locate the Safe Search button.
2. - Click the button to activate safe browsing.
  
![image](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/enable.png)

When viewing a site from the search results, its display is based on specific factors.
**Network Type**: The first option at the top shows the network type, such as Onion, I2P, or Clearnet.
**Website Topic**: The next two options provide details about the site’s topic, e.g., forum, leak, cryptocurrency, etc.
**Update Date**: Displays the last update date of the site, along with some additional related data.
**Bottom Tabs**: At the bottom, 2-3 tabs are available:
- The first tab shows the sections of the website.
- The next tab provides information about the type of content available on that website.
- These parameters collectively represent specific details for each site that appears in the search results.

![image](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/companies.png)

#### Section Tab
The "Section" tab provides a detailed view of the various sections of the website, highlighting the specific parts being extracted during the data crawling process. This feature helps users identify and understand the structure of the website within the fetched data. 

![image](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/sections.png)

#### Content Tab
Next to it is the content tab, which provides access to all the raw content crawled from the respective site. Clicking on it displays the extracted data in its unprocessed form, allowing for a deeper analysis of the information gathered.

![image](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/content1.png)

In generic crawling, three key aspects can be observed using a machine learning model. On the right side of the page, several parameters of the results are displayed for user convenience:

**Keyword Insight**: This section highlights the fetch results related to the entered search word. It provides detailed insights, including:
- The number of keywords identified during the crawl.
- The total count of documents fetched containing those keywords.
- The number of links or pages retrieved that are associated with the keywords.
These observations offer a clear understanding of how the data is gathered and processed, ensuring that users can analyze the results efficiently and make informed decisions based on the displayed metrics.

![image](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/keywordinsight.png)

#### General Coverage
Below this, the "General Coverage" section displays the results in a structured format.
- It first shows the total number of items found during the search.
- Then, it provides a breakdown of active and inactive items, along with the results for seldom active items, offering a clear summary of the data.

![image](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/resultgeneral2.png)

#### Unique Results
Afterward, the page presents some unique results for further analysis. The first section displays information about the extracted URLs. Below it, a table lists the unique emails identified during the crawl. This is followed by details about the archive, highlighting unique document files retrieved from the data.

![image](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/uniqueurls.png)

#### Unique Cellular
This section displays the total number of phone numbers extracted from the crawled data. It provides a clear count for easy reference and analysis.

![image](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/uniquenumbers.png)

After viewing the search results, let’s explore the options available in the top navbar step by step. Each option provides specific functionalities for navigating and analyzing data.


### Monitor Section:

Next, we move to the "Monitor" tab in the top menu. This option displays a separate script for each site, providing detailed insights and monitoring capabilities. Additionally, it allows users to include custom scripts, offering flexibility to tailor the monitoring process as needed.

![image](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/monitor.png)

### Market Section:
The "Market" section provides insights into the buying and selling activities of various items, whether they involve legal or illegal goods. It acts as a monitoring tool to observe transactions and trends within the marketplace. Essentially, this section serves as a virtual store for tracking the sale and purchase of items on the dark web, offering a comprehensive overview of the trading environment.

![image](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/market.png)

### Forum Section:
In a forum, various platforms can be utilized, such as blogs, websites, or media channels, to facilitate discussions around the data. These platforms provide spaces for users to share insights, ask questions, and engage in conversations about the relevant information. The forum serves as an interactive space where individuals can contribute their knowledge and collaborate on the topic.

![image](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/forum.png)

### News Section:
The news section allows users to view any news related to the data, provided there is relevant coverage available. It keeps users updated with the latest developments and trends related to the searched data. This section ensures users stay informed about any significant news that may impact their analysis or understanding.

![image](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/news.png)

### Email Section: 
By selecting the email option, users can enter any email address to investigate related information. This feature helps identify where the data associated with that email has been leaked or exposed. It provides valuable insights into potential data breaches involving the specified email.

![image](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/email.png)

### Network type
At the end of the page, there is a button on the platform. When clicked, a dropdown menu appears, providing options to filter the network based on specific criteria. This feature allows users to refine their search or display preferences according to their needs.

![screencapture-orion-genesistechnologies-org-search-2025-01-10-16_32_15](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/settings.png)

By default, the setting will be set to "All" to display normal results. However, users have the option to modify this setting based on their preferences. This flexibility allows for more customized viewing of the data.

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
