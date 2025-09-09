import asyncio
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import secrets

from orion.helper_manager.env_handler import env_handler


class mail_manager:
    __instance = None
    

    @staticmethod
    def get_instance():
        if mail_manager.__instance is None:
            if mail_manager.__instance is None:
                mail_manager.__instance = mail_manager()
        return mail_manager.__instance

    def __init__(self):
        if mail_manager.__instance is not None:
            raise Exception("This class is a singleton!")
        mail_manager.__instance = self


    async def send_verification_mail(self, to: str, subject: str, body: str):
        ACCOUNTS_MAIL_PASSWORD = env_handler.get_instance().env("ACCOUNTS_MAIL_PASSWORD")
        sender_email = "accounts@orionintelligence.org"
        smtp_server = "smtp.titan.email"
        smtp_port = 465
        msg = MIMEMultipart()
        msg["From"] = sender_email
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))
        await asyncio.to_thread(self._send_sync_email, sender_email, ACCOUNTS_MAIL_PASSWORD, to, msg,smtp_server,smtp_port)
        

    def _send_sync_email(self, sender_email, password, to, msg,smtp_server,smtp_port):
        with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
            server.login(sender_email, password)
            server.sendmail(sender_email, to, msg.as_string())