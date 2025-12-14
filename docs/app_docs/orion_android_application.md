## Orion Browser

We have also developed a mobile application called **Orion Browser**, which allows users to seamlessly access the Orion Intelligence Tool directly from their mobile devices. Through this browser, users can utilize the same powerful features and capabilities of Orion Intelligence anytime, anywhere—ensuring convenience and mobility without compromising functionality.

:::{admonition} Highlights
:class: tip

- Mobile access to Orion Intelligence
- **Tor Powered** option for `.onion` links
- Privacy-focused browsing controls and proxy management
- Built-in **Support** and troubleshooting tools
:::

:::{grid} 2
:gutter: 2

:::{grid-item-card} Home screen
:::{figure} https://github.com/user-attachments/assets/2fc05f06-b525-4727-8aed-6ccdbcec60f6
:alt: Orion Browser home screen
:width: 300
:align: center
:::
On launch, the main screen provides quick access to core actions and settings.
:::

:::{grid-item-card} Quick actions
:::{figure} https://github.com/user-attachments/assets/107ab055-ace8-498d-a1dd-da084c218972
:alt: Orion Browser quick actions
:width: 300
:align: center
:::
At the bottom of the screen, common actions are available:

- **Tor Powered**: check and open `.onion` links
- **Fast & Secure**: securely access the Orion Intelligence Tool
:::
:::

### Troubleshoot menu (top-right)

When you tap the top-right menu button, a troubleshooting panel appears with:

- **Dismiss**: closes the troubleshooting menu without affecting the app
- **Reset**: closes the app and requires restarting (restores default behavior)

---

### Connect with Your Company

This feature allows users to connect directly with their respective company by entering a unique **4-digit company code**. Once entered, the user gains access to the company’s account and can use paid features according to the organization’s subscription plan.

If the user does not enter a company code, they can continue using the platform in **Try Free** mode with limited features.

:::{figure} https://github.com/user-attachments/assets/bfac15b2-68f3-4532-a73b-a86197452112
:alt: Connect with your company code screen
:width: 300
:align: left
:::

---

### Browser Room

When **Browser Mode** is enabled, the application operates entirely within the dedicated Orion Browser environment, providing a secure and controlled browsing experience.

:::{figure} https://github.com/user-attachments/assets/efbdbb27-7ed7-47b8-87cc-36132a5c7baf
:alt: Browser mode enabled
:width: 300
:align: left
:::

If Browser Mode is disabled, the application opens a web page using **DuckDuckGo**, a privacy-focused search engine. DuckDuckGo does not track user activity, store personal information, or create user profiles. In this mode, the system functions like a standard web browser while maintaining enhanced privacy.

:::{figure} https://github.com/user-attachments/assets/87be8ab7-b680-4315-9d85-edc8895b739d
:alt: DuckDuckGo mode
:width: 300
:align: left
:::

---

### Support

In the browser settings (top right), there is an option labeled **Support**. When clicked, a dedicated support page opens with comprehensive guidance for all browser-related features. Each feature is explained in detail with step-by-step instructions, usage methods, and helpful tips.

:::{figure} https://github.com/user-attachments/assets/0f23d67f-c30d-44ee-b6d0-5c2914bbddc6
:alt: Support screen
:width: 300
:align: left
:::

---

### Settings

Next to Support is the **Settings** area, where users can view and manage browser configuration—including proxy settings. In **Proxy Settings**, the top-right action allows users to connect with support. There is also an **Enable Bridge** option that can be toggled to bypass restrictions when needed.

:::{figure} https://github.com/user-attachments/assets/47fb5c7f-315c-4f1a-b00b-83387f6ea8fc
:alt: Settings entry / proxy settings
:width: 300
:align: left
:::

:::{dropdown} Settings | General
:open:

:::{figure} https://github.com/user-attachments/assets/e984dca7-328d-4811-b5de-b1fb59a92dd7
:alt: General settings screen
:width: 300
:align: left
:::

1. **Home**  
   Customize the default homepage link.  
   Default: `try.orionintelligence.org`  
   You can change it to any preferred page.

2. **New Tab**  
   Open the homepage in a new tab without leaving the current page.

3. **Theme**  
   Choose one of the following:
   - **Dark Theme**: best for low-light environments  
   - **Light Theme**: standard bright interface  
   - **System Default**: follows the device theme  

4. **General Settings**
   - **Full-Screen Browsing**: toggle immersive full-screen mode  
   - **Language**: choose the preferred interface language
:::

:::{dropdown} Settings | Privacy
This section provides tools to keep your identity, browsing activity, and data private while using the browser.

:::{figure} https://github.com/user-attachments/assets/d2de3f98-6a90-4b31-851c-b9e9b28304b8
:alt: Privacy settings screen
:width: 300
:align: left
:::

- **Private Browsing**: helps reduce stored browsing traces
- **Allow JavaScript** (toggle): enables/disables interactive website scripts  
  (Disabling can increase security, but may break some site features.)
- **Block Popup** (toggle): blocks popup ads and unwanted windows  
  (Some legitimate popups like login/verification may not work.)
- **Do Not Track**: sends a request to websites not to track you  
  (Some sites respect it; others ignore it.)
- **Clear Private Data on Exit**: clears history, cookies, cache, and saved site data when the app closes
- **Cookies Settings**:
  - **Enabled**: maximum compatibility
  - **Enabled, excluding tracking cookies**: blocks tracking cookies while keeping most sites functional
  - **Enabled, excluding 3rd-party**: blocks third-party cookies for stronger privacy
  - **Disabled**: maximum privacy (may break logins and sessions)
:::

:::{dropdown} Tracking Protection
:open:

:::{figure} https://github.com/user-attachments/assets/8d608590-b7f0-4561-95b9-54367bab68e9
:alt: Tracking protection screen
:width: 300
:align: left
:::

- **Disable Protection**: allows tracking (lowest privacy)
- **Default (Recommended)**: blocks ads, trackers, and basic fingerprinting while keeping most sites working
- **Strict Policy**: blocks advanced trackers/fingerprinting (strongest privacy; some sites may break)
:::

:::{dropdown} Manage Notification
In Orion Browser, **local notifications** are device alerts shown by the browser—even when the app runs in the background.

:::{figure} https://github.com/user-attachments/assets/7b9de283-705b-4443-b47b-01082f09cca9
:alt: Manage notifications screen
:width: 300
:align: left
:::

Examples of local notifications:
- **Download complete** notification
- **Network status change** (internet lost/restored)
- **Security alerts** for unsafe or suspicious sites
- **New tab / extension activity**
- **Form auto-save reminders**
- **Update notifications**
- **Session restore reminders**
:::

#### Device Notification Settings

This section includes OS-level toggles to control how notifications behave on the device.

:::{figure} https://github.com/user-attachments/assets/f01d180e-6ee4-4510-8301-6801df0fb8f8
:alt: Device notification settings screen
:width: 300
:align: left
:::

- **Allow Notifications**: enables or blocks all Orion Browser notifications
- **Reminder Intensity**: controls how strongly reminders appear (e.g., follow-up prompts)
- **Show Badges**: shows notification counts on the app icon
- **Banners**: shows notifications as banners at the top of the screen
- **Lock Screen**: displays notifications on the lock screen
- **Play Sound**: plays a sound when notifications arrive
- **Vibrate**: enables vibration for notifications
- **Notification Style**: defines how notifications are displayed (system style)

---

### Accessibility

The Accessibility menu allows users to customize display and interaction settings for a more comfortable browsing experience.

:::{figure} https://github.com/user-attachments/assets/c72ba5d7-e7f7-41d0-9935-9781c95416e6
:alt: Accessibility settings screen
:width: 300
:align: left
:::

- **Font Scaling**: use a slider to adjust text size across the browser
- **Interaction**
  - **Enable Zoom**: forces zoom support on all web pages
  - **Voice Input**: dictation in the URL bar for hands-free entry

---

### Clear Private Data

The **Clear Private Data** feature removes browsing information to protect privacy, improve performance, and free storage.

:::{figure} https://github.com/user-attachments/assets/8ca3efd4-7a19-40bd-9d5b-94828918d7c6
:alt: Clear private data screen
:width: 300
:align: left
:::

Available options:
- **Clear Tabs**: closes all tabs and removes session data
- **Clear History**: deletes visited website records
- **Clear Bookmarks**: removes saved bookmarks/favorites
- **Clear Cache**: removes temporary files used for faster loading
- **Clear Site Data**: removes saved website storage (local storage)
- **Clear Session**: ends active sessions and signs you out
- **Clear Cookies**: removes cookies (logins/preferences)
- **Clear Settings**: resets browser/app settings to default

---

### Advanced

The Advanced menu contains settings related to the browser interface and behavior.

:::{figure} https://github.com/user-attachments/assets/73a456a4-e5ce-4465-b739-697f6fca50d8
:alt: Advanced settings screen
:width: 300
:align: left
:::

- **Restore Tabs**: choose whether to restore tabs after restarting (Enable/Disable)
- **Toolbar Theme**: apply website-defined toolbar theme (Enable/Disable)
- **Tab View**
  - **Grid Design**: visual thumbnail grid
  - **List Design**: text-focused list layout
- **Data Saver**
  - **Always Show Images**: full visual experience (uses more data)
  - **Block All Images**: text-first browsing (saves data, faster loads)
- **Show Web Fonts**: allow remote fonts for better visuals (may increase data usage)
- **Background Sound**: allow website audio to continue while the app runs in the background

---

### Proxy Settings

Proxy Settings help enhance privacy and manage Tor connectivity.

:::{figure} https://github.com/user-attachments/assets/c61a53cf-265d-4c66-b7f5-c1e2a1debbfe
:alt: Proxy settings screen
:width: 300
:align: left
:::

Tor routes traffic through multiple encrypted relays to help anonymize browsing activity and protect user identity.

- **Orion Proxy Status**: disabled by default; enable for anonymous/Tor browsing
- **Orion & Bridge Status**
  - **Snowflake Connectivity Status**: bypasses blocking using volunteer proxies that resemble normal HTTPS traffic
  - **Bridge Connectivity Status**: uses non-public Tor entry points to avoid censorship blocks

:::{admonition} Restart required
:class: warning

After changing proxy settings, restart the application. You will be automatically navigated to the Proxy Manager for the changes to take effect.
:::

---

### Rate This App

The Rate This App option redirects users to the Play Store page where they can leave a star rating (1–5) and review. Ratings and reviews help improve performance, usability, and feature direction.

:::{figure} https://github.com/user-attachments/assets/b31f251e-73ee-485e-9373-4f9b7ae00ff8
:alt: Rate this app screen
:width: 300
:align: left
:::

#### Share This App

Share This App generates the official Play Store link and allows users to share it via messaging apps, email, or social media so others can install the browser easily.

:::{figure} https://github.com/user-attachments/assets/703c9b37-1ddf-4c33-86b8-c0241eb480b9
:alt: Share this app screen
:width: 300
:align: left
:::

### Privacy Policy

Opens the official Privacy Policy page explaining what data is collected, how it is used, stored, and protected, as well as user rights for access, control, and deletion.

:::{figure} https://github.com/user-attachments/assets/72fd0559-3916-4ff5-865a-99cd26c66ca6
:alt: Privacy policy screen
:width: 300
:align: left
:::

### Fix Browser

Fix Browser opens a **Troubleshoot** popup with two actions:

- **Dismiss**: closes the popup and returns to the menu without changes
- **Reset**: restores default settings, closes the browser, and requires reopening the app

:::{figure} https://github.com/user-attachments/assets/6ce8c497-1575-48d6-bd88-9b38524e0d4b
:alt: Troubleshoot popup
:width: 300
:align: left
:::
