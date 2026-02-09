(user-manual)=

# User Documentation

:::{admonition} At a glance
:class: tip

This guide walks through the Orion UI end-to-end (navigation, search, modules, reports, analytics, and supporting tools).
It is formatted for **Sphinx + MyST + Shibuya** (right-side “On this page” enabled).
:::

## Introduction

let's take a look at the admin panel, designed exclusively for administrative users. This section is purpose-built to
allow administrators to configure settings, monitor system performance, and oversee user activities. The diagram below
illustrates the secure and straightforward login process for the admin panel, which is restricted solely to authorized
personnel. Unlike user-facing components of the platform, the admin panel offers advanced tools and features that
provide full control over the system's functionality, ensuring smooth and efficient management of operations.

<img width="1916" height="905" alt="adminlogin" src="https://github.com/user-attachments/assets/ac750d71-a920-4d35-a545-341731e856e6" />



## Homepage Page

The Orion Platform's main interface is designed with user-friendliness in mind, offering intuitive and streamlinedaccess to its wide range of features. When we  log in to Orion, we are presented with a highly attractive dashboard that contains numerous features, which we will explain one by one in the following sections. It seamlessly integrates with advanced machine learning models, significantly enhancing search accuracy and enabling deeper, more intelligent content analysis. Users can efficiently search, filter, and visualize data across multiple categories, making data exploration both effective and insightful. With its robust capabilities, Orion empowers users to uncover patterns, trends, and correlations within vast datasets. This makes it an ideal solution for professionals seeking actionable insights and informed decision-making. The platform's versatility and performance ensure it meets the needs of various industries and use cases.

<img width="1919" height="1079" alt="homepage" src="https://github.com/user-attachments/assets/022963ba-4c8e-41df-85aa-d719ca881edb" />

### Homepage Menu
![hompagemenu](https://github.com/user-attachments/assets/c1da6427-81d7-478d-9e1e-03e08214df40)


**Account**
<img width="1918" height="652" alt="account" src="https://github.com/user-attachments/assets/7915872b-5c3d-4f65-bcd7-a4b8727ee743" />
The Account Settings module allows users to manage and customize their personal account preferences. Within this section, users are provided with several configuration options related to security and appearance.

Firstly, users can manage their login and security settings, including the ability to enable or disable Two-Factor Authentication (2FA) to enhance account security. This allows users to choose the level of protection they require for their accounts.

Secondly, users can customize the application interface according to their preferences. The system provides an option to change the theme, allowing users to switch between Light Mode and Dark Mode for better usability and visual comfort.

These settings are designed to give users greater control over their account security and user experience, ensuring flexibility and convenience while using the system.

**Users**
   ![users](https://github.com/user-attachments/assets/c2ba3864-7d71-4b13-8cf9-36bc9375f1f3)

   The Users module provides functionality to view and manage all users who have been added to the system. In this section, authorized personnel (such as an administrator or tenant manager) can see detailed information about each user.

The displayed information includes:

- User Email Address

- Assigned Role within the system

- Account Status (Active or Inactive)

- Subscription Plan associated with the user

- In addition to viewing user details, the module also provides View and Edit options.

The View option allows administrators to open and review complete user information without making changes. The Edit option allows administrators to modify user details, such as role, status, or other relevant information, as permitted by system policies. This feature helps administrators efficiently monitor, manage, and update user accounts while ensuring proper access control and subscription management.

   **Adduser**
   <img width="1918" height="803" alt="add" src="https://github.com/user-attachments/assets/364b9515-25fa-4f66-83ae-de08162bcb33" />
The Add User feature allows an administrator to manually create and register a new user in the system. When the administrator clicks on the “Add User” option, a user registration form is displayed.

This form requires the administrator to enter the necessary details, including:

- Username

- Email Address

- Password

- Role (as defined in the system)

- Licensing or Subscription Options (to assign the appropriate plan or permissions)

After filling in the required information and submitting the form, the system creates the new user account and assigns the selected role and licensing configuration. This feature ensures that administrators can efficiently onboard new users and configure their access and subscription settings according to organizational requirements.

   **Viewuser**
   
   ![viewuser](https://github.com/user-attachments/assets/f18b94d8-83d5-4d86-be90-5d4a082222bb)

   In this section, we can view all information related to a user. This includes details such as the username, email address, account status (active or inactive), and subscription or license information. It provides a complete overview of each user’s account and access details.

   **Edituser**
   
   <img width="807" height="891" alt="edituser" src="https://github.com/user-attachments/assets/030168b9-7ad4-4d82-9129-6170460f46c3" />



   **Auditlog**
   ![auditlog](https://github.com/user-attachments/assets/9ddff11b-6189-430b-8a04-abec2854983e)

  
   

   **Tenant**
   <img width="1918" height="892" alt="terrnet" src="https://github.com/user-attachments/assets/e649cb49-3bd2-47dd-8ddc-e229331370d9" />

   In this system, the concept of a tenant refers to an independent company or organization that is provided with its own isolated environment. Each company (tenant) will have the ability to create, manage, and maintain its own users internally.

Under this feature, the company will be fully responsible for adding, updating, or removing its users according to its operational requirements. These activities will be performed within the company’s tenant environment, and no involvement from the system’s central administrator will be required. Furthermore, the administrator will not have visibility into or control over the internal user management of each tenant.

This functionality is specifically designed to give companies flexibility and autonomy, allowing them to customize the system usage according to their internal structure, workflows, and policies. The tenant-based approach ensures that each company can configure and utilize the platform independently, without interference, while maintaining proper isolation and data privacy between different tenants.

   

**System Settings**
![systemsetting](https://github.com/user-attachments/assets/aad4a8de-b8bf-4a78-85df-dcc60c4265b7)



### Navbar



## Directory Page

Here’s an overview of the interface components

### Navbar Filter

The navigation bar has been moved to the left side of the page. This adjustment enhances accessibility for users. It also creates a cleaner and more efficient workflow.

<img width="568" height="700" alt="menu" src="https://github.com/user-attachments/assets/a5e649d3-dd30-47e2-9fd7-45c842ba3a54" />


It consists of the following main menu items:

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
   This feature helps identify early indicators of cyber threats, ongoing attacks, or planned activities by malicious
   actors.

6. **Live APIs:** Offers real-time data streams through APIs, facilitating integration with external systems and tools.
   This feature supports continuous monitoring and enables timely responses to evolving cybersecurity events.

7. **Exploit:** The Exploit module in Orion Intelligence enables users to identify, analyze, and simulate known vulnerabilities using CVE data and integrated exploit tools. With AI-powered suggestions, Orion assists in selecting relevant exploits based on system context, helping security teams assess real-world risk faster and more efficiently.
8.  **Feed:** The Feed module delivers real-time updates on cybersecurity threats, CVEs, breaches, and industry trends from trusted global sources. Orion curates and prioritizes the most relevant news, keeping your team informed about emerging risks and developments that could impact your infrastructure or applications.
9.  **Dumps:**  Provides access to large collections of compromised data gathered from various underground and open sources.
These data dumps often include leaked databases, user credentials, email lists, financial records, or other sensitive information.

   In this module, the system actively collects data from:

 **Telegram channels:** Extracts downloadable files and shared dump links related to breaches or leaks.

**Websites and forums:** Scrapes or downloads publicly available or dark web-hosted data dumps posted by malicious
      actors.

**Other open-source intelligence (OSINT) platforms:** Tracks and organizes dump-related information for quick
      analysis.
10. **Stealerlogs:**   In the Stealer Log, we can view leaked credentials. These credentials may be associated with any domain, and their records appear under the ‘Fast Search’ and ‘Full Search’ options. Both of these search methods allow efficient retrieval of compromised data. The detailed functionality of these features will be explained in the following sections.

11. **CTI Graph:** The CTI (Cyber Threat Intelligence) module offers a graph-based view that visualizes complex relationships between key cyber threat entities such as threat actors, malware families, TTPs (tactics, techniques, and procedures), IP addresses, domains, file hashes, and affected organizations. By mapping these connections visually, the module enables users to understand how threats are interlinked, attribute attacks to known groups, and correlate indicators of compromise (IOCs) with previous incidents. This enhances threat hunting, improves situational awareness, and accelerates investigations. The CTI graph integrates intelligence from sources like MITRE ATT&CK, dark web monitoring, and internal alerts to provide contextual, actionable insights.

12. **Onion Link:** The Onion Link feature allows secure access to Orion Intelligence through the Tor browser. By clicking the Orion Link, users can operate the tool anonymously over the dark web, ensuring privacy and resilience in restricted or high-risk environments. Ideal for sensitive investigations and secure threat intelligence operations.

13. **Links:** This module displays links associated with recent data dumps collected from platforms monitored sources. These links typically point to external locations where leaked or compromised data is hosted. By centralizing these dump-related URLs, the platform allows users to quickly access and analyze the raw data or files being circulated in the threat landscape. This feature supports ongoing monitoring of dump activity and helps identify the nature and scope of leaked content.

14. **Documentation:** This section provides comprehensive documentation for all users of the platform. It includes a detailed user manual, explanations about the platform’s features and modules, and developer documentation to guide technical users through integration, API usage, and system architecture. This module ensures that both end-users and developers can easily understand and utilize the platform's full capabilities.

## Homepage

The home page acts as the central hub of the platform, providing users with easy access to the core functionalities. On
the left, there is a sidebar designed for users to quickly navigate to specific sections, streamlining the process of
data retrieval. Below the sidebar, the page is divided into two main sections: the General Index and the Leaked Index.
The Generic Index offers a broad overview of the collected data, summarizing standard findings for users. In contrast,
the Leaked Index focuses on sensitive or critical information, enabling users to easily identify and prioritize
high-priority data. This well-organized structure ensures that users have an intuitive and efficient experience.

### Key Features

- The **search bar** at the top of the interface allows users to quickly and efficiently find specific pieces of
  information. It supports keyword-based queries, making the process of locating data fast and straightforward. This
  feature enhances productivity by reducing the time spent on manual searching.

<img width="981" height="408" alt="searchbar" src="https://github.com/user-attachments/assets/3c2970f3-a0f7-406b-98f6-6bb87f8785ad" />


In this **search bar**, a dropdown appears where we can select and apply different filters. There are two ways to use these filters: At the top, a "List of filters" is displayed, from which we can select the desired ones. Additionally, we can type directly into the search filter input field to find and apply a specific filter. Below this, there is another input field labeled “Enter Entity”, where an additional filter can be applied. When both the upper filter and the lower entity filter are applied together, they provide the most accurate and refined results. And below, in the IOs section, it will display the filter that was selected above, indicating which filter has been applied. In the search bar, we have different types of filters. On the top right side of the search bar, there is a button labeled “Advance”, which can be enabled or disabled. When enabled, a dropdown box appears, displaying the complete list of available filters.

Next to the **Advance button**, there is also a Tools option. When we click on Tools, an additional option appears below titled “Search by (match individual terms)”. Within this, three categories of search modes are available:

- Match Any Term (OR):
This option shows results containing any of the search terms. The results are broader and may include more generic or loosely related data.

- Match All Terms (AND):
This option shows results that contain all of the search terms, but not necessarily in the same order or exact phrasing. The data here is usually more relevant and closely related to the query.

- Match Full Query (Exact Match):
This option only shows results that exactly match the full query entered. If such results exist, they will be displayed; otherwise, no results will appear.

<img width="821" height="167" alt="filterbar" src="https://github.com/user-attachments/assets/d1974392-7a61-4e98-b98d-e16aa2ddd32b" />


Here, we can see the filters that have been applied. There is also a Clear button available, which allows us to remove all the applied filters at once.

#### Statistics

In the statistics section, when we view the chart bars, several results are displayed. The first statistic highlights the top teams that are most frequently involved in leak incidents. The next chart shows the teams associated with website defacement activities. The third statistic presents the top geographic regions with the highest number of defacement incidents. Finally, another chart displays the most frequently used hashtags, reflecting their use in social media activities and related incidents.

<img width="1587" height="300" alt="satistics" src="https://github.com/user-attachments/assets/cb089b53-bd31-4fce-8e27-04491939a7c5" />


#### To Data Leaks

The data is displayed in two rows. The top row contains leak-related results, fetched from Onion, Clearnet, and I2P. Each block includes a “View Detail” option at the bottom, which opens the specific result page with complete information such as related URLs, metadata, JSON report, and other reports linked to the same leak.

The second row presents results related to defacements. Similar to the leaks section, selecting “View Detail” redirects to a detailed result page, where comprehensive insights are available, including the associated network, JSON report, and other relevant information.

<img width="1591" height="523" alt="topleakdata" src="https://github.com/user-attachments/assets/31c25b76-e1e0-4de7-87d2-e757d7483101" />


- The **Generic Index** offers a summarized view of the broad data collected from various sources. It presents standard
  findings in an organized format, giving users a quick understanding of general trends. This helps in forming a base
  for more detailed analysis and decision-making.

- The **Leaked Index** highlights data that is sensitive, confidential, or potentially compromised. It brings attention
  to high-priority information such as leaked credentials, making it easier for users to act quickly. This ensures
  critical threats are addressed before they escalate.

- The **structured layout** of the platform breaks the interface into clear, logical sections for better usability. This
  design allows users to navigate smoothly through different features without confusion. It creates a more intuitive and
  efficient experience for both new and experienced users.

<img width="1657" height="877" alt="indexing" src="https://github.com/user-attachments/assets/dac910ad-bb35-4079-9c74-f4341296c7fb" />


The home page features a prominent search bar positioned at the top, designed to let users quickly input data for either
viewing or initiating a crawl process. This search bar acts as the central entry point for user interaction,
streamlining access to the platform’s core functions. Just below the search bar, the page is neatly divided into two
primary categories, each representing a key area of focus within the system. These categories help organize the data in
a clear and logical manner, allowing users to easily navigate and analyze the content. This structured layout ensures an
efficient and user-friendly experience right from the start.

### Categories Filter

Selecting "Analytics" from the navigation bar takes users to a detailed view that mirrors the two main categories
already shown on the home page. This section is designed to provide a focused look at the platform’s collected data and
analytical results. It presents information in a structured format, allowing users to explore key insights efficiently.
The clear layout supports streamlined analysis and quick interpretation of complex data.

1. #### Generic Index

The "Generic Index" category displays information related to the crawling process, providing users with insights into
various states of the fetched data. These states represent different aspects of the crawling operation, each offering
valuable details. By reviewing the data systematically, one state at a time, users can gain a comprehensive
understanding of the progress and status of the crawl. This structure ensures users can focus on specific areas of
interest without being overwhelmed by unnecessary information.

<img width="1638" height="415" alt="generic index" src="https://github.com/user-attachments/assets/e4e62891-3cb5-4ffe-a353-20c0fc11d93c" />


- **Document Count:** This section provides detailed information about the results obtained after the data is fetched,
  focusing on the total document count. It displays the total number of documents retrieved from the crawl, presented as
  a single count value for clarity. This summary helps users quickly understand the volume of data collected and gauge
  the breadth of the crawl. It offers a snapshot of how extensive the data collection process has been.

- **Most Recent Date:** This state informs users about the most recent updates to the crawled data, ensuring they are
  kept up-to-date with the latest information available. It displays the most recent entries in the dataset, helping
  users quickly identify any new data that has been fetched. This is especially useful for tracking changes and
  monitoring updates in near real-time.

- **Oldes Update:** This section displays information about the oldest updates in the data, indicating when the data was
  last fetched in the past. By showing the oldest updates, users can track long-term changes and identify any outdated
  or irrelevant data. This is useful for distinguishing between fresh data and data that may no longer be applicable or
  valid.

- **Update five days:**   This section provides information about the updates from the last five days, allowing users to
  focus on recent changes that are highly relevant. By highlighting data updates within the past five days, this feature
  helps users quickly analyze recent changes without sifting through older, less relevant data. It ensures the focus
  remains on the most up-to-date information.

- **Update Nine days:**  This section provides insights into the updates from the last nine days, offering users a view
  of changes over a slightly longer period. It helps users monitor data for any significant changes or trends that may
  have developed in the past week or so. This feature is useful for tracking medium-term updates that may not be as
  immediate but are still important for ongoing analysis.

- **Average Score:**  This section displays the average score count of the results, providing users with an overall
  assessment of the data quality. The average score metric is important for evaluating how well the crawling process
  performed in terms of the relevance and quality of the data fetched. It allows users to assess the overall
  effectiveness of the crawling process and decide whether further adjustments are needed.

- **URL/Documents:** This section shows the count of URLs being extracted from the sites during the crawl, offering a
  clear view of the total number of URLs found. By displaying the URL count, users can gauge how many web pages were
  captured during the crawl, helping them understand the extent of the data sourced. This metric is particularly useful
  for analyzing the scale of the crawling operation.

- **Archive/Documents:**  This refers to the number of archived URLs found on each website, allowing users to assess the
  historical relevance of the crawled data. The archived URLs give insight into the longevity and preservation of online
  content, helping users understand how much of the data being crawled has been preserved over time. This is valuable
  for monitoring the ongoing availability of older content.

- **Email/Documents:**  This section will show the number of email addresses found within the crawled data, helping
  users identify key communication points. By tracking the emails found during the crawl, users can extract important
  contact details for analysis. This is crucial for identifying potential communication channels and understanding the
  nature of the content within the dataset.

- **Phone/Documents:** This section indicates how many phone numbers were fetched from each site during the crawl,
  providing users with detailed contact information. By tracking phone numbers, users can understand the level of
  personal or business contact data within the dataset. This feature allows for a deeper analysis of how connected or
  widespread the data is across different platforms.

- **Clearnet/Document:** This section informs users about the clearnet-type URLs that were captured during the crawl. On
  average, each clearnet link provides around four URLs, which belong to the standard public internet network. This
  section helps users understand the volume of accessible, non-hidden data collected, which is essential for
  distinguishing between regular web content and more obscure or private data.

- **Common Type:** These are the general types of data supported by the network, helping users categorize the different
  types of content collected. This section ensures that users can easily understand the variety and scope of data being
  gathered from diverse sources. It also helps in organizing the data into recognizable categories, making analysis more
  straightforward and manageable.

<img width="1638" height="415" alt="generic index" src="https://github.com/user-attachments/assets/dacc2f16-7e5f-4204-9384-093ae371a921" />


In this diagram, the values displayed within the boxes represent the crawling data, which is updated daily. Each box
contains two sets of numbers: the top numbers indicate the results of daily data updates, while the bottom numbers
represent updates on a weekly basis.

2. #### Leaked Index

<img width="1641" height="297" alt="leak index" src="https://github.com/user-attachments/assets/cb4ab8a8-a8b2-490d-a671-bd7730d91814" />


The Leaked Index offers detailed insights into the various states of leaked data within the dataset, specifically
targeting sensitive or confidential information. It helps users identify critical data that has been exposed, making it
easier to track potential risks or security breaches. By providing a clear overview of the leaked data, this index
allows for more focused analysis and prioritization of high-risk information. This feature is essential for ensuring
that important threats are detected and addressed promptly.

3. #### Defacement

The Defacement category allows users to deeply analyze data related to websites that have been compromised or visually
altered by attackers. Within this section, users can:

- View the total number of websites that have been hacked or defaced, giving a comprehensive overview of the scale of
  such incidents. This helps to quantify the number of attacks and monitor the impact on the web ecosystem.

- Identify and filter fake or fraudulent websites among the defaced entries, ensuring that users can focus on legitimate
  threats and exclude irrelevant or misleading data.

- Review technical metrics, such as the server response speed at the time the defacement was detected, offering insights
  into how server performance may have been affected by the attack.

This category provides essential insights into the nature and scale of web defacement incidents, enabling users to track
emerging threats in real time. By understanding the specific vulnerabilities that led to these attacks, users can assess
the overall security posture of affected web servers. Furthermore, this information helps in improving website defense
strategies and mitigating future risks associated with web defacements.

<img width="1647" height="203" alt="defacement" src="https://github.com/user-attachments/assets/9b4ce4c0-9bfd-46e8-b68a-15405d3fd0aa" />


## General Intellignece

This is the second option in the navigation bar, designed to give users easy access to a wide range of data categories.
When a user performs a search using the search bar, the results are automatically displayed based on the query,
providing tailored information for efficient exploration. Within the "General Intelligence" dropdown menu, accessible
through the second navigation option, several subcategories become available, allowing users to delve deeper into
specific areas of interest. These subcategories include General, Forums, News, Stolen Data, Drugs, Hacking,
Marketplaces, Cryptocurrencies, and Leaks, each containing relevant data for the user to explore. Depending on the
search query, users can view data associated with any of these categories, providing them with focused and detailed
information. In the following sections, we will explore each of these subcategories individually to offer a better
understanding of their contents and how users can leverage them effectively.

<img width="1913" height="567" alt="general_intelligence_all" src="https://github.com/user-attachments/assets/5cc296ec-59d6-4e26-9c22-d880ec462269" />


### All

The "All" category offers a comprehensive and unified view of intelligence data, consolidating information from every subcategory under the General Intelligence section. This enables users to access a broad range of data in one place, making it easier to analyze and compare information across various categories. The "All" category serves as a centralized hub for quickly reviewing the full spectrum of collected intelligence.

1. ### General

This section houses a diverse collection of uncategorized intelligence data, encompassing various findings that don’t fit neatly into the more specific categories outlined elsewhere. It includes miscellaneous insights and discoveries gathered from different sources, providing users with a broader scope of information. This section ensures that no valuable data goes overlooked, even if it doesn't fall under a specific category.

<img width="1366" height="424" alt="general feature-modified" src="https://github.com/user-attachments/assets/c55048a7-ae0c-4e9a-870b-97863c4c1660" />


2. ### Forums

In a forum, various platforms can be utilized, such as blogs, websites, or media channels, to facilitate discussions around the data. These platforms provide spaces for users to share insights, ask questions, and engage in conversations about the relevant information. The forum serves as an interactive space where individuals can contribute their knowledge and collaborate on the topic.

<img width="1912" height="563" alt="forums" src="https://github.com/user-attachments/assets/4fae3549-7431-4779-983a-5a0a9c560468" />


3. ### News

The news section allows users to view any news related to the data, provided there is relevant coverage available. It keeps users updated with the latest  developments and trends related to the searched data. This section ensures users stay informed about any significant news that may impact their analysis or understanding.

<img width="1362" height="396" alt="news-modified" src="https://github.com/user-attachments/assets/42410658-8aae-4b97-881c-d01ce42081e2" />


4. ### Stolen

This section lists data breaches that involve the theft of sensitive personal, financial, or business information. It
includes incidents where credentials, credit card dumps, and other confidential data have been exposed, often being sold
or shared on underground platforms. Users can explore the extent of these breaches and gain insights into the
compromised data to assess potential risks.

<img width="1365" height="411" alt="stolen-modified" src="https://github.com/user-attachments/assets/fff50b0f-c738-442c-ac67-6e4227668abc" />


5. ### Drugs

This section monitors and displays listings related to the sale or trade of illegal drugs across dark web marketplaces,
providing a comprehensive overview of illicit activity in this area. By tracking these listings, it helps law
enforcement and monitoring teams stay informed about emerging drug trends, enabling more effective intervention. The
data serves as a valuable resource for identifying new patterns and taking action against illegal drug distribution.

<img width="1266" height="629" alt="drugs-modified" src="https://github.com/user-attachments/assets/e1fff168-0acf-4157-90f4-b1ccc4311a2b" />


6. ### Hacking

Provides valuable insights into hacking-related content, including tutorials on website exploits, malware development,
and discussions or sales of vulnerabilities within hacker communities. It offers a closer look at the tools and
techniques being shared, helping security teams stay informed about potential threats. Monitoring this data is crucial
for understanding evolving hacking methods and strengthening cybersecurity defenses.

<img width="1364" height="426" alt="hacking-modified" src="https://github.com/user-attachments/assets/ca9a4718-1b74-4f10-b5a7-4404b1bc72f4" />


7. ### Marketplaces

Tracks online marketplaces (especially on the dark web) where illicit goods and services are traded. This includes
weapons, fake documents, stolen data, malware, etc.

<img width="1352" height="425" alt="marketplace-modified" src="https://github.com/user-attachments/assets/b0661028-3dbd-4ef2-92db-be86c6885244" />


8. ### Cryptocurrency

Analyzes cryptocurrency-related intelligence including illicit transactions, wallets linked to cybercrime, and usage of
crypto for money laundering or ransom payments.

<img width="1366" height="577" alt="cryptocurrency-modified" src="https://github.com/user-attachments/assets/aef8b237-bf19-4ca3-9606-0fd5c25c9084" />


9. ### Leaks

Focuses on leaked documents, databases, or credentials published online. These could include government files, internal
company data, or proprietary tools that have been exposed.

<img width="1364" height="636" alt="leaks-modified" src="https://github.com/user-attachments/assets/7dfd43c9-f67a-4145-ba51-20c8c1b7fbf3" />


## Data Breach
The Data Breach section in the navigation bar includes six categories:

<img width="1916" height="746" alt="databreach" src="https://github.com/user-attachments/assets/864f5b1c-7f61-433f-9824-0fe23fabff97" />

 **Databases**

This section contains detailed records of actual data breaches, offering in-depth information about compromised credentials, personal details, and other sensitive content. It compiles data gathered from multiple sources, providing a clear picture of the extent and nature of each breach. This helps users assess the impact of these breaches and understand the type of sensitive information that was exposed.

<img width="1917" height="891" alt="database" src="https://github.com/user-attachments/assets/234263fe-87c8-44f9-b62b-14c31ac1632e" />

 **Tracking**
 
 ![tracking](https://github.com/user-attachments/assets/b7719919-c665-4068-b382-bd4f73b959cc)


## Discussion

In discussion, we often receive general results that may appear in various places, such as forums or similar platforms. These outcomes are not always specific and can be found across different sources.

<img width="1917" height="630" alt="image" src="https://github.com/user-attachments/assets/aee08d43-1e09-4ec2-ab34-4fe201686255" />

4. ### Warfare
This section provides curated intelligence on cyber warfare activities, including attacks on critical infrastructure, state-sponsored campaigns, and geopolitical cyber threats. Orion continuously monitors sources for warfare-related incidents, offering organizations timely insights into high-level threats with global implications.

5. ### Cloud
The Cloud module focuses on identifying misconfigurations, leaked credentials, and potential vulnerabilities in cloud environments. Orion scans for exposed cloud assets, such as open buckets, API keys, or improperly secured services, helping teams secure their cloud infrastructure proactively.

2. ### Tracking
This module allows users to check if specific email addresses have been compromised in public or underground data breaches. Orion scans and matches email addresses against known leak databases and provides detailed breach context, including the breach source, exposure date, and type of leaked data.

3. ### Logs
The Logs module offers access to various leaked logs, such as login credentials, FTP details, RDP data, or access tokens. These logs are sourced from underground forums and marketplaces. Orion filters and organizes the data to help security analysts identify unauthorized exposures and potential system risks.


## Defacement

The Defacement section provides access to an archive list of websites that have been compromised or defaced. 

<img width="1907" height="411" alt="defacementmenu" src="https://github.com/user-attachments/assets/422d3ece-3e5f-47d4-a9cb-d7c429946ef8" />


In the Defacement menu, there are three main categories:

**1- Hacked (Website Defacement / Unauthorized Access)**

When an attacker changes the content of a website, such as text, images, or replaces the homepage.

Example: Displaying messages like “Hacked by XYZ.”

**2- Phishing**

When a website is cloned or modified to trick users into providing sensitive information.

Example: Fake login pages used to steal credentials.

**3- Database (Data Breach / Data Dumping)**

When an attacker gains access to the database and leaks, modifies, or deletes its data.

Example: Leaking user emails, passwords, or personal information.

These three categories together make up the major classifications under “Defacement.” When you click on any of these three categories, you get an internal list with certain parameters, which are as follows:
- Serial Number – Unique identifier for each record.

- Base URL – The domain or main address associated with the defaced site.

- IP Address – Link to where the defaced content or evidence is archived.

- Attacker(s) Name – The individual or group responsible for the defacement.

- Team Name (if applicable) – Name of the hacker team involved, if any.

- Web Server Information – Type of web server that was running on the affected site (e.g., Apache, Nginx, etc.).

- Date of Defacement – The date when the defacement occurred.

- Defaced Web URL – Direct link to the defaced website or the affected page.

This module is designed to provide a centralized and searchable database of defaced websites, enabling security teams
and analysts to monitor and investigate web-based attacks efficiently.


## Social

The Social module is designed to monitor and analyze threat intelligence shared across social media and messaging
platforms, with a primary focus on Telegram—a widely used channel among cybercriminal groups for sharing illicit
information. This module integrates directly with selected Telegram channels, groups, and bots that are known to
circulate cyber threat data, including leaked credentials, data dumps, malware samples, and discussions of planned
cyberattacks. In addition, under the social category, there are three more platforms from which Orion Intelligence collects data. These include Twitter, various discussion forums, and Reddit.

**Twitter (now called X)**
A social media platform where people post short messages, news, updates, and opinions.
Orion can collect data from here to monitor trending topics, public opinions, and potential threats being discussed in real-time.

**Forums**
Online discussion boards where people talk about specific topics (e.g., hacking, technology, politics, etc.).
Orion can gather data from forums to track detailed conversations, underground discussions, and community insights that may not appear on mainstream platforms.

**Reddit**
A large online platform made up of “subreddits,” which are communities focused on different topics (like cybersecurity, news, technology, etc.).
Orion can use Reddit to collect data on user discussions, emerging issues, and niche community insights that might highlight potential risks or trends.

<img width="1912" height="855" alt="social" src="https://github.com/user-attachments/assets/230e62db-50e4-4b09-baf7-cd274edee76b" />


## Live APIs

The Live APIs section provides users with real-time investigative tools. In this, the actual data is searched rather than being pre-fed.
It can also include many other features and possibilities. Within this section:

### Email Lookup:

By selecting the email option, users can input any email address to retrieve related breach information. This tool helps
identify where and how the data associated with the entered email may have been leaked or exposed, offering valuable
insights into potential security incidents or data breaches.

### Breach Records:

Below the lookup interface, a list of data breach records is displayed. These records offer additional context and
reference points, allowing users to explore known breaches and validate the exposure of specific information.

<img width="1908" height="826" alt="liveapi" src="https://github.com/user-attachments/assets/054f30cc-25b1-417f-9f02-f3ad350e7312" />


## Exploit

An exploit is a piece of software, code, or technique that takes advantage of a vulnerability or weakness in a system, application, or network. If a program has a flaw (like improper input validation or weak authentication), an exploit can be used to trigger that flaw.
Short answer: they are different kinds of exploit-related information, not all the same thing.

- CVE — a vulnerability identifier (public record of a known flaw).
- Tools — references to exploit modules / PoC code / attacker tools (methods someone could use to exploit a CVE).
- Zero-day — an unpatched, actively exploited vulnerability (high-risk because no vendor patch exists yet).

<img width="1918" height="715" alt="exploit" src="https://github.com/user-attachments/assets/a5683c65-8165-4843-aecd-5b04454168d3" />


**1- CVE:** 
In Orion, CVE (Common Vulnerabilities and Exposures) provides a standardized identifier for publicly known software vulnerabilities (e.g., CVE-2024-xxxx). Each entry includes a stable ID, a brief description, and references to help teams track and remediate issues. Within Orion, the results may include both actual vulnerability records as well as discussion-based references related to those vulnerabilities.

<img width="1908" height="535" alt="cve" src="https://github.com/user-attachments/assets/902e0533-fec6-4e28-8280-e7dd54bfdd71" />


**2- Tools:**
Orion Intelligence includes a tool-discovery feature that identifies which tools are in use (for example, WordPress). It scans those tools for issues and alerts you if it finds bugs or vulnerabilities. The feature provides clear, actionable information about the problem and where it appears. This helps developers quickly prioritize fixes and maintain safer, more reliable systems.

<img width="1905" height="908" alt="tools" src="https://github.com/user-attachments/assets/e1cf46ca-de11-4355-ac74-3b2be4353dee" />


**3- Zeroday:**
A zero-day vulnerability is a previously unknown flaw in a software or system that has not yet been identified or patched by the vendor. Because no fix exists at the time of discovery, it can be exploited immediately by attackers. Orion Intelligence identifies and reports these vulnerabilities in real time, enabling organizations to respond quickly and reduce potential risks.

<img width="1908" height="900" alt="zeroday" src="https://github.com/user-attachments/assets/ee37db76-1753-4f7c-9d7b-00d881d33c9a" />


## Feed

Feed mainly contains news items that may cover any topic or be related to a specific search. Each general feed result can be opened and viewed individually.
You can also plot any result on the CTI graph to see its relationships and context. This lets analysts examine single items and explore their connections visually.

<img width="1913" height="907" alt="feed" src="https://github.com/user-attachments/assets/28ed9fa1-df82-4f31-97ad-3de95c1b26dc" />


## Data Dump

Provides access to large collections of compromised data gathered from various underground and open sources.
These data dumps often include leaked databases, user credentials, email lists, financial records, or other sensitive
information.

- Data is collected from:

- Telegram channels (shared files or links)

- Dark web forums and sites

- Open-source leak platforms

The platform categorizes and indexes this information for further analysis and correlation with threat activity. In the
Data Dumps module, a **filtering option** is available on the right-hand side of the interface. This feature allows
users to selectively view data dumps based on their preferred source. Users can filter dumps originating from specific
websites, Telegram channels, or other monitored resources, enabling more efficient navigation and targeted analysis of
the collected data.

<img width="1903" height="886" alt="dump" src="https://github.com/user-attachments/assets/0b69b04d-4b84-4ddd-898b-b5727a9a9f3f" />


## Stealerlogs

Stealer logs are collections of data harvested by “info-stealer” malware. Credentials in these stealer logs typically consist of usernames, passwords, and sometimes session tokens taken from an infected device.
When viewing credentials, you can often filter or group by domain to see which credentials are associated with a particular service. The typical record layout is: (1) a URL or domain in the first column, (2) the username or email in the second column, (3) the password in the third column — usually stored as a hash rather than the plaintext password — and (4) a timestamp indicating the date and time the credential was leaked.

<img width="1915" height="907" alt="stealerlogs" src="https://github.com/user-attachments/assets/11fba8d7-bfe3-4344-baf7-ec10f2a1a89c" />


## CTI Graph

The CTI (Cyber Threat Intelligence) module offers a graph-based view that visualizes complex relationships between key
cyber threat entities such as threat actors, malware families, TTPs (tactics, techniques, and procedures), IP addresses,
domains, file hashes, and affected organizations. By mapping these connections visually, the module enables users to
understand how threats are interlinked, attribute attacks to known groups, and correlate indicators of compromise (IOCs)
with previous incidents. This enhances threat hunting, improves situational awareness, and accelerates investigations.
The CTI graph integrates intelligence from sources like MITRE ATT&CK, dark web monitoring, and internal alerts to
provide contextual, actionable insights.

<img width="1917" height="911" alt="image" src="https://github.com/user-attachments/assets/2510cf42-0cd7-4c30-825b-e9ca00f9b5b0" />


When the CTI Graph module is clicked, it automatically opens in a new tab. This module displays a connection graph
composed of various nodes, visually representing complex relationships between different cyber threat entities.

On the leftmost side of the interface, there are two levels of filters. In the first-level filter, users can choose from
three categories: Cluster, Document, and Property. Based on the selected category, the second-level filter below
dynamically updates to show options relevant to the chosen category, allowing users to refine and customize the graph
view for more focused analysis.

**Cluster** If the Cluster filter is selected in the first-level filter, the second-level filter presents four options:
General, Leak, Defacement, and Chat.

**Document** If the Document filter is selected, the second-level filter prompts the user to enter a Document ID.

**Property** Similarly, if the Property filter is selected, the second-level filter asks the user to choose a property
type—such as email, hashes, etc.—and then specify the property value for a more targeted query.

<img width="757" height="658" alt="ctifilters" src="https://github.com/user-attachments/assets/6b46a285-8d27-4e27-ba19-41a8848f2686" />


On the rightmost side of the CTI Graph interface, there are several additional options:

- The first option is a toggle to enable or disable physics, which controls the animation and movement behavior of the
  graph nodes.

- The second option allows users to expand the CTI graph for a broader and more detailed view.

- Below that, the Details section displays information related to the filters selected on the left side of the graph,
  providing context about the current view.

- Finally, there is a Color Indicators section, which explains the meaning of different node colors used within the
  graph for easier interpretation.

<img width="257" height="888" alt="togglebar" src="https://github.com/user-attachments/assets/5cf73e5a-6d3e-4da0-9695-ef9b13c412ee" />


## Fillter and Analytics

On the left side of the page, there are two options: Analytics and Filter.

<img width="1918" height="552" alt="filters" src="https://github.com/user-attachments/assets/29b31e54-3d46-4067-8c1a-e4d66df596e8" />


### Analytics:

This section provides insights related to any search performed using the navigation bar. It displays the count of
results corresponding to the selected navigation options.

The first two tables in the Analytics section are:

Keyword Insights Table – This table presents data based on the keywords used during the search.

General Coverage of Results Table – This table provides an overview of the general distribution of the search results.

### Search Results Insights:

This section presents a comprehensive overview of the fetched results based on the entered search word. It provides:

- The number of keywords identified during the crawl.

- The total documents fetched containing those keywords.

- The number of links or pages associated with the keywords.

These insights offer a clear understanding of how data is gathered and processed, enabling users to analyze results efficiently and make informed decisions. Additionally, the General Coverage summary displays the total number of items found during the search, with a breakdown of active, inactive, and seldom active items, ensuring a structured and clear representation of the data.

<img width="492" height="748" alt="keywords" src="https://github.com/user-attachments/assets/aa97e9db-38ef-4fbd-b391-cc325f3f3bb5" />


Below the two tables mentioned above, we have detailed data associated with each category, such as URLs, titles, and
networks. For instance, if the data includes URLs, it displays which specific URLs are available; if it includes titles,
it shows the corresponding records; and if networks are present, it indicates the different types of networks appearing
in the search results.

Each variable can be expanded through a dropdown menu, which reveals separate and specific results related to that
particular variable from the entire search dataset.

<img width="801" height="961" alt="resultparameters" src="https://github.com/user-attachments/assets/08463d80-87d5-4f75-b0a8-af8ebe0fceb6" />


### Filters

The second option alongside Analytics is the Filter menu. When we click on it, an extended submenu appears. This submenu
contains two additional options.
Clicking on this icon applies a standard filter to the data, helping users narrow down their search. It streamlines the
process of refining results for more targeted insights.

<img width="281" height="887" alt="filters2" src="https://github.com/user-attachments/assets/e7f62291-b4e9-4a2d-a223-6a781e875429" />


### Network Types

Onion: Dark web links.

I2P: Invisible Internet Project links.

Clearnet: Surface web links.

<img width="295" height="307" alt="networktype" src="https://github.com/user-attachments/assets/f1351e9e-c3db-4954-87d6-a818f2217645" />


### Enable Safe Search Button

The Safe Search feature enhances user safety by filtering out inappropriate or explicit content. To enable this feature:

1.
    - Locate the Safe Search button.
2.
    - Click the button to activate safe browsing.

<img width="293" height="192" alt="safesearch" src="https://github.com/user-attachments/assets/b205a4ef-e4de-4324-bf80-e1f90d358633" />


### Creation Date

In this, you can select a custom date and view the updated results or sites specific to that date.

<img width="258" height="356" alt="datefilter" src="https://github.com/user-attachments/assets/57f8ab96-faea-4233-919b-d53a027bf053" />


### Mitre TTP

It means that if we select something from the MITRE type, we will see comments or pages related to that attack type,
content that corresponds to the selected attack type.

<img width="257" height="585" alt="mitretype" src="https://github.com/user-attachments/assets/8f85ede7-a823-4ffe-89b3-a1dfedffe1ba" />


### Search Results
In Orion Intelligence there are two types of searches: keyword-based searches and URL-based searches.
If you enter a URL (which may be any website) and click the Run Scan button next to the search bar, Orion immediately begins scanning that site.
Within a few seconds the platform returns all findings related to the URL and presents them as a set of strong and weak parameters for that site.
This allows analysts to quickly see an overall assessment and the specific strengths and weaknesses associated with the scanned website.

<img width="1906" height="911" alt="urlsearch" src="https://github.com/user-attachments/assets/2b321636-ebea-40e2-a728-19ec52a46c42" />


When you enter any keywords into the search bar and press enter, the system processes the input and retrieves relevant
data. It then displays the search results that match the specified keywords. This allows users to efficiently find
information based on their search criteria. The results are presented in an organized format for easy analysis.

<img width="1906" height="911" alt="urlsearch" src="https://github.com/user-attachments/assets/47861a0d-2f8e-4bf9-bd6b-6173057e4f41" />


As shown in the image below, the security scan report displays findings related to that site’s security.
It highlights identified vulnerabilities and weaknesses and provides details needed to assess and remediate each issue.

<img width="1906" height="911" alt="urlsearch" src="https://github.com/user-attachments/assets/58f5cd44-dc0c-43b4-908f-d0fac92638b9" />


In the search results we have two actions: Explore and Open Report.
Clicking Explore takes the specific result into the relevant tool menu—e.g., a social-related result opens the Social menu for deeper inspection.
Open Report opens the full report for that result so you can review all findings and details.

<img width="1156" height="620" alt="searchdetail" src="https://github.com/user-attachments/assets/62fffea6-049e-4d76-bc35-78fcf3d3381f" />


Clicking Open Report redirects to a separate page where detailed information about the selected result is displayed. This allows you to examine that specific result more thoroughly, with all related findings and insights presented in one place.

<img width="1667" height="677" alt="openreport" src="https://github.com/user-attachments/assets/2368921f-d991-4189-bfc3-77e85a6dbc08" />


When performing a search, the results are shown in a split view, helping organize the information more effectively. This
layout separates different data sets, making it easier for users to focus on specific results. By displaying the data
side by side, it allows for quick comparison and detailed analysis. The split view enhances the user experience by
simplifying the navigation of search results. Below the search bar overall fetch results related to the keyword.

<img width="1916" height="897" alt="image" src="https://github.com/user-attachments/assets/5611d6a7-a126-4013-b5d2-3c5798cd56af" />


The detailed view of a search result provides essential information to help users assess the nature of a website before
accessing it. This is followed by the website topic, which typically reflects the site's purpose—such as a forum, leak
site, or cryptocurrency platform.
**Open Report**
When a user clicks on a specific section of the result, a separate menu appears, offering various features related to
the selected site. 

<img width="1917" height="598" alt="image" src="https://github.com/user-attachments/assets/10827be3-337d-48e2-a85b-df9a6d0e64db" />


This menu is designed for quick access to useful tools, including:

**Download:** Allows the user to download available site content
**Print:** Enables printing of the current view or content
**AI Summary:** Search results we receive are in another language, the AI Summary will generate a summary for us in our
preferred language.
**Share Link:** Copies the site’s URL for easy sharing
**Open in New Tab:** Loads the site in a separate browser tab for convenience.
**Open CTI Graph:** This option redirects the user from the search results to the corresponding page on the CTI Graph,
displaying relevant visual relationships based on the selected search item.

In addition to the mentioned details, this section also displays the publish date, network type, last update date,
relevant tags, and the status of the link. The status indicates whether the link is currently active or inactive,
helping users quickly determine if the site is accessible.

#### Search Insight:

In this, if we open any result obtained from the search, the bottom section—referred to as Search Insight—displays
additional parameters related to that site or search result. These may include the section, context, location type, IP
address, and any web links or URLs found within it.

Towards the end, there is a complete menu table available, where several additional elements can be viewed, such as:

#### Section Tab
The "Section" tab provides a detailed view of the various sections of the website, highlighting the specific parts being
extracted during the data crawling process. This feature helps users identify and understand the structure of the
website within the fetched data.

#### Content Tab
Next to it is the content tab, which provides access to all the raw content crawled from the respective site. Clicking
on it displays the extracted data in its unprocessed form, allowing for a deeper analysis of the information gathered.

#### Images
In the Images menu, it displays the number of images related to that particular result.

#### Content Type
Next, we have the Content Type section, which shows the types of content associated with that particular result.

#### Clear Net
After that, there is the Clearnet option, which displays all the links related to the Clearnet that are associated with
the selected result.

#### Person
Then we have the Person option, which displays the names of individuals associated with the selected search result.

<img width="1715" height="822" alt="reports" src="https://github.com/user-attachments/assets/d1bdea60-b148-4f46-94b1-6b24ff9afdb9" />


#### Metadata
Metadata contains different types of information such as website URL, IP address, images, content, telephone numbers, content type, and file paths. It provides a complete overview of all available details related to a given source.

<img width="1627" height="867" alt="metadata" src="https://github.com/user-attachments/assets/dfd00989-4a8d-4eca-86c6-a473a8d2345c" />


#### JSON Response
The JSON response presents information from the same link in a structured format. Each piece of data can be viewed separately and more clearly, making it easier to analyze individual elements.

<img width="1598" height="866" alt="jsonresponse" src="https://github.com/user-attachments/assets/aa4a439d-803a-4347-9d60-ad47aaacbee2" />


#### Related Reports
Related reports display all additional reports connected to the same link being analyzed. This helps identify what other findings or references are linked to that particular source.

<img width="1613" height="627" alt="relatedreports" src="https://github.com/user-attachments/assets/bcea17d6-f1aa-4b3a-bdfe-56df77de3456" />


#### AI Powered Chatbot

Finally, one of the most important features of our tool is the AI-powered chatbot. This intelligent assistant allows users to ask questions about any related report, URL, or dataset and instantly receive clear answers. The chatbot is designed to simplify complex information by providing summaries, highlighting key details, and guiding users toward deeper insights. It also supports interactive queries, enabling users to explore data in a conversational manner rather than searching manually. This feature makes the overall experience more efficient, user-friendly, and highly effective for decision-making.

<img width="387" height="588" alt="chatbot" src="https://github.com/user-attachments/assets/b2f847eb-9981-48d7-9df2-c2f561baa406" />


## Overview and Additional Features

This provides an overview of the original scope of our project. Moving forward, we would like to highlight some
additional features and elements that we have specifically developed for our client. Along with Orion, which serves as
our core platform, we have integrated three other platforms to address various needs. The first is Dozzel, which caters
to a particular set of functionalities; the second is Swagger, a tool that helps us manage and test APIs; and the third
is Flower, a platform designed for monitoring and managing tasks. Each of these platforms serves a unique purpose,
enhancing the overall system and offering greater flexibility and efficiency for the client.

### Dozzel

We have added an extra API to the server to provide insights into server usage. This API tracks the processing
activities within the system or software, particularly where machine learning algorithms are running.

- Additionally, it provides detailed logs, monitors system stability, and highlights areas where bugs or issues have
  occurred.

- It also offers real-time updates on system performance, helps identify potential bottlenecks, and ensures a proactive
  approach to system optimization and troubleshooting.
- It is providing us data without a server.

![WhatsApp Image 2025-01-14 at 11 24 32 PM](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/dozzle.png)


### Swagger.org

After this, we move on to Swagger, which plays a critical role by essentially handling the actual backend operations.
Earlier, we discussed Orion, a comprehensive front-side software that provided us with the ability to view and analyze
all the data effectively. Orion serves as the interface for interacting with the data, making it user-friendly and
accessible. On the other hand, Swagger allows us to dive deeper into the backend processes, giving insights into how the
data is being handled and processed behind the scenes. This distinction between front-end visualization and backend
operation highlights the complementary roles of Orion and Swagger in managing and understanding the system's
functionality.

![WhatsApp Image 2025-01-14 at 11 26 16 PM (1)](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/swegger.png)


In Swagger, we have several APIs that we can directly use for testing. The biggest advantage of Swagger's APIs is that
if you don't want to use our system, you can still run Swagger's APIs on your own system and utilize them.

Swagger operates on our HTTP scheme and provides three main APIs:

**GET/api/directory:** This API allows us to view a list of all available APIs.
**GET /api/insight:** This API provides key insights, which are the results we saw on Orion's front page.
**GET /api/search:** This API enables us to view the search results, showing what we find in response to our search
queries.

![image](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/swegger1.png)


### Models

After this, on the same page, we have several models that are active, including DirectoryResponse, Directory,
InsightResponse, GenericModel, LeakModel, SearchResponse, SearchResult, and ErrorResponse.

![image](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/models.png)


To run Swagger, we have been provided with its link. Below, the keys for it are mentioned.

https://swagger.try.orionintelligence.org:9443/

### Flower

Next, we have the third tool, called Flowers. This tool helps in situations where we are running multiple crawlers, such
as 40 at a time, and some of them either break down or get stuck. It allows us to monitor and debug the crawlers
effectively.

Key features of the tool

- Identify which crawler is hitting how many sites simultaneously.
- Monitor how many links each crawler is extracting and bringing back.
- Debug issues such as broken or stuck crawlers during operation.

![image](https://raw.githubusercontent.com/msmannan00/Orion-Search/refs/heads/trusted-main/docs/screenshots/flowers.png)


In this way, if we need to access a system, a key is required for that system. With the help of this key, we can access
its features or resources. These keys related to open sources, specifically TRAEFIK KEYS, DEMO KEYS, and PRODUCTION
MODE. These three concepts help us manage demo server access and control features in production.

### Keys

**TRAEFIK KEYS**

1. TRAEFIK_USERNAME=admin
2. TRAEFIK_PASSWORD=
('SHnTUYTIaz7ahQrVeMHVzK4y7PUGXb9VCp3bTYtaLPrUuE8am2ahVjk2dKYzw3C8')

**Description:** These keys are used for both Flower and Dozzle. They allow access to the demo server, enabling users to
use it for demonstration purposes.

**DEMO KEYS**

1. DEMO_USERNAME=demo
2. DEMO_PASSWORD=
('contact out agent')

**Description:** Demo keys are used to provide users with a demo version of the service. By using these keys, users can
access a limited, demo server environment to explore features.

**PRODUCTION MODE**

1. DEMO="0"
2. API_SWAGGER="1"
3. PRODUCTION="0"
4. MAINTAINANCE="0"

**Description:** In production mode, we use environmental variables to control and manage the system. This setup is
crucial for optimizing performance and making production decisions.

### Control Management System

All these configurations fall under a centralized control management system, which helps in controlling both demo and
production environments.
You can use these keys and configurations for demo purposes or to manage a live, production environment.
