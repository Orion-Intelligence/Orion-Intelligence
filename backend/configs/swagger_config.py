from fastapi import FastAPI
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")


def configure_swagger(app: FastAPI):
    app.swagger_ui_init_oauth = {"appName": "API Access", }

    @app.get("/docs", include_in_schema=False)
    async def custom_swagger_ui():
        swagger_ui_html = get_swagger_ui_html(
            openapi_url="/openapi.json",
            title="Api Access",
            oauth2_redirect_url="/docs/oauth2-redirect", ).body.decode("utf-8")

        swagger_ui_html += '<script src="/static/swagger-auth.js"></script>'

        return HTMLResponse(content=swagger_ui_html)
