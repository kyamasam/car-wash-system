# Subscriptions API: Frontend Guide

How the frontend checks a business's subscription, shows packages, takes M-Pesa payments and handles the "subscription expired" state.

All paths are relative to the API base URL (`NEXT_PUBLIC_API_URL`, e.g. `http://localhost:8000/api`). Every endpoint needs the usual JWT `Authorization: Bearer <token>` header, which the shared `axiosInstance` in `src/hooks/use-api.ts` already adds.

---

## Contents

1. [Concepts](#1-concepts)
2. [Endpoints at a glance](#2-endpoints-at-a-glance)
3. [Subscription status](#3-subscription-status)
4. [Packages](#4-packages)
5. [Paying with M-Pesa](#5-paying-with-m-pesa)
6. [Payment & subscription history](#6-payment--subscription-history)
7. [The expired state (read-only mode)](#7-the-expired-state-read-only-mode)
8. [Errors](#8-errors)
9. [TypeScript types](#9-typescript-types)
10. [Suggested hooks](#10-suggested-hooks)
11. [UI checklist](#11-ui-checklist)

---

## 1. Concepts

| Term | Meaning |
|---|---|
| **Package** | A subscription tier (e.g. "Standard"). It has a list of features and one price per billing period. There is one package today, but the UI should list however many come back. |
| **Billing period** | `daily` (1 day), `weekly` (7), `monthly` (30), `yearly` (365). A price of `null` means that period is **not offered** for that package, so hide or disable it. |
| **Subscription** | The time the business has paid for. Each payment adds days. |
| **Trial** | New businesses get a free trial (14 days by default). While it runs, the status is `active` and `is_trial` is `true`. |
| **Stacking** | Paying while still active adds the days **after** the current expiry, so no days are lost. Paying after expiry starts from now. |
| **Read-only mode** | Once expired, the business can still **view** everything (all GETs work), but any create, update or delete fails with HTTP **402**. |

**Who can do what**

| Role | View status | View packages | Pay / view payment & subscription history |
|---|---|---|---|
| owner | yes | yes | yes |
| manager | yes | yes | yes |
| cashier, attendant | yes | yes | no (403) |

Hide the "Renew / Pay" actions for cashiers and attendants. Show them a "Ask your owner or manager to renew" message instead.

---

## 2. Endpoints at a glance

| Method | Path | Who | Purpose |
|---|---|---|---|
| GET | `/subscriptions/status/` | any staff | Current status + expiry |
| GET | `/subscriptions/packages/` | any staff | List packages with prices (not paginated) |
| GET | `/subscriptions/packages/{id}/` | any staff | One package |
| POST | `/subscriptions/payments/initiate/` | owner, manager | Start an M-Pesa STK push |
| POST | `/subscriptions/payments/{id}/confirm/` | owner, manager | Poll a payment; days are granted when it succeeds |
| GET | `/subscriptions/payments/` | owner, manager | Payment history (paginated) |
| GET | `/subscriptions/payments/{id}/` | owner, manager | One payment (no provider check) |
| GET | `/subscriptions/history/` | owner, manager | Granted periods: trial + paid (paginated) |

All subscription endpoints keep working when the subscription has expired, so an expired business can always renew.

---

## 3. Subscription status

```
GET /subscriptions/status/
```

**200**

```json
{
  "status": "active",
  "expires_at": "2026-11-11T10:42:07.123456Z",
  "is_trial": true,
  "days_remaining": 14,
  "package": {
    "id": "6d0f…",
    "name": "Standard",
    "code": "standard",
    "features": ["jobs", "customers", "workers", "commissions", "expenses", "reports", "multi_branch"]
  }
}
```

| Field | Type | Notes |
|---|---|---|
| `status` | `"active" \| "expired"` | Use this to decide what to show. Don't recompute it from `expires_at`. |
| `expires_at` | ISO datetime \| `null` | `null` only if the business has never had a subscription. |
| `is_trial` | boolean | `true` while the free trial is the period in force. |
| `days_remaining` | integer | Whole days, rounded up. `0` when expired. |
| `package` | object \| `null` | The package currently in force. `features` is a list of feature codes. |

**404** if the user is not linked to a business (e.g. a platform superuser).

**When to fetch:** on app load (after login), and again after a successful payment. A `staleTime` of a few minutes is fine. Also refetch whenever any request returns the `subscription_expired` error (see [§7](#7-the-expired-state-read-only-mode)).

**Suggested banners**

| Condition | Banner |
|---|---|
| `status === "active" && is_trial` | "Free trial: X days left. Choose a plan." |
| `status === "active" && days_remaining <= 3` | "Your subscription ends in X days. Renew now." |
| `status === "expired"` | Persistent: "Your subscription expired on {date}. You can view data but can't make changes. Renew." |

### Feature codes

`jobs`, `customers`, `workers`, `commissions`, `expenses`, `reports`, `multi_branch`

They are informational for now: the backend does not gate endpoints by feature yet. Use them to render the feature list on package cards. Map codes to display labels on the frontend, and ignore unknown codes.

---

## 4. Packages

```
GET /subscriptions/packages/
```

**200** returns a plain array, **not paginated**, ordered by `sort_order`:

```json
[
  {
    "id": "6d0f…",
    "name": "Standard",
    "code": "standard",
    "description": "All features.",
    "features": ["jobs", "customers", "workers", "commissions", "expenses", "reports", "multi_branch"],
    "daily_price": "50.00",
    "weekly_price": "300.00",
    "monthly_price": "1000.00",
    "yearly_price": null,
    "currency": "KES",
    "is_default": true,
    "sort_order": 0
  }
]
```

- Prices are **decimal strings**. Use `Number(price)` only for display/formatting, never for maths you send back. The backend decides the amount, and the frontend never sends one.
- `null` price = period not available for this package. Hide or disable that option.
- If every price is `null`, payments are not configured yet. Show "Plans coming soon" rather than a broken checkout.

**Period selector:** show each non-null period with its price and length, e.g. *Monthly: KES 1,000 / 30 days*. A useful extra is the effective daily rate (`monthly_price / 30`).

---

## 5. Paying with M-Pesa

The payment is **asynchronous**: the customer approves it on their phone, which takes about 5–60 s and sometimes never happens. The flow is:

```
1. POST /payments/initiate/        → payment {id, status: "pending"}
2. Show "Check your phone…"
3. wait 5 s, then every 5 s:
     POST /payments/{id}/confirm/  → { payment, subscription }
   stop when payment.status is "succeeded" or "failed", or after ~2 min
4. succeeded → success screen + refetch status
   failed    → show failure_reason + "Try again"
   timeout   → "We couldn't confirm your payment yet…"
```

### 5.1 Initiate

```
POST /subscriptions/payments/initiate/
```

**Body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `package_id` | UUID | yes | From `/packages/` |
| `period` | `"daily" \| "weekly" \| "monthly" \| "yearly"` | yes | Must have a non-null price |
| `payment_method` | `"mpesa"` | no | Defaults to `"mpesa"`. Other values (`card`, `bank_transfer`, `manual`) exist but are rejected for now. |
| `phone` | string | no | M-Pesa number. If omitted, the logged-in user's phone is used. Accepts `0712345678`, `712345678`, `254712345678` and `+254712345678`. |

Prefill the phone input with the user's phone, and let them change it, because the payer may be someone else.

```json
{ "package_id": "6d0f…", "period": "monthly", "phone": "0712345678" }
```

**201** returns the payment object (see [§9](#9-typescript-types)), with `status: "pending"`:

```json
{
  "id": "b3c1…",
  "business": "9a7e…",
  "package": "6d0f…",
  "package_detail": { "id": "6d0f…", "name": "Standard", "code": "standard", "features": ["…"] },
  "period": "monthly",
  "days": 30,
  "amount": "1000.00",
  "currency": "KES",
  "payment_method": "mpesa",
  "phone": "+254712345678",
  "status": "pending",
  "receipt_number": null,
  "failure_reason": null,
  "initiated_by": "1f2e…",
  "created_at": "2026-10-28T10:59:00Z",
  "updated_at": "2026-10-28T10:59:01Z"
}
```

**Errors**

| Status | `errors[].attr` | When |
|---|---|---|
| 400 | `period` | Period not offered for this package |
| 400 | `payment_method` | Method not enabled yet |
| 400 | `phone` | No phone available, or the number is invalid |
| 400 | `package_id` | Unknown or inactive package |
| 403 | — | User is not an owner/manager |
| 502 | — | `payment_provider_error`: M-Pesa could not be reached. Offer "Try again". |

### 5.2 Confirm (poll)

```
POST /subscriptions/payments/{id}/confirm/
```

No body. It checks the provider and, the first time the payment succeeds, grants the days. It is safe to call as many times as you like: days are only ever granted once.

**200**

```json
{
  "payment": { "id": "b3c1…", "status": "succeeded", "receipt_number": "SJK3XXXXXX", "…": "…" },
  "subscription": {
    "status": "active",
    "expires_at": "2026-12-11T10:42:07Z",
    "is_trial": false,
    "days_remaining": 44,
    "package": { "id": "6d0f…", "name": "Standard", "code": "standard", "features": ["…"] }
  }
}
```

| `payment.status` | What to do |
|---|---|
| `pending` | Keep polling. Show "Waiting for you to enter your M-Pesa PIN…". |
| `succeeded` | Stop. Show success with `receipt_number` (the M-Pesa code the user will quote to support) and the new `subscription.expires_at`. Update the cached status from `subscription` or refetch it. |
| `failed` | Stop. Show `failure_reason` (e.g. `cancelled`, `failed`) with a "Try again" button that starts a **new** initiate. |

A **502** during polling means the provider was briefly unreachable. Ignore it and keep polling until your timeout.

**Polling rules**

- Wait ~5 s before the first poll, then poll every ~5 s.
- Stop after ~2 minutes and show: *"We couldn't confirm your payment yet. If you completed it on your phone, your subscription will update automatically within a few minutes."* The backend re-checks pending payments every 5 minutes, so a late payment is never lost.
- Stop polling if the user closes the modal. Don't start a second payment while one is still pending for the same user.

> **Toast gotcha:** the shared axios interceptor in `src/hooks/use-api.ts` shows "Request successful ✅" for **every** non-GET response and an error toast for every non-GET error. `confirm` is a POST polled every 5 s, so calling it through the default `useApiMutation` would toast on every poll. Either skip the interceptor's toasts for `/payments/*/confirm/` (e.g. a URL check or a `silent` flag on the request config), or poll with a dedicated axios instance. Show your own toast once, when the final status arrives.

---

## 6. Payment & subscription history

Both endpoints are owner/manager only and paginated with the standard DRF shape `{ count, next, previous, results }`, 10 per page. Use `?page=2` for further pages.

```
GET /subscriptions/payments/
```

`results` are payment objects (same shape as [§5.1](#51-initiate)), newest first. Good columns: date, package, period, amount, phone, status, receipt number.

```
GET /subscriptions/history/
```

`results` are granted periods, latest end date first:

```json
{
  "id": "e71a…",
  "business": "9a7e…",
  "package": "6d0f…",
  "package_detail": { "id": "6d0f…", "name": "Standard", "code": "standard", "features": ["…"] },
  "is_trial": false,
  "period": "monthly",
  "starts_at": "2026-11-11T10:42:07Z",
  "ends_at": "2026-12-11T10:42:07Z",
  "payment": "b3c1…",
  "created_at": "2026-10-28T11:00:00Z"
}
```

For the trial row, `is_trial` is `true` and `period` and `payment` are `null`. A period whose `starts_at` is in the future is a stacked renewal: show it as "Upcoming".

---

## 7. The expired state (read-only mode)

When a business's subscription has expired:

- **All GET requests still work.** Lists, details and reports load as normal.
- **Every POST / PUT / PATCH / DELETE** to business endpoints (jobs, customers, payments, branches, …) returns:

```
HTTP 402 Payment Required
```

```json
{
  "type": "client_error",
  "errors": [
    {
      "code": "subscription_expired",
      "detail": "Your subscription expired on 27 Oct 2026. Renew to continue making changes.",
      "attr": null
    }
  ]
}
```

- `/subscriptions/*` endpoints, login and profile endpoints are **not** blocked.

**Frontend handling**

1. **Detect globally.** In the axios response interceptor, if `error.response?.status === 402` and `errors[0].code === "subscription_expired"`:
   - invalidate the `["subscription-status"]` query so banners update
   - open the renew modal for owners/managers, or show the "ask your owner" notice for others
   - the existing interceptor already shows `detail` as an error toast, so don't add a second one
2. **Prevent it up front.** When `status === "expired"`, disable or hide create/edit/delete buttons and show a tooltip like "Subscription expired: renew to make changes". The 402 handler is the safety net, not the main UX.
3. **Don't log the user out** on 402. Only 401 means the session is gone.

---

## 8. Errors

All errors use the project's standard format (drf-standardized-errors), which `parseDjangoErrors` in `use-api.ts` already understands:

```json
{
  "type": "validation_error | client_error | server_error",
  "errors": [{ "code": "string", "detail": "human-readable message", "attr": "field name or null" }]
}
```

| Status | `code` | Meaning |
|---|---|---|
| 400 | varies (`invalid`, `required`, …) | Bad input, see `attr` |
| 401 | `not_authenticated` / `token_not_valid` | Logged out |
| 402 | `subscription_expired` | Expired: read-only mode ([§7](#7-the-expired-state-read-only-mode)) |
| 403 | `permission_denied` | Not owner/manager for payment/history endpoints |
| 404 | `not_found` | Payment belongs to another business, or user has no business |
| 502 | `payment_provider_error` | M-Pesa provider unreachable, retry |

---

## 9. TypeScript types

```ts
export type BillingPeriod = "daily" | "weekly" | "monthly" | "yearly";
export type SubscriptionStatusValue = "active" | "expired";
export type SubscriptionPaymentStatus = "pending" | "succeeded" | "failed";
export type SubscriptionPaymentMethod = "mpesa" | "card" | "bank_transfer" | "manual";

export type FeatureCode =
  | "jobs" | "customers" | "workers" | "commissions"
  | "expenses" | "reports" | "multi_branch";

export const BILLING_PERIOD_DAYS: Record<BillingPeriod, number> = {
  daily: 1, weekly: 7, monthly: 30, yearly: 365,
};

export const PERIOD_PRICE_FIELD: Record<BillingPeriod, keyof Package> = {
  daily: "daily_price", weekly: "weekly_price", monthly: "monthly_price", yearly: "yearly_price",
};

export interface PackageSummary {
  id: string;
  name: string;
  code: string;
  features: string[]; // FeatureCode values; ignore unknown ones
}

export interface Package extends PackageSummary {
  description: string;
  daily_price: string | null;   // decimal string; null = not offered
  weekly_price: string | null;
  monthly_price: string | null;
  yearly_price: string | null;
  currency: string;             // "KES"
  is_default: boolean;
  sort_order: number;
}

export interface SubscriptionStatus {
  status: SubscriptionStatusValue;
  expires_at: string | null;
  is_trial: boolean;
  days_remaining: number;
  package: PackageSummary | null;
}

export interface SubscriptionPayment {
  id: string;
  business: string;
  package: string;
  package_detail: PackageSummary;
  period: BillingPeriod;
  days: number;
  amount: string;               // decimal string
  currency: string;
  payment_method: SubscriptionPaymentMethod;
  phone: string | null;
  status: SubscriptionPaymentStatus;
  receipt_number: string | null;
  failure_reason: string | null;
  initiated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPeriod {
  id: string;
  business: string;
  package: string;
  package_detail: PackageSummary;
  is_trial: boolean;
  period: BillingPeriod | null;
  starts_at: string;
  ends_at: string;
  payment: string | null;
  created_at: string;
}

export interface InitiatePaymentBody {
  package_id: string;
  period: BillingPeriod;
  payment_method?: SubscriptionPaymentMethod; // default "mpesa"
  phone?: string;
}

export interface ConfirmPaymentResponse {
  payment: SubscriptionPayment;
  subscription: SubscriptionStatus;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
```

---

## 10. Suggested hooks

These follow the existing `src/hooks/<area>/use-*.ts` pattern. Put them in `src/hooks/subscriptions/`.

```ts
// use-subscription-status.ts
export function useSubscriptionStatus() {
  return useApiQuery<SubscriptionStatus, SubscriptionStatus>("/subscriptions/status/", {
    queryKey: ["subscription-status"],
    select: (d) => d,
    staleTime: 1000 * 60 * 5,
    enabled: typeof window !== "undefined" && !!localStorage.getItem("authToken"),
  });
}

// use-packages.ts
export function usePackages() {
  return useApiQuery<Package[], Package[]>("/subscriptions/packages/", {
    queryKey: ["subscription-packages"],
    select: (d) => d,
    staleTime: 1000 * 60 * 30,
  });
}
```

Polling `confirm` (outline). Call it through an axios path that doesn't fire the global toasts:

```ts
async function pollPayment(paymentId: string, signal: AbortSignal): Promise<ConfirmPaymentResponse | null> {
  const deadline = Date.now() + 2 * 60_000;
  await sleep(5_000);
  while (Date.now() < deadline && !signal.aborted) {
    try {
      const { data } = await silentAxios.post<ConfirmPaymentResponse>(
        `/subscriptions/payments/${paymentId}/confirm/`, null, { signal },
      );
      if (data.payment.status !== "pending") return data;
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status !== 502) throw e; // 502 = transient, keep polling
    }
    await sleep(5_000);
  }
  return null; // timed out, still pending
}
```

On success: `queryClient.setQueryData(["subscription-status"], data.subscription)` and invalidate `["subscription-payments"]` and `["subscription-history"]`.

---

## 11. UI checklist

- [ ] Status banner (trial / ending soon / expired) visible app-wide
- [ ] Billing/subscription page: current status, package cards, period selector (hide `null` prices), payment history, subscription history
- [ ] Renew modal: period → phone (prefilled, editable) → "Check your phone" → success with receipt / failure with retry / timeout message
- [ ] Polling stops on final status, timeout or modal close; no duplicate toasts while polling
- [ ] Pay actions hidden for cashier/attendant roles
- [ ] When expired: write actions disabled with an explanation; reads keep working
- [ ] Global 402 `subscription_expired` handler: refetch status, prompt renew, don't log out
- [ ] Prices formatted from decimal strings; amounts are never sent to the backend
