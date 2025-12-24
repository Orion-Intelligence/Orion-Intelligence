from fastapi import FastAPI
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")


def configure_swagger(app: FastAPI):
    app.swagger_ui_init_oauth = {"appName": "Orion Intelligence OpenAPI", }

    @app.get("/docs", include_in_schema=False)
    async def custom_swagger_ui():
        swagger_ui_html = get_swagger_ui_html(
            openapi_url="/openapi.json",
            title="Orion Intelligence OpenAPI",
            oauth2_redirect_url="/docs/oauth2-redirect", ).body.decode("utf-8")

        swagger_ui_html += """
        <script>
            window.onload = function() {
                let token = localStorage.getItem('swagger_access_token');
                if (token) {
                    let swaggerUi = window.ui;
                    if (swaggerUi) {
                        swaggerUi.preauthorizeApiKey("OAuth2PasswordBearer", "Bearer " + token);
                    }
                }
            };
        </script>
        """

        return HTMLResponse(content=swagger_ui_html)
