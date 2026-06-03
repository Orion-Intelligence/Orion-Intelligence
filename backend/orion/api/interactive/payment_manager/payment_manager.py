from html import escape

from orion.api.interactive.payment_manager.model.payment_param_model import PaymentParamModel
from orion.helper_manager.env_handler import env_handler
from orion.services.mail_manager.mail_manager import mail_manager
from orion.services.mail_manager.mail_enums import MailSubject, MailUrlHeading
from orion.constants import constant


class PaymentManager:
    __instance = None

    @staticmethod
    def get_instance():
        if PaymentManager.__instance is None:
            PaymentManager.__instance = PaymentManager()
        return PaymentManager.__instance

    def __init__(self):
        if PaymentManager.__instance is not None:
            raise Exception("This class is a singleton!")
        PaymentManager.__instance = self

    @staticmethod
    async def send_subscription_info(request: PaymentParamModel):
        support_email = env_handler.get_instance().env("SUPPORT_EMAIL") or "support@genesistechnologies.org"
        APP_URL = env_handler.get_instance().env("APP_URL")
        display_name = escape(request.name)
        display_phone = escape(request.phone)
        display_email = escape(request.email)
        display_plan = escape(request.plan or "")

        html_content = constant.mail_template.render(
            username=display_name,
            email=display_email,
            subject=MailSubject.PRO_SUBSCRIPTION.value,
            lurlHeading=MailUrlHeading.PRO_SUBSCRIPTION.value,
            url=APP_URL,
            extra_message=f"""
                <p><b>Name:</b> {display_name}</p>
                <p><b>Phone:</b> {display_phone}</p>
                <p><b>Email:</b> {display_email}</p>
                <p><b>Plan:</b> {display_plan}</p>
            """)

        await mail_manager.get_instance().send_verification_mail_list(
            to_list=[support_email, request.email], subject=MailSubject.PRO_SUBSCRIPTION.value, body=html_content)

        return {"message": "Subscription request sent successfully."}
