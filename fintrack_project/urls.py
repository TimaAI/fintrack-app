from django.contrib import admin
from django.urls import path, include
from transactions.views import index, login_view, register_view, logout_view, profile_view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('transactions.urls')),
    path('', index, name='index'),
    path('login/', login_view, name='login'),
    path('register/', register_view, name='register'),
    path('logout/', logout_view, name='logout'),
    path('profile/', profile_view, name='profile'),
]