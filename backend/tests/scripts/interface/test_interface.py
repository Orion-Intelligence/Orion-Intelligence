import pytest

from tests.scripts.interface.helpers import _client_with_frontend


@pytest.mark.anyio
async def test_frontend_index_injects_csp_nonce(tmp_path, monkeypatch):
    (tmp_path / "index.html").write_text(
        '<app-root ngCspNonce="__CSP_NONCE__"></app-root>',
        encoding="utf-8",
    )

    async with _client_with_frontend(tmp_path, monkeypatch) as client:
        response = await client.get("/")

    assert response.status_code == 200
    assert 'ngCspNonce="test-nonce"' in response.text
    assert "__CSP_NONCE__" not in response.text


@pytest.mark.anyio
async def test_frontend_index_request_injects_csp_nonce(tmp_path, monkeypatch):
    (tmp_path / "index.html").write_text(
        '<app-root ngCspNonce="__CSP_NONCE__"></app-root>',
        encoding="utf-8",
    )

    async with _client_with_frontend(tmp_path, monkeypatch) as client:
        response = await client.get("/index.html")

    assert response.status_code == 200
    assert 'ngCspNonce="test-nonce"' in response.text


@pytest.mark.anyio
async def test_frontend_index_removes_nonce_placeholders_without_middleware(tmp_path, monkeypatch):
    (tmp_path / "index.html").write_text(
        '<app-root ngcspnonce="__CSP_NONCE__"></app-root>'
        '<script nonce="__CSP_NONCE__" src="/main.js"></script>',
        encoding="utf-8",
    )

    async with _client_with_frontend(tmp_path, monkeypatch, set_nonce=False) as client:
        response = await client.get("/")

    assert response.status_code == 200
    assert "__CSP_NONCE__" not in response.text
    assert 'ngcspnonce=""' not in response.text
    assert 'nonce=""' not in response.text
