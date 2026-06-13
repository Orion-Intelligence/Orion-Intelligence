from crawler.crawler_instance.local_shared_model.rule_model import FetchConfig, FetchProxy, RuleModel, RuleType, ThreatType


class _apt_sample:
    @property
    def seed_url(self) -> str:
        return "https://any.run/malware-trends/"

    @property
    def rule_config(self) -> RuleModel:
        return RuleModel(m_fetch_proxy=FetchProxy.NONE, m_fetch_config=FetchConfig.REQUESTS, m_threat_type=ThreatType.APT, m_resoource_block=False, m_rule_type=RuleType.APT)
