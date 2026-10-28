from rest_framework.test import APITestCase

from commons.models import Branch, Business
from services.models import Service, ServicePrice
from users.models import User


def _results(response):
    data = response.json()
    return data["results"] if isinstance(data, dict) and "results" in data else data


class ServiceScopingTests(APITestCase):
    def setUp(self):
        self.biz_a = Business.objects.create(name="A")
        self.biz_b = Business.objects.create(name="B")
        self.branch_a1 = Branch.objects.create(business=self.biz_a, name="A1", code="A1")
        self.branch_a2 = Branch.objects.create(business=self.biz_a, name="A2", code="A2")
        self.branch_b1 = Branch.objects.create(business=self.biz_b, name="B1", code="B1")

        self.shared = Service.objects.create(business=self.biz_a, name="Wash", code="WASH", category="vehicle")
        self.a1_only = Service.objects.create(
            business=self.biz_a, branch=self.branch_a1, name="Polish", code="POL", category="vehicle"
        )
        self.a2_only = Service.objects.create(
            business=self.biz_a, branch=self.branch_a2, name="Wax", code="WAX", category="vehicle"
        )
        self.b_service = Service.objects.create(business=self.biz_b, name="Wash", code="WASH", category="vehicle")

        price = dict(price=100, commission_value=10, commission_type="fixed")
        self.price_all = ServicePrice.objects.create(service=self.shared, branch=None, **price)
        self.price_a1 = ServicePrice.objects.create(service=self.shared, branch=self.branch_a1, **price)
        self.price_a2 = ServicePrice.objects.create(service=self.shared, branch=self.branch_a2, **price)

        self.owner_a = User.objects.create_user("owner@a.com", "pw", business=self.biz_a, phone_number="700000001")
        self.attendant_a1 = User.objects.create_user(
            "a1@a.com", "pw", business=self.biz_a, branch=self.branch_a1, phone_number="700000002"
        )
        self.owner_b = User.objects.create_user("owner@b.com", "pw", business=self.biz_b, phone_number="700000003")

    def _ids(self, user):
        self.client.force_authenticate(user)
        response = self.client.get("/api/services/?page=1")
        self.assertEqual(response.status_code, 200)
        return {s["id"]: s for s in _results(response)}

    def test_business_user_sees_all_business_services(self):
        services = self._ids(self.owner_a)
        self.assertEqual(set(services), {str(self.shared.id), str(self.a1_only.id), str(self.a2_only.id)})
        self.assertEqual(len(services[str(self.shared.id)]["prices"]), 3)

    def test_branch_user_sees_branch_and_shared_services_and_prices(self):
        services = self._ids(self.attendant_a1)
        self.assertEqual(set(services), {str(self.shared.id), str(self.a1_only.id)})
        price_ids = {p["id"] for p in services[str(self.shared.id)]["prices"]}
        self.assertEqual(price_ids, {str(self.price_all.id), str(self.price_a1.id)})

    def test_other_business_cannot_see_or_retrieve(self):
        services = self._ids(self.owner_b)
        self.assertEqual(set(services), {str(self.b_service.id)})
        response = self.client.get(f"/api/services/{self.shared.id}/")
        self.assertEqual(response.status_code, 404)

    def test_create_sets_business_and_code_unique_per_business(self):
        self.client.force_authenticate(self.owner_b)
        response = self.client.post(
            "/api/services/", {"name": "Polish", "code": "POL", "category": "vehicle"}, format="json"
        )
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(Service.objects.get(id=response.json()["id"]).business, self.biz_b)

        response = self.client.post(
            "/api/services/", {"name": "Wash 2", "code": "WASH", "category": "vehicle"}, format="json"
        )
        self.assertEqual(response.status_code, 400)

    def test_cannot_price_another_business_service(self):
        self.client.force_authenticate(self.owner_b)
        response = self.client.post(
            "/api/services/prices/",
            {"service": str(self.shared.id), "price": 50, "commission_value": 5, "commission_type": "fixed"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
