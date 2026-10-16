from rest_framework.routers import DefaultRouter
from billing.views import PaymentViewSet, CommissionPayoutViewSet, CommissionEntryViewSet, ExpenseViewSet, ExpenseCategoryViewSet

router = DefaultRouter()
router.register("payments", PaymentViewSet, basename="payment")
router.register("commission-payouts", CommissionPayoutViewSet, basename="commission-payout")
router.register("commission-entries", CommissionEntryViewSet, basename="commission-entry")
router.register("expenses", ExpenseViewSet, basename="expense")
router.register("expense-categories", ExpenseCategoryViewSet, basename="expense-category")

url_patterns = router.urls
