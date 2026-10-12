class ResourceType:
    BRANCH = "branch"
    JOB = "job"
    WORKER = "worker"
    CUSTOMER = "customer"
    PAYMENT = "payment"
    EXPENSE = "expense"

    choices = [
        (BRANCH, "Branch"),
        (JOB, "Job"),
        (WORKER, "Worker"),
        (CUSTOMER, "Customer"),
        (PAYMENT, "Payment"),
        (EXPENSE, "Expense"),
    ]
