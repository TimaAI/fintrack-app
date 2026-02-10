# 🔌 FinTrack API Documentation

## Обзор

FinTrack API предоставляет RESTful endpoints для управления личными финансами.

**Base URL:** `http://127.0.0.1:8000/api/`

**Аутентификация:** Session Authentication

---

## Модели данных

### Transaction (Транзакция)
```json
{
  "id": integer,
  "user": integer (FK),
  "date": datetime,
  "category": string,
  "amount": decimal,
  "type": string ["income", "expense"],
  "description": string
}
```

### Категории

**Расходы:**
- `food` - Продукты
- `transport` - Транспорт
- `entertainment` - Развлечения
- `health` - Здоровье
- `shopping` - Покупки
- `utilities` - Коммунальные
- `other_expense` - Другое

**Доходы:**
- `salary` - Зарплата
- `freelance` - Фриланс
- `investment` - Инвестиции
- `gift` - Подарок
- `other_income` - Другое

---

## Endpoints

### 1. Транзакции

#### Список всех транзакций
```http
GET /api/transactions/
```

**Параметры запроса:** Нет

**Ответ:** `200 OK`
```json
[
  {
    "id": 1,
    "date": "2026-02-09T12:00:00Z",
    "category": "food",
    "category_display": "Продукты",
    "amount": "5000.00",
    "type": "expense",
    "type_display": "Расход",
    "description": "Магазин"
  }
]
```

---

#### Создать транзакцию
```http
POST /api/transactions/
Content-Type: application/json
```

**Тело запроса:**
```json
{
  "type": "expense",
  "category": "food",
  "amount": "5000.00",
  "date": "2026-02-09T12:00:00Z",
  "description": "Продукты"
}
```

**Ответ:** `201 Created`

---

#### Получить транзакцию
```http
GET /api/transactions/{id}/
```

**Ответ:** `200 OK`

---

#### Обновить транзакцию
```http
PUT /api/transactions/{id}/
Content-Type: application/json
```

**Тело запроса:** (как при создании)

**Ответ:** `200 OK`

---

#### Удалить транзакцию
```http
DELETE /api/transactions/{id}/
```

**Ответ:** `204 No Content`

---

### 2. Аналитика

#### Получить баланс
```http
GET /api/transactions/balance/
```

**Ответ:** `200 OK`
```json
{
  "balance": 348000.00,
  "total_income": 350000.00,
  "total_expense": 2000.00
}
```

---

#### Получить аналитику трат
```http
GET /api/transactions/analytics/
```

**Ответ:** `200 OK`
```json
{
  "current_month_total": 2000.00,
  "previous_month_total": 1500.00,
  "change_percent": 33.33,
  "trend": "up",
  "top_category": {
    "category": "food",
    "total": 1200.00
  },
  "category_breakdown": [
    {"category": "food", "total": 1200.00},
    {"category": "transport", "total": 800.00}
  ]
}
```

---

#### Получить сводку по категориям
```http
GET /api/transactions/summary/
```

**Ответ:** `200 OK`
```json
{
  "income_by_category": [...],
  "expense_by_category": [...]
}
```

---

#### Получить данные календаря
```http
GET /api/transactions/calendar/?year=2026&month=2
```

**Параметры:**
- `year` (обязательно) - год
- `month` (обязательно) - месяц (1-12)

**Ответ:** `200 OK`
```json
[
  {
    "date": "2026-02-09",
    "transactions": [...],
    "total_income": 0,
    "total_expense": 5000.00
  }
]
```

---

## Коды ошибок

- `200 OK` - Успешный запрос
- `201 Created` - Ресурс создан
- `204 No Content` - Успешно удалено
- `400 Bad Request` - Неверные данные
- `401 Unauthorized` - Требуется авторизация
- `403 Forbidden` - Доступ запрещен
- `404 Not Found` - Ресурс не найден
- `500 Internal Server Error` - Ошибка сервера

---

## Примеры использования

### Python (requests)
```python
import requests

# Вход
session = requests.Session()
login_data = {'username': 'user', 'password': 'pass'}
session.post('http://127.0.0.1:8000/login/', data=login_data)

# Получить транзакции
response = session.get('http://127.0.0.1:8000/api/transactions/')
print(response.json())

# Создать транзакцию
data = {
    'type': 'expense',
    'category': 'food',
    'amount': '5000',
    'date': '2026-02-09T12:00:00Z',
    'description': 'Покупки'
}
response = session.post('http://127.0.0.1:8000/api/transactions/', json=data)
```

### JavaScript (Fetch API)
```javascript
// Создать транзакцию
const data = {
    type: 'expense',
    category: 'food',
    amount: '5000',
    date: '2026-02-09T12:00:00Z',
    description: 'Покупки'
};

fetch('http://127.0.0.1:8000/api/transactions/', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken')
    },
    credentials: 'include',
    body: JSON.stringify(data)
})
.then(response => response.json())
.then(data => console.log(data));
```

---

**Последнее обновление:** 09.02.2026