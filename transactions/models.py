from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User

class Transaction(models.Model):
    TYPE_CHOICES = [
        ('income', 'Доход'),
        ('expense', 'Расход'),
    ]
    
    CATEGORY_CHOICES = [
        # Расходы
        ('food', 'Продукты'),
        ('transport', 'Транспорт'),
        ('entertainment', 'Развлечения'),
        ('health', 'Здоровье'),
        ('shopping', 'Покупки'),
        ('utilities', 'Коммунальные'),
        ('other_expense', 'Другое'),
        # Доходы
        ('salary', 'Зарплата'),
        ('freelance', 'Фриланс'),
        ('investment', 'Инвестиции'),
        ('gift', 'Подарок'),
        ('other_income', 'Другое'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')  # НОВОЕ ПОЛЕ
    date = models.DateTimeField(default=timezone.now, verbose_name='Дата')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, verbose_name='Категория')
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Сумма')
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, verbose_name='Тип')
    description = models.TextField(blank=True, verbose_name='Описание')
    
    class Meta:
        ordering = ['-date']
        verbose_name = 'Транзакция'
        verbose_name_plural = 'Транзакции'
    
    def __str__(self):
        return f"{self.user.username} - {self.get_type_display()} - {self.amount}"