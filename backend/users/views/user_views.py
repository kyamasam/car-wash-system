from django.db import models
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters, serializers, permissions
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import status

from commons.mixins import BranchScopedMixin
from users.models import User
from users.permissions import AnonCreateAndUpdateOwnerOnly
from users.services.account_confirmation import send_account_confirmation_email
from users.serializers import (
    ChangePasswordSerializer,
    ConfirmAccountSerializer,
    CustomTokenObtainPairSerializer,
    LimitedUserSerializer,
    UserSerializer,
    SendPasswordResetCodeSerializer,
    ResetPasswordSerializer,
)
from drf_spectacular.utils import extend_schema, inline_serializer, OpenApiExample
from drf_spectacular.types import OpenApiTypes


class CustomObtainTokenPairView(TokenObtainPairView):
    authentication_classes = []
    permission_classes = (AllowAny,)
    serializer_class = CustomTokenObtainPairSerializer


class UserViewSet(BranchScopedMixin, viewsets.ModelViewSet):
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer
    permission_classes = [AnonCreateAndUpdateOwnerOnly]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ["username", "email"]
    filterset_fields = ["username"]

    def get_serializer_class(self):
        if self.action == 'list' and not self.request.user.is_superuser:
            return LimitedUserSerializer
        return UserSerializer

    def partial_update(self, request, pk=None):
        try:
            auth_user = self.request.user
            if auth_user.is_staff or auth_user.is_superuser:
                user = User.objects.get(pk=pk)
            else:
                if str(pk) != str(auth_user.id):
                    raise serializers.ValidationError('User cannot update this user')
                user = User.objects.get(pk=pk)
            serializer = self.get_serializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=["get"], url_path="get-current-user", serializer_class=UserSerializer)
    def get_current_user(self, request):
        user_obj = User.objects.get(pk=request.user.id)
        return Response(UserSerializer(user_obj, context={"request": request}).data)

    @extend_schema(
        summary="Confirm user account",
        description=(
            "Verifies the account using the emailed OTP code. Optionally sets a password. "
            "If the user has a usable password afterwards, JWT tokens and the user are returned; "
            "otherwise only a `detail` message is returned."
        ),
        request=ConfirmAccountSerializer,
        responses={
            200: inline_serializer(
                name="ConfirmAccountResponse",
                fields={
                    "access": serializers.CharField(required=False),
                    "refresh": serializers.CharField(required=False),
                    "user": inline_serializer(
                        name="ConfirmAccountUser",
                        required=False,
                        fields={
                            "id": serializers.UUIDField(),
                            "email": serializers.EmailField(),
                            "first_name": serializers.CharField(),
                            "last_name": serializers.CharField(),
                            "username": serializers.CharField(),
                            "role": serializers.CharField(),
                        },
                    ),
                    "detail": serializers.CharField(required=False),
                },
            ),
            400: inline_serializer(
                name="ConfirmAccountError",
                fields={
                    "non_field_errors": serializers.ListField(child=serializers.CharField(), required=False),
                    "email": serializers.ListField(child=serializers.CharField(), required=False),
                    "otp_code": serializers.ListField(child=serializers.CharField(), required=False),
                    "password": serializers.ListField(child=serializers.CharField(), required=False),
                    "confirm_password": serializers.ListField(child=serializers.CharField(), required=False),
                },
            ),
        },
        examples=[
            OpenApiExample(
                "Confirmed with tokens",
                response_only=True,
                status_codes=["200"],
                value={
                    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    "user": {
                        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                        "email": "user@example.com",
                        "first_name": "Jane",
                        "last_name": "Doe",
                        "username": "janedoe",
                        "role": "owner",
                    },
                },
            ),
            OpenApiExample(
                "Confirmed without password",
                response_only=True,
                status_codes=["200"],
                value={"detail": "Account confirmed successfully."},
            ),
            OpenApiExample(
                "Invalid OTP",
                response_only=True,
                status_codes=["400"],
                value={"non_field_errors": ["Invalid OTP code or email address."]},
            ),
            OpenApiExample(
                "Passwords do not match",
                response_only=True,
                status_codes=["400"],
                value={"non_field_errors": ["Passwords do not match."]},
            ),
        ],
    )
    @action(detail=False, methods=["post"], url_path="confirm-account",
            permission_classes=[permissions.AllowAny], serializer_class=ConfirmAccountSerializer)
    def confirm_account(self, request):
        serializer = ConfirmAccountSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        token_data = serializer.save()
        if token_data:
            return Response(token_data, status=status.HTTP_200_OK)
        return Response({"detail": "Account confirmed successfully."}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="check-status", permission_classes=[permissions.AllowAny])
    def check_account_status(self, request):
        email = request.query_params.get('email', '')
        try:
            user = User.objects.get(email=email)
            return Response({"email_verified": user.email_verified})
        except User.DoesNotExist:
            return Response({"email_verified": False})

    @action(detail=False, methods=["post"], url_path="resend-verification",
            permission_classes=[permissions.AllowAny])
    def resend_verification(self, request):
        from django.utils import timezone
        from datetime import timedelta

        email = request.data.get("email", "").strip()
        if not email:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"detail": "If that email is registered, a new code has been sent."})

        if user.email_verified:
            return Response({"detail": "This account is already verified."}, status=status.HTTP_400_BAD_REQUEST)

        if user.otp_code_expires_at:
            cooldown_until = user.otp_code_expires_at - timedelta(hours=24) + timedelta(minutes=1)
            if timezone.now() < cooldown_until:
                seconds_left = int((cooldown_until - timezone.now()).total_seconds())
                return Response(
                    {"detail": f"Please wait {seconds_left} seconds before requesting another code.",
                     "seconds_left": seconds_left},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )
        send_account_confirmation_email(user)
        return Response({"detail": "If that email is registered, a new code has been sent."})

    @action(detail=False, methods=["post"], url_path="send-reset-link",
            permission_classes=[permissions.AllowAny], serializer_class=SendPasswordResetCodeSerializer)
    def send_reset_password_code(self, request):
        serializer = SendPasswordResetCodeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
        else:
            raise serializers.ValidationError(serializer.errors, code=400)
        return Response({"data": "Email Sent"})

    @action(detail=False, methods=["post"], url_path="reset-password",
            permission_classes=[permissions.AllowAny], serializer_class=ResetPasswordSerializer)
    def reset_password(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
        return Response({"data": "Password Changed Successfully"})

    @action(methods=["POST"], permission_classes=[permissions.IsAuthenticated],
            detail=False, url_path="change-password", serializer_class=ChangePasswordSerializer)
    def change_password(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            raise serializers.ValidationError(serializer.errors)
        current_password = serializer.validated_data.get('current_password')
        new_password = serializer.validated_data.get('new_password')
        user = request.user
        if not user.check_password(current_password):
            raise serializers.ValidationError("Current password is incorrect")
        user.set_password(new_password)
        user.save()
        return Response({"error": False, "data": None, "msg": "Password changed successfully"},
                        status=status.HTTP_200_OK)
