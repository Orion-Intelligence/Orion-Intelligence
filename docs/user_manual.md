# Welcome to Orion Platform
## Introduction

The Orion Platform is a comprehensive, web-based solution designed for Open Source Intelligence (OSINT) experts. Combining the functionality of a browser, search engine, crawler, and data aggregation tool, Orion empowers users to explore, search, and visualize data efficiently. Built on Docker, Orion features a user-friendly interface for seamless interaction with its powerful Orion Crawler.

First, let's take a look at the admin panel. The diagram below shows the login process for the admin panel, which is exclusively for the admin side and not for users.

![screencapture-orion-genesistechnologies-org-admin-login-2025-01-10-15_36_48](https://github.com/user-attachments/assets/e183130b-3ae4-40ae-881a-2aa7887ae32d)


# User Interface Overview:
## Main Page

The Orion Platform's main interface offers users straightforward access to its features. It integrates with machine learning models to improve search accuracy and enable advanced content analysis. Orion provides a variety of functions, such as searching, filtering, and visualizing data across multiple categories, making it a powerful tool for exploring data and gathering insights.

![screencapture-orion-genesistechnologies-org-2025-01-08-11_43_05](https://github.com/user-attachments/assets/4477474f-51b7-4f18-9fd6-7d02110ec9ab)

Here’s an overview of the interface components:
## Navbar

The top navigation bar consists of three main menus:

1. **Home:**  Navigates back to the main page.

2. **Links:** Shows the crawled links stored in the database.

3. **Analytics:** This is displayed on our home page, showing the two types of data results provided: Generic Results and Leaked Index.


![image](https://github.com/user-attachments/assets/377c4865-03c4-4d53-89d8-f31c2d27685c)

Let’s talk about the home page, which is the main part of the platform. It has three main sections. First, there’s a search bar to help users look for specific information. Next, the home page is divided into two main categories: General Index and Leaked Index. Let’s explain these sections in more detail.

## Categories:
The platform is divided into two primary categories:

1. ### General Index:

 ![image](https://github.com/user-attachments/assets/2d2aad3e-3e1f-4558-8885-a2e6c99f5cd6)

The "General Index" category contains information related to crawling, where various states can be observed. All these states are associated with the fetched data, which can be reviewed one by one.


- **Document Count:** This will provide information about the results obtained after fetching the data, specifically the count of documents. It gives us the total number of documents as a single count value..

- **Most Recent Date:** This state will inform us about the most recent updates to our crawled data.

- **Oldes Update:** This section will display the results related to the oldest updates in the data, showing when the data was fetched in the past.

- **Update five days:**   This section will provide information about the updates from the last 5 days. 

- **Update Nine days:** This section will provide information about the updates from the last 9 days.

- **Average Score:**  An average score count of our results will be displayed here.

- **URL/Documents:** The count of URLs being extracted from our document will be displayed here.
- **Archive/Documents:**  we will get the count of archived documents.
- **Email/Documents:**  This section will show us the number of emails in our fetched data.
- **Phone/Documents:** The phone section will indicate how many phone numbers are being fetched from our data.
- **Clearnet/Document:** This section informs us about the normal rate of URLs being displayed. On average, each link provides around 4 URLs, which belong to the clearnet, a standard type of network.
- **Common Type:** These are the general types supported by our network.



2. ### Leaked Index:

![image](https://github.com/user-attachments/assets/5a04980d-d04a-4dbd-a361-f3194c8115d2)

Leak Index Provides us certain states information about leaked data related to the required information.




## Links:

![image](https://github.com/user-attachments/assets/8f296c1d-66b0-49a1-bc39-6d1f6347e8fd)

The Links menu contains crawled links added to the database post-crawling.Basically It contains crawling filters.

![image](https://github.com/user-attachments/assets/a2960cba-49c8-4eb0-9db2-6f819d3ecc8b)

It is categorized into:

### Network Types:

- **Onion:** Dark web links.

- **I2P:** Invisible Internet Project links.

- **Clearnet:** Surface web links.

![image](https://github.com/user-attachments/assets/54be404e-ada8-4037-ac9a-bef27d671df4)

### Index Menu:

The Index Menu includes two categories:

- **General Index**

- **Leaked Index**

![image](https://github.com/user-attachments/assets/061b00f9-c376-4651-b435-5227e8aede86)

### Content Option Bar
Users can select their research content via the Content Option Bar, enabling them to focus on specific topics or data sets.

![image](https://github.com/user-attachments/assets/d770fd5c-a4c5-42a9-9fc5-b5267305e677)

## Live Onion Search Table

The Live Onion Search Table displays real-time search results in a structured format:

| Column        | Description                              |
|-------------|------------------------------------------|
| **ID**      | Unique identifier for each result.       |
| **Service URLs**   | URLs of the services found. |
| **Status** | Indicates the data category (e.g., leaked, forums, cryptocurrency, general). |
| **URL**   | Displays whether the URL is active or inactive. |
| **Leak Status**   | Specifies whether the leak is active or inactive. |
| **Network Type**   | Indicates the type of network (e.g., Onion, I2P, Clearnet). |


- **Links Panel:** Contains links related to the keyword.

- **Statistical Panel:** Displays statistical insights such as:

- **Keyword Insights:** Provides analytical data about the keyword.

- **Results General Coverage:** Highlights the overall data coverage.

- **Unique URLs:** Lists distinct URLs.

- **Unique Documents:** Displays unique documents related to the keyword

## Search Results

When you type two keywords into the search bar and press enter, the system will retrieve and display data related to those keywords.

![image](https://github.com/user-attachments/assets/e6d76c53-7201-491b-8ccc-c868390e16af)

When performing a search, the results are displayed in a split view:

![screencapture-orion-genesistechnologies-org-search-2025-01-08-22_52_19](https://github.com/user-attachments/assets/5430a7c9-d2d8-4b32-8eed-97fe2c5b4b8c)



## Top Bar Options

We have a total of 6 classifiers here.The top bar, displayed post-search, includes the following options:

- **All:** Shows overall data related to the entered keyword.
 
- **Monitor:** We are shown a separate script for each site.

- **Forums:** Displays forum-related results.

- **News:** Highlights news items.

- **Emails:** Lists email-related results.

![image](https://github.com/user-attachments/assets/c88f5db2-cafa-4364-894d-11b91576cdf4)

This will provide us with the overall fetch results related to the keyword.

![image](https://github.com/user-attachments/assets/0c29c908-8b91-4504-9f3b-dae253d1eda9)


## Enable Safe Search Button

The Safe Search feature enhances user safety by filtering out inappropriate or explicit content. To enable this feature:
1. - Locate the Safe Search button.
2. - Click the button to activate safe browsing.
  
![image](https://github.com/user-attachments/assets/f3deed4b-654d-4305-8d2a-6d69f9530eca)

When the search results are displayed, if we view a site from the results, it will be based on certain factors. At the top, the first option will indicate the network type, which could be Onion, I2P, or Clearnet. The next two options will provide information about the website’s topic, such as whether it is a forum, a leak, or related to cryptocurrency, etc.
Next, it will display the update date of the site along with some related data. At the bottom, there are 2 or 3 additional tabs. The first tab is for the section, and the next tab indicates the type of content on that website.
Basically, these upper and top parameters represent the specific results for each site that appears in our search.

![image](https://github.com/user-attachments/assets/3e148fad-9b0c-4b4b-883e-645d15e8922b)

The "Section" tab essentially shows the different sections of the website, indicating which sections are being extracted from the site within our data.

![image](https://github.com/user-attachments/assets/759126ba-d827-4287-ab92-9296d54b094d)


In generic crawling, basically, three things can be observed through a machine learning model. on the right side of the page, some parameters of the results are displayed. The first is "Keyword Insight," which shows the fetch results related to our search word. It provides information about how many keywords were found, how many related documents were fetched, and how many links or pages were retrieved.

![image](https://github.com/user-attachments/assets/22dbcf1e-a7cd-44d7-b094-b3b7d9c4e198)


Then below, we have some results under "General Coverage," which first display the total found items, followed by the breakdown of active and inactive items, and finally show the results for seldom active items.

![image](https://github.com/user-attachments/assets/1594be14-b37b-4874-b80d-1cba0fa096cf)

After that, our page displays some unique results. The first section provides information about the extracted URLs. Below that, a table shows unique emails, followed by details about the archive, which highlights unique document files.

![image](https://github.com/user-attachments/assets/793634ef-c4b1-4faf-a6a1-781ad5f69059)



Now, we move to the next tab in the top menu, which is named "Monitor." In the monitor option, we are shown a separate script for each site.Custom scripts can also be included in this.

![image](https://github.com/user-attachments/assets/43a8a6fa-6704-4f6a-895e-9536491a6c22)


In the marketp, we can observe whether the buying and selling of any item is taking place, whether it pertains to legal or illegal goods. We can describe this as a store for the sale and purchase of items on the dark web.

![image](https://github.com/user-attachments/assets/0ae606dd-1592-42f3-ba28-a0a328e5eee3)

In a forum, any of our platforms can be used, such as a blog, website, or media channel, where we can have discussions related to that data.

![image](https://github.com/user-attachments/assets/6636e260-69bf-46d2-8ba3-f6eb1780a571)

In the news section, we can view any news related to that data if available.

![image](https://github.com/user-attachments/assets/ae1979d5-8dee-4085-b551-8208ff5e5532)

By going to the email option, we can enter any email and check the related information to see where the data from this email has been leaked.

![image](https://github.com/user-attachments/assets/bbcdf2b6-ba60-4bee-adeb-248e0ff3ef09)


After this, at the end, there is a button on our platform. When we click on it, a dropdown menu appears, allowing us to filter our network.

![image](https://github.com/user-attachments/assets/b84d6c94-6486-42ec-b4c3-c216e936d56e)









## Conclusion

The Orion Platform offers a robust toolset for OSINT professionals, enabling efficient exploration and analysis of data. By following this manual, users can maximize their productivity while maintaining a safe and ethical approach to dark web research.








