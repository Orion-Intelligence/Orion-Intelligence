from typing import Optional

from pydantic import ValidationError
from orion.api.interactive.search_manager.search_data_model.search_callback_model import result_item
from orion.constants.constant import CONSTANTS

class search_callback:
  __instance = None

  @staticmethod
  async def __parse_filtered_documents(p_paged_documents):
    mRelevanceListData = []
    mDescription = set()
    total_pages = 0

    try:
      total_hits = p_paged_documents.get('hits', {}).get('total', {}).get('value', 0)
      if total_hits > 0:
        total_pages = total_hits / CONSTANTS.S_SETTINGS_SEARCHED_DOCUMENT_SIZE

      m_result_final = p_paged_documents.get('hits', {}).get('hits', [])

      for m_document in m_result_final:
        m_service = m_document.get('_source', None)
        if not m_service:
          continue

        highlight_text = ""
        if "highlight" in m_document:
          m_highlight = m_document["highlight"]

          important_fragments = m_highlight.get("m_important_content", [])
          content_fragments = m_highlight.get("m_content", [])
          href_fragments = m_highlight.get("m_href_html", [])

          if important_fragments:
            highlight_text = " ... ".join(important_fragments)

          if len(highlight_text) < 250 and content_fragments:
            highlight_text = f"{highlight_text} ... {' ... '.join(content_fragments)}".strip(" .")

          if len(highlight_text) < 250 and href_fragments:
            highlight_text = f"{highlight_text} ... {' ... '.join(href_fragments)}".strip(" .")

          if highlight_text:
            m_service["m_important_content"] = highlight_text

          m_service["highlight"] = m_highlight

        if "m_ref_html" in m_service and len(m_service["m_important_content"]) < 250 and len(m_service["m_ref_html"])>20:
          m_service["m_important_content"] = "TARGET WEBDATA 〡 " + m_service["m_ref_html"]

        m_service['m_sub_host'] = m_service.get('m_sub_host', '/')
        m_service['m_host'] = m_service.get('m_host', '')

        m_content_preview = m_service.get("m_content", "")[:500]
        m_hash = m_service.get("m_hash", "")
        dedup_key = m_content_preview if m_content_preview else m_hash

        if isinstance(dedup_key, list):
          if any(item in mDescription for item in dedup_key):
            continue
          for item in dedup_key:
            mDescription.add(item)
        else:
          if dedup_key in mDescription:
            continue
          mDescription.add(dedup_key)
        mRelevanceListData.append(m_service)
      content_suggestions = p_paged_documents.get('suggest', {}).get('content_suggestion', [])
      return mRelevanceListData, content_suggestions, total_pages

    except Exception as e:
      print("Error parsing filtered documents:", e)
      return mRelevanceListData, [], total_pages

  async def search_handler(self, m_status, m_documents, callback_model, listing_filter=None):
    if not m_status:
      return callback_model(Result=[], Suggestions=[], Page_Count=0)

    parsed_result = await self.__parse_filtered_documents(m_documents)
    m_parsed_documents, m_suggestions_content, total_pages = parsed_result

    def clean_document(doc):
      if "highlight" in doc and "m_important_content" in doc["highlight"]:
        highlighted_fragments = doc["highlight"]["m_important_content"]
        if highlighted_fragments:
          doc["m_important_content"] = highlighted_fragments[0]

      if listing_filter is not None:
        doc = {k: v for k, v in doc.items() if k not in listing_filter}

      for key, value in doc.items():
        if isinstance(value, list) and len(value) > 3:
          doc[key] = value[:3]

      return {
        k: v for k, v in doc.items()
        if v not in (None, '', []) and (not isinstance(v, dict) or v)
      }

    filtered_results = [clean_document(doc) for doc in m_parsed_documents]

    return callback_model(
      Result=filtered_results,
      Suggestions=m_suggestions_content,
      Page_Count=total_pages
    )

  @staticmethod
  async def get_doc(results) -> Optional[result_item]:
      try:
          if results and isinstance(results, list) and len(results) > 0:
              return results[0]
          return None
      except ValidationError:
          return None
