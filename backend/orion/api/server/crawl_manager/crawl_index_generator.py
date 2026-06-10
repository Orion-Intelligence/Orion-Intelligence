import hashlib
from datetime import datetime, timezone

from orion.helper_manager.helper_controller import helper_controller
from orion.services.elastic_manager.elastic_enums import ELASTIC_INDEX, ELASTIC_KEYS


class crawl_index_generator:
    @staticmethod
    def index_query_general(p_index_data):
        index_entries = []
        utc_now = datetime.now(timezone.utc)
        current_timestamp = utc_now.isoformat()

        if isinstance(p_index_data, list):
            pass
        else:
            if not p_index_data["m_important_content"] or not p_index_data["m_title"]:
                return index_entries

            p_index_data["m_update_date"] = current_timestamp
            p_index_data["m_hash_content"] = hashlib.sha256(
                (p_index_data["m_important_content"] + p_index_data["m_title"]).encode()).hexdigest()
            p_index_data["m_hash_url"] = hashlib.sha256(
                (p_index_data["m_url"] + p_index_data["m_title"]).encode()).hexdigest()
            data_hash = helper_controller.generate_data_hash(p_index_data["m_url"])
            p_index_data["m_hash"] = data_hash

            index_entries.append(
                {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_GENERIC_INDEX, ELASTIC_KEYS.S_VALUE: p_index_data, })

        return index_entries

    @staticmethod
    def index_query_chat(p_index_data):
        index_entries = []
        for chat in p_index_data.get("m_chat_data", []):
            if not chat.get("m_message_id"):
                continue

            chat["m_hash"] = helper_controller.generate_data_hash(chat.get("m_message_id"))
            index_entries.append({ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_CHATS_INDEX, ELASTIC_KEYS.S_VALUE: chat})

        return index_entries

    @staticmethod
    def index_query_social(p_index_data):
        index_entries = []
        for post in p_index_data.get("cards_data", []):
            m_hash = ""
            if post.get("m_message_id"):
                m_hash = post.get("m_message_id")
            if not m_hash:
                m_hash = post.get("m_title") + "_" + post.get("m_channel_url")
            if not m_hash:
                continue

            post["m_hash"] = helper_controller.generate_data_hash(m_hash)
            index_entries.append({ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_SOCIAL_INDEX, ELASTIC_KEYS.S_VALUE: post})
        return index_entries

    @staticmethod
    def index_query_sanctions(p_index_data):
        index_entries = []

        if isinstance(p_index_data, list):
            for item in p_index_data:
                if not isinstance(item, dict):
                    continue

                data = {k: v for k, v in item.items() if v is not None}
                schema_value = data.pop("schema_name", None)
                if schema_value:
                    data["schema"] = schema_value

                identifier = data.get("id")
                if not identifier:
                    continue

                data["m_hash"] = helper_controller.generate_data_hash(str(identifier))
                index_entries.append({ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_OPENSANCTIONS_INDEX, ELASTIC_KEYS.S_VALUE: data})

            return index_entries

        if not isinstance(p_index_data, dict):
            return index_entries

        data = {k: v for k, v in p_index_data.items() if v is not None}
        schema_value = data.pop("schema_name", None)
        if schema_value:
            data["schema"] = schema_value

        identifier = data.get("id")
        if not identifier:
            return index_entries

        data["m_hash"] = helper_controller.generate_data_hash(str(identifier))
        index_entries.append({ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_OPENSANCTIONS_INDEX, ELASTIC_KEYS.S_VALUE: data})
        return index_entries

    @staticmethod
    def index_query_stealerlog(p_index_data):
        bulk_entries = []
        for log in p_index_data["logs"]:
            m_hash = log["m_hash"]
            _id = str(datetime.utcnow().year) + "_UTC_" + m_hash

            doc = {}
            for k in log:
                if log[k] is not None:
                    doc[k] = log[k]

            bulk_entries.append({"create": {"_index": ELASTIC_INDEX.S_STEALERLOGS_INDEX, "_id": _id}})
            bulk_entries.append(doc)

        return bulk_entries

    @staticmethod
    def index_query_defacement(p_index_data):
        index_entries = []
        utc_now = datetime.now(timezone.utc)
        current_timestamp = utc_now.isoformat()

        for record in p_index_data.get("cards_data", []):
            if not record["m_url"]:
                continue

            data_hash = helper_controller.generate_data_hash(record["m_url"])
            record["m_hash"] = data_hash
            record["m_update_date"] = current_timestamp
            index_entries.append(
                {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_DEFACEMENT_INDEX, ELASTIC_KEYS.S_VALUE: record, })
        return index_entries

    @staticmethod
    def index_query_leak(p_index_data):
        contact_link = p_index_data.get("contact_link", "")
        index_entries = []
        current_timestamp = datetime.now(timezone.utc).isoformat()

        for card in p_index_data.get("cards_data", []):
            if not card["m_url"] or not card["m_title"]:
                continue

            card["m_hash"] = helper_controller.generate_data_hash(card["m_base_url"] + "_" + card["m_title"])
            card["m_update_date"] = current_timestamp
            card["m_contact_link"] = contact_link

            cleaned_card = {k: v for k, v in card.items() if v is not None}

            index_entries.append(
                {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_LEAK_INDEX, ELASTIC_KEYS.S_VALUE: cleaned_card, })

        return index_entries

    @staticmethod
    def index_query_exploit(p_index_data):
        contact_link = p_index_data.get("contact_link", "")
        index_entries = []
        current_timestamp = datetime.now(timezone.utc).isoformat()

        for card in p_index_data.get("cards_data", []):
            if not card["m_url"] or not card["m_title"]:
                continue

            card["m_hash"] = helper_controller.generate_data_hash(card["m_url"] + "_" + card["m_title"])
            card["m_update_date"] = current_timestamp
            card["m_contact_link"] = contact_link

            cleaned_card = {k: v for k, v in card.items() if v is not None}

            index_entries.append(
                {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_EXPLOIT_INDEX, ELASTIC_KEYS.S_VALUE: cleaned_card, })

        return index_entries

    @staticmethod
    def index_query_apt(p_index_data):
        contact_link = p_index_data.get("contact_link", "")
        base_url = p_index_data.get("base_url", "")
        index_entries = []
        current_timestamp = datetime.now(timezone.utc).isoformat()

        for card in p_index_data.get("cards_data", []):
            title = card.get("m_title")
            if not title:
                continue

            card["m_hash"] = helper_controller.generate_data_hash(title)
            card["m_update_date"] = current_timestamp
            card["m_contact_link"] = contact_link
            card.setdefault("m_base_url", base_url)

            cleaned_card = {k: v for k, v in card.items() if v is not None}

            index_entries.append(
                {ELASTIC_KEYS.S_DOCUMENT: ELASTIC_INDEX.S_APT_INDEX, ELASTIC_KEYS.S_VALUE: cleaned_card, })

        return index_entries
