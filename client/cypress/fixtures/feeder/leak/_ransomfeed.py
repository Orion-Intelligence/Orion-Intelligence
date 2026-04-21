from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, RuleType


class _ransomfeed:
    @property
    def seed_url(self) -> str:
        return "https://ransomfeed.it/frontend-core-v2/?page=dash-table"

    @property
    def rule_config(self) -> RuleModel:
        m_rule_type = RuleType.LEAK
        return RuleModel(m_rule_type=m_rule_type)
