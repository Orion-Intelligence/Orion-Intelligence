import re


class search_helper_methods:

  @staticmethod
  def clip_sections(sections, words_to_highlight, max_width, fallback_text):
    sections = [section.lower() for section in sections]
    words_to_highlight = [word.lower() for word in words_to_highlight]
    pattern = re.compile(r'\b(' + '|'.join(map(re.escape, words_to_highlight)) + r')\b', re.IGNORECASE)
    combined_text = ". ".join(sections)
    match = pattern.search(combined_text)
    first_occurrence, matched_token = (match.start(), match.group()) if match else (None, None)
    start = 0
    was_deadend = False
    if first_occurrence is None:
      first_occurrence = 0

    if first_occurrence - 50 < 0:
      start = 0
    else:
      first_occurrence_pointer = max(0, first_occurrence - 100) + combined_text[max(0, first_occurrence - 100):first_occurrence].rfind('.') if first_occurrence else None
      if first_occurrence_pointer is None:
        first_occurrence_pointer = max(0, first_occurrence - 100) + combined_text[max(0, first_occurrence - 100):first_occurrence].rfind(' ') if first_occurrence else None
        if first_occurrence_pointer is not None:
          start = first_occurrence_pointer
      else:
        start = first_occurrence_pointer + 1

    if first_occurrence + max_width + 100 > len(combined_text):
      end = len(combined_text)
    else:
      first_occurrence_pointer = (first_occurrence + max_width + combined_text[first_occurrence + max_width:first_occurrence + max_width + 100].rfind('.')) if first_occurrence and combined_text[first_occurrence + max_width:first_occurrence + max_width + 100].rfind('.') != -1 else None
      if first_occurrence_pointer is None:
        first_occurrence_pointer = (first_occurrence + max_width + combined_text[first_occurrence + max_width:first_occurrence + max_width + 100].rfind(' ')) if first_occurrence and combined_text[first_occurrence + max_width:first_occurrence + max_width + 100].rfind(' ') != -1 else None
        if first_occurrence_pointer is not None:
          end = first_occurrence_pointer
        else:
          end = first_occurrence + max_width
        was_deadend = True
      else:
        end = first_occurrence_pointer
    extracted_text = combined_text[start:end].strip()

    if len(extracted_text) < 10:
      return fallback_text
    elif was_deadend:
      return extracted_text + "..."
    else:
      return extracted_text


  @staticmethod
  def highlight_tokens_in_text(text, words_to_highlight):
    tokens = list(filter(str.strip, words_to_highlight.split() if isinstance(words_to_highlight, str) else words_to_highlight))
    if not tokens:
      return text
    pattern = re.compile(r'\b\w*(' + '|'.join(map(re.escape, tokens)) + r')\w*\b', re.IGNORECASE)
    return pattern.sub(lambda match: f'<span class="highlight-description">{match.group(0)}</span>', text)


  @staticmethod
  def normalize_text(p_text):
    return p_text.encode("ascii", "ignore").decode()
