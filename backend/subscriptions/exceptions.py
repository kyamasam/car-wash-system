from rest_framework import status
from rest_framework.exceptions import APIException


class SubscriptionExpired(APIException):
    status_code = status.HTTP_402_PAYMENT_REQUIRED
    default_code = "subscription_expired"
    default_detail = "Your subscription has expired. Renew to continue making changes."

    def __init__(self, expires_at=None):
        detail = self.default_detail
        if expires_at:
            detail = f"Your subscription expired on {expires_at:%d %b %Y}. Renew to continue making changes."
        super().__init__(detail=detail, code=self.default_code)


class PaymentProviderError(APIException):
    status_code = status.HTTP_502_BAD_GATEWAY
    default_code = "payment_provider_error"
    default_detail = "Could not reach the payment provider. Please try again."
