class UserRole:
    OWNER = "owner"
    MANAGER = "manager"
    ATTENDANT = "attendant"
    CASHIER = "cashier"

    choices = [
        (OWNER, "Owner"),
        (MANAGER, "Manager"),
        (ATTENDANT, "Attendant"),
        (CASHIER, "Cashier"),
    ]
