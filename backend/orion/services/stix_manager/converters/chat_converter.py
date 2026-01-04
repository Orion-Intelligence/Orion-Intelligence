import re
from typing import Any, Dict, List, Set, Tuple

from orion.services.stix_manager.converters.stix_helper import StixHelper


class _ChatConverter:

    def convert(self, raw):
        h = StixHelper()
        created = (h.parse_ts(h.safe_get(raw, "m_creation_date")) or h.parse_ts(h.safe_get(raw, "m_update_date")) or h.parse_ts(
            h.safe_get(raw, "m_message_date")) or h.now_ts())
        modified = h.parse_ts(h.safe_get(raw, "m_update_date")) or created
        if modified < created:
            modified = created

        caption = str(h.first_nonempty(h.safe_get(raw, "m_caption"), h.safe_get(raw, "m_content"), "Chat - unknown title"))
        url = h.first_nonempty(h.safe_get(raw, "m_message_sharable_link"), h.safe_get(raw, "m_media_url"))
        channel_url = h.safe_get(raw, "m_channel_url")
        channel_id = h.safe_get(raw, "m_channel_id")
        platform = h.safe_get(raw, "m_platform")
        network = h.safe_get(raw, "m_network") or (str(platform).strip().lower() if platform else None)
        doc_id = h.first_nonempty(
            h.safe_get(raw, "m_document_id"),
            h.safe_get(raw, "m_hash"),
            h.safe_get(raw, "m_message_id"),
            url,
            channel_id,
            caption)

        content_src = h.first_nonempty(h.safe_get(raw, "m_content"), h.safe_get(raw, "m_media_caption"), "")
        summary = h.clean_text(str(content_src or ""))
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
        if platform:
            labels.add(f"platform:{str(platform).strip().lower()}")
        if network:
            labels.add(str(network).strip().lower())
        labels.add("orion:chat")

        langs = [str(x).strip() for x in h.as_list(h.safe_get(raw, "m_language")) if str(x).strip()]
        lang = langs[0] if len(langs) == 1 else None

        sender = h.first_nonempty(h.safe_get(raw, "m_sender_username"), h.safe_get(raw, "m_users"), h.safe_get(raw, "m_author"))
        created_by_ref = None
        if sender:
            if isinstance(sender, list):
                sender_name = str(sender[0]).strip() if sender else ""
            else:
                sender_name = str(sender).strip()
            if sender_name:
                ident = {"type": "identity", "spec_version": "2.1", "id": h.stix_id(
                    "identity",
                    f"sender:{sender_name}"), "created": created, "modified": modified, "name": sender_name, "identity_class": "individual", "object_marking_refs": [
                    tlp_amber_id], }
                created_by_ref = h.add_obj(objects, seen, ident, uniq=("identity", f"sender:{sender_name}"))

        channel_name = h.first_nonempty(h.safe_get(raw, "m_channel_name"), channel_id, channel_url, "Chat channel")
        infra_seed = h.first_nonempty(channel_url, channel_id)
        infra_ref = None
        if infra_seed:
            infra_types = ["unknown"]
            if str(platform).strip().lower() in {"telegram", "t.me"} or (channel_url and "t.me" in str(channel_url)):
                infra_types = ["communications"]
            infra = {"type": "infrastructure", "spec_version": "2.1", "id": h.stix_id(
                "infrastructure", f"channel:{infra_seed}"), "created": created, "modified": modified, "name": str(
                channel_name), "description": summary if summary else None, "infrastructure_types": infra_types, "first_seen": created, "last_seen": modified, "labels": sorted(
                labels), "object_marking_refs": [tlp_amber_id], "x_orion_network": str(
                network) if network else None, "x_orion_channel_id": str(channel_id) if channel_id else None, }
            infra = {k: v for k, v in infra.items() if v is not None}
            infra_ref = h.add_obj(objects, seen, infra, uniq=("infrastructure", f"channel:{infra_seed}"))

        domain_vals = [str(x).strip() for x in h.as_list(h.safe_get(raw, "m_domain")) if str(x).strip()]
        url_vals = [str(x).strip() for x in h.as_list(h.safe_get(raw, "m_url")) if str(x).strip()]
        ip_vals = [str(x).strip() for x in h.as_list(h.safe_get(raw, "m_ip")) if str(x).strip()]
        email_vals = [str(x).strip() for x in h.as_list(h.safe_get(raw, "m_email")) if str(x).strip()]
        asn_vals = [str(x).strip().upper().lstrip("AS") for x in h.as_list(h.safe_get(raw, "m_asns")) if str(x).strip()]
        file_paths = [str(x).strip() for x in h.as_list(h.safe_get(raw, "m_file_paths")) if str(x).strip()]
        encoded_urls = [str(x).strip() for x in h.as_list(h.safe_get(raw, "m_encoded_urls")) if str(x).strip()]
        weblinks = [str(x).strip() for x in h.as_list(h.safe_get(raw, "m_weblink")) if str(x).strip()]
        mentions = [str(x).strip() for x in h.as_list(h.safe_get(raw, "m_mention")) if str(x).strip()]
        hashtags = [str(x).strip().lstrip("#") for x in h.as_list(h.safe_get(raw, "m_hashtag")) if str(x).strip()]
        user_agents = [str(x).strip() for x in h.as_list(h.safe_get(raw, "m_user_agents")) if str(x).strip()]
        cves = [str(x).strip().upper() for x in h.as_list(h.safe_get(raw, "m_cve")) if str(x).strip()]

        for eu in encoded_urls:
            if eu.startswith(("http://", "https://")):
                url_vals.append(eu)
        for wl in weblinks:
            if wl.startswith(("http://", "https://")):
                url_vals.append(wl)
        if url:
            url_vals.append(str(url))
        if channel_url:
            url_vals.append(str(channel_url))

        domain_vals = sorted(set(domain_vals))
        url_vals = sorted(set(url_vals))
        ip_vals = sorted(set(ip_vals))
        email_vals = sorted(set(email_vals))
        asn_vals = sorted(set([a for a in asn_vals if a.isdigit()]))
        file_paths = sorted(set(file_paths))
        user_agents = sorted(set(user_agents))

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

        for p in file_paths:
            sco = {"type": "directory", "id": h.sco_id("directory", p), "path": p}
            sco_refs.append(h.add_obj(objects, seen, sco, uniq=("directory", p)))

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
            indicator_refs.append(h.add_indicator(objects, seen, created, modified, labels, tlp_amber_id, "Emails", f"[email-addr:value IN ({vals})]", ["malicious-activity"]))

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
        for token in sorted(set([c for c in cves if c.startswith("CVE-")])):
            v = {"type": "vulnerability", "spec_version": "2.1", "id": h.stix_id(
                "vulnerability",
                token), "created": created, "modified": modified, "name": token, "external_references": [
                {"source_name": "nvd", "external_id": token, "url": f"https://nvd.nist.gov/vuln/detail/{token}"}], "object_marking_refs": [
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
                f"chat-meta|{doc_id}|{created}"), "created": created, "modified": modified, "abstract": "Chat metadata (and sensitive hashed)", "content": str(
                content_note), "object_marking_refs": [tlp_red_id] if sensitive else [tlp_amber_id], }
            note_ref = h.add_obj(objects, seen, note, uniq=("note", note["id"]))

        external_refs: List[Dict[str, Any]] = []
        if url:
            external_refs.append({"source_name": "source", "url": str(url)})
        if channel_url and channel_url != url:
            external_refs.append({"source_name": "channel_url", "url": str(channel_url)})
        if h.safe_get(raw, "m_hash"):
            external_refs.append({"source_name": "content-hash", "external_id": str(h.safe_get(raw, "m_hash"))})
        if h.safe_get(raw, "m_scrap_file"):
            external_refs.append({"source_name": "scraper", "external_id": str(h.safe_get(raw, "m_scrap_file"))})
        if h.safe_get(raw, "m_message_id"):
            external_refs.append({"source_name": "message_id", "external_id": str(h.safe_get(raw, "m_message_id"))})

        report_object_refs: List[str] = []
        for r in [infra_ref, observed_ref, note_ref, created_by_ref]:
            if r:
                report_object_refs.append(r)
        report_object_refs.extend(vuln_refs)
        report_object_refs.extend(indicator_refs)
        report_object_refs.extend(attack_refs)

        report: Dict[str, Any] = {"type": "report", "spec_version": "2.1", "id": h.stix_id(
            "report",
            f"chat:{doc_id}"), "created": created, "modified": modified, "name": caption, "description": summary if summary else None, "report_types": [
            "threat-report"], "published": created, "labels": sorted(
            labels), "lang": lang, "created_by_ref": created_by_ref, "external_references": external_refs or None, "object_refs": sorted(
            set(report_object_refs)), "object_marking_refs": [tlp_amber_id], "x_orion_doc_id": str(
            doc_id), "x_orion_network": str(network) if network else None, "x_orion_platform": str(
            platform) if platform else None, "x_orion_channel_id": str(
            channel_id) if channel_id else None, "x_orion_channel_name": str(
            h.safe_get(raw, "m_channel_name")) if h.safe_get(
            raw, "m_channel_name") else None, "x_orion_views": str(h.safe_get(raw, "m_views")) if h.safe_get(
            raw, "m_views") else None, "x_orion_sender_is_bot": bool(h.safe_get(raw, "m_sender_is_bot")) if h.safe_get(
            raw, "m_sender_is_bot") is not None else None, "x_orion_is_forwarded": bool(
            h.safe_get(raw, "m_is_forwarded")) if h.safe_get(
            raw, "m_is_forwarded") is not None else None, "x_orion_is_reply": bool(
            h.safe_get(raw, "m_is_reply")) if h.safe_get(
            raw, "m_is_reply") is not None else None, "x_orion_pinned": bool(h.safe_get(raw, "m_pinned")) if h.safe_get(
            raw, "m_pinned") is not None else None, }
        report = {k: v for k, v in report.items() if v is not None}
        h.add_obj(objects, seen, report, uniq=("report", report["id"]))

        bundle = {"type": "bundle", "id": h.stix_id("bundle", report["id"]), "spec_version": "2.1", "objects": objects, }
        return bundle
