from abc import ABC
from datetime import datetime
from typing import List
from bs4 import BeautifulSoup
from playwright.sync_api import Page
from urllib.parse import urljoin
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.log_manager.log_controller import log
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _csocybercrime(leak_extractor_interface, ABC):
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(_csocybercrime, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, callback=None):
        if self._initialized:
            return
        self.callback = callback
        self._card_data = []
        self._entity_data = []
        self.soup = None
        self._redis_instance = redis_controller()
        self._is_crawled = False
        self._initialized = True

    def init_callback(self, callback=None):
        self.callback = callback

    @property
    def seed_url(self) -> str:
        # Starting URL for the CSO Cybercrime section (page 1)
        return "https://www.csoonline.com/uk/cybercrime/"

    @property
    def developer_signature(self) -> str:
        return "name:signature"

    @property
    def base_url(self) -> str:
        return "https://www.csoonline.com"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.NONE, m_fetch_config=FetchConfig.PLAYRIGHT, m_threat_type=ThreatType.NEWS)

    @property
    def card_data(self) -> List:
        return self._card_data

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def entity_data(self) -> List:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(
            command, [key + self.__class__.__name__, default_value, expiry]
        )

    def contact_page(self) -> str:
        return self.base_url

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback and self.callback():
            self._card_data.clear()
            self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        self._is_crawled = False

        page.add_init_script("""(() => {
               window.addEventListener('DOMContentLoaded', () => {
                   try {
                       const modalBtn = document.querySelector("body > div.subscribers-modal-container.aae7b662c59641bfa43e91a5d7a53ef8 > div.subscribers-modal.aae7b662c59641bfa43e91a5d7a53ef8.subscribers-modal-bottom-left > div.subscribers-actions > button.secondary-action.subscribers-no-button");
                       if (modalBtn) modalBtn.click();
                   } catch (e) {}
               });
           })();""")

        all_links = set()


        for page_num in range(1, 2):
            page_url = self.seed_url.rstrip('/') + (f"/page/{page_num}/" if page_num > 1 else "")
            page.goto(page_url, wait_until="domcontentloaded", timeout=60000)
            page.wait_for_load_state("networkidle")

            soup = BeautifulSoup(page.content(), "html.parser")
            for tag in soup.select("a[href*='/article/']"):
                href = tag.get("href")
                if href:
                    full_url = href if href.startswith("http") else urljoin(self.base_url, href)
                    if "/cybercrime/" in full_url or "/article/" in full_url:
                        all_links.add(full_url)

        for idx, link in enumerate(all_links, 1):
            try:
                page.goto(link, wait_until="domcontentloaded", timeout=60000)
                page.wait_for_selector("article, div.article-body, div.content, section.article__body", timeout=10000)

                soup = BeautifulSoup(page.content(), "html.parser")
                title_tag = soup.select_one("h1")
                title = title_tag.get_text(strip=True)

                content_tag = soup.select_one("article") or \
                              soup.select_one("div.article-body") or \
                              soup.select_one("div.content") or \
                              soup.select_one("section.article__body")

                full_text = ""
                if content_tag:
                    paragraphs = content_tag.find_all("p")
                    if paragraphs:
                        full_text = "\n".join(p.get_text(strip=True) for p in paragraphs)
                    else:
                        full_text = content_tag.get_text(separator="\n", strip=True)

                lines = [line.strip() for line in full_text.splitlines() if line.strip()]
                first_two_lines = "\n".join(lines[:2])
                article_date = datetime.strptime(page.locator('div.card__info.card__info--light span').nth(0).text_content().strip(), '%b %d, %Y').date()

                card_data = leak_model(
                    m_screenshot="",
                    m_title=title,
                    m_weblink=[link],
                    m_dumplink=[link],
                    m_url=link,
                    m_base_url=self.base_url,
                    m_content=first_two_lines,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_important_content=f"{title}\n{full_text}",
                    m_content_type=["news"],
                    m_leak_date=article_date,
                )
                entity_data = entity_model(m_team="CSO Cybercrime Section")

                self.append_leak_data(card_data, entity_data)

            except Exception as e:
                log.g().e(e)
                continue

        self._is_crawled = True


