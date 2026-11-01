from django.core import mail
from django.test import override_settings
from rest_framework.test import APITestCase

from commons.models import Branch, Business
from users.constants import UserRole
from users.models import User

CURRENT_URL = "/api/commons/businesses/current/"


class BusinessFooterSettingsTests(APITestCase):
    def setUp(self):
        self.business = Business.objects.create(name="A")
        self.owner = User.objects.create_user("owner@a.com", "pw", business=self.business, phone_number="700000001")
        self.client.force_authenticate(self.owner)

    def test_footers_default_blank(self):
        data = self.client.get(CURRENT_URL).json()
        self.assertEqual(data["receipt_footer"], "")
        self.assertEqual(data["job_card_footer"], "")

    def test_patch_sets_and_clears_footers(self):
        response = self.client.patch(
            CURRENT_URL,
            {"receipt_footer": "Paybill 123\nThanks!", "job_card_footer": "Collect by 6pm"},
            format="multipart",
        )
        self.assertEqual(response.status_code, 200)
        self.business.refresh_from_db()
        self.assertEqual(self.business.receipt_footer, "Paybill 123\nThanks!")
        self.assertEqual(self.business.job_card_footer, "Collect by 6pm")

        response = self.client.patch(CURRENT_URL, {"receipt_footer": "", "job_card_footer": ""}, format="multipart")
        self.assertEqual(response.status_code, 200)
        self.business.refresh_from_db()
        self.assertEqual(self.business.receipt_footer, "")
        self.assertEqual(self.business.job_card_footer, "")

    def test_footer_max_length(self):
        response = self.client.patch(CURRENT_URL, {"receipt_footer": "x" * 501}, format="multipart")
        self.assertEqual(response.status_code, 400)


BRANCHES_URL = "/api/commons/branches/"
BRANCHES_ALL_URL = "/api/commons/branches/all/"
SWITCH_BRANCH_URL = "/api/users/switch-branch/"


class OwnerDefaultBranchTests(APITestCase):
    def setUp(self):
        self.business = Business.objects.create(name="A")
        self.owner = User.objects.create_user(
            "owner@a.com", "pw", business=self.business, role=UserRole.OWNER, phone_number="700000001"
        )
        self.client.force_authenticate(self.owner)

    def _create_branch(self, code):
        response = self.client.post(BRANCHES_URL, {"name": code, "code": code, "business": self.business.id})
        self.assertEqual(response.status_code, 201, response.content)
        return response.json()["id"]

    def test_first_branch_is_assigned_to_owner(self):
        first = self._create_branch("A-1")
        self.owner.refresh_from_db()
        self.assertEqual(str(self.owner.branch_id), first)

    def test_later_branches_do_not_reassign(self):
        first = self._create_branch("A-1")
        self._create_branch("A-2")
        self.owner.refresh_from_db()
        self.assertEqual(str(self.owner.branch_id), first)

    def test_owner_with_branch_still_lists_all_branches(self):
        self._create_branch("A-1")
        self._create_branch("A-2")
        self.assertEqual(len(self.client.get(BRANCHES_ALL_URL).json()), 2)

    def test_non_owner_is_not_assigned(self):
        manager = User.objects.create_user(
            "m@a.com", "pw", business=self.business, role=UserRole.MANAGER, phone_number="700000002"
        )
        self.client.force_authenticate(manager)
        self._create_branch("A-1")
        manager.refresh_from_db()
        self.assertIsNone(manager.branch_id)

    def test_owner_can_switch_branch(self):
        self._create_branch("A-1")
        second = self._create_branch("A-2")
        response = self.client.post(SWITCH_BRANCH_URL, {"branch": second})
        self.assertEqual(response.status_code, 200)
        self.owner.refresh_from_db()
        self.assertEqual(str(self.owner.branch_id), second)

    def test_switch_rejects_other_business_branch(self):
        other = Branch.objects.create(business=Business.objects.create(name="B"), name="B", code="B-1")
        response = self.client.post(SWITCH_BRANCH_URL, {"branch": str(other.id)})
        self.assertEqual(response.status_code, 400)

    def test_switch_rejects_non_owner(self):
        branch = Branch.objects.create(business=self.business, name="A", code="A-1")
        attendant = User.objects.create_user(
            "at@a.com", "pw", business=self.business, branch=branch, phone_number="700000003"
        )
        self.client.force_authenticate(attendant)
        response = self.client.post(SWITCH_BRANCH_URL, {"branch": str(branch.id)})
        self.assertEqual(response.status_code, 403)


@override_settings(ADMIN_NOTIFICATION_EMAILS=["admin@example.com"])
class NewBusinessAdminNotificationTests(APITestCase):
    def test_creating_business_emails_admin(self):
        user = User.objects.create_user(
            "new@a.com", "pw", first_name="Jane", last_name="Doe", phone_code="+254", phone_number="700000009",
        )
        self.client.force_authenticate(user)
        with self.captureOnCommitCallbacks(execute=True):
            res = self.client.post("/api/commons/businesses/", {"name": "Sparkle Wash"})
        self.assertEqual(res.status_code, 201, res.content)
        self.assertEqual(len(mail.outbox), 1)
        email = mail.outbox[0]
        self.assertEqual(email.to, ["admin@example.com"])
        self.assertEqual(email.subject, "New business: Sparkle Wash")
        self.assertIn("Jane Doe", email.body)
        self.assertIn("new@a.com", email.body)
        self.assertIn("+254700000009", email.body)
