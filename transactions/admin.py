from django.contrib import admin
from .models import Transaction

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'type', 'category', 'amount', 'description']
    list_filter = ['user', 'type', 'category', 'date']
    search_fields = ['description', 'user__username']
    date_hierarchy = 'date'