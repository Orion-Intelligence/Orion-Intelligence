# Report: news

## Description

Get a specific breach-related news intelligence report generated from external news feeds by its report ID.

The request is an HTTP GET and accepts:
- **doc_id** (path) — string identifier of the news report document
- **lang** (query, optional) — language code to localize narrative sections when supported.

No request body is required.

## Response

News intelligence report document describing breach- or threat-related events from external news sources, returned as a single JSON object.

Core response fields typically include:
- **m_title** — title of the article or report
- **m_url** — direct URL of the article
- **m_base_url** — base URL of the source site
- **m_content** — normalized article text, including extracted narrative content
- **m_important_content** — summary or extracted key snippet
- **m_network** — usually `clearnet`
- **m_content_type** — internal classification labels such as `news`
- **m_team** — publishing organization or referenced entity
- **m_weblink** — list of related article URLs
- **m_dumplink** — list of referenced dump or external resources
- **m_organization** — organizations mentioned or discussed in the article
- **m_language** — detected language(s)
- **m_domain** — domains associated with the source
- **m_hash** — internal hash for deduplication
- **m_update_date** — last update timestamp
- **m_creation_date** — ingestion timestamp
- **content_type** — high-level classification tags used by other modules

Example response:
```json
{
  "m_title": "Turning Intelligence Into Action with Threat-Informed Defense",
  "m_url": "https://thehackernews.com/expert-insights/2025/09/turning-intelligence-into-action-with.html",
  "m_base_url": "https://thehackernews.com/",
  "m_content": "Jean-Philippe Salles — Head of Product at Filigran Sept 22, 2025  Cybersecurity is undergoing a necessary transformation from reacting to threats as they arise to proactively anticipating and addressing them through Threat-Informed Defense (TID). This shift emphasizes operational discipline over accumulating more tools. It involves using threat intelligence to streamline existing technologies, enhance the quality of security signals, and focus efforts on the threats most relevant to each organization. The goal is to continuously identify and close security gaps by combining insights from external threat data with internal defense capabilities.  How do you put TID into practice? The team at Filigran has broken down the TID framework into a six-stage pipeline to develop actionable chunks for cybersecurity leaders. In this article, we share the details so that your security teams can leverage it too to support TID.  What is Threat-Informed Defense?#  First advocated by MITRE, Threat-Informed Defense (TID) leverages MITRE ATT&CK framework to map how real threat actors operate and align defenses accordingly. It rests on three pillars:  Cyber threat intelligence: First gather, ingest and process all of your threat intelligence to make it contextual and relevant for you. Go beyond IOCs to understand adversary behaviors and intent, which are more durable and more costly for attackers to change. Defensive measures: Translate prioritized threat intelligence into detections, hardening, response playbooks, and configurations; utilize it properly and make it do the work for you. Adapt controls to the threats most likely to target you. Testing and evaluation: Plan adversary emulation and run continuous breach-and-attack simulations to verify coverage and avoid regressions. Gain granular level visibility into the effectiveness of your security programs. Automate and scale for continuous security posture validation and improvement.  Security teams today are facing tighter budgets and limited resources. As a result, many CISOs are shifting their focus from constantly adopting new tools to making the most of the technologies they already have. This change in mindset is driving a more proactive approach to cybersecurity. Instead of waiting for threats to happen, leaders are asking critical questions like 'Who might target us?', 'How do they operate?', 'Are our defenses strong enough?' and 'What's our plan if something fails?'. Implementing a Threat-Informed Defense (TID) strategy requires breaking down silos between teams, encouraging collaboration and information sharing across security operations, threat intelligence, and testing groups.  From Idea to Execution: Threat-Informed Defense Pipeline#  Similar to Continuous Threat Exposure Management (CTEM), TID is a concept, a cybersecurity strategy. Organizations can adopt and implement TID through various approaches, whether using commercial solutions, open-source tools, or hybrid implementations. For example, one approach could involve leveraging Filigran's open-source extended threat management (XTM) suite that combines threat intelligence platform with adversary emulation capabilities. These integrated solutions help security teams operationalize TID through six actionable stages:  Stage 01: Strategic threat landscape assessment#  Goal: Identify which adversaries, malware, and campaigns are most relevant to your business model, stack, and region.  How: Threat assessment in threat-informed defense involves systematically evaluating and prioritizing the specific threat actors, their capabilities, tactics, techniques, and procedures (TTPs) that are most likely to target your organization's critical assets. A threat intelligence platform (TIP) allows you to gather, analyze, refine and share prioritized threat intelligence is a useful component for this step.  Outcome: A prioritized watchlist with clear inclusion criteria and analyst annotations.  Stage 02: Actor and malware tracking#  Goal: Keep pace with evolving TTPs and indicators while filtering noise.  How: Maintain adaptive watchlists; triage incoming reports; tag IOCs and TTPs and distribute them to SIEM/EDR/SOAR. Modern TIPs like open-source based OpenCTI use knowledge graph models to provide powerful visualizations to link campaigns, malware, techniques, and exploited vulnerabilities.  Outcome: Continuously updated views of active threats and automated, stakeholder-ready reporting to show program progress.  Stage 03: TTP and report mapping#  Goal: See where attacker behaviors outpace your defenses.  How: Advanced Persistent Threats (APTs) and opportunistic attackers increasingly target the expanded attack surface created by cloud-native architectures, leveraging misconfigurations in multi-cloud environments, exploiting container escape vulnerabilities, poisoning CI/CD pipelines with malicious code, and conducting identity-based attacks through stolen credentials and API keys. OpenCTI can serve as a critical enabler for this assessment by centralizing and correlating threat intelligence specific to your technology stack, automatically ingesting indicators and TTPs from multiple sources—including cloud provider threat feeds, container security advisories, and identity-focused threat research. The platform maps these threats to the MITRE ATT&CK framework, allowing security teams to visualize adversary groups.  Outcome: A prioritized TTP list ready for adversary emulation and detection engineering.  Stage 04: Breach & attack simulation#  Goal: Prove whether you security controls detect and respond as designed.  How: Testing security controls in TID moves beyond generic vulnerability scanning and compliance checks to validate whether your defenses actually stop the specific adversary behaviors targeting your organization. Adversary Exposure Validation (AEV) tools makes threat intelligence actionable by emulating the exact techniques your most likely threat actors employ. Filigran's open-source OpenBAS provides scalability to design and execute purple team exercises, breach and attack simulations, and atomic red team tests. It also feed outcomes back into OpenCTI to maintain context with the threats that matter.  Outcome: A continuous feedback loop that catches regressions, validates detections, and informs engineering fixes.  Stage 05: Control validation and investment#  Goal: Translate intel and testing into targeted remediation and budget decisions.  How: Use time-series and historical snapshots to show coverage trends and risk reduction. Apply remediation guidance from OpenBAS to tune configs, update rules, and plan upgrades or replacements. The continuous validation using the combination of OpenCTI and OpenBAS creates a feedback loop that informs strategic investments and architectural decisions with unprecedented precision. The quantifiable nature of these insights enables CISOs to justify budget requests with specific risk reduction metrics, prioritize engineering efforts based on actual adversary impact  Outcome: Evidence-based prioritization that improves day-to-day resilience and informs quarterly planning.  Stage 06: Quarterly review#  Goal: Recalibrate strategy and maintain executive alignment.  How: Consolidate threat insights, control coverage, and simulation results into executive-ready reporting. Our recommendation is to make this as a quarterly exercise to share with your key stakeholders. This creates a closed-loop system where threat intelligence directly drives security validation priorities. Revisit tracked threats, business priorities, and risk appetite as part of a broader Continuous Threat Exposure Management (CTEM) rhythm.  Outcome: A living program that stays aligned to business risk and adversary reality.  Ready to make the shift to Threat-Informed Defense?#  Utilize TID to shift the conversation from traditional security life cycle (protection/detection/response) to proactive finding the gaps in your security controls and reducing cyber risks. The empirical approach of TID provides metrics that matter, from 'we blocked 10 million attacks' to 'we can detect and stop 85% of the techniques used by the ransomware groups actively targeting our sector and here is what we are going to do to fill our gaps for the rest 15%'.  If you'd like to learn more about TID, Filigran's open-source product suite, and its alignment with the framework you can download our latest white paper, A Practical Guide to Threat-Informed Defense, or contact us to speak directly with our team.    SHARE      Tweet  Share  Share  Share",
  "m_important_content": "Jean-Philippe Salles — Head of Product at Filigran Sept 22, 2025  Cybersecurity is undergoing a necessary transformation from reacting to threats as they arise to proactively anticipating and addressing them through Threat-Informed Defense (TID). This shift emphasizes operational discipline over accumulating more tools.",
  "m_network": "clearnet",
  "m_content_type": ["news"],
  "m_weblink": [
    "https://thehackernews.com/expert-insights/2025/09/turning-intelligence-into-action-with.html"
  ],
  "m_dumplink": [
    "https://thehackernews.com/expert-insights/2025/09/turning-intelligence-into-action-with.html"
  ],
  "m_team": "hackernews live",
  "m_scrap_file": "_thehackernews",
  "m_organization": ["Filigran", "MITRE", "Cybersecurity"],
  "m_language": ["en"],
  "m_domain": ["thehackernews.com"],
  "m_hash": "7cd89edea323f8127203c984df5df7d7cbb0b564cae4b5ef770f7050f11cba34",
  "m_update_date": "2025-10-10T08:21:46.160580+00:00",
  "m_creation_date": "2025-10-10T08:21:46.186711+00:00"
}
```


Additionally, the response may include automatically extracted indicators of compromise (IOCs). Only indicators that are actually found in the underlying content are returned; IOC fields with no data are omitted from the response.

Supported IOC / enrichment fields:
- **m_phone_number** — Phone Numbers
- **m_email** — Emails
- **m_domain** — Domains
- **m_country** — Country
- **m_url** — URLs
- **m_cve** — CVE & CWE
- **m_ip** — IP Addresses
- **m_yara_rule** — YARA Rules
- **m_encoded_urls** — Encoded URLs
- **m_file_paths** — File Paths
- **m_credit_card** — Credit Cards
- **m_org** — Organizations
- **m_company_name** — Company Names
- **m_person** — Persons
- **m_location** — Locations
- **m_language** — Languages
- **m_user_agents** — User Agents
- **m_asns** — ASNs
- **m_team** — Teams
- **m_hashtag** — Hashtags
- **m_mention** — Mentions
- **m_social_media_profiles** — Social Media Profiles
- **m_currencies** — Currencies
- **m_crypto_address** — Crypto Addresses
- **m_xmpp_addresses** — XMPP Addresses
- **m_enterprise_attack_tactics** — Enterprise ATT&CK Tactics
- **m_enterprise_attack_techniques** — Enterprise ATT&CK Techniques
- **m_document_id** — Document IDs
- **m_au_abn** — Australian IDs
- **m_us_passport** — US IDs
- **m_us_bank_number** — US Bank Numbers
- **m_platform** — Platform
- **m_author** — Author
- **m_industry** — Industry
- **m_scrap_file** — Scrap Script
