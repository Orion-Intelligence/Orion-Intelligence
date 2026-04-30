from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, RuleType


class _pastebin_sample:
    @property
    def seed_url(self) -> str:
        return "https://pastebin.com/u/Overwtime"

    @property
    def rule_config(self) -> RuleModel:
        m_rule_type = RuleType.PASTEBIN
        return RuleModel(m_rule_type=m_rule_type)
