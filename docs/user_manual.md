# User Documentations
## Introduction

let's take a look at the admin panel, designed exclusively for administrative users. This section is purpose-built to allow administrators to configure settings, monitor system performance, and oversee user activities. The diagram below illustrates the secure and straightforward login process for the admin panel, which is restricted solely to authorized personnel. Unlike user-facing components of the platform, the admin panel offers advanced tools and features that provide full control over the system's functionality, ensuring smooth and efficient management of operations.

![https://github.com/msmannan00/Orion-Search/blob/documentation_v2/docs/screenshots/adminpage.png](https://github.com/user-attachments/assets/4477474f-51b7-4f18-9fd6-7d02110ec9ab)



## Homepage Page

The Orion Platform's main interface offers users straightforward access to its features. It integrates with machine learning models to improve search accuracy and enable advanced content analysis. Orion provides a variety of functions, such as searching, filtering, and visualizing data across multiple categories, making it a powerful tool for exploring data and gathering insights.

![screencapture-orion-genesistechnologies-org-2025-01-08-11_43_05](https://github.com/user-attachments/assets/4477474f-51b7-4f18-9fd6-7d02110ec9ab)

## Directory Page
Here’s an overview of the interface components

### Navbar Filter

The top navigation bar consists of three main menus

1. **Home:**  Navigates back to the main page, allowing users to restart their workflow or access key features quickly and efficiently without losing context.
2. **Links:** Shows the crawled links stored in the database.

3. **Analytics:** This is displayed on our home page, showcasing two types of data results: Generic Results, which provide a broad summary of findings, and Leaked Index, highlighting sensitive or critical information for immediate attention.

![image](https://github.com/user-attachments/assets/0e453924-31c2-4d6f-a0cf-0a0d14159d81)


The home page acts as the central hub of the platform, providing users with easy access to the core functionalities. At the top, there is a search bar designed for users to quickly search for specific information, streamlining the process of data retrieval. Below the search bar, the page is divided into two main sections: the General Index and the Leaked Index. The General Index offers a broad overview of the collected data, summarizing standard findings for users. In contrast, the Leaked Index focuses on sensitive or critical information, enabling users to easily identify and prioritize high-priority data. This well-organized structure ensures that users have an intuitive and efficient experience.
### Key Features
- The **search bar** at the top allows for quick and efficient searching of specific information.
- The **General Index** provides an overview of the broad data collected, offering a summary of standard findings.
The **Leaked Index** highlights sensitive or critical information, helping users quickly identify and prioritize high-priority data.
The **structured layout** divides the page into sections, ensuring an intuitive and efficient user experience.

![image](https://github.com/user-attachments/assets/09cc9dba-85df-4491-9271-82b1768db146)

The home page features a prominent search bar at the top, allowing users to input data for viewing or crawling. Below the search bar, the page is organized into two primary categories. These categories structure the platform’s core data for easy access and analysis.

### Categories Filter
Selecting "Analytics" from the navigation bar displays two categories already available on the home page. This section provides a clear view of the platform’s data results. It is organized into two main categories for streamlined analysis.

1. #### General Index
   
 ![image](https://github.com/user-attachments/assets/2d2aad3e-3e1f-4558-8885-a2e6c99f5cd6)
 
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

![image](https://github.com/user-attachments/assets/e24d4c82-4494-49ae-9878-c2f350d4881a)

In this diagram, the values displayed within the boxes represent the crawling data, which is updated daily. Each box contains two sets of numbers: the top numbers indicate the results of daily data updates, while the bottom numbers represent updates on a weekly basis.

2. #### Leaked Index

![image](https://github.com/user-attachments/assets/5a04980d-d04a-4dbd-a361-f3194c8115d2)

The Leaked Index provides detailed information about the states of leaked data related to the specific information being sought. It helps identify and track sensitive or critical data within the dataset.

### Links Filter
This is the second option in our navigation bar, offering a comprehensive view of all the links/URLs that appear in the search results. These links represent the complete URLs, primarily consisting of the main index pages from the crawled websites. By displaying these URLs, the section provides an overview of the websites that have been explored. It also enables users to track the total number of websites crawled so far, giving a clear picture of the platform’s data collection progress. This feature is useful for reviewing the breadth of data gathered through the crawling process.

![image](https://github.com/user-attachments/assets/62b7996c-b9d8-4f5e-a29e-2271f0f4b930)

On this page, the live onion search table includes various elements that we will discuss individually. Each element plays a crucial role in the search and data retrieval process.
In the first row, we have URLs, followed by the network type.

#### Network Types

- **Onion:** Dark web links.

- **I2P:** Invisible Internet Project links.

- **Clearnet:** Surface web links.

![image](https://github.com/user-attachments/assets/82703f4e-ee8f-4d36-a6d6-83ce4d305b3f)


### Index Menu

The Index Menu includes two categories:

- **General Index**  This section allows us to view all the links crawled in general mode, providing a broad overview of all indexed URLs. It helps track and manage the overall set of data collected during the crawling process.

- **Leaked Index**  In this section, we can view only the links containing leaked data, filtering out non-relevant results. This allows users to focus on sensitive or critical information, streamlining the analysis of potentially high-risk data.

![image](https://github.com/user-attachments/assets/8fa343fa-70cd-4036-837d-167e4ff89b57)

#### Content Option Bar
The content bar offers 10 different options, enabling users to view links based on their specific selection. By default, it is set to the "General" option, displaying a broad range of links. Users can open the dropdown menu to choose from a variety of categories or filters, allowing them to tailor the content to their needs. This feature enhances navigation and makes it easier to access relevant data. It ensures a flexible and user-friendly experience for viewing links.

![image](https://github.com/user-attachments/assets/307b3aa6-3f8c-4d05-afba-90c0f5e575a1)

#### Filter
Next to the content option, there is a small filter icon. Clicking on this icon applies a standard filter to the data, helping users narrow down their search. It streamlines the process of refining results for more targeted insights.

![11111](https://github.com/user-attachments/assets/94b19bee-171b-4a7f-a0a9-9f5d05b2ed3f)



### Onion Crawl Statistics

![image](https://github.com/user-attachments/assets/2419e18f-d78a-40ad-8dea-95ad0247b03b)


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

![image](https://github.com/user-attachments/assets/e6d76c53-7201-491b-8ccc-c868390e16af)

When performing a search, the results are shown in a split view, helping organize the information more effectively. This layout separates different data sets, making it easier for users to focus on specific results. By displaying the data side by side, it allows for quick comparison and detailed analysis. The split view enhances the user experience by simplifying the navigation of search results.

![screencapture-orion-genesistechnologies-org-search-2025-01-08-22_52_19](https://github.com/user-attachments/assets/5430a7c9-d2d8-4b32-8eed-97fe2c5b4b8c)

### Top Bar Options

We have a total of 6 classifiers here.The top bar, displayed post-search, includes the following options:

- **All:** Shows overall data related to the entered keyword.
 
- **Monitor:** We are shown a separate script for each site.

- **Forums:** Displays forum-related results.

- **News:** Highlights news items.

- **Emails:** Lists email-related results.

![image](https://github.com/user-attachments/assets/c88f5db2-cafa-4364-894d-11b91576cdf4)

This will provide us with the overall fetch results related to the keyword.

![image](https://github.com/user-attachments/assets/0c29c908-8b91-4504-9f3b-dae253d1eda9)

### Enable Safe Search Button

The Safe Search feature enhances user safety by filtering out inappropriate or explicit content. To enable this feature:
1. - Locate the Safe Search button.
2. - Click the button to activate safe browsing.
  
![image](https://github.com/user-attachments/assets/f3deed4b-654d-4305-8d2a-6d69f9530eca)

When viewing a site from the search results, its display is based on specific factors.
**Network Type**: The first option at the top shows the network type, such as Onion, I2P, or Clearnet.
**Website Topic**: The next two options provide details about the site’s topic, e.g., forum, leak, cryptocurrency, etc.
**Update Date**: Displays the last update date of the site, along with some additional related data.
**Bottom Tabs**: At the bottom, 2-3 tabs are available:
- The first tab shows the sections of the website.
- The next tab provides information about the type of content available on that website.
- These parameters collectively represent specific details for each site that appears in the search results.

![image](https://github.com/user-attachments/assets/e4be9f60-82bb-4a5a-bc99-ebddbec5dad3)

#### Section Tab
The "Section" tab provides a detailed view of the various sections of the website, highlighting the specific parts being extracted during the data crawling process. This feature helps users identify and understand the structure of the website within the fetched data. 

![image](https://github.com/user-attachments/assets/7a71a046-915a-48b8-b4da-b1ee071c9ed2)

#### Content Tab
Next to it is the content tab, which provides access to all the raw content crawled from the respective site. Clicking on it displays the extracted data in its unprocessed form, allowing for a deeper analysis of the information gathered.

![image](https://github.com/user-attachments/assets/869f1d79-0d94-4913-b056-b5f8155f116b)

In generic crawling, three key aspects can be observed using a machine learning model. On the right side of the page, several parameters of the results are displayed for user convenience:

**Keyword Insight**: This section highlights the fetch results related to the entered search word. It provides detailed insights, including:
- The number of keywords identified during the crawl.
- The total count of documents fetched containing those keywords.
- The number of links or pages retrieved that are associated with the keywords.
These observations offer a clear understanding of how the data is gathered and processed, ensuring that users can analyze the results efficiently and make informed decisions based on the displayed metrics.

![image](https://github.com/user-attachments/assets/22dbcf1e-a7cd-44d7-b094-b3b7d9c4e198)

#### General Coverage
Below this, the "General Coverage" section displays the results in a structured format.
- It first shows the total number of items found during the search.
- Then, it provides a breakdown of active and inactive items, along with the results for seldom active items, offering a clear summary of the data.

![image](https://github.com/user-attachments/assets/1594be14-b37b-4874-b80d-1cba0fa096cf)

#### Unique Results
Afterward, the page presents some unique results for further analysis. The first section displays information about the extracted URLs. Below it, a table lists the unique emails identified during the crawl. This is followed by details about the archive, highlighting unique document files retrieved from the data.

![image](https://github.com/user-attachments/assets/793634ef-c4b1-4faf-a6a1-781ad5f69059)

#### Unique Cellular
This section displays the total number of phone numbers extracted from the crawled data. It provides a clear count for easy reference and analysis.

![image](https://github.com/user-attachments/assets/008afd38-e2b5-4470-ad5a-a9b525f47579)

After viewing the search results, let’s explore the options available in the top navbar step by step. Each option provides specific functionalities for navigating and analyzing data.


### Monitor Section:

Next, we move to the "Monitor" tab in the top menu. This option displays a separate script for each site, providing detailed insights and monitoring capabilities. Additionally, it allows users to include custom scripts, offering flexibility to tailor the monitoring process as needed.

![image](https://github.com/user-attachments/assets/6aa830be-d846-4cc2-9d28-6f56b96cdab1)

### Market Section:
The "Market" section provides insights into the buying and selling activities of various items, whether they involve legal or illegal goods. It acts as a monitoring tool to observe transactions and trends within the marketplace. Essentially, this section serves as a virtual store for tracking the sale and purchase of items on the dark web, offering a comprehensive overview of the trading environment.

![image](https://github.com/user-attachments/assets/b2c65eca-363e-46ef-9c57-6ec3236bbd72)

### Forum Section:
In a forum, various platforms can be utilized, such as blogs, websites, or media channels, to facilitate discussions around the data. These platforms provide spaces for users to share insights, ask questions, and engage in conversations about the relevant information. The forum serves as an interactive space where individuals can contribute their knowledge and collaborate on the topic.

![image](https://github.com/user-attachments/assets/84938ad2-d76b-4099-8424-d47d1666ce83)

### News Section:
The news section allows users to view any news related to the data, provided there is relevant coverage available. It keeps users updated with the latest developments and trends related to the searched data. This section ensures users stay informed about any significant news that may impact their analysis or understanding.

![image](https://github.com/user-attachments/assets/8c86b7df-e7c6-4442-a8a1-5ec14f01493f)

### Email Section: 
By selecting the email option, users can enter any email address to investigate related information. This feature helps identify where the data associated with that email has been leaked or exposed. It provides valuable insights into potential data breaches involving the specified email.

![image](https://github.com/user-attachments/assets/bbcdf2b6-ba60-4bee-adeb-248e0ff3ef09)

### Network type
At the end of the page, there is a button on the platform. When clicked, a dropdown menu appears, providing options to filter the network based on specific criteria. This feature allows users to refine their search or display preferences according to their needs.

![screencapture-orion-genesistechnologies-org-search-2025-01-10-16_32_15](https://github.com/user-attachments/assets/5323f7bd-8576-48e7-bf60-ee1e2d6e7640)

By default, the setting will be set to "All" to display normal results. However, users have the option to modify this setting based on their preferences. This flexibility allows for more customized viewing of the data.

## Overview and Additional Features
This provides an overview of the original scope of our project. Moving forward, we would like to highlight some additional features and elements that we have specifically developed for our client. Along with Orion, which serves as our core platform, we have integrated three other platforms to address various needs. The first is Dozzel, which caters to a particular set of functionalities; the second is Swagger, a tool that helps us manage and test APIs; and the third is Flower, a platform designed for monitoring and managing tasks. Each of these platforms serves a unique purpose, enhancing the overall system and offering greater flexibility and efficiency for the client.

### Dozzel
We have added an extra API to the server to provide insights into server usage. This API tracks the processing activities within the system or software, particularly where machine learning algorithms are running.

- Additionally, it provides detailed logs, monitors system stability, and highlights areas where bugs or issues have occurred.

- It also offers real-time updates on system performance, helps identify potential bottlenecks, and ensures a proactive approach to system optimization and troubleshooting.
- It is providing us data without a server.

![WhatsApp Image 2025-01-14 at 11 24 32 PM](https://github.com/user-attachments/assets/58c3964e-3f14-494e-a91b-2cdadd197b40)

### Swagger.org
After this, we move on to Swagger, which plays a critical role by essentially handling the actual backend operations. Earlier, we discussed Orion, a comprehensive front-side software that provided us with the ability to view and analyze all the data effectively. Orion serves as the interface for interacting with the data, making it user-friendly and accessible. On the other hand, Swagger allows us to dive deeper into the backend processes, giving insights into how the data is being handled and processed behind the scenes. This distinction between front-end visualization and backend operation highlights the complementary roles of Orion and Swagger in managing and understanding the system's functionality.

![WhatsApp Image 2025-01-14 at 11 26 16 PM (1)](https://github.com/user-attachments/assets/16450bc8-8058-4223-a37d-84394ba973ea)

In Swagger, we have several APIs that we can directly use for testing. The biggest advantage of Swagger's APIs is that if you don't want to use our system, you can still run Swagger's APIs on your own system and utilize them.

Swagger operates on our HTTP scheme and provides three main APIs:

**GET/api/directory:** This API allows us to view a list of all available APIs.
**GET /api/insight:** This API provides key insights, which are the results we saw on Orion's front page.
**GET /api/search:** This API enables us to view the search results, showing what we find in response to our search queries.

![image](https://github.com/user-attachments/assets/75e89e94-6727-4278-a01a-4e62781c11b2)

### Models
After this, on the same page, we have several models that are active, including DirectoryResponse, Directory, InsightResponse, GenericModel, LeakModel, SearchResponse, SearchResult, and ErrorResponse.

![image](https://github.com/user-attachments/assets/c5114a92-abac-40fd-89de-f60cc31c1e6b)

To run Swagger, we have been provided with its link. Below, the keys for it are mentioned.

https://swagger.orion.genesistechnologies.org:9443/

### Flower
Next, we have the third tool, called Flowers. This tool helps in situations where we are running multiple crawlers, such as 40 at a time, and some of them either break down or get stuck. It allows us to monitor and debug the crawlers effectively.

Key features of the tool

- Identify which crawler is hitting how many sites simultaneously.
- Monitor how many links each crawler is extracting and bringing back.
- Debug issues such as broken or stuck crawlers during operation.
  
![image](https://github.com/user-attachments/assets/1c8804cd-bb65-4331-9df9-c0e55a4084cc)

In this way, if we need to access a system, a key is required for that system. With the help of this key, we can access its features or resources. These keys related to open sources, specifically TRAEFIK KEYS, DEMO KEYS, and PRODUCTION MODE. These three concepts help us manage demo server access and control features in production.


### Keys
**TRAEFIK KEYS**
TRAEFIK_USERNAME=admin
TRAEFIK_PASSWORD='SHnTUYTIaz7ahQrVeMHVzK4y7PUGXb9VCp3bTYtaLPrUuE8am2ahVjk2dKYzw3C8'

**Description:** These keys are used for both Flower and Dozzle. They allow access to the demo server, enabling users to use it for demonstration purposes.

**DEMO KEYS**
DEMO_USERNAME=demo
DEMO_PASSWORD='TYdycoDuU9U6N6f2B7N8GsxpG3AkkSaOrlX8WBOwJgke3UNYCjgd3owwObGdPrsw'

**Description:** Demo keys are used to provide users with a demo version of the service. By using these keys, users can access a limited, demo server environment to explore features.

**PRODUCTION MODE**
DEMO="0"
API_SWAGGER="1"
PRODUCTION="0"
MAINTAINANCE="0"
PRODUCTION_DOMAIN=*

**Description:** In production mode, we use environmental variables to control and manage the system. This setup is crucial for optimizing performance and making production decisions.


### Control Management System
All these configurations fall under a centralized control management system, which helps in controlling both demo and production environments.
You can use these keys and configurations for demo purposes or to manage a live, production environment.
