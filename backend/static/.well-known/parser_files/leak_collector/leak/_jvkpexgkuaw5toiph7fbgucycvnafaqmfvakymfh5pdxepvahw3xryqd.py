from abc import ABC
from typing import List
from urllib.parse import urljoin, urlparse
import re
from datetime import datetime

from playwright.sync_api import Page

from crawler.constants.constant import RAW_PATH_CONSTANTS
from crawler.crawler_instance.local_interface_model.leak.leak_extractor_interface import leak_extractor_interface
from crawler.crawler_instance.local_shared_model.data_model.entity_model import entity_model
from crawler.crawler_instance.local_shared_model.data_model.leak_model import leak_model
from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, FetchProxy, FetchConfig, ThreatType
from crawler.crawler_services.redis_manager.redis_controller import redis_controller
from crawler.crawler_services.redis_manager.redis_enums import REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS
from crawler.crawler_services.shared.helper_method import helper_method
from crawler.crawler_services.log_manager.log_controller import log


class _jvkpexgkuaw5toiph7fbgucycvnafaqmfvakymfh5pdxepvahw3xryqd(leak_extractor_interface, ABC):
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
            cls._instance = super(_jvkpexgkuaw5toiph7fbgucycvnafaqmfvakymfh5pdxepvahw3xryqd, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    @property
    def is_crawled(self) -> bool:
        return self._is_crawled

    @property
    def seed_url(self) -> str:
        return "http://jvkpexgkuaw5toiph7fbgucycvnafaqmfvakymfh5pdxepvahw3xryqd.onion"

    @property
    def developer_signature(self) -> str:
        return "name:signature"

    @property
    def base_url(self) -> str:
        return "http://jvkpexgkuaw5toiph7fbgucycvnafaqmfvakymfh5pdxepvahw3xryqd.onion"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.TOR, m_fetch_config=FetchConfig.PLAYRIGHT, m_threat_type= ThreatType.LEAK)

    @property
    def card_data(self) -> List[leak_model]:
        return self._card_data

    @property
    def entity_data(self) -> List[entity_model]:
        return self._entity_data

    def invoke_db(self, command: int, key: str, default_value, expiry: int = None):
        return self._redis_instance.invoke_trigger(command, [key + self.__class__.__name__, default_value, expiry])

    def contact_page(self) -> str:
        return "http://jvkpexgkuaw5toiph7fbgucycvnafaqmfvakymfh5pdxepvahw3xryqd.onion"

    def append_leak_data(self, leak: leak_model, entity: entity_model):
        self._card_data.append(leak)
        self._entity_data.append(entity)
        if self.callback:
            if self.callback():
                self._card_data.clear()
                self._entity_data.clear()

    def parse_leak_data(self, page: Page):
        try:
            page.wait_for_load_state("networkidle", timeout=60000)
            listing_base = page.url or self.base_url

            cards = page.evaluate(r"""
                () => {
                    const out = [];
                    const nodes = Array.from(document.querySelectorAll('section.grid article.book-card'));
                    for (const c of nodes) {
                        const href = c.getAttribute('data-href') || '';
                        const h3 = c.querySelector('h3');
                        const title = h3 ? (h3.innerText || '').trim() : (c.getAttribute('aria-label') || '').trim();
                        let country = '';
                        let weblink = '';
                        let data_size = '';
                        const textEls = Array.from(c.querySelectorAll('span, p, div'));
                        for (const t of textEls) {
                            const txt = (t.innerText || '').trim();
                            if (!country && txt.includes('🗺️')) {
                                country = txt.replace('🗺️', '').trim();
                            }
                            if (!weblink && txt.includes('🔗')) {
                                weblink = txt.replace('🔗', '').trim();
                            }
                            if (!data_size && /DATA SIZE/i.test(txt)) {
                                const ds = txt.replace(/.*DATA SIZE[:\s]*/i, '').trim();
                                if (ds) data_size = ds;
                            }
                        }
                        out.push({ href, title, country, weblink, data_size });
                    }
                    return out;
                }
            """)

            for card in cards:
                href = (card.get("href") or "").strip()
                title = (card.get("title") or "").strip()
                country = (card.get("country") or "").strip()
                weblink_text = (card.get("weblink") or "").strip()
                data_size = (card.get("data_size") or "").strip()

                if not title and not href:
                    continue

                weblink = ""
                if weblink_text:
                    w = weblink_text.strip()
                    if w.startswith("http://") or w.startswith("https://"):
                        weblink = w
                    elif w.startswith("//"):
                        weblink = "http:" + w
                    elif re.match(r'^[\w\.-]+\.[a-z]{2,}$', w, re.IGNORECASE):
                        weblink = "http://" + w.lstrip("./")
                    else:
                        weblink = urljoin(listing_base, w)
                else:
                    m = re.search(r'\(([^)]+)\)', title)
                    if m:
                        cand = m.group(1).strip()
                        if cand.startswith("http://") or cand.startswith("https://"):
                            weblink = cand
                        elif re.match(r'^[\w\.-]+\.[a-z]{2,}$', cand, re.IGNORECASE):
                            weblink = "http://" + cand.lstrip("./")
                        else:
                            weblink = urljoin(listing_base, cand)

                detail_url = href if href else listing_base
                page.goto(detail_url, wait_until="domcontentloaded", timeout=60000)
                page.wait_for_load_state("networkidle", timeout=60000)

                desc = page.evaluate(r"""
                    () => {
                        const ps = Array.from(document.querySelectorAll('article.book-card p'));
                        for (const p of ps) {
                            const t = (p.innerText || '').trim();
                            if (!t) continue;
                            if (t.includes('🗺️') || t.includes('🔗') || /DATA SIZE/i.test(t)) continue;
                            return t;
                        }
                        return '';
                    }
                """)
                content = (desc or "").strip()

                data_block = page.evaluate(r"""
                    () => {
                        const ps = Array.from(document.querySelectorAll('article.book-card p'));
                        for (const p of ps) {
                            const t = (p.innerText || '').trim();
                            if (/DATA SIZE/i.test(t)) return t;
                        }
                        return '';
                    }
                """)
                if data_block:
                    if not data_size:
                        mm = re.search(r'DATA SIZE[:\s]*(.*)', data_block, re.IGNORECASE)
                        if mm:
                            data_size = mm.group(1).strip()
                    content = (content + "\n\n" + data_block.strip()) if content else data_block.strip()

                leak_date = None
                if content:
                    patterns = [
                        r'(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s*\d{4}',
                        r'\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}',
                        r'\d{4}-\d{2}-\d{2}',
                    ]
                    for p in patterns:
                        mm = re.search(p, content)
                        if mm:
                            s = mm.group(0)
                            try:
                                if re.match(r'\d{4}-\d{2}-\d{2}', s):
                                    leak_date = datetime.strptime(s, '%Y-%m-%d').date()
                                    break
                                try:
                                    leak_date = datetime.strptime(s, '%B %d, %Y').date()
                                    break
                                except Exception:
                                    pass
                                try:
                                    leak_date = datetime.strptime(s, '%d %B %Y').date()
                                    break
                                except Exception:
                                    pass
                            except Exception:
                                continue
                    if not leak_date:
                        yy = re.search(r'\b(20\d{2}|19\d{2})\b', content)
                        if yy:
                            try:
                                leak_date = datetime(int(yy.group(0)), 1, 1).date()
                            except Exception:
                                leak_date = None

                imgs = page.evaluate(r"""
                    () => {
                        const sel = Array.from(document.querySelectorAll('article.book-card .left-panel img, article.book-card .image-card img'));
                        return sel.map(i => i.getAttribute('src') || '').filter(s => !!s);
                    }
                """)
                images_rel: List[str] = []
                for s in imgs or []:
                    abs_src = urljoin(page.url or detail_url, s)
                    parsed = urlparse(abs_src)
                    rel = parsed.path or ""
                    if parsed.query:
                        rel = rel + "?" + parsed.query
                    if rel and rel not in images_rel:
                        images_rel.append(rel)

                header_parts = []
                if title:
                    header_parts.append(title)
                if data_size:
                    header_parts.append(data_size)
                if weblink:
                    header_parts.append(weblink)
                header_line = " | ".join(header_parts)
                full_content = header_line
                if content:
                    full_content = (full_content + "\n\n" + content) if full_content else content
                important_content = full_content[:500] if full_content else ""
                ref_html = helper_method.extract_refhtml(weblink, self.invoke_db, REDIS_COMMANDS, CUSTOM_SCRIPT_REDIS_KEYS, RAW_PATH_CONSTANTS, page)

                card_data = leak_model(
                    m_ref_html= ref_html,
                    m_title=title if title else "",
                    m_url=detail_url,
                    m_screenshot=helper_method.get_screenshot_base64(page, title, self.base_url),
                    m_base_url=self.base_url,
                    m_content=full_content,
                    m_network=helper_method.get_network_type(self.base_url),
                    m_important_content=important_content,
                    m_weblink=[weblink] if weblink else [],
                    m_dumplink=[],
                    m_content_type=["leaks"],
                )

                if hasattr(card_data, "m_logo_or_images"):
                    card_data.m_logo_or_images = images_rel if images_rel else []
                else:
                    card_data.m_dumplink = []

                if hasattr(card_data, "m_leak_date"):
                    card_data.m_leak_date = leak_date if leak_date else None
                if hasattr(card_data, "m_data_size"):
                    card_data.m_data_size = data_size if data_size else ""
                if hasattr(card_data, "m_country"):
                    card_data.m_country = country if country else ""

                entity_data = entity_model(
                    m_scrap_file=self.__class__.__name__,
                    m_team="DragonForce",
                    m_country=[country] if country else [],
                    m_location=[country] if country else [],
                )

                self.append_leak_data(card_data, entity_data)

                page.go_back(wait_until="domcontentloaded", timeout=60000)
                page.wait_for_load_state("networkidle", timeout=60000)

        except Exception as ex:
            log.g().e(f"SCRIPT ERROR {ex} " + str(self.__class__.__name__))