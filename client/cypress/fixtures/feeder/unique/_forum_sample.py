from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, RuleType


class _forum_sample:
    @property
    def seed_url(self) -> str:
        return "https://b1nd.net"

    @property
    def rule_config(self) -> RuleModel:
        m_rule_type = RuleType.FORUM
        return RuleModel(m_rule_type=m_rule_type)
