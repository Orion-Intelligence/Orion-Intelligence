import re
from typing import Any, Dict, List, Set, Tuple

from orion.services.stix_manager.converters.stix_helper import StixHelper


class _SocialConverter:
    def convert(self, raw):

        h = StixHelper()
        created = (h.parse_ts(h.safe_get(raw, "m_creation_date")) or h.parse_ts(h.safe_get(raw, "m_update_date")) or h.parse_ts(
            h.safe_get(raw, "m_message_date")) or h.now_ts())
        modified = h.parse_ts(h.safe_get(raw, "m_update_date")) or created
        if modified < created:
            modified = created

        title = str(
            h.first_nonempty(
                h.safe_get(raw, "m_title"),
                h.safe_get(raw, "m_url"),
                h.safe_get(raw, "m_channel_url"),
                "Social - unknown title"))
        url = h.first_nonempty(
            h.safe_get(raw, "m_message_sharable_link"), h.safe_get(raw, "m_channel_url"), h.safe_get(raw, "m_url"))
        base_url = h.safe_get(raw, "m_channel_url")
        network = h.safe_get(raw, "m_network")
        platform = h.safe_get(raw, "m_platform")
        doc_id = h.first_nonempty(h.safe_get(raw, "m_document_id"), h.safe_get(raw, "m_hash"), url, base_url, title)

        content_src = h.first_nonempty(
            h.safe_get(raw, "m_content"), h.safe_get(raw, "m_important_content"), h.safe_get(raw, "m_meta_description"), "")
        summary = h.clean_text(str(content_src or ""))
        if not summary:
            return {}
        if len(summary) > 4000:
            summary = summary[:4000] + "…"

        objects: List[Dict[str, Any]] = []
        seen: Dict[Tuple[str, str], str] = {}

        tlp_amber_id = h.stix_id("marking-definition", "tlp:amber")
        tlp_red_id = h.stix_id("marking-definition", "tlp:red")

        h.add_obj(
            objects,
            seen,
            {"type": "marking-definition", "spec_version": "2.1", "id": tlp_amber_id, "created": created, "definition_type": "tlp", "definition": {"tlp": "amber"}, },
            uniq=("marking-definition", "tlp:amber"))

        h.add_obj(
            objects,
            seen,
            {"type": "marking-definition", "spec_version": "2.1", "id": tlp_red_id, "created": created, "definition_type": "tlp", "definition": {"tlp": "red"}, },
            uniq=("marking-definition", "tlp:red"))

        content_types = set(
            str(x).strip().lower() for x in
                (h.as_list(h.safe_get(raw, "m_content_type")) + h.as_list(h.safe_get(raw, "content_type"))) if str(x).strip())

        labels: Set[str] = set()
        for ct in sorted(content_types):
            labels.add(ct)
        if network:
            labels.add(str(network).strip().lower())
        if platform:
            labels.add(f"platform:{str(platform).strip().lower()}")
        labels.add("orion:social")

        langs = [str(x).strip() for x in h.as_list(h.safe_get(raw, "m_language")) if str(x).strip()]
        lang = langs[0] if len(langs) == 1 else None

        industries = [str(x).strip() for x in h.as_list(h.safe_get(raw, "m_industry")) if str(x).strip()]
        sector = industries[0] if industries else "Social Media"

        location_refs: List[str] = []
        for c in (h.as_list(h.safe_get(raw, "m_country")) or h.as_list(h.safe_get(raw, "m_location"))):
            cc = str(c).strip()
            if not cc:
                continue
            loc = {"type": "location", "spec_version": "2.1", "id": h.stix_id(
                "location",
                f"country:{cc}"), "created": created, "modified": modified, "name": cc, "country": cc, "object_marking_refs": [
                tlp_amber_id], }
            location_refs.append(h.add_obj(objects, seen, loc, uniq=("location", f"country:{cc}")))

        author = h.first_nonempty(h.safe_get(raw, "m_author"), h.safe_get(raw, "m_username"))
        created_by_ref = None
        if author:
            if isinstance(author, list):
                author_name = str(author[0]).strip() if author else ""
            else:
                author_name = str(author).strip()
            if author_name:
                ident = {"type": "identity", "spec_version": "2.1", "id": h.stix_id(
                    "identity",
                    f"author:{author_name}"), "created": created, "modified": modified, "name": author_name, "identity_class": "individual", "object_marking_refs": [
                    tlp_amber_id], }
                created_by_ref = h.add_obj(objects, seen, ident, uniq=("identity", f"author:{author_name}"))

        domain_vals = [str(x).strip() for x in h.as_list(h.safe_get(raw, "m_domain")) if str(x).strip()]
        url_vals = [str(x).strip() for x in h.as_list(h.safe_get(raw, "m_url")) if str(x).strip()]
        ip_vals = [str(x).strip() for x in h.as_list(h.safe_get(raw, "m_ip")) if str(x).strip()]
        email_vals = [str(x).strip() for x in h.as_list(h.safe_get(raw, "m_email")) if str(x).strip()]
        asn_vals = [str(x).strip().upper().lstrip("AS") for x in h.as_list(h.safe_get(raw, "m_asns")) if str(x).strip()]
        path_vals = [str(x).strip() for x in h.as_list(h.safe_get(raw, "m_file_paths")) if str(x).strip()]
        social_profiles = [str(x).strip() for x in h.as_list(h.safe_get(raw, "m_social_media_profiles")) if str(x).strip()]
        encoded_urls = [str(x).strip() for x in h.as_list(h.safe_get(raw, "m_encoded_urls")) if str(x).strip()]
        xmpp_vals = [str(x).strip() for x in h.as_list(h.safe_get(raw, "m_xmpp_addresses")) if str(x).strip()]
        crypto_vals = [str(x).strip() for x in h.as_list(h.safe_get(raw, "m_crypto_address")) if str(x).strip()]
        user_agents = [str(x).strip() for x in h.as_list(h.safe_get(raw, "m_user_agents")) if str(x).strip()]
        hashtags = [str(x).strip().lstrip("#") for x in h.as_list(h.safe_get(raw, "m_hashtag")) if str(x).strip()]
        mentions = [str(x).strip().lstrip("@") for x in h.as_list(h.safe_get(raw, "m_mention")) if str(x).strip()]

        if url:
            url_vals.append(str(url))

        for eu in encoded_urls:
            if eu.startswith(("http://", "https://")):
                url_vals.append(eu)

        for sp in social_profiles:
            if sp.startswith(("http://", "https://")):
                url_vals.append(sp)

        domain_vals = sorted(set(domain_vals))
        url_vals = sorted(set(url_vals))
        ip_vals = sorted(set(ip_vals))
        email_vals = sorted(set([e for e in email_vals]))
        asn_vals = sorted(set([a for a in asn_vals if a.isdigit()]))
        path_vals = sorted(set(path_vals))
        xmpp_vals = sorted(set(xmpp_vals))
        crypto_vals = sorted(set(crypto_vals))
        user_agents = sorted(set(user_agents))

        infra_seed = h.first_nonempty(base_url, url, domain_vals[0] if domain_vals else None)
        infra_ref = None
        if infra_seed:
            infra_types = ["unknown"]
            if str(network).lower() == "onion":
                infra_types = ["anonymization"]
            infra = {"type": "infrastructure", "spec_version": "2.1", "id": h.stix_id(
                "infrastructure", f"infra:{infra_seed}"), "created": created, "modified": modified, "name": str(
                h.first_nonempty(
                    platform,
                    title,
                    "Social infrastructure")), "description": summary if summary else None, "infrastructure_types": infra_types, "first_seen": created, "last_seen": modified, "labels": sorted(
                labels), "object_marking_refs": [tlp_amber_id], "x_orion_network": str(
                network) if network else None, "x_orion_platform": str(platform) if platform else None, }
            infra = {k: v for k, v in infra.items() if v is not None}
            infra_ref = h.add_obj(objects, seen, infra, uniq=("infrastructure", f"infra:{infra_seed}"))

        sco_refs: List[str] = []

        for u in url_vals:
            sco = {"type": "url", "id": h.sco_id("url", u), "value": u}
            sco_refs.append(h.add_obj(objects, seen, sco, uniq=("url", u)))

        for d in domain_vals:
            sco = {"type": "domain-name", "id": h.sco_id("domain-name", d), "value": d}
            sco_refs.append(h.add_obj(objects, seen, sco, uniq=("domain-name", d)))

        for ip in ip_vals:
            if ":" in ip:
                sco = {"type": "ipv6-addr", "id": h.sco_id("ipv6-addr", ip), "value": ip}
                sco_refs.append(h.add_obj(objects, seen, sco, uniq=("ipv6-addr", ip)))
            else:
                sco = {"type": "ipv4-addr", "id": h.sco_id("ipv4-addr", ip), "value": ip}
                sco_refs.append(h.add_obj(objects, seen, sco, uniq=("ipv4-addr", ip)))

        for e in email_vals:
            el = e.lower()
            sco = {"type": "email-addr", "id": h.sco_id("email-addr", el), "value": e}
            sco_refs.append(h.add_obj(objects, seen, sco, uniq=("email-addr", el)))

        for a in asn_vals:
            sco = {"type": "autonomous-system", "id": h.sco_id("autonomous-system", a), "number": int(a)}
            sco_refs.append(h.add_obj(objects, seen, sco, uniq=("autonomous-system", a)))

        for p in path_vals:
            sco = {"type": "directory", "id": h.sco_id("directory", p), "path": p}
            sco_refs.append(h.add_obj(objects, seen, sco, uniq=("directory", p)))

        for x in xmpp_vals:
            sco = {"type": "x-mpp-addr", "id": h.sco_id("x-mpp-addr", x), "value": x}
            sco_refs.append(h.add_obj(objects, seen, sco, uniq=("x-mpp-addr", x)))

        for c in crypto_vals:
            sco = {"type": "cryptocurrency-wallet", "id": h.sco_id("cryptocurrency-wallet", c), "address": c}
            sco_refs.append(h.add_obj(objects, seen, sco, uniq=("cryptocurrency-wallet", c)))

        for ua in user_agents:
            sco = {"type": "user-agent", "id": h.sco_id("user-agent", ua), "string": ua}
            sco_refs.append(h.add_obj(objects, seen, sco, uniq=("user-agent", ua)))

        observed_ref = None
        if sco_refs:
            obs = {"type": "observed-data", "spec_version": "2.1", "id": h.stix_id(
                "observed-data",
                f"{doc_id}|{created}"), "created": created, "modified": modified, "first_observed": created, "last_observed": modified, "number_observed": 1, "object_refs": sorted(
                set(sco_refs)), "object_marking_refs": [tlp_amber_id], }
            observed_ref = h.add_obj(objects, seen, obs, uniq=("observed-data", obs["id"]))

        indicator_refs: List[str] = []

        if domain_vals:
            vals = ", ".join(f"'{h.escape_pat(v)}'" for v in domain_vals)
            indicator_refs.append(h.add_indicator(objects, seen, created, modified, labels, tlp_amber_id, "Domains", f"[domain-name:value IN ({vals})]", ["malicious-activity"]))

        if url_vals:
            vals = ", ".join(f"'{h.escape_pat(v)}'" for v in url_vals)
            indicator_refs.append(h.add_indicator(objects, seen, created, modified, labels, tlp_amber_id, "URLs", f"[url:value IN ({vals})]", ["malicious-activity"]))

        if ip_vals:
            v4 = sorted({v for v in ip_vals if ":" not in v})
            v6 = sorted({v for v in ip_vals if ":" in v})
            if v4:
                vals = ", ".join(f"'{h.escape_pat(v)}'" for v in v4)
                indicator_refs.append(h.add_indicator(objects, seen, created, modified, labels, tlp_amber_id, "IPv4", f"[ipv4-addr:value IN ({vals})]", ["malicious-activity"]))
            if v6:
                vals = ", ".join(f"'{h.escape_pat(v)}'" for v in v6)
                indicator_refs.append(h.add_indicator(objects, seen, created, modified, labels, tlp_amber_id, "IPv6", f"[ipv6-addr:value IN ({vals})]", ["malicious-activity"]))

        if email_vals:
            vals = ", ".join(f"'{h.escape_pat(v)}'" for v in email_vals)
            indicator_refs.append(h.add_indicator(objects, seen, created, modified, labels, tlp_amber_id, "Emails", f"[email-addr:value IN ({vals})]", ["phishing"]))

        for yr in h.as_list(h.safe_get(raw, "m_yara_rule")):
            rule = str(yr).strip()
            if not rule:
                continue
            yara_ind: Dict[str, Any] = {"type": "indicator", "spec_version": "2.1", "id": h.stix_id(
                "indicator",
                f"yara|{h.sha256(rule)}"), "created": created, "modified": modified, "name": "YARA Rule", "pattern_type": "yara", "pattern": rule, "valid_from": created, "labels": sorted(
                labels), "object_marking_refs": [tlp_amber_id], }
            indicator_refs.append(h.add_obj(objects, seen, yara_ind, uniq=("indicator", yara_ind["id"])))

        vuln_refs: List[str] = []
        for c in h.as_list(h.safe_get(raw, "m_cve")):
            token = str(c).strip().upper()
            if not token:
                continue
            if token.startswith("CVE-"):
                v = {"type": "vulnerability", "spec_version": "2.1", "id": h.stix_id(
                    "vulnerability",
                    token), "created": created, "modified": modified, "name": token, "external_references": [
                    {"source_name": "nvd", "external_id": token, "url": f"https://nvd.nist.gov/vuln/detail/{token}"}], "object_marking_refs": [
                    tlp_amber_id], }
                vuln_refs.append(h.add_obj(objects, seen, v, uniq=("vulnerability", token)))
            elif token.startswith("CWE-"):
                cwe_num = token.replace("CWE-", "")
                if cwe_num.isdigit():
                    v = {"type": "vulnerability", "spec_version": "2.1", "id": h.stix_id(
                        "vulnerability",
                        token), "created": created, "modified": modified, "name": token, "external_references": [
                        {"source_name": "cwe", "external_id": token, "url": f"https://cwe.mitre.org/data/definitions/{cwe_num}.html"}], "object_marking_refs": [
                        tlp_amber_id], }
                    vuln_refs.append(h.add_obj(objects, seen, v, uniq=("vulnerability", token)))

        tactics = [str(x).strip().lower().replace(" ", "-") for x in
            h.as_list(h.safe_get(raw, "m_enterprise_attack_tactics")) if str(x).strip()]
        techniques = [str(x).strip().upper() for x in h.as_list(h.safe_get(raw, "m_enterprise_attack_techniques")) if
            str(x).strip()]
        attack_refs: List[str] = []
        for tech in sorted(set(techniques)):
            if not re.match(r"^(T\d{4})(\.\d{3})?$", tech):
                continue
            base = tech.split(".")[0]
            ap: Dict[str, Any] = {"type": "attack-pattern", "spec_version": "2.1", "id": h.stix_id(
                "attack-pattern",
                tech), "created": created, "modified": modified, "name": tech, "external_references": [
                {"source_name": "mitre-attack", "external_id": tech, "url": f"https://attack.mitre.org/techniques/{base}/"}], "kill_chain_phases": [
                {"kill_chain_name": "mitre-attack", "phase_name": t} for t in
                sorted(set(tactics))] if tactics else None, "object_marking_refs": [tlp_amber_id], }
            ap = {k: v for k, v in ap.items() if v is not None}
            attack_refs.append(h.add_obj(objects, seen, ap, uniq=("attack-pattern", tech)))

        sensitive: Dict[str, List[Dict[str, str]]] = {}

        h.add_sensitive(sensitive, "credit_cards", h.as_list(h.safe_get(raw, "m_credit_card")))
        h.add_sensitive(sensitive, "us_passport", h.as_list(h.safe_get(raw, "m_us_passport")))
        h.add_sensitive(sensitive, "au_abn", h.as_list(h.safe_get(raw, "m_au_abn")))
        h.add_sensitive(sensitive, "us_bank_number", h.as_list(h.safe_get(raw, "m_us_bank_number")))

        note_ref = None
        if sensitive or hashtags or mentions:
            content_note: Dict[str, Any] = {}
            if sensitive:
                content_note["sensitive_hashed"] = sensitive
            if hashtags:
                content_note["hashtags"] = sorted(set([h for h in hashtags if h]))
            if mentions:
                content_note["mentions"] = sorted(set([m for m in mentions if m]))
            note = {"type": "note", "spec_version": "2.1", "id": h.stix_id(
                "note",
                f"social-meta|{doc_id}|{created}"), "created": created, "modified": modified, "abstract": "Social metadata (and sensitive hashed)", "content": str(
                content_note), "object_marking_refs": [tlp_red_id] if sensitive else [tlp_amber_id], }
            note_ref = h.add_obj(objects, seen, note, uniq=("note", note["id"]))

        external_refs: List[Dict[str, Any]] = []
        if url:
            external_refs.append({"source_name": "source", "url": str(url)})
        if base_url and base_url != url:
            external_refs.append({"source_name": "channel_url", "url": str(base_url)})
        if h.safe_get(raw, "m_hash"):
            external_refs.append({"source_name": "content-hash", "external_id": str(h.safe_get(raw, "m_hash"))})
        if h.safe_get(raw, "m_scrap_file"):
            external_refs.append({"source_name": "scraper", "external_id": str(h.safe_get(raw, "m_scrap_file"))})
        if h.safe_get(raw, "m_message_sharable_link"):
            external_refs.append({"source_name": "share_link", "url": str(h.safe_get(raw, "m_message_sharable_link"))})

        report_object_refs: List[str] = []
        for r in [infra_ref, observed_ref, note_ref, created_by_ref]:
            if r:
                report_object_refs.append(r)
        report_object_refs.extend(location_refs)
        report_object_refs.extend(indicator_refs)
        report_object_refs.extend(vuln_refs)
        report_object_refs.extend(attack_refs)

        report: Dict[str, Any] = {"type": "report", "spec_version": "2.1", "id": h.stix_id(
            "report",
            f"social:{doc_id}"), "created": created, "modified": modified, "name": title, "description": summary if summary else None, "report_types": [
            "threat-report"], "published": created, "labels": sorted(
            labels), "lang": lang, "created_by_ref": created_by_ref, "external_references": external_refs or None, "object_refs": sorted(
            set(report_object_refs)), "object_marking_refs": [tlp_amber_id], "x_orion_doc_id": str(
            doc_id), "x_orion_network": str(network) if network else None, "x_orion_platform": str(
            platform) if platform else None, "x_orion_post_comments_count": str(
            h.safe_get(raw, "m_post_comments_count")) if h.safe_get(raw, "m_post_comments_count") else None, }
        report = {k: v for k, v in report.items() if v is not None}
        h.add_obj(objects, seen, report, uniq=("report", report["id"]))

        bundle = {"type": "bundle", "id": h.stix_id("bundle", report["id"]), "spec_version": "2.1", "objects": objects, }
        return bundle
