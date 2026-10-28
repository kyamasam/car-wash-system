from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import mixins, status
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet, ReadOnlyModelViewSet

from subscriptions.models import Package, Subscription, SubscriptionPayment
from subscriptions.permissions import CanManageSubscription
from subscriptions.serializers import (
    ConfirmPaymentResponseSerializer,
    InitiatePaymentSerializer,
    PackageSerializer,
    SubscriptionPaymentSerializer,
    SubscriptionSerializer,
    SubscriptionStatusSerializer,
)
from subscriptions.services.subscription import get_subscription_state, initiate_payment, refresh_payment


def _user_phone(user):
    if not user.phone_number:
        return None
    return f"{user.phone_code or ''}{user.phone_number}"


@extend_schema_view(list=extend_schema(tags=["subscriptions"]), retrieve=extend_schema(tags=["subscriptions"]))
class PackageViewSet(ReadOnlyModelViewSet):
    queryset = Package.objects.filter(is_active=True, deleted_at__isnull=True)
    serializer_class = PackageSerializer
    pagination_class = None
    subscription_exempt = True


class SubscriptionStatusView(APIView):
    """Current subscription state of the user's business. Open to any member."""

    subscription_exempt = True

    @extend_schema(tags=["subscriptions"], responses=SubscriptionStatusSerializer)
    def get(self, request):
        if not request.user.business_id:
            raise NotFound("You are not linked to a business.")
        state = get_subscription_state(request.user.business_id)
        return Response(SubscriptionStatusSerializer(state).data)


@extend_schema_view(list=extend_schema(tags=["subscriptions"]))
class SubscriptionViewSet(mixins.ListModelMixin, GenericViewSet):
    """The business's granted periods (trial + paid)."""

    queryset = Subscription.objects.select_related("package").filter(is_active=True, deleted_at__isnull=True)
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated, CanManageSubscription]
    subscription_exempt = True

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_superuser:
            return qs
        return qs.filter(business_id=user.business_id)


@extend_schema_view(list=extend_schema(tags=["subscriptions"]), retrieve=extend_schema(tags=["subscriptions"]))
class SubscriptionPaymentViewSet(ReadOnlyModelViewSet):
    queryset = SubscriptionPayment.objects.select_related("package").all()
    serializer_class = SubscriptionPaymentSerializer
    permission_classes = [IsAuthenticated, CanManageSubscription]
    subscription_exempt = True

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_superuser:
            return qs
        return qs.filter(business_id=user.business_id)

    @extend_schema(tags=["subscriptions"], request=InitiatePaymentSerializer, responses=SubscriptionPaymentSerializer)
    @action(detail=False, methods=["post"], url_path="initiate")
    def initiate(self, request):
        if not request.user.business_id:
            raise NotFound("You are not linked to a business.")
        serializer = InitiatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        payment = initiate_payment(
            request.user,
            package=data["package"],
            period=data["period"],
            payment_method=data["payment_method"],
            phone=data.get("phone") or _user_phone(request.user),
        )
        return Response(SubscriptionPaymentSerializer(payment).data, status=status.HTTP_201_CREATED)

    @extend_schema(tags=["subscriptions"], request=None, responses=ConfirmPaymentResponseSerializer)
    @action(detail=True, methods=["post"], url_path="confirm")
    def confirm(self, request, pk=None):
        payment = refresh_payment(self.get_object())
        return Response(ConfirmPaymentResponseSerializer({
            "payment": payment,
            "subscription": get_subscription_state(payment.business_id),
        }).data)
