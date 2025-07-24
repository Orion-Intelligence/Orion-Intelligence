import math

from orion.constants.constant import CONSTANTS


class directory_helper_methods:

    @staticmethod
    def get_pagination(page_number, count):
        total_pages = max(1, math.ceil(count / CONSTANTS.S_SETTINGS_DIRECTORY_LIST_MAX_SIZE))

        if page_number > total_pages:
            return None, None, total_pages, False

        max_display_pages = 5
        half_range = max_display_pages // 2

        if total_pages <= max_display_pages:
            start_page, end_page = 1, total_pages
        elif page_number <= half_range:
            start_page, end_page = 1, min(max_display_pages, total_pages)
        elif page_number > total_pages - half_range:
            start_page, end_page = max(1, total_pages - max_display_pages + 1), total_pages
        else:
            start_page, end_page = page_number - half_range, min(page_number + half_range, total_pages)

        return start_page, end_page, total_pages, True
