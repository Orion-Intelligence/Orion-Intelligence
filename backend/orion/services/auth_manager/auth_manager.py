from fastapi import HTTPException
import threading
from datetime import datetime, timedelta, timezone

from orion.constants.constant import CONSTANTS
from orion.services.mongo_manager.mongo_controller import mongo_controller
from orion.services.mongo_manager.shared_model.db_auth_models import db_user_account,user_role,UserStatus
from orion.services.mongo_manager.signup_model.signup_request_model import SignupRequest
from orion.services.session_manager.session_manager import session_manager
from orion.services.mail_manager.mail_manager import mail_manager


class auth_manager:
    __instance = None
    __lock = threading.Lock()
    __cache = {}

    @staticmethod
    def get_instance():
        if auth_manager.__instance is None:
            with auth_manager.__lock:
                if auth_manager.__instance is None:
                    auth_manager.__instance = auth_manager()
        return auth_manager.__instance

    def __init__(self):
        if auth_manager.__instance is not None:
            raise Exception("This class is a singleton!")
        auth_manager.__instance = self
        self._engine = mongo_controller.get_instance().get_engine()

    async def authenticate_user(self, username: str, password: str):
        user = await self._engine.find_one(db_user_account, db_user_account.username == username)
        if not user or not CONSTANTS.S_AUTH_PWD_CONTEXT.verify(password, user.password):
            return None
        return user
    
    async def signup_user(data: SignupRequest):
        engine = mongo_controller.get_instance().get_engine()
        existing_user = await engine.find_one(
            db_user_account,
            (db_user_account.username == data.username) |
            (db_user_account.email == data.email)
        )
        if existing_user:
            raise HTTPException(status_code=400, detail="Username or email already exists")

        hashed_password = CONSTANTS.S_AUTH_PWD_CONTEXT.hash(data.password)
        _verification_token=session_manager.get_instance().generate_verification_token()
        _verification_token_expire=datetime.now(timezone.utc) + timedelta(days=1)

        user = db_user_account(
            username=data.username,
            email=data.email,
            password=hashed_password,
            role=user_role.PROFILE,
            status=UserStatus.PENDING,
            verification_token=_verification_token,
            verification_expiry=_verification_token_expire
        )
        await engine.save(user)
        verify_url = f"http://localhost:4200/welcome/{_verification_token}"
        html_content=f"""\
       <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="utf-8">
        <meta name="x-apple-disable-message-reformatting">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>Thank You</title>
        </head>
        <body style="margin:0;padding:0;background:#f5f7fa;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f7fa;">
            <tr>
            <td align="center" style="padding:24px 12px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                    style="max-width:820px;background:#ffffff;border:1px solid #e5e7eb;
                            border-radius:16px;overflow:hidden;box-shadow:0 6px 18px rgba(17,24,39,.06);">

                <!-- Header -->
                <tr>
                    <td style="background:linear-gradient(90deg,#0ea5e9,#6366f1);
                            color:#ffffff;padding:22px 26px;
                            font:600 20px/1.3 Arial,Helvetica,sans-serif;">
                    We’ve Received Your Message
                    </td>
                </tr>

                <!-- Intro Text -->
                <tr>
                    <td style="padding:28px 26px 12px 26px;
                            font:16px/1.65 Arial,Helvetica,sans-serif;
                            color:#0f172a;">
                    Thank you for contacting Orion Intelligence. Your request has been successfully
                    submitted and added to our support queue. Our team reviews messages throughout the day,
                    and you can expect a reply within 24–48 business hours. For urgent issues,
                    simply reply to this email to escalate.
                    </td>
                </tr>

                <!-- Section Label -->
                <tr>
                    <td style="padding:0 26px 8px 26px;">
                    <div style="display:inline-block;background:#ecfeff;color:#0e7490;
                                font:700 11px/1 Arial,Helvetica,sans-serif;
                                border:1px solid #a5f3fc;border-radius:9999px;
                                padding:6px 10px;margin:12px 0 0 0;">
                        Submission Details
                    </div>
                    </td>
                </tr>

                <!-- Submission Details -->
                <tr>
                    <td style="padding:12px 26px 16px 26px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                            style="border:1px solid #e5e7eb;border-radius:12px;background:#fafafa;">
                        <tr>
                        <td style="padding:16px 18px;font:14px/1.7 Arial,Helvetica,sans-serif;color:#111827;">
                            <div style="margin:0 0 10px 0;">
                            <span style="display:inline-block;min-width:110px;color:#6b7280;">Name</span>
                            <strong>{data.username}</strong>
                            </div>
                            <div style="margin:0 0 10px 0;">
                            <span style="display:inline-block;min-width:110px;color:#6b7280;">Email</span>
                            <strong>{data.email}</strong>
                            </div>
                            <div style="margin:0 0 10px 0;">
                            <span style="display:inline-block;min-width:110px;color:#6b7280;">Subject</span>
                            <strong>{"Subject"}</strong>
                            </div>
                            <div>
                            <span style="display:inline-block;min-width:110px;color:#6b7280;vertical-align:top;">
                                Message
                            </span>
                            <div style="display:inline-block;border:1px solid #e5e7eb;
                                        border-radius:10px;background:#ffffff;
                                        padding:12px;max-width:100%;white-space:pre-wrap;">
                                {verify_url}
                            </div>
                            </div>
                        </td>
                        </tr>
                    </table>
                    </td>
                </tr>

                <!-- Footer Info -->
                <tr>
                    <td style="padding:6px 26px 22px 26px;
                            font:13px/1.7 Arial,Helvetica,sans-serif;
                            color:#334155;background:linear-gradient(0deg,#ffffff,#ffffff);">
                    <span>
                        Please keep this confirmation email for your records.
                        If you attached files or additional context, we may reference them during our response.
                    </span>
                    </td>
                </tr>

                <!-- Footer -->
                <tr>
                    <td style="background:#0f172a;color:#cbd5e1;padding:26px;text-align:center;">
                    <div style="font:700 14px/1 Arial,Helvetica,sans-serif;
                                letter-spacing:.3px;margin-bottom:10px;">
                        Orion Intelligence
                    </div>
                    <div style="font:12px/1.7 Arial,Helvetica,sans-serif;margin-bottom:10px;">
                        Sydney, NSW · 
                        <a href="https://orionintelligence.org/" style="color:#93c5fd;text-decoration:none;">
                        orionintelligence.org
                        </a> · 
                        <a href="https://www.linkedin.com/showcase/orion-by-genesis-technologies"
                        style="color:#93c5fd;text-decoration:none;">
                        LinkedIn
                        </a>
                    </div>
                    <div style="font:11px/1.6 Arial,Helvetica,sans-serif;color:#94a3b8;">
                        You’re receiving this message because you contacted us through our website.
                        If this wasn’t you, please ignore this email.
                    </div>
                    </td>
                </tr>

                </table>
            </td>
            </tr>
        </table>
        </body>
        </html>
        """
        await mail_manager.get_instance().send_verification_mail(
                to=user.email,
                subject="Please verify your account",
                body=html_content
            )

        return {"message": "Signup successful. Your account is under verification.", "status": "pending"}
    
    async def verify_user(token: str):
        engine = mongo_controller.get_instance().get_engine()
        user = await engine.find_one(db_user_account, db_user_account.verification_token == token)
        if not user:
            raise HTTPException(status_code=404, detail="Invalid token")

        if not user.verification_expiry or datetime.now(timezone.utc) > user.verification_expiry.replace(tzinfo=timezone.utc):
            raise HTTPException(status_code=400, detail="Verification link expired")

        user.status = UserStatus.ONBOARDING 
        user.verification_token = None
        user.verification_expiry = None
        await engine.save(user)

        return {"message": "Email verified successfully. You may continue onboarding."}
    
    async def forgot_password(mail: str):
        engine = mongo_controller.get_instance().get_engine()
        user = await engine.find_one(db_user_account, db_user_account.email == mail)
        if not user:
            raise HTTPException(status_code=404, detail="Entered mail is not resgister")
        
        forgotToken=session_manager.get_instance().generate_verification_token()

        user.verification_token=forgotToken
        await engine.save(user)

        verify_url = f"http://localhost:4200/forgot/{forgotToken}"
        await mail_manager.get_instance().send_verification_mail(
                to=user.email,
                subject="Password rest link for orion intelligence",
                body=f"Hi {user.username},\n\nDon't share this link with anyone\n"
            f"{verify_url}\n\n"
            "Best regards,\nTeam"
            )
        
        return {"message": "Reset password mail send successfully."}
    
    async def update_password(token:str,password:str):
        engine = mongo_controller.get_instance().get_engine()
        user = await engine.find_one(db_user_account, db_user_account.verification_token == token)
        if not user:
            raise HTTPException(status_code=404, detail="Invaild Link")
        
        hashed_password = CONSTANTS.S_AUTH_PWD_CONTEXT.hash(password)
        user.verification_token=None
        user.password=hashed_password
        await engine.save(user)

        return {"message": "Password reset successfully."}
        
        

        
        
