from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, RuleType


class _defacement_sample:
    @property
    def seed_url(self) -> str:
        return "https://raw.githubusercontent.com"

    @property
    def rule_config(self) -> RuleModel:
        m_rule_type = RuleType.DEFACEMENT
        return RuleModel(m_rule_type=m_rule_type)
