from datetime import timedelta
from decimal import Decimal
from unittest import mock

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from commons.models import Business
from subscriptions.constants import BillingPeriod, SubscriptionPaymentStatus
from subscriptions.models import Package, Subscription, SubscriptionPayment
from subscriptions.services import subscription as service
from users.constants import UserRole
from users.models import User

FASTDUKA = "subscriptions.services.fastduka"


class SubscriptionTestBase(TestCase):
    def setUp(self):
        self.package = Package.objects.get(code="standard")
        self.package.daily_price = Decimal("50.00")
        self.package.monthly_price = Decimal("1000.00")
        self.package.save()
        with self.captureOnCommitCallbacks(execute=True):
            self.business = Business.objects.create(name="Shine")
        self.owner = User.objects.create_user(
            email="owner@example.com", password="pw", business=self.business, role=UserRole.OWNER,
            phone_code="+254", phone_number="712345678",
        )
        self.attendant = User.objects.create_user(
            email="att@example.com", password="pw", business=self.business, role=UserRole.ATTENDANT,
        )
        self.client = APIClient()
        self.client.force_authenticate(self.owner)

    def expire(self):
        past = timezone.now() - timedelta(days=1)
        Subscription.objects.filter(business=self.business).update(starts_at=past - timedelta(days=1), ends_at=past)


class TrialTests(SubscriptionTestBase):
    def test_new_business_gets_one_trial(self):
        trials = Subscription.objects.filter(business=self.business, is_trial=True)
        self.assertEqual(trials.count(), 1)
        self.assertIsNone(service.start_trial(self.business))
        self.assertEqual(trials.count(), 1)

    def test_status_reports_active_trial(self):
        res = self.client.get("/api/subscriptions/status/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["status"], "active")
        self.assertTrue(res.data["is_trial"])
        self.assertEqual(res.data["package"]["code"], "standard")

    def test_status_reports_expired(self):
        self.expire()
        res = self.client.get("/api/subscriptions/status/")
        self.assertEqual(res.data["status"], "expired")
        self.assertEqual(res.data["days_remaining"], 0)


class GrantDaysTests(SubscriptionTestBase):
    def test_stacks_on_current_expiry_when_active(self):
        expiry = service.get_expiry(self.business.id)
        sub = service.grant_days(self.business.id, self.package, BillingPeriod.MONTHLY, 30)
        self.assertEqual(sub.starts_at, expiry)
        self.assertEqual(sub.ends_at, expiry + timedelta(days=30))

    def test_starts_now_when_expired(self):
        self.expire()
        before = timezone.now()
        sub = service.grant_days(self.business.id, self.package, BillingPeriod.DAILY, 1)
        self.assertGreaterEqual(sub.starts_at, before)
        self.assertTrue(service.is_active(self.business.id))


class GuardTests(SubscriptionTestBase):
    def create_branch(self):
        return self.client.post("/api/commons/branches/", {"business": self.business.id, "name": "A", "code": "A1"})

    def test_writes_allowed_when_active(self):
        self.assertEqual(self.create_branch().status_code, 201)

    def test_writes_blocked_when_expired(self):
        self.expire()
        res = self.create_branch()
        self.assertEqual(res.status_code, 402)
        self.assertEqual(res.data["errors"][0]["code"], "subscription_expired")
        self.assertIn("expired on", res.data["errors"][0]["detail"])

    def test_reads_allowed_when_expired(self):
        self.expire()
        self.assertEqual(self.client.get("/api/commons/branches/").status_code, 200)

    @mock.patch(f"{FASTDUKA}.initiate_stk_push", return_value=("key-1", {"idempotency_key": "key-1"}))
    def test_subscription_endpoints_exempt_when_expired(self, _):
        self.expire()
        res = self.client.post("/api/subscriptions/payments/initiate/",
                               {"package_id": self.package.id, "period": "monthly"})
        self.assertEqual(res.status_code, 201)


class PaymentTests(SubscriptionTestBase):
    @mock.patch(f"{FASTDUKA}.initiate_stk_push", return_value=("key-1", {"idempotency_key": "key-1"}))
    def initiate(self, _, period="monthly", **extra):
        return self.client.post("/api/subscriptions/payments/initiate/",
                                {"package_id": self.package.id, "period": period, **extra})

    def test_initiate_uses_user_phone_and_snapshots_price(self):
        res = self.initiate()
        self.assertEqual(res.status_code, 201)
        payment = SubscriptionPayment.objects.get(pk=res.data["id"])
        self.assertEqual(payment.phone, "+254712345678")
        self.assertEqual(payment.amount, Decimal("1000.00"))
        self.assertEqual(payment.days, 30)
        self.assertEqual(payment.idempotency_key, "key-1")

    def test_initiate_rejects_unoffered_period(self):
        res = self.initiate(period="yearly")
        self.assertEqual(res.status_code, 400)

    def test_initiate_rejects_disabled_method(self):
        res = self.initiate(payment_method="card")
        self.assertEqual(res.status_code, 400)

    def test_attendant_cannot_pay(self):
        self.client.force_authenticate(self.attendant)
        self.assertEqual(self.initiate().status_code, 403)

    def test_confirm_grants_days_once(self):
        payment_id = self.initiate().data["id"]
        expiry = service.get_expiry(self.business.id)
        processed = {"status": SubscriptionPaymentStatus.SUCCEEDED, "receipt": "SJK123",
                     "raw": {"transaction_status": "processed", "amount": "1000.00"}}
        with mock.patch(f"{FASTDUKA}.get_transaction", return_value=processed):
            first = self.client.post(f"/api/subscriptions/payments/{payment_id}/confirm/")
            second = self.client.post(f"/api/subscriptions/payments/{payment_id}/confirm/")
        self.assertEqual(first.data["payment"]["status"], "succeeded")
        self.assertEqual(second.data["payment"]["receipt_number"], "SJK123")
        self.assertEqual(Subscription.objects.filter(payment_id=payment_id).count(), 1)
        self.assertEqual(service.get_expiry(self.business.id), expiry + timedelta(days=30))

    def test_unknown_provider_status_stays_pending(self):
        payment_id = self.initiate().data["id"]
        with mock.patch(f"{FASTDUKA}.get_transaction",
                        return_value={"status": SubscriptionPaymentStatus.PENDING, "receipt": None,
                                      "raw": {"transaction_status": "queued"}}):
            res = self.client.post(f"/api/subscriptions/payments/{payment_id}/confirm/")
        self.assertEqual(res.data["payment"]["status"], "pending")
        self.assertFalse(Subscription.objects.filter(payment_id=payment_id).exists())

    def test_amount_mismatch_does_not_grant(self):
        payment_id = self.initiate().data["id"]
        with mock.patch(f"{FASTDUKA}.get_transaction",
                        return_value={"status": SubscriptionPaymentStatus.SUCCEEDED, "receipt": "X",
                                      "raw": {"transaction_status": "processed", "amount": "10"}}):
            res = self.client.post(f"/api/subscriptions/payments/{payment_id}/confirm/")
        self.assertEqual(res.data["payment"]["status"], "failed")
        self.assertFalse(Subscription.objects.filter(payment_id=payment_id).exists())

    def test_cannot_confirm_other_business_payment(self):
        payment_id = self.initiate().data["id"]
        other = Business.objects.create(name="Other")
        stranger = User.objects.create_user(email="s@example.com", password="pw", business=other,
                                            role=UserRole.OWNER, phone_number="700000000")
        self.client.force_authenticate(stranger)
        self.assertEqual(self.client.post(f"/api/subscriptions/payments/{payment_id}/confirm/").status_code, 404)
