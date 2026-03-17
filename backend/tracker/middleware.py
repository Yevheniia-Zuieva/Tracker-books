import logging

logger = logging.getLogger('tracker')

class ExceptionLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        # Логуємо будь-яку непередбачувану помилку, яка не була оброблена у views
        logger.critical(f"Unhandled Exception: {str(exception)} on access to {request.path}", exc_info=True)
        return None