from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, RuleType


class _reddit_sample:
    @property
    def seed_url(self) -> str:
        return "https://www.reddittorjg6rue252oqsxryoxengawnmo46qy4kyii5wtqnwfj4ooad.onion/r/privacy/new"

    @property
    def rule_config(self) -> RuleModel:
        m_rule_type = RuleType.REDDIT
        return RuleModel(m_rule_type=m_rule_type)
