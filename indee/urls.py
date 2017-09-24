from django.conf.urls import patterns, include, url
from django.contrib import admin

from indee import views

urlpatterns = patterns(
    url(r'^admin/', include(admin.site.urls)),
    url(r'^home/', views.home),
    url(r'^initiate_upload/', views.initiate_upload),
    url(r'^get_presigned_url/', views.get_presigned_url_for_part),
    url(r'^complete_multipart_upload.', views.complete_multipart_upload),
)
