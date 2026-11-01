# FastDuka STK Push Integration Guide

This document describes how to initiate an M-Pesa STK Push payment and poll for its status using the FastDuka API.

---

## Overview

The flow is:

1. **Initiate** — POST to FastDuka to trigger an STK Push to the customer's phone.
2. **Store** — Save the `idempotency_key` returned in the response; you'll use it to track the transaction.
3. **Poll / Confirm** — GET from FastDuka using the `idempotency_key` to check whether the payment has been completed.

---

## Prerequisites

You will need the following credentials (obtain from your FastDuka account):

| Variable | Description |
|---|---|
| `FASTDUKA_API_KEY` | Your FastDuka API key |
| `FASTDUKA_PAYBILL` | Your M-Pesa Paybill / Till number registered on FastDuka |
| `FASTDUKA_ORGID` | Your FastDuka organisation ID |
| `FASTDUKA_CONFIG_ID` | Your payment config ID on FastDuka |

---

## Step 1 — Initiate STK Push

### Endpoint

```
POST https://api.fastduka.co.ke/api/transaction/
```

### Headers

```
Authorization: Api-Key <FASTDUKA_API_KEY>
Content-Type: application/json
```

### Request Body

```json
{
  "customer_account_number": "2547XXXXXXXX",
  "amount": 500,
  "receiving_account_number": "<FASTDUKA_PAYBILL>",
  "receiving_organization_id": "<FASTDUKA_ORGID>",
  "payment_method_name": "mpesa",
  "payment_method_subtype": "stk_push",
  "config_id": "<FASTDUKA_CONFIG_ID>",
  "transaction_note": "Payment for order #123"
}
```

#### Field Reference

| Field | Type | Required | Description |
|---|---|---|---|
| `customer_account_number` | string | Yes | Customer's M-Pesa phone number (format: `2547XXXXXXXX`) |
| `amount` | number | Yes | Amount to charge in KES. Max 250,000 |
| `receiving_account_number` | string | Yes | Your Paybill or Till number |
| `receiving_organization_id` | string | Yes | Your FastDuka organisation ID |
| `payment_method_name` | string | Yes | Always `"mpesa"` |
| `payment_method_subtype` | string | Yes | Always `"stk_push"` |
| `config_id` | string | Yes | Your FastDuka payment config ID |
| `transaction_note` | string | Yes | Description shown to the customer on their phone. Cannot be omitted. |

### Success Response — `200 OK`

The full transaction object is returned. Save the `idempotency_key` field — it is the only way to look up this transaction later.

```json
{
  "id": 1042,
  "customer_account_number": "254712345678",
  "customer_invoice_number": "aGVsbG8=",
  "amount": 500.0,
  "transaction_identifier": "bXBlc2FLRVM=",
  "idempotency_key": "550e8400-e29b-41d4-a716-446655440000",
  "payment_method": {
    "id": 1,
    "name": "mpesa",
    "currency": "KES"
  },
  "receiving_account": {
    "id": 3,
    "account_identifier": "174379"
  },
  "receiving_organization": {
    "id": 7,
    "organization_name": "Acme Ltd"
  },
  "transaction_confirmation_number": null,
  "transaction_response_code": "0",
  "transaction_status": "initiated",
  "transaction_note": "Payment for order #123",
  "retried_next_transaction_id": null,
  "transaction_response": null,
  "created_at": "2026-06-24T10:00:00Z",
  "updated_at": "2026-06-24T10:00:00Z"
}
```

> **Important:** Save the `idempotency_key` from this response. It is the only way to look up this transaction later.

#### Key Response Fields

| Field | Description |
|---|---|
| `idempotency_key` | UUID to use when polling for status (Step 2) |
| `transaction_status` | Will be `"initiated"` immediately after the STK push is sent |
| `transaction_confirmation_number` | `null` at this stage; populated once the customer pays |
| `transaction_response_code` | Safaricom response code: `"0"` means the push was accepted |

### Error Responses

| HTTP Status | Condition | Body |
|---|---|---|
| `400 Bad Request` | Missing required field | `{"detail": "<field> not provided"}` |
| `400 Bad Request` | Invalid `payment_method_name` | `{"detail": "payment method was not correct"}` |
| `400 Bad Request` | Invalid `receiving_account_number` | `{"detail": "receiving account number was not correct"}` |
| `400 Bad Request` | Safaricom rejected the STK request | `{"detail": "<Safaricom error message>"}` |
| `401 Unauthorized` | Missing or invalid API key | `{"detail": "Authentication credentials were not provided."}` |

---

## Step 2 — Poll Payment Status

After initiating the push, the customer will receive a prompt on their phone. Once they approve (or the prompt times out / they cancel), Safaricom sends a callback that updates the transaction status. Poll this endpoint to read the current state.

### Endpoint

```
GET https://api.fastduka.co.ke/api/retrieve_transaction_by_idempotency_key/<idempotency_key>/
```

Replace `<idempotency_key>` with the UUID returned in Step 1.

> **Note:** This endpoint does not require an `Authorization` header.

### Success Response — `200 OK`

Returns the same full transaction object as the initiate response. The key fields to check are:

```json
{
  "idempotency_key": "550e8400-e29b-41d4-a716-446655440000",
  "transaction_status": "processed",
  "transaction_confirmation_number": "QAB1234XYZ",
  "transaction_response_code": "0",
  ...
}
```

#### Transaction Status Values

| Status | Meaning |
|---|---|
| `initiated` | The STK push was accepted by Safaricom and sent to the customer's phone; still waiting for customer action |
| `processed` | The customer approved and payment was received. `transaction_confirmation_number` will contain the M-Pesa receipt code (e.g. `QAB1234XYZ`) |
| `failed` | The customer cancelled, the prompt timed out, or payment failed. `transaction_confirmation_number` will be empty |

> `transaction_response_code` mirrors the Safaricom result code: `0` for success, any non-zero value for failure.

### Error Responses

| HTTP Status | Condition | Body |
|---|---|---|
| `404 Not Found` | `idempotency_key` does not exist | `{"detail": "No Transaction matches the given query."}` |

---

## Complete Example (Python)

```python
import os
import time
import requests

FASTDUKA_API_KEY  = os.environ["FASTDUKA_API_KEY"]
FASTDUKA_PAYBILL  = os.environ["FASTDUKA_PAYBILL"]
FASTDUKA_ORGID    = os.environ["FASTDUKA_ORGID"]
FASTDUKA_CONFIG_ID = os.environ["FASTDUKA_CONFIG_ID"]

BASE_URL = "https://api.fastduka.co.ke/api"

auth_headers = {
    "Authorization": f"Api-Key {FASTDUKA_API_KEY}",
    "Content-Type": "application/json",
}

# --- Step 1: Initiate STK Push ---
payload = {
    "customer_account_number": "254712345678",
    "amount": 500,
    "receiving_account_number": FASTDUKA_PAYBILL,
    "receiving_organization_id": FASTDUKA_ORGID,
    "payment_method_name": "mpesa",
    "payment_method_subtype": "stk_push",
    "config_id": FASTDUKA_CONFIG_ID,
    "transaction_note": "Payment for order #123",  # required
}

response = requests.post(f"{BASE_URL}/transaction/", json=payload, headers=auth_headers)

if response.status_code != 200:
    raise Exception(f"STK Push failed [{response.status_code}]: {response.text}")

data = response.json()
idempotency_key = data["idempotency_key"]
print(f"STK Push sent. Tracking key: {idempotency_key}")

# --- Step 2: Poll for status (no auth header required) ---
for _ in range(10):          # poll up to 10 times
    time.sleep(5)            # wait 5 seconds between checks

    status_response = requests.get(
        f"{BASE_URL}/retrieve_transaction_by_idempotency_key/{idempotency_key}/",
    )

    if status_response.status_code == 404:
        raise Exception("Transaction not found — check your idempotency_key.")
    if status_response.status_code != 200:
        raise Exception(f"Status check failed [{status_response.status_code}]: {status_response.text}")

    data = status_response.json()
    txn_status = data.get("transaction_status")
    mpesa_code  = data.get("transaction_confirmation_number")

    print(f"Status: {txn_status}")

    if txn_status == "processed":
        print(f"Payment confirmed! M-Pesa code: {mpesa_code}")
        break
    elif txn_status == "failed":
        print("Payment failed or was cancelled.")
        break
else:
    print("Still pending after max retries — consider re-checking later.")
```

---

## Notes

- The STK Push prompt expires after roughly **60 seconds** if the customer does not respond; the callback will then arrive with a failure code and the status will become `"failed"`.
- Phone numbers must be in the international format without the leading `+`: `2547XXXXXXXX` (not `07XXXXXXXX` or `+2547XXXXXXXX`).
- M-Pesa imposes a single-transaction maximum of **KES 250,000**.
- The `idempotency_key` is a UUID generated per transaction. Do not reuse it for a different payment.
- Avoid polling more frequently than every 5 seconds to stay within rate limits.
- `transaction_note` is a **required** field; omitting it will return a `400` error.
