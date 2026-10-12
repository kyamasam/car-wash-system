# backend/asgi.py - Add this temporarily for debugging
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Initialize Django ASGI application early
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator
from django.urls import path, re_path

# Debug: Print all registered routes
from django.urls import get_resolver
print("🔍 Registered URL patterns:")
for pattern in get_resolver().url_patterns:
    print(f" {pattern.pattern}")

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter([
                # path('api/ws/resume/<uuid:resume_id>/', ResumeStatusConsumer.as_asgi()),
            ])
        )
    ),
})

print("✅ ASGI application configured")