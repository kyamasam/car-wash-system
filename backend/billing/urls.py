from rest_framework.routers import DefaultRouter
from billing.views import PaymentViewSet, CommissionPayoutViewSet, CommissionEntryViewSet, ExpenseViewSet

router = DefaultRouter()
router.register("payments", PaymentViewSet, basename="payment")
router.register("commission-payouts", CommissionPayoutViewSet, basename="commission-payout")
router.register("commission-entries", CommissionEntryViewSet, basename="commission-entry")
router.register("expenses", ExpenseViewSet, basename="expense")

url_patterns = router.urls
