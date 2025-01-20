from abc import ABC
from typing import List, Tuple, Set
from bs4 import BeautifulSoup
from crawler.crawler_instance.local_interface_model.collector_interface import collector_interface
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig
from crawler.crawler_instance.local_shared_model.leak_data_model import leak_data_model
from crawler.crawler_instance.local_shared_model.card_extraction_model import card_extraction_model
from datetime import datetime


class _darkfeed(collector_interface, ABC):
  _instance = None

  def __init__(self):
    self.soup = None
    self.extracted_data: List[card_extraction_model] = []

  def __new__(cls):
    if cls._instance is None:
      cls._instance = super(_darkfeed, cls).__new__(cls)
    return cls._instance

  @property
  def base_url(self) -> str:
    return "https://darkfeed.io"

  @property
  def rule_config(self) -> RuleModel:
    return RuleModel(m_fetch_proxy=FetchProxy.NONE, m_fetch_config=FetchConfig.SELENIUM)

  def parse_leak_data(self, html_content: str, p_data_url: str) -> Tuple[leak_data_model, Set[str]]:
    self.soup = BeautifulSoup(html_content, 'html.parser')
    data_model = leak_data_model(cards_data=[], contact_link=self.contact_page(), base_url=self.base_url, content_type=["leak"])

    today_date = datetime.today().strftime('%Y-%m-%d')

    for article in self.soup.find_all("article", class_="elementor-post"):
      title_link = article.find("h3", class_="elementor-post__title").find("a")
      url = title_link['href'] if title_link else None
      title = title_link.get_text(strip=True) if title_link else None

      date_element = article.find("span", class_="elementor-post-date")
      posted_date = date_element.get_text(strip=True) if date_element else None

      image_element = article.find("img", class_="attachment-large")
      image_url = image_element['src'] if image_element else None

      if url and title and posted_date:
        content_message = f"{title}, To visit or explore more visit the website: {url}"

        card = card_extraction_model(m_title=title, m_url=url, m_base_url=self.base_url, m_content=content_message, m_content_type="leak", m_logo_or_images=[image_url] if image_url else [], m_last_updated=today_date)
        self.extracted_data.append(card)
        data_model.cards_data.append(card)

    return data_model, set()

  def contact_page(self) -> str:
    return "https://www.linkedin.com/company/darkfeed/"
