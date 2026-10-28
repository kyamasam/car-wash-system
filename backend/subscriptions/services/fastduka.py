import logging
import re

import requests
from django.conf import settings

from subscriptions.constants import SubscriptionPaymentStatus

logger = logging.getLogger(__name__)

TIMEOUT_SECONDS = 30


class FastDukaError(Exception):
    pass


def _headers():
    return {
        "Authorization": f"Api-Key {settings.FASTDUKA_API_KEY}",
        "Content-Type": "application/json",
    }


def normalise_kenyan_phone(phone):
    digits = re.sub(r"\D", "", phone or "")
    if digits.startswith("254"):
        digits = digits[3:]
    digits = digits.lstrip("0")
    if len(digits) != 9:
        raise ValueError(f"Invalid Kenyan phone number: {phone}")
    return f"+254{digits}"


def initiate_stk_push(phone, amount, note):
    """Send an STK push. Returns (idempotency_key, raw_response)."""
    payload = {
        "customer_account_number": normalise_kenyan_phone(phone),
        "amount": str(amount),
        "receiving_account_number": settings.FASTDUKA_PAYBILL,
        "receiving_organization_id": settings.FASTDUKA_ORGID,
        "payment_method_name": "mpesa",
        "payment_method_subtype": "stk_push",
        "config_id": settings.FASTDUKA_CONFIG_ID,
        "transaction_note": note,
    }
    try:
        response = requests.post(
            f"{settings.FASTDUKA_API_BASE}/transaction/", json=payload, headers=_headers(), timeout=TIMEOUT_SECONDS
        )
    except requests.RequestException as exc:
        raise FastDukaError(f"STK push request failed: {exc}") from exc
    if response.status_code != 200:
        logger.error("FastDuka STK push failed (%s): %s", response.status_code, response.text)
        raise FastDukaError(f"STK push failed ({response.status_code}): {response.text}")
    data = response.json()
    return data["idempotency_key"], data


def get_transaction(idempotency_key):
    """Fetch a transaction's state. Returns {status, receipt, raw}."""
    try:
        response = requests.get(
            f"{settings.FASTDUKA_API_BASE}/retrieve_transaction_by_idempotency_key/{idempotency_key}/",
            headers=_headers(),
            timeout=TIMEOUT_SECONDS,
        )
    except requests.RequestException as exc:
        raise FastDukaError(f"Status check request failed: {exc}") from exc
    if response.status_code != 200:
        logger.error("FastDuka status check failed (%s): %s", response.status_code, response.text)
        raise FastDukaError(f"Status check failed ({response.status_code}): {response.text}")
    data = response.json()
    return {
        "status": SubscriptionPaymentStatus.FASTDUKA_STATUS_MAP.get(
            data.get("transaction_status", ""), SubscriptionPaymentStatus.PENDING
        ),
        "receipt": data.get("transaction_confirmation_number") or None,
        "raw": data,
    }
