import asyncio
from unittest.mock import AsyncMock, patch
import httpx
import pytest
from fastapi import HTTPException

from orion.services.orion_mail_client.orion_mail_client import orion_mail_client


@pytest.fixture
def mail_client():
    client = orion_mail_client()
    client._internal_url = "http://fake-mail-host:8000"
    client._secret = "test-secret-key"
    client._timeout = 5.0
    return client


def test_orion_mail_client_singleton():
    inst1 = orion_mail_client.get_instance()
    inst2 = orion_mail_client.get_instance()
    assert inst1 is inst2


def test_headers(mail_client):
    headers = mail_client._headers()
    assert headers["x-orion-mail-client-secret"] == "test-secret-key"
    assert headers["Host"] == "localhost"
    assert headers["Content-Type"] == "application/json"


def test_create_tenant_mailbox_success(mail_client):
    async def run():
        mock_response = httpx.Response(
            status_code=200,
            json={
                "status": "ok",
                "mailbox_id": "mb-12345",
                "mailbox_address": "acme_report@mail.orionintelligence.org",
                "user_id": "u-123",
            },
            request=httpx.Request("POST", "http://fake-mail-host:8000/api/internal/tenants/mailbox"),
        )
        with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response
            res = await mail_client.create_tenant_mailbox(
                tenant_id="660000000000000000000001",
                tenant_slug="acme",
                tenant_name="Acme Corp",
            )
            assert res["mailbox_id"] == "mb-12345"
            assert res["mailbox_address"] == "acme_report@mail.orionintelligence.org"
            mock_post.assert_awaited_once()

    asyncio.run(run())


def test_create_tenant_mailbox_http_error(mail_client):
    async def run():
        mock_response = httpx.Response(
            status_code=400,
            text="Tenant already exists",
            request=httpx.Request("POST", "http://fake-mail-host:8000/api/internal/tenants/mailbox"),
        )
        with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response
            with pytest.raises(HTTPException) as exc:
                await mail_client.create_tenant_mailbox(
                    tenant_id="660000000000000000000001",
                    tenant_slug="acme",
                    tenant_name="Acme Corp",
                )
            assert exc.value.status_code == 502
            assert "Orion Mail mailbox creation failed" in exc.value.detail

    asyncio.run(run())


def test_create_tenant_mailbox_network_error(mail_client):
    async def run():
        with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
            mock_post.side_effect = httpx.ConnectError("Connection refused")
            with pytest.raises(HTTPException) as exc:
                await mail_client.create_tenant_mailbox(
                    tenant_id="660000000000000000000001",
                    tenant_slug="acme",
                    tenant_name="Acme Corp",
                )
            assert exc.value.status_code == 502
            assert "Unable to connect to Orion Mail service" in exc.value.detail

    asyncio.run(run())


def test_send_takedown_mail_success(mail_client):
    async def run():
        mock_response = httpx.Response(
            status_code=200,
            json={"status": "sent", "message_id": "msg-999"},
            request=httpx.Request("POST", "http://fake-mail-host:8000/api/internal/takedown/send"),
        )
        with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response
            res = await mail_client.send_takedown_mail(
                tenant_id="660000000000000000000001",
                to_email="abuse@hoster.com",
                subject="Takedown notice for phishing.com",
                target_domain="phishing.com",
                custom_message="Please take down this site immediately.",
                takedown_id="td-123",
            )
            assert res["status"] == "sent"
            assert res["message_id"] == "msg-999"

    asyncio.run(run())


def test_send_takedown_mail_http_error(mail_client):
    async def run():
        mock_response = httpx.Response(
            status_code=500,
            text="SMTP server failure",
            request=httpx.Request("POST", "http://fake-mail-host:8000/api/internal/takedown/send"),
        )
        with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response
            with pytest.raises(HTTPException) as exc:
                await mail_client.send_takedown_mail(
                    tenant_id="660000000000000000000001",
                    to_email="abuse@hoster.com",
                    subject="Takedown notice",
                    target_domain="phishing.com",
                )
            assert exc.value.status_code == 502
            assert "Orion Mail takedown dispatch failed" in exc.value.detail

    asyncio.run(run())


def test_send_takedown_mail_network_error(mail_client):
    async def run():
        with patch.object(httpx.AsyncClient, "post", new_callable=AsyncMock) as mock_post:
            mock_post.side_effect = httpx.ConnectTimeout("Timeout")
            with pytest.raises(HTTPException) as exc:
                await mail_client.send_takedown_mail(
                    tenant_id="660000000000000000000001",
                    to_email="abuse@hoster.com",
                    subject="Takedown notice",
                    target_domain="phishing.com",
                )
            assert exc.value.status_code == 502
            assert "Unable to connect to Orion Mail service" in exc.value.detail

    asyncio.run(run())


def test_get_unread_takedown_count_success(mail_client):
    async def run():
        mock_response = httpx.Response(
            status_code=200,
            json={"status": "ok", "unread_count": 4},
            request=httpx.Request("GET", "http://fake-mail-host:8000/api/internal/takedown/unread-count"),
        )
        with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_response
            count = await mail_client.get_unread_takedown_count(tenant_id="660000000000000000000001")
            assert count == 4

    asyncio.run(run())


def test_get_unread_takedown_count_error_returns_zero(mail_client):
    async def run():
        mock_response = httpx.Response(
            status_code=500,
            text="Internal Server Error",
            request=httpx.Request("GET", "http://fake-mail-host:8000/api/internal/takedown/unread-count"),
        )
        with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_response
            count = await mail_client.get_unread_takedown_count(tenant_id="660000000000000000000001")
            assert count == 0

        with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
            mock_get.side_effect = httpx.ConnectError("Connection failed")
            count = await mail_client.get_unread_takedown_count(tenant_id="660000000000000000000001")
            assert count == 0

    asyncio.run(run())
