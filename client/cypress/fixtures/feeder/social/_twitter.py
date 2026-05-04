from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, RuleType


class _twitter:
    def __init__(self):
        self.m_seed_url = "https://x.com/Arkbird_SOLG/"

    @property
    def seed_url(self) -> str:
        return self.m_seed_url

    @property
    def rule_config(self) -> RuleModel:
        m_rule_type = RuleType.TWITTER
        return RuleModel(m_rule_type=m_rule_type)
