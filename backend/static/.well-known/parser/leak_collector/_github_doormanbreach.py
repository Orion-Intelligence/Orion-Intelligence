from abc import ABC
from typing import List
from playwright.sync_api import Page
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method
from bs4 import BeautifulSoup
import re

class _github_doormanbreach(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self, callback=None):

        self.callback = callback
        self._card_data = []
        self._entity_data = []
        self.soup = None
        self._initialized = None
        self._redis_instance = redis_controller()

    def init_callback(self, callback=None):

        self.callback = callback

    def __new__(cls, callback=None):

        if cls._instance is None:
            cls._instance = super(_github_doormanbreach, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def seed_url(self) -> str:
        return "https://github.com/doormanBreach/DataBreaches"

    @property
    def base_url(self) -> str:
        return "https://github.com/doormanBreach"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.NONE, m_resoource_block=False, m_fetch_config=FetchConfig.PLAYRIGHT)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "https://github.com/doormanBreach/DataBreaches"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):

        is_crawled = bool(self.invoke_db(REDIS_COMMANDS.S_GET_BOOL, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + self.__class__.__name__, False, None))
        if is_crawled:
            return

        hrefs = page.eval_on_selector_all(
            'a.Link--primary',
            'els => els.map(e => e.getAttribute("href"))'
        )

        md_links = []
        seen = set()
        for href in hrefs:
            if href and href.endswith('.md') and '/blob/' in href and href not in seen:
                full_url = 'https://github.com' + href
                md_links.append(full_url)
                seen.add(href)

        md_links = list(dict.fromkeys(md_links))

        for idx, md_url in enumerate(md_links, start=1):
            page.goto(md_url)
            page.wait_for_selector('article.markdown-body')
            article = BeautifulSoup(page.content(), 'html.parser').find('article', class_='markdown-body')
            if not article:
                continue

            title = article.find('h1').get_text(strip=True) if article.find('h1') else ""



            description, date = "", ""
            desc_h2 = article.find('h2', string=lambda s: s and 'Description' in s)
            if desc_h2:
                section_texts = []
                for sibling in desc_h2.find_parent().find_next_siblings():
                    if sibling.name == 'h2' or (sibling.name == 'div' and sibling.find('h2')):
                        break
                    if sibling.name == 'p':
                        section_texts.append(sibling.get_text(strip=True))
                    elif sibling.name == 'ul':
                        section_texts += [li.get_text(strip=True) for li in sibling.find_all('li')]
                if section_texts:
                    if re.search(
                            r'(\d{4}-\d{2}-\d{2}|January|February|March|April|May|June|July|August|September|October|November|December)',
                            section_texts[0], re.I):
                        date = section_texts.pop(0)
                    description = " ".join(section_texts)



            breached_data = ""
            bd_h2 = article.find('h2', string=lambda s: s and 'Breached data' in s)
            if bd_h2:
                fields = []
                for sibling in bd_h2.find_parent().find_next_siblings():
                    if sibling.name and sibling.name.startswith('h'):
                        break
                    txt = (
                        sibling.get_text(strip=True)
                        if sibling.name == 'p'
                        else ", ".join(li.get_text(strip=True) for li in sibling.find_all('li'))
                        if sibling.name == 'ul'
                        else ""
                    )
                    for item in re.split(r',\s*', re.split(r'\s*breach.*', txt, flags=re.I)[0]):
                        if re.search(r'(address|password|username|phone|name|date|gender)', item, re.I):
                            fields.append(item.strip())
                breached_data = ", ".join(fields)



            download_links = []
            download_h2 = article.find('h2', string=lambda s: s and 'Free download Link' in s)
            if download_h2:
                candidates = []
                p_links = download_h2.find_next_sibling('p')
                if p_links:
                    candidates += [a['href'] for a in p_links.find_all('a', href=True)]
                candidates += [
                    a['href']
                    for a in download_h2.find_all_next('a', href=True)
                    if a.find_previous('h2') is download_h2
                ]
                download_links = list(dict.fromkeys(
                    [link for link in candidates if 'github.com' not in link and link.startswith('http')]))

            m_content = f"Title: {title} Date: {date} Description: {description} Breached data: {breached_data} Download links: {download_links}"

            card_data = leak_model(
                m_title=title,
                m_url=md_url,
                m_base_url=self.base_url,
                m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
                m_content=m_content,
                m_network=helper_method.get_network_type(self.base_url),
                m_important_content=description,
                m_dumplink=download_links,
                m_content_type=["leaks"],
                m_leak_date=helper_method.extract_and_convert_date(date)
            )

            entity_data = entity_model(
                m_team="doormanBreach",
            )

            self.append_leak_data(card_data, entity_data)
        self.invoke_db(REDIS_COMMANDS.S_SET_BOOL, CUSTOM_SCRIPT_REDIS_KEYS.URL_PARSED.value + self.__class__.__name__, True, None)
