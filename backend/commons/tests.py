from rest_framework.test import APITestCase

from commons.models import Business
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
