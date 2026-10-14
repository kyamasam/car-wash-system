class ServiceCategory:
    VEHICLE = "vehicle"
    CARPET = "carpet"
    OTHER = "other"

    choices = [
        (VEHICLE, "Vehicle"),
        (CARPET, "Carpet"),
        (OTHER, "Other"),
    ]


class PricingUnit:
    PER_JOB = "per_job"
    PER_ITEM = "per_item"
    BY_SIZE = "by_size"

    choices = [
        (PER_JOB, "Per Job"),
        (PER_ITEM, "Per Item"),
        (BY_SIZE, "By Size"),
    ]


class CommissionType:
    FIXED = "fixed"
    PERCENTAGE = "percentage"

    choices = [
        (FIXED, "Fixed"),
        (PERCENTAGE, "Percentage"),
    ]
