from starlette.middleware.base import BaseHTTPMiddleware
from metrics import REQUEST_COUNT

EXCLUDED_PATHS = ("/metrics", "/health", "/ready", "/livez")

class MetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):

        if request.url.path.startswith(EXCLUDED_PATHS):
            return await call_next(request)

        response = await call_next(request)

        endpoint = (
            request.scope.get("route").path
            if request.scope.get("route")
            else request.url.path
        )

        REQUEST_COUNT.labels(
            app_name="webapp",
            method=request.method,
            endpoint=endpoint,
            http_status=str(response.status_code)
        ).inc()

        return response
