from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from users.views.user_views import CustomObtainTokenPairView, UserViewSet
from users.views.password_reset import ForgotPasswordView, ResetPasswordView

url_patterns = [
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('token/', CustomObtainTokenPairView.as_view(), name='token_obtain_pair'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='reset-password'),
]

core_router = DefaultRouter()
core_router.register(r"", UserViewSet)

url_patterns += core_router.urls
