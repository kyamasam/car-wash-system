"""
Per-method payment handlers. Each handler starts a payment with the provider
and reports its latest state; granting days is shared in services.subscription.
To support a new method, add a handler here and add the method to
SubscriptionPaymentMethod.ENABLED.
"""
from rest_framework.exceptions import ValidationError

from subscriptions.constants import SubscriptionPaymentMethod, SubscriptionPaymentStatus
from subscriptions.exceptions import PaymentProviderError
from subscriptions.services import fastduka


class BasePaymentHandler:
    # Whether refresh() asks the provider for a status (used by the reconcile task).
    supports_polling = False

    def prepare(self, payment):
        """Validate/normalise the unsaved payment before it is stored."""

    def initiate(self, payment):
        """Start the payment with the provider. Mutates and saves `payment`."""
        raise NotImplementedError

    def refresh(self, payment):
        """Return {status, receipt, raw} from the provider."""
        raise NotImplementedError


class MpesaHandler(BasePaymentHandler):
    supports_polling = True

    def prepare(self, payment):
        if not payment.phone:
            raise ValidationError({"phone": "A phone number is required for M-Pesa payments."})
        try:
            payment.phone = fastduka.normalise_kenyan_phone(payment.phone)
        except ValueError as exc:
            raise ValidationError({"phone": str(exc)})

    def initiate(self, payment):
        note = f"Subscription {payment.package.name} {payment.period} — {payment.business.name}"
        try:
            key, raw = fastduka.initiate_stk_push(payment.phone, payment.amount, note)
        except fastduka.FastDukaError as exc:
            payment.status = SubscriptionPaymentStatus.FAILED
            payment.failure_reason = str(exc)
            payment.save(update_fields=["status", "failure_reason", "updated_at"])
            raise PaymentProviderError()
        payment.idempotency_key = key
        payment.raw_response = raw
        payment.save(update_fields=["idempotency_key", "raw_response", "updated_at"])

    def refresh(self, payment):
        if not payment.idempotency_key:
            return {"status": payment.status, "receipt": payment.receipt_number, "raw": payment.raw_response}
        try:
            return fastduka.get_transaction(payment.idempotency_key)
        except fastduka.FastDukaError as exc:
            raise PaymentProviderError() from exc


PAYMENT_HANDLERS = {
    SubscriptionPaymentMethod.MPESA: MpesaHandler(),
}


def get_handler(payment_method):
    return PAYMENT_HANDLERS[payment_method]
