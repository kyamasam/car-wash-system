from decimal import Decimal

from django.db.models import Q
from rest_framework.exceptions import ValidationError

from customers.models import Customer, Vehicle
from jobs.models import JobItem
from services.models import ServicePrice


def resolve_customer(customer_id=None, customer_data=None):
    """Return existing or newly created Customer, or None if neither provided."""
    if customer_id:
        try:
            return Customer.objects.get(id=customer_id)
        except Customer.DoesNotExist:
            raise ValidationError({"customer_id": "Customer not found."})

    if customer_data:
        phone = customer_data.get("phone")
        if not phone:
            raise ValidationError({"customer": "phone is required when creating a customer."})
        customer, _ = Customer.objects.get_or_create(
            phone=phone,
            defaults={
                "name": customer_data.get("name"),
                "email": customer_data.get("email"),
            },
        )
        return customer

    return None


def resolve_vehicle(vehicle_id=None, vehicle_data=None, customer=None):
    """Return existing or newly created Vehicle, or None if not provided."""
    if vehicle_id:
        try:
            vehicle = Vehicle.objects.get(id=vehicle_id)
        except Vehicle.DoesNotExist:
            raise ValidationError({"vehicle_id": "Vehicle not found."})
        if customer and vehicle.customer_id is None:
            vehicle.customer = customer
            vehicle.save(update_fields=["customer"])
        return vehicle

    if not vehicle_data:
        return None

    plate_number = vehicle_data.get("plate_number")
    if not plate_number:
        raise ValidationError({"vehicle": "plate_number is required."})

    vehicle, _ = Vehicle.objects.get_or_create(
        plate_number=plate_number,
        defaults={
            "vehicle_category": vehicle_data.get("vehicle_category"),
            "make": vehicle_data.get("make"),
            "model": vehicle_data.get("model"),
            "color": vehicle_data.get("color"),
        },
    )

    # Link to customer if not already linked
    if customer and vehicle.customer_id is None:
        vehicle.customer = customer
        vehicle.save(update_fields=["customer"])

    return vehicle


def lookup_service_price(service_id, branch_id, vehicle_category=None):
    """
    Find the most specific ServicePrice for a service on this branch.

    Priority (most specific → least):
    1. branch + vehicle_category (exact)
    2. branch + vehicle_category IS NULL
    3. branch IS NULL + vehicle_category (exact)
    4. branch IS NULL + vehicle_category IS NULL
    """
    base_qs = ServicePrice.objects.filter(service_id=service_id)

    candidates = base_qs.filter(
        Q(branch_id=branch_id) | Q(branch__isnull=True)
    )

    if vehicle_category:
        candidates = candidates.filter(
            Q(vehicle_category=vehicle_category) | Q(vehicle_category__isnull=True)
        )
    else:
        candidates = candidates.filter(vehicle_category__isnull=True)

    price = _manual_priority(candidates, branch_id, vehicle_category)

    if price is None:
        raise ValidationError(
            {"items": f"No price configured for service {service_id} on this branch."}
        )
    return price


def _manual_priority(qs, branch_id, vehicle_category):
    """Select the most specific ServicePrice without a custom manager."""
    # 1. exact branch + exact vehicle_category
    if vehicle_category:
        match = qs.filter(branch_id=branch_id, vehicle_category=vehicle_category).first()
        if match:
            return match

    # 2. exact branch + any vehicle_category
    match = qs.filter(branch_id=branch_id, vehicle_category__isnull=True).first()
    if match:
        return match

    # 3. global (branch NULL) + exact vehicle_category
    if vehicle_category:
        match = qs.filter(branch__isnull=True, vehicle_category=vehicle_category).first()
        if match:
            return match

    # 4. global + any vehicle_category
    return qs.filter(branch__isnull=True, vehicle_category__isnull=True).first()


def build_job_items(job, items_data, branch_id, vehicle_category=None):
    """
    Create JobItems for a job, locking in prices from ServicePrice.
    Returns list of (JobItem, ServicePrice) pairs for downstream use (e.g. commission).
    """
    to_create = []
    price_map = []  # parallel list of ServicePrice per item

    for item in items_data:
        service_id = item["service"].id if hasattr(item["service"], "id") else item["service"]
        quantity = Decimal(str(item.get("quantity", 1)))

        service_price = item.get("service_price") or lookup_service_price(service_id, branch_id, vehicle_category)
        unit_price = service_price.price
        line_total = unit_price * quantity

        to_create.append(
            JobItem(
                job=job,
                service_id=service_id,
                quantity=quantity,
                unit_price=unit_price,
                line_total=line_total,
                description=item.get("description"),
                tag_number=item.get("tag_number"),
                notes=item.get("notes"),
            )
        )
        price_map.append(service_price)

    created_items = JobItem.objects.bulk_create(to_create)
    return list(zip(created_items, price_map))
