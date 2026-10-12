
from django.contrib import admin
from django.urls import path, include
from users.urls import url_patterns as user_url_patterns
from commons.urls import url_patterns as commons_url_patterns
from workers.urls import url_patterns as worker_url_patterns
from customers.urls import url_patterns as customer_url_patterns
from services.urls import url_patterns as service_url_patterns
from jobs.urls import url_patterns as job_url_patterns
from billing.urls import url_patterns as billing_url_patterns
from reports.urls import url_patterns as report_url_patterns

from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    path('api/users/', include([*user_url_patterns,])),
    path('api/commons/', include([*commons_url_patterns,])),
    path('api/workers/', include([*worker_url_patterns,])),
    path('api/customers/', include([*customer_url_patterns,])),
    path('api/services/', include([*service_url_patterns,])),
    path('api/jobs/', include([*job_url_patterns,])),
    path('api/billing/', include([*billing_url_patterns,])),
    path('api/reports/', include([*report_url_patterns,])),

    path('summernote/', include('django_summernote.urls')),
    path('admin/', admin.site.urls),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
