import json
from orion.management.models.insight_model import InsightData, AGGREGATION_MAPPING
from orion.management.models.insight_model_comparison import InsightComparisonModel

from datetime import datetime


def populate_comparison_model(insight_old, insight_new, daily: bool):
    comparison = InsightComparisonModel()
    REVERSE_AGGREGATION_MAPPING = {v: k for k, v in AGGREGATION_MAPPING.items()}

    for section in ["general", "leak"]:
        old_model = getattr(insight_old, section)
        new_model = getattr(insight_new, section)
        comparison_model = getattr(comparison, section)

        for field in new_model.__dict__:
            new_value = getattr(new_model, field)
            old_value = getattr(old_model, field)

            if isinstance(new_value, datetime):
                new_value = new_value.isoformat()

            if isinstance(new_value, int) and isinstance(old_value, int):
                if new_value == 0 and old_value == 0:
                    change_percentage = "0%"
                elif old_value != 0:
                    change_percentage = f"{((new_value - old_value) / abs(old_value)) * 100:.2f}%"
                elif old_value == 0 and new_value != 0:
                    change_percentage = "100%"
                else:
                    change_percentage = "-"
            else:
                change_percentage = "-"

            metric = getattr(comparison_model, field)
            metric.key = REVERSE_AGGREGATION_MAPPING.get(field, field)
            metric.value = new_value

            if isinstance(new_value, int):
                if daily:
                    metric.change_daily = change_percentage
                else:
                    metric.change_weekly = change_percentage

    return comparison

def process_data(data):
    parsed_data = json.loads(data)
    for section in ["general", "leak"]:
        if "most_recent" in parsed_data[section]:
            parsed_data[section]["most_recent"] = str(parsed_data[section]["most_recent"])
        if "oldest_update" in parsed_data[section]:
            parsed_data[section]["oldest_update"] = str(parsed_data[section]["oldest_update"])
    return parsed_data

data = '{"general": {"document_count": 110, "most_recent": "2025-02-11T00:19:55.302000+00:00", "oldest_update": "2025-02-11T00:19:48.671000+00:00", "updated_5_days_ago": 0, "updated_9_days_ago": 0, "average_score": 54.0, "url_document_count": 0, "archive_document_count": 0, "email_document_count": 0, "phone_document_count": 0, "clearnet_document_count": 0, "common_types": "general"}, "leak": {"document_count": 0, "unique_base_urls": 0, "url_document_count": 0, "dumps_document_count": 0, "updated_5_days_ago": 0, "updated_9_days_ago": 0, "most_recent": "2025-02-11T00:19:48.271000+00:00", "oldest_update": "2025-02-11T00:19:37.600000+00:00"}}'
data = process_data(data)
insight_old = InsightData()
insight_new = InsightData.model_validate(data)
result = populate_comparison_model(insight_old, insight_new,False)
print(result)

