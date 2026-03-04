import time as _time

from abc import ABC
from typing import List

from playwright.sync_api import Page

from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.shared.helper_method import helper_method


class _akiral2iz6a7qgd3ayp3l6yub7xx2uep76idk3u2kollpj5z3z636bad(leak_extractor_interface, ABC):
    _instance = None

    def __init__(self, callback=None):
        self.callback = callback
        self._card_data = []
        self._entity_data = []
        self.soup = None
        self._initialized = None
        self._redis_instance = redis_controller()
        self._is_crawled = False

    def init_callback(self, callback=None):
        self.callback = callback

    def __new__(cls, callback=None):
        if cls._instance is None:
            cls._instance = super(_akiral2iz6a7qgd3ayp3l6yub7xx2uep76idk3u2kollpj5z3z636bad, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    def developer_signature(self) -> str:
        return "open:open"

    @property
    def seed_url(self) -> str:
        return "https://akiral2iz6a7qgd3ayp3l6yub7xx2uep76idk3u2kollpj5z3z636bad.onion/"

    @property
    def base_url(self) -> str:
        return "https://akiral2iz6a7qgd3ayp3l6yub7xx2uep76idk3u2kollpj5z3z636bad.onion/"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_timeout=57200, m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT,
                         m_resoource_block=False, m_threat_type=ThreatType.LEAK)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "https://akiral2iz6a7qgd3ayp3l6yub7xx2uep76idk3u2kollpj5z3z636bad.onion/"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):

        tor_timeout = 60000
        collected_hashes = set()
        last_data_time = _time.time()

        def handle_response(response):
            nonlocal last_data_time
            try:
                if "application/json" not in response.headers.get("content-type", ""):
                    return

                data = response.json()
                objects = data.get("objects")

                if not objects:
                    return

                body_hash = hash(str(objects))
                if body_hash in collected_hashes:
                    return

                collected_hashes.add(body_hash)
                last_data_time = _time.time()

                for item in objects:
                    name = item.get("name", "").strip()
                    desc = item.get("desc", "").strip()
                    url = item.get("url", "").strip()

                    if url.startswith("[[!;;;;") and "]" in url:
                        url = url.split("]")[0].replace("[[!;;;;", "").strip()

                    magnet = ""
                    if "magnet:?" in desc:
                        magnet = desc[desc.find("magnet:?"):].split()[0]

                    m_content = f"Name: {name}\nDescription: {desc}\nMagnet: {magnet}\nURL: {url}"
                    dump_links = [x for x in [magnet, url] if x]

                    card_data = leak_model(
                        m_title=name if name else "Unknown",
                        m_url=page.url,
                        m_base_url=self.base_url,
                        m_screenshot=helper_method.get_screenshot_base64(page, name, self.base_url),
                        m_content=m_content,
                        m_network=helper_method.get_network_type(self.base_url),
                        m_important_content=desc[:500],
                        m_dumplink=dump_links,
                        m_content_type=["leaks"],
                    )

                    entity_data = entity_model(
                        m_scrap_file=self.__class__.__name__,
                        m_team="akira",
                    )

                    self.append_leak_data(card_data, entity_data)

            except Exception:
                pass

        page.on("response", handle_response)

        try:
            page.wait_for_selector('textarea.cmd-clipboard', timeout=tor_timeout)

            page.click('textarea.cmd-clipboard')
            page.wait_for_timeout(500)

            page.keyboard.press("Space")
            page.wait_for_timeout(200)
            page.keyboard.press("Backspace")
            page.wait_for_timeout(300)

            page.keyboard.type("leaks", delay=120)
            page.keyboard.press("Enter")

            page_num = 1
            no_data_count = 0
            max_no_data_attempts = 3

            while True:
                page.wait_for_timeout(2000)

                page.click('textarea.cmd-clipboard')
                page.wait_for_timeout(300)

                page.keyboard.press("Control+A")
                page.wait_for_timeout(100)
                page.keyboard.press("Backspace")
                page.wait_for_timeout(300)

                cmd = f"leaks --page {page_num}"

                page.keyboard.type(cmd, delay=120)
                page.wait_for_timeout(500)

                page.keyboard.press("Enter")

                start_time = _time.time()
                got_data = False
                response_timeout = 15

                while _time.time() - start_time < response_timeout:
                    page.wait_for_timeout(500)
                    if _time.time() - last_data_time < 2:
                        got_data = True
                        break

                if not got_data:
                    no_data_count += 1
                    if no_data_count >= max_no_data_attempts:
                        break
                else:
                    no_data_count = 0

                page_num += 1

                if page_num > 1000:
                    break

            self._is_crawled = True

        except Exception:
            self._is_crawled = False

        finally:
            page.remove_listener("response", handle_response)
