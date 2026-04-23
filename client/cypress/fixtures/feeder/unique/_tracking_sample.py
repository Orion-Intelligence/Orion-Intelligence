from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, RuleType


class _tracking_sample:
    @property
    def seed_url(self) -> str:
        return "https://www.acn.gov.it/"

    @property
    def rule_config(self) -> RuleModel:
        m_rule_type = RuleType.TRACKING
        return RuleModel(m_rule_type=m_rule_type)
