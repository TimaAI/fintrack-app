from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Q
from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages
from .models import Transaction
from .serializers import TransactionSerializer
from datetime import datetime, timedelta
from collections import defaultdict

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]  # Требуется авторизация
    
    def get_queryset(self):
        # Показываем только транзакции текущего пользователя
        return Transaction.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # Автоматически привязываем к текущему пользователю
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def balance(self, request):
        """Получить текущий баланс"""
        user_transactions = Transaction.objects.filter(user=request.user)
        income = user_transactions.filter(type='income').aggregate(
            total=Sum('amount'))['total'] or 0
        expense = user_transactions.filter(type='expense').aggregate(
            total=Sum('amount'))['total'] or 0
        balance = income - expense
        
        return Response({
            'balance': balance,
            'total_income': income,
            'total_expense': expense
        })
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Получить сводку по категориям"""
        user_transactions = Transaction.objects.filter(user=request.user)
        income_summary = user_transactions.filter(type='income').values(
            'category').annotate(total=Sum('amount'))
        expense_summary = user_transactions.filter(type='expense').values(
            'category').annotate(total=Sum('amount'))
        
        return Response({
            'income_by_category': income_summary,
            'expense_by_category': expense_summary
        })
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Анализ привычек трат"""
        now = datetime.now()
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0)
        
        if now.month == 1:
            prev_month_start = now.replace(year=now.year-1, month=12, day=1)
        else:
            prev_month_start = now.replace(month=now.month-1, day=1)
        
        user_transactions = Transaction.objects.filter(user=request.user)
        current_expenses = user_transactions.filter(
            type='expense',
            date__gte=current_month_start
        )
        
        prev_expenses = user_transactions.filter(
            type='expense',
            date__gte=prev_month_start,
            date__lt=current_month_start
        )
        
        current_total = current_expenses.aggregate(total=Sum('amount'))['total'] or 0
        prev_total = prev_expenses.aggregate(total=Sum('amount'))['total'] or 0
        
        if prev_total > 0:
            change_percent = ((current_total - prev_total) / prev_total) * 100
        else:
            change_percent = 0
        
        top_category = current_expenses.values('category').annotate(
            total=Sum('amount')
        ).order_by('-total').first()
        
        category_breakdown = list(current_expenses.values('category').annotate(
            total=Sum('amount')
        ).order_by('-total'))
        
        return Response({
            'current_month_total': float(current_total),
            'previous_month_total': float(prev_total),
            'change_percent': round(change_percent, 2),
            'trend': 'up' if change_percent > 0 else 'down' if change_percent < 0 else 'stable',
            'top_category': top_category,
            'category_breakdown': category_breakdown
        })
    
    @action(detail=False, methods=['get'])
    def calendar(self, request):
        """Получить транзакции для календаря"""
        year = request.GET.get('year')
        month = request.GET.get('month')
        
        user_transactions = Transaction.objects.filter(user=request.user)
        
        if year and month:
            transactions = user_transactions.filter(
                date__year=year,
                date__month=month
            )
        else:
            now = datetime.now()
            transactions = user_transactions.filter(
                date__year=now.year,
                date__month=now.month
            )
        
        calendar_data = {}
        for transaction in transactions:
            date_key = transaction.date.strftime('%Y-%m-%d')
            
            if date_key not in calendar_data:
                calendar_data[date_key] = {
                    'date': date_key,
                    'transactions': [],
                    'total_income': 0,
                    'total_expense': 0,
                }
            
            calendar_data[date_key]['transactions'].append({
                'id': transaction.id,
                'type': transaction.type,
                'category': transaction.category,
                'amount': float(transaction.amount),
                'description': transaction.description,
            })
            
            if transaction.type == 'income':
                calendar_data[date_key]['total_income'] += float(transaction.amount)
            else:
                calendar_data[date_key]['total_expense'] += float(transaction.amount)
        
        return Response(list(calendar_data.values()))


# Страницы аутентификации
@login_required
def index(request):
    """Главная страница с интерфейсом"""
    return render(request, 'index.html', {'user': request.user})


def login_view(request):
    """Страница входа"""
    if request.user.is_authenticated:
        return redirect('index')
    
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            messages.success(request, f'Добро пожаловать, {user.username}!')
            return redirect('index')
        else:
            messages.error(request, 'Неверный логин или пароль')
    
    return render(request, 'login.html')


def register_view(request):
    """Страница регистрации"""
    if request.user.is_authenticated:
        return redirect('index')
    
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password1 = request.POST.get('password1')
        password2 = request.POST.get('password2')
        
        # Валидация
        if password1 != password2:
            messages.error(request, 'Пароли не совпадают')
        elif len(password1) < 6:
            messages.error(request, 'Пароль должен быть минимум 6 символов')
        elif User.objects.filter(username=username).exists():
            messages.error(request, 'Пользователь с таким именем уже существует')
        elif User.objects.filter(email=email).exists():
            messages.error(request, 'Email уже используется')
        else:
            # Создаем пользователя
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password1
            )
            login(request, user)
            messages.success(request, f'Аккаунт создан! Добро пожаловать, {username}!')
            return redirect('index')
    
    return render(request, 'register.html')


def logout_view(request):
    """Выход из системы"""
    logout(request)
    messages.info(request, 'Вы вышли из системы')
    return redirect('login')


@login_required
def profile_view(request):
    """Профиль пользователя"""
    user = request.user
    total_transactions = Transaction.objects.filter(user=user).count()
    total_income = Transaction.objects.filter(user=user, type='income').aggregate(
        total=Sum('amount'))['total'] or 0
    total_expense = Transaction.objects.filter(user=user, type='expense').aggregate(
        total=Sum('amount'))['total'] or 0
    
    context = {
        'user': user,
        'total_transactions': total_transactions,
        'total_income': total_income,
        'total_expense': total_expense,
        'balance': total_income - total_expense,
    }
    return render(request, 'profile.html', context)