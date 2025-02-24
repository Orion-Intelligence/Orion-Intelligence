from orion.constants.strings import GENERAL_STRINGS


class spell_checker:
  # Private Variables
  __instance = None

  # Initializations
  def __init__(self):
    pass

  @staticmethod
  def generate_suggestions(p_query, p_suggestion_content):
    p_query = p_query.lower()
    if len(p_suggestion_content) == 0:
      return GENERAL_STRINGS.S_GENERAL_EMPTY, GENERAL_STRINGS.S_GENERAL_EMPTY

    m_query = p_query
    m_content = {}
    for m_suggestion in p_suggestion_content:
      if len(m_suggestion['options']) > 0:
        m_content[m_suggestion['text']] = m_suggestion['options'][0]['text']

    m_query_text = GENERAL_STRINGS.S_GENERAL_EMPTY
    for m_key in m_content.keys():
      if len(m_query_text) > 0:
        m_query_text = m_query_text.replace(m_key, m_content[m_key])
      else:
        m_query_text = p_query.replace(m_key, m_content[m_key])
      m_query = m_query.replace(m_key, m_content[m_key])

    return m_query, m_query_text

