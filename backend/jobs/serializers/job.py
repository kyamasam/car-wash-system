from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from billing.serializers.billing import CommissionEntrySerializer, PaymentSerializer
from billing.services.commission import create_commission_entries
from customers.constants import VehicleCategory
from customers.serializers import CustomerSerializer, VehicleSerializer
from jobs.constants import CollectionMethod, PaymentStatus
from jobs.models import Job, JobItem
from jobs.services.job_creation import build_job_items, resolve_customer, resolve_vehicle
from services.models import Service, ServicePrice
from workers.serializers.worker import WorkerSerializer


class _ServiceSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ["id", "name", "code", "category", "unit", "icon"]


class JobItemSerializer(serializers.ModelSerializer):
    service = _ServiceSummarySerializer(read_only=True)

    class Meta:
        model = JobItem
        fields = "__all__"


class JobSerializer(serializers.ModelSerializer):
    items = JobItemSerializer(many=True, read_only=True)
    customer = CustomerSerializer(read_only=True)
    vehicle = VehicleSerializer(read_only=True)
    worker = WorkerSerializer(read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    commission_entries = CommissionEntrySerializer(many=True, read_only=True)

    class Meta:
        model = Job
        fields = "__all__"
        read_only_fields = ("job_number",)


# ---------------------------------------------------------------------------
# Write serializers for job creation
# ---------------------------------------------------------------------------

class _CustomerInputSerializer(serializers.Serializer):
    phone = serializers.CharField()
    name = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    email = serializers.EmailField(required=False, allow_null=True)


class _VehicleInputSerializer(serializers.Serializer):
    plate_number = serializers.CharField()
    vehicle_category = serializers.ChoiceField(
        choices=VehicleCategory.choices, required=False, allow_null=True
    )
    make = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    model = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    color = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class _JobItemInputSerializer(serializers.Serializer):
    service = serializers.PrimaryKeyRelatedField(queryset=Service.objects.all())
    service_price = serializers.PrimaryKeyRelatedField(
        queryset=ServicePrice.objects.all(),
        required=False,
        allow_null=True,
    )
    quantity = serializers.DecimalField(max_digits=10, decimal_places=2, default=1)
    description = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    tag_number = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    notes = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class JobCreateSerializer(serializers.ModelSerializer):
    # Customer: pass an existing ID, inline data, or omit entirely
    customer_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    customer_data = _CustomerInputSerializer(write_only=True, required=False, allow_null=True)

    # Vehicle: pass an existing UUID, inline data, or omit entirely
    vehicle_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    vehicle_data = _VehicleInputSerializer(write_only=True, required=False, allow_null=True)

    # Line items (required — a job with no services makes no sense)
    items = _JobItemInputSerializer(many=True, write_only=True)

    class Meta:
        model = Job
        fields = [
            "worker",
            "collection_method",
            "pickup_address",
            "contact_phone",
            "expected_collection_at",
            "discount_amount",
            "notes",
            # write-only composite inputs
            "customer_id",
            "customer_data",
            "vehicle_id",
            "vehicle_data",
            "items",
        ]
        extra_kwargs = {
            "discount_amount": {"required": False, "default": Decimal("0")},
        }

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one item is required.")
        return value

    def validate(self, attrs):
        user = self.context["request"].user
        print("user branch", user)
        if not user.branch_id:
            raise serializers.ValidationError(
                {"branch": "Your account has no assigned branch. Contact your administrator."}
            )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        # Extract composite inputs not mapped to Job fields
        customer_id = validated_data.pop("customer_id", None)
        customer_data = validated_data.pop("customer_data", None)
        vehicle_id = validated_data.pop("vehicle_id", None)
        vehicle_data = validated_data.pop("vehicle_data", None)
        items_data = validated_data.pop("items")

        request = self.context["request"]
        branch = request.user.branch

        # 1. Resolve customer (existing, new, or anonymous)
        customer = resolve_customer(customer_id=customer_id, customer_data=customer_data)

        # 2. Resolve vehicle (by UUID, inline data, or omitted)
        vehicle = resolve_vehicle(vehicle_id=vehicle_id, vehicle_data=vehicle_data, customer=customer)
        vehicle_category = vehicle.vehicle_category if vehicle else None

        # 3. Create the job shell — totals will be filled after items are created
        job = Job.objects.create(
            **validated_data,
            branch=branch,
            customer=customer,
            vehicle=vehicle,
            subtotal=Decimal("0"),
            total_amount=Decimal("0"),
            payment_status=PaymentStatus.UNPAID,
            created_by=request.user,
        )

        # 4. Set check-in time for walk-in jobs
        if job.collection_method == CollectionMethod.WALK_IN:
            job.checked_in_at = timezone.now()

        # 5. Build job items with locked-in prices from ServicePrice
        items_with_prices = build_job_items(
            job=job,
            items_data=items_data,
            branch_id=branch.id,
            vehicle_category=vehicle_category,
        )

        # 6. Compute and persist final totals
        subtotal = sum(item.line_total for item, _ in items_with_prices)
        discount = job.discount_amount or Decimal("0")
        job.subtotal = subtotal
        job.total_amount = max(subtotal - discount, Decimal("0"))
        job.save(update_fields=["subtotal", "total_amount", "checked_in_at"])

        # 7. Create commission entries for eligible worker
        create_commission_entries(job=job, job_items_with_prices=items_with_prices)

        return job

    def to_representation(self, instance):
        # Respond with the full job (items, totals, job number) so clients can
        # use it immediately, e.g. to print the job card.
        return JobSerializer(instance, context=self.context).data
