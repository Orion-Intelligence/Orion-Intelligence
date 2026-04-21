from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, RuleType


class _hackread:
    @property
    def seed_url(self) -> str:
        return "https://hackread.com/category/hacking-news/"

    @property
    def rule_config(self) -> RuleModel:
        m_rule_type = RuleType.NEWS
        return RuleModel(m_rule_type=m_rule_type)
