class PaymentMethod:
    CASH = "cash"
    MPESA = "mpesa"
    CARD = "card"
    BANK_TRANSFER = "bank_transfer"

    choices = [
        (CASH, "Cash"),
        (MPESA, "M-Pesa"),
        (CARD, "Card"),
        (BANK_TRANSFER, "Bank Transfer"),
    ]


class PaymentType:
    PAYMENT = "payment"
    DEPOSIT = "deposit"
    REFUND = "refund"

    choices = [
        (PAYMENT, "Payment"),
        (DEPOSIT, "Deposit"),
        (REFUND, "Refund"),
    ]


class CommissionEntryType:
    EARNED = "earned"
    ADJUSTMENT = "adjustment"
    REVERSAL = "reversal"

    choices = [
        (EARNED, "Earned"),
        (ADJUSTMENT, "Adjustment"),
        (REVERSAL, "Reversal"),
    ]


class CommissionEntryStatus:
    PENDING = "pending"
    PAID = "paid"
    VOID = "void"

    choices = [
        (PENDING, "Pending"),
        (PAID, "Paid"),
        (VOID, "Void"),
    ]
