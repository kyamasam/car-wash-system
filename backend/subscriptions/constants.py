class BillingPeriod:
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"

    choices = [
        (DAILY, "Daily"),
        (WEEKLY, "Weekly"),
        (MONTHLY, "Monthly"),
        (YEARLY, "Yearly"),
    ]

    DAYS = {
        DAILY: 1,
        WEEKLY: 7,
        MONTHLY: 30,
        YEARLY: 365,
    }

    PRICE_FIELD = {
        DAILY: "daily_price",
        WEEKLY: "weekly_price",
        MONTHLY: "monthly_price",
        YEARLY: "yearly_price",
    }


class Feature:
    """Feature constants stored comma-separated on Package.features."""

    JOBS = "jobs"
    CUSTOMERS = "customers"
    WORKERS = "workers"
    COMMISSIONS = "commissions"
    EXPENSES = "expenses"
    REPORTS = "reports"
    MULTI_BRANCH = "multi_branch"

    choices = [
        (JOBS, "Jobs"),
        (CUSTOMERS, "Customers"),
        (WORKERS, "Workers"),
        (COMMISSIONS, "Commissions"),
        (EXPENSES, "Expenses"),
        (REPORTS, "Reports"),
        (MULTI_BRANCH, "Multiple branches"),
    ]

    ALL = [value for value, _ in choices]


class SubscriptionPaymentMethod:
    MPESA = "mpesa"
    CARD = "card"
    BANK_TRANSFER = "bank_transfer"
    MANUAL = "manual"

    choices = [
        (MPESA, "M-Pesa"),
        (CARD, "Card"),
        (BANK_TRANSFER, "Bank Transfer"),
        (MANUAL, "Manual"),
    ]

    # Methods that can be initiated through the API today.
    ENABLED = {MPESA}


class SubscriptionPaymentStatus:
    PENDING = "pending"
    SUCCEEDED = "succeeded"
    FAILED = "failed"

    choices = [
        (PENDING, "Pending"),
        (SUCCEEDED, "Succeeded"),
        (FAILED, "Failed"),
    ]

    FINAL = {SUCCEEDED, FAILED}

    # Unknown FastDuka statuses map to PENDING so new intermediate states never reject real payments.
    FASTDUKA_STATUS_MAP = {
        "processed": SUCCEEDED,
        "failed": FAILED,
        "cancelled": FAILED,
    }


class SubscriptionStatus:
    ACTIVE = "active"
    EXPIRED = "expired"

