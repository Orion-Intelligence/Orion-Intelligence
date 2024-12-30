import re
from abc import ABC
from typing import List, Set, Tuple
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from crawler.crawler_instance.local_interface_model.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.card_extraction_model import card_extraction_model
from crawler.crawler_instance.local_shared_model.leak_data_model import leak_data_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_services.shared.helper_method import helper_method

class _ddosecrets(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self):
        self.soup = None
        self._initialized = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(_ddosecrets, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def base_url(self) -> str:
        return "https://ddosecrets.com"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_sub_url_length=10000, m_fetch_proxy=FetchProxy.NONE, m_fetch_config = FetchConfig.SELENIUM)

    @staticmethod
    def clean_text(text: str) -> str:
        return " ".join(text.split()).strip()

    def parse_leak_data(self, html_content: str, p_data_url: str) -> Tuple[leak_data_model, Set[str]]:
        self.soup = BeautifulSoup(html_content, 'html.parser')

        data_model = leak_data_model(
            cards_data=[],
            contact_link=self.contact_page(),
            base_url=self.base_url,
            content_type=["leak"]
        )
        sub_links = []
        if "/article/" in p_data_url:
            cards = self.extract_cards('content', p_data_url)
            data_model = leak_data_model(
                cards_data=cards,
                contact_link=self.contact_page(),
                base_url=self.base_url,
                content_type=["leak"]
            )
        else:
            all_categories_links = self.extract_links_from_class('div', 'all-categories')
            drill_in_article_links = self.extract_links_from_class('article', 'drill-in')
            drill_in_div_links = self.extract_links_from_class('a', 'drill-in')
            sub_links = list(set(all_categories_links + drill_in_article_links + drill_in_div_links))

        return data_model, set(sub_links)

    def extract_links_from_class(self, tag: str, class_name: str) -> List[str]:
        elements = self.soup.find_all(tag, class_=class_name)
        links = []
        for element in elements:
            if tag == 'a':
                href = element.get('href')
                if href:
                    links.append(urljoin(self.base_url, href))
            else:
                links.extend(
                    urljoin(self.base_url, a['href']) for a in element.find_all('a', href=True)
                )
        return links

    def extract_cards(self, container_class: str, url: str) -> List[card_extraction_model]:
        container = self.soup.find_all(lambda tag: tag.has_attr('class') and tag['class'] == [container_class])
        new_cards_data = []

        for card in container:
            title = card.find('h1').get_text(strip=True) if card.find('h1') else ""
            metadata = card.find(class_="metadata")
            leakdate = card.find(class_="meta")
            article_content = ""
            if card.find(class_="article-content"):
                article_content = re.sub(r'[\n\r]+', '', card.find(class_="article-content").text)

            metadata_dict = {}
            if metadata:
                for p in metadata.find_all('p'):
                    label_element = p.find('span', class_='label')
                    link_element = p.find('a', href=True)

                    if label_element:
                        label_text = label_element.get_text(strip=True).replace(":", "")

                        if link_element:
                            link_href = urljoin(self.base_url, link_element['href'])
                            metadata_dict[label_text] = f"{link_href}"
                        else:
                            metadata_dict[label_text] = p.get_text(strip=True).replace(label_element.get_text(strip=True), "").strip()

            source_url = metadata_dict.get("Source", "")
            download_link = metadata_dict.get("Download", "")
            magnet_link = metadata_dict.get("Magnet", "")
            torrent_link = metadata_dict.get("Torrent", "")
            external_link = metadata_dict.get("External Collaboration Link", "")
            if isinstance(external_link, str):
                external_link = [external_link]

            card_data = card_extraction_model(
                m_leak_date = leakdate.text.replace("Published on ",""),
                m_title=title,
                m_url=url,
                m_network=helper_method.get_network_type(self.base_url).value,
                m_base_url=self.base_url,
                m_content=article_content,
                m_important_content=article_content,
                m_weblink=[source_url],
                m_dumplink=[download_link, magnet_link, torrent_link],
                m_extra_tags=external_link,
                m_content_type="general"
            )
            new_cards_data.append(card_data)

        return new_cards_data

    def contact_page(self) -> str:
        return urljoin(self.base_url, "/?contact")
