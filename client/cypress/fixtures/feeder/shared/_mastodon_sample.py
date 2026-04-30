from crawler.crawler_instance.local_shared_model.rule_model import RuleModel, RuleType


class _mastodon_sample:
    @property
    def seed_url(self) -> str:
        return "https://mastodon.social/@falconfeedsio/"

    @property
    def rule_config(self) -> RuleModel:
        m_rule_type = RuleType.MASTODON
        return RuleModel(m_rule_type=m_rule_type)
