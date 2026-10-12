from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from drf_spectacular.utils import extend_schema
from ..serializers.password_reset import ForgotPasswordSerializer, ResetPasswordSerializer
from ..services.password_reset import PasswordResetService

@extend_schema(tags=['Authentication'])
class ForgotPasswordView(APIView):
    """Request password reset email"""
    permission_classes = [AllowAny]
    
    @extend_schema(
        summary='Request password reset',
        description='Sends a password reset link to the user\'s email',
        request=ForgotPasswordSerializer,
        responses={
            200: {'description': 'Password reset email sent'},
            400: {'description': 'Invalid email'},
        }
    )
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        result = PasswordResetService.initiate_reset(email)
        
        if result['success']:
            return Response(
                {'message': result['message']},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'error': result['message']},
                status=status.HTTP_400_BAD_REQUEST
            )


@extend_schema(tags=['Authentication'])
class ResetPasswordView(APIView):
    """Reset password using token"""
    permission_classes = [AllowAny]
    
    @extend_schema(
        summary='Reset password',
        description='Reset user password using the token from email',
        request=ResetPasswordSerializer,
        responses={
            200: {'description': 'Password reset successful'},
            400: {'description': 'Invalid token or data'},
        }
    )
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        new_password = serializer.validated_data['new_password']
        
        PasswordResetService.reset_password(user, new_password)
        
        return Response(
            {'message': 'Password reset successful. You can now login with your new password.'},
            status=status.HTTP_200_OK
        )