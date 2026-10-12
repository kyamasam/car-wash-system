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
    PER_SQFT = "per_sqft"

    choices = [
        (PER_JOB, "Per Job"),
        (PER_ITEM, "Per Item"),
        (PER_SQFT, "Per Sq Ft"),
    ]


class CommissionType:
    FIXED = "fixed"
    PERCENTAGE = "percentage"

    choices = [
        (FIXED, "Fixed"),
        (PERCENTAGE, "Percentage"),
    ]
