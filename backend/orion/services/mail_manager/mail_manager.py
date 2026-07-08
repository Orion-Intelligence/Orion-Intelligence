import asyncio
from fastapi import HTTPException
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import ssl

from orion.helper_manager.env_handler import env_handler
from orion.services.log_manager.log_controller import log
from orion.services.mongo_manager.shared_model.db_system_settings import db_system_model

MAIL_CONFIGURATION_FAILED_STATUS = 424


class mail_manager:
    __instance = None

    @staticmethod
    def get_instance():
        if mail_manager.__instance is None:
            mail_manager.__instance = mail_manager()
        return mail_manager.__instance

    def __init__(self):
        if mail_manager.__instance is not None:
            raise Exception("This class is a singleton!")
        mail_manager.__instance = self

    async def process_app_variables(self, subject: str, body: str):
        from orion.services.mongo_manager.mongo_controller import mongo_controller
        engine = mongo_controller.get_instance().get_engine()
        record = await engine.find_one(
            db_system_model, db_system_model.key == "app_name")
        app_name = record.value if record and record.value else "Orion Intelligence"

        subject = subject.replace("appname", app_name)
        body = body.replace("appname", app_name)

        return subject, body

    @staticmethod
    def _global_mail_config():
        from orion.api.server.config_manager.config_controller import config_controller
        config = config_controller.getInstance()._config
        meta_info_raw = config.get("meta_info", "{}")
        try:
            meta_info = json.loads(meta_info_raw) if isinstance(meta_info_raw, str) else {}
        except (TypeError, ValueError):
            meta_info = {}

        return meta_info

    @staticmethod
    def _normalize_mail_config(config):
        password = config.get("ACCOUNTS_MAIL_PASSWORD")
        sender_email = config.get("ACCOUNTS_MAIL")
        smtp_server = config.get("ACCOUNTS_SMTP_SERVER")
        smtp_port_raw = config.get("ACCOUNTS_SMTP_PORT")
        if not password or not sender_email or not smtp_server or not smtp_port_raw:
            raise HTTPException(status_code=400, detail="SMTP configuration is incomplete")
        try:
            smtp_port = int(str(smtp_port_raw))
        except ValueError:
            raise HTTPException(status_code=400, detail="SMTP configuration is incomplete")
        return sender_email, password, smtp_server, smtp_port

    @staticmethod
    def _decrypt_tenant_value(enc, value):
        if not value:
            return ""
        try:
            return enc.decrypt(value.encode()).decode()
        except Exception:
            return ""

    async def _tenant_mail_config(self, tenant_id: str | None):
        if not tenant_id:
            return None
        from bson import ObjectId
        from cryptography.fernet import Fernet
        from orion.services.encryption_manager.key_manager import KeyManager
        from orion.services.mongo_manager.mongo_controller import mongo_controller
        from orion.services.mongo_manager.shared_model.db_tenant_model import db_tenant_model

        if not ObjectId.is_valid(str(tenant_id)):
            return None
        engine = mongo_controller.get_instance().get_engine()
        tenant = await engine.find_one(db_tenant_model, db_tenant_model.id == ObjectId(str(tenant_id)))
        if not tenant:
            return None
        dek = await KeyManager.get_instance().get_profile_dek(str(tenant.id))
        if not dek:
            return None
        enc = Fernet(dek)
        config = {
            "ACCOUNTS_MAIL_PASSWORD": self._decrypt_tenant_value(enc, getattr(tenant, "accounts_mail_password", "")),
            "ACCOUNTS_MAIL": self._decrypt_tenant_value(enc, getattr(tenant, "accounts_mail", "")),
            "ACCOUNTS_SMTP_SERVER": self._decrypt_tenant_value(enc, getattr(tenant, "accounts_smtp_server", "")),
            "ACCOUNTS_SMTP_PORT": self._decrypt_tenant_value(enc, getattr(tenant, "accounts_smtp_port", "")),
        }
        return config if all(config.values()) else None

    async def _selected_mail_config(self, tenant_id: str | None):
        return await self._tenant_mail_config(tenant_id) or self._global_mail_config()

    async def _prepare_verification_message(self, to_header: str, subject: str, body: str, tenant_id: str | None = None, config=None):
        subject, body = await self.process_app_variables(subject, body)
        sender_email, ACCOUNTS_MAIL_PASSWORD, smtp_server, smtp_port = self._normalize_mail_config(
            config or await self._selected_mail_config(tenant_id))
        msg = MIMEMultipart("alternative")
        msg["From"] = sender_email
        msg["To"] = to_header
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "html"))
        return sender_email, ACCOUNTS_MAIL_PASSWORD, smtp_server, smtp_port, msg

    async def send_verification_mail(self, to: str, subject: str, body: str, tenant_id: str | None = None, config=None):
        sender_email, ACCOUNTS_MAIL_PASSWORD, smtp_server, smtp_port, msg = await self._prepare_verification_message(to, subject, body, tenant_id, config)
        await asyncio.to_thread(self._send_sync_email, sender_email, ACCOUNTS_MAIL_PASSWORD, to, msg, smtp_server, smtp_port)

    async def send_verification_mail_list(self, to_list, subject: str, body: str, tenant_id: str | None = None):
        sender_email, ACCOUNTS_MAIL_PASSWORD, smtp_server, smtp_port, msg = await self._prepare_verification_message(", ".join(to_list), subject, body, tenant_id)
        await asyncio.to_thread(self._send_sync_email_list, sender_email, ACCOUNTS_MAIL_PASSWORD, to_list, msg, smtp_server, smtp_port)

    async def send_test_mail(self, tenant_id: str | None = None, config=None):
        meta_info = config or await self._selected_mail_config(tenant_id)
        to = meta_info.get("ACCOUNTS_MAIL")
        if not to:
            raise HTTPException(status_code=400, detail="SMTP configuration is incomplete")
        try:
            await self.send_verification_mail(to, "SMTP configuration test", "<p>SMTP configuration test email.</p>", tenant_id=tenant_id, config=meta_info)
        except HTTPException:
            raise
        except Exception as exc:
            smtp_code = getattr(exc, "smtp_code", None)
            smtp_error = getattr(exc, "smtp_error", None)
            if isinstance(smtp_error, bytes):
                smtp_error = smtp_error.decode(errors="ignore")
            detail = f"SMTP error {smtp_code}" if smtp_code else "Mail configuration is not working"
            if smtp_error:
                detail = f"{detail}: {smtp_error}"
            raise HTTPException(status_code=MAIL_CONFIGURATION_FAILED_STATUS, detail=detail) from exc

    @staticmethod
    def _send_sync_email(sender_email, password, to, msg, smtp_server, smtp_port):
        recipients = [to, sender_email]
        mail_manager._send_sync(sender_email, password, recipients, msg, smtp_server, smtp_port)

    @staticmethod
    def _send_sync_email_list(sender_email, password, to_list, msg, smtp_server, smtp_port):
        recipients = list(to_list) + [sender_email]
        mail_manager._send_sync(sender_email, password, recipients, msg, smtp_server, smtp_port)

    @staticmethod
    def _send_sync(sender_email, password, recipients, msg, smtp_server, smtp_port):
        if env_handler.get_instance().env("PRODUCTION", "0") == "1":
            with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
                server.login(sender_email, password)
                server.sendmail(sender_email, recipients, msg.as_string())
        else:
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.sendmail(sender_email, recipients, msg.as_string())

    async def validate_mail_configuration(self, tenant_id: str | None = None):
        if tenant_id:
            tenant_config = await self._tenant_mail_config(tenant_id)
            if tenant_config:
                sender_email, password, smtp_server, smtp_port = self._normalize_mail_config(tenant_config)
                await asyncio.to_thread(
                    mail_manager._validate_connection_sync, sender_email, password, smtp_server, smtp_port
                )
                return
        await asyncio.to_thread(mail_manager._validate_mail_configuration_sync)

    @staticmethod
    def _validate_mail_configuration_sync():
        sender_email, password, smtp_server, smtp_port = mail_manager._normalize_mail_config(
            mail_manager._global_mail_config())
        return mail_manager._validate_connection_sync(sender_email, password, smtp_server, smtp_port)

    @staticmethod
    def _validate_connection_sync(sender_email, password, smtp_server, smtp_port):
        try:
            is_production = env_handler.get_instance().env("PRODUCTION", "0") == "1"

            context = ssl.create_default_context()

            if is_production:
                with smtplib.SMTP_SSL(
                    smtp_server,
                    smtp_port,
                    context=context,
                    timeout=10
                ) as server:

                    server.login(sender_email, password)

            else:
                with smtplib.SMTP(
                    smtp_server,
                    smtp_port,
                    timeout=10
                ) as server:

                    try:
                        server.starttls(context=context)
                        server.login(sender_email, password)
                    except Exception as ex:
                        log.g().w(f"SMTP validation fallback failed: {str(ex)}")

            return True

        except Exception:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid network configuration in system settings"
            )
