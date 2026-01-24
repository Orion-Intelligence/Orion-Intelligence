import asyncio
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from orion.helper_manager.env_handler import env_handler
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_system_settings import db_system_model


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
        engine = mongo_controller.get_instance().get_engine()
        record = await engine.find_one(
            db_system_model, db_system_model.key == "app_name")
        app_name = record.value if record and record.value else "Orion Intelligence"

        subject = subject.replace("appname", app_name)
        body = body.replace("appname", app_name)

        return subject, body

    async def _prepare_verification_message(self, to_header: str, subject: str, body: str):
        subject, body = await self.process_app_variables(subject, body)
        ACCOUNTS_MAIL_PASSWORD = env_handler.get_instance().env("ACCOUNTS_MAIL_PASSWORD")
        sender_email = env_handler.get_instance().env("ACCOUNTS_MAIL")
        smtp_server = env_handler.get_instance().env("ACCOUNTS_SMTP_SERVER")
        smtp_port = int(env_handler.get_instance().env("ACCOUNTS_SMTP_PORT"))
        msg = MIMEMultipart("alternative")
        msg["From"] = sender_email
        msg["To"] = to_header
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "html"))
        return sender_email, ACCOUNTS_MAIL_PASSWORD, smtp_server, smtp_port, msg

    async def send_verification_mail(self, to: str, subject: str, body: str):
        sender_email, ACCOUNTS_MAIL_PASSWORD, smtp_server, smtp_port, msg = await self._prepare_verification_message(to, subject, body)
        await asyncio.to_thread(self._send_sync_email, sender_email, ACCOUNTS_MAIL_PASSWORD, to, msg, smtp_server, smtp_port)

    async def send_verification_mail_list(self, to_list, subject: str, body: str):
        sender_email, ACCOUNTS_MAIL_PASSWORD, smtp_server, smtp_port, msg = await self._prepare_verification_message(", ".join(to_list), subject, body)
        await asyncio.to_thread(self._send_sync_email_list, sender_email, ACCOUNTS_MAIL_PASSWORD, to_list, msg, smtp_server, smtp_port)

    @staticmethod
    def _send_sync_email(sender_email, password, to, msg, smtp_server, smtp_port):
        recipients = [to, sender_email]
        if env_handler.get_instance().env("PRODUCTION", "0") == "1":
            with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
                server.login(sender_email, password)
                server.sendmail(sender_email, recipients, msg.as_string())
        else:
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.sendmail(sender_email, recipients, msg.as_string())

    @staticmethod
    def _send_sync_email_list(sender_email, password, to_list, msg, smtp_server, smtp_port):
        recipients = list(to_list) + [sender_email]
        if env_handler.get_instance().env("PRODUCTION", "0") == "1":
            with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
                server.login(sender_email, password)
                server.sendmail(sender_email, recipients, msg.as_string())
        else:
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.sendmail(sender_email, recipients, msg.as_string())
