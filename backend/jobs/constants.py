class JobStatus:
    QUEUED = "queued"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    READY_FOR_COLLECTION = "ready_for_collection"
    COLLECTED = "collected"
    CANCELLED = "cancelled"

    choices = [
        (QUEUED, "Queued"),
        (IN_PROGRESS, "In Progress"),
        (COMPLETED, "Completed"),
        (READY_FOR_COLLECTION, "Ready for Collection"),
        (COLLECTED, "Collected"),
        (CANCELLED, "Cancelled"),
    ]


class PaymentStatus:
    UNPAID = "unpaid"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"
    REFUNDED = "refunded"

    choices = [
        (UNPAID, "Unpaid"),
        (PARTIALLY_PAID, "Partially Paid"),
        (PAID, "Paid"),
        (REFUNDED, "Refunded"),
    ]


class CollectionMethod:
    WALK_IN = "walk_in"
    PICKUP = "pickup"
    DELIVERY = "delivery"

    choices = [
        (WALK_IN, "Walk In"),
        (PICKUP, "Pickup"),
        (DELIVERY, "Delivery"),
    ]
