import logging

from django.apps import AppConfig

logger = logging.getLogger('tracker')

class TrackerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'tracker'

    def ready(self):
        logger.info("Tracker app is ready.")