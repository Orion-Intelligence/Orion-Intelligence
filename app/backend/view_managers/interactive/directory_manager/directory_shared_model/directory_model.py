from django.db import models
from app.backend.constants.strings import GENERAL_STRINGS

class DirectoryModel(models.Model):
    page_number = models.CharField(max_length=255, default=GENERAL_STRINGS.S_GENERAL_EMPTY)
    content_type = models.CharField(max_length=255, default=GENERAL_STRINGS.S_GENERAL_EMPTY)
    index = models.CharField(max_length=255, default=GENERAL_STRINGS.S_GENERAL_EMPTY)
    network = models.CharField(max_length=255, default=GENERAL_STRINGS.S_GENERAL_EMPTY)
    site = models.URLField(default=GENERAL_STRINGS.S_GENERAL_HTTP)

    def __str__(self):
        return f"DirectoryModel(Page: {self.page_number}, Type: {self.content_type})"

    @classmethod
    def create_from_request(cls, request_data):
        """Creates an instance from a Django request (e.g., from request.POST or request.data)."""
        return cls.objects.create(
            page_number=request_data.get('page_number', GENERAL_STRINGS.S_GENERAL_EMPTY),
            content_type=request_data.get('content_type', GENERAL_STRINGS.S_GENERAL_EMPTY),
            index=request_data.get('index', GENERAL_STRINGS.S_GENERAL_EMPTY),
            network=request_data.get('network', GENERAL_STRINGS.S_GENERAL_EMPTY),
            site=request_data.get('site', GENERAL_STRINGS.S_GENERAL_HTTP)
        )
