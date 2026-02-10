from rest_framework import serializers
from .models import Transaction

class TransactionSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = Transaction
        fields = ['id', 'date', 'category', 'category_display', 'amount', 
                  'type', 'type_display', 'description']
        read_only_fields = ['id']