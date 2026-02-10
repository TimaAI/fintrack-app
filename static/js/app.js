// API endpoint
const API_URL = 'http://127.0.0.1:8000/api';

// Категории
const CATEGORIES = {
    expense: {
        food: '🍔 Продукты',
        transport: '🚗 Транспорт',
        entertainment: '🎮 Развлечения',
        health: '💊 Здоровье',
        shopping: '🛍️ Покупки',
        utilities: '💡 Коммунальные',
        other_expense: '📦 Другое'
    },
    income: {
        salary: '💰 Зарплата',
        freelance: '💻 Фриланс',
        investment: '📈 Инвестиции',
        gift: '🎁 Подарок',
        other_income: '💵 Другое'
    }
};

let currentFilter = 'all';
let editingId = null;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('Страница загружена');
    initializePage();
});

async function initializePage() {
    console.log('Инициализация...');
    setCurrentDateTime();
    updateCategoryOptions('expense');
    await loadBalance();
    await loadAnalytics();
    await loadTransactions();
    await loadCalendar();

    // Обработчики событий
    const typeSelect = document.getElementById('type');
    if (typeSelect) {
        typeSelect.addEventListener('change', function(e) {
            updateCategoryOptions(e.target.value);
        });
    }

    const form = document.getElementById('transactionForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Форма отправлена!');
            handleFormSubmit(e);
        });
    } else {
        console.error('Форма не найдена!');
    }
}

// Установить текущую дату и время
function setCurrentDateTime() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now - offset).toISOString().slice(0, 16);
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.value = localISOTime;
    }
}

// Обновить опции категорий
function updateCategoryOptions(type) {
    const categorySelect = document.getElementById('category');
    if (!categorySelect) return;
    
    const categories = CATEGORIES[type];
    categorySelect.innerHTML = '';
    
    for (const [value, label] of Object.entries(categories)) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        categorySelect.appendChild(option);
    }
}

// Загрузить баланс
async function loadBalance() {
    try {
        const response = await fetch(`${API_URL}/transactions/balance/`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        const balanceEl = document.getElementById('balanceAmount');
        const incomeEl = document.getElementById('totalIncome');
        const expenseEl = document.getElementById('totalExpense');
        
        if (balanceEl) balanceEl.textContent = formatMoney(data.balance);
        if (incomeEl) incomeEl.textContent = formatMoney(data.total_income);
        if (expenseEl) expenseEl.textContent = formatMoney(data.total_expense);
    } catch (error) {
        console.error('Ошибка загрузки баланса:', error);
    }
}

// Загрузить аналитику
async function loadAnalytics() {
    try {
        const response = await fetch(`${API_URL}/transactions/analytics/`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        // Изменение за месяц
        const changeElement = document.getElementById('monthChange');
        if (changeElement) {
            const changePercent = data.change_percent;
            const trend = data.trend;
            changeElement.textContent = `${changePercent > 0 ? '+' : ''}${changePercent}%`;
            changeElement.style.color = trend === 'up' ? 'var(--danger)' : trend === 'down' ? 'var(--success)' : 'var(--text)';
        }
        
        // Самая затратная категория
        const topCatEl = document.getElementById('topCategory');
        if (topCatEl && data.top_category) {
            const catName = CATEGORIES.expense[data.top_category.category] || data.top_category.category;
            topCatEl.innerHTML = `${catName} ${formatMoney(data.top_category.total)}`;
        }
        
        // Сравнение месяцев
        const comparisonEl = document.getElementById('monthComparison');
        if (comparisonEl) {
            comparisonEl.innerHTML = `
                <div>Этот месяц: ${formatMoney(data.current_month_total)}</div>
                <div>Прошлый месяц: ${formatMoney(data.previous_month_total)}</div>
            `;
        }
        
        // Показать секцию аналитики
        const analyticsSection = document.getElementById('analyticsSection');
        if (analyticsSection) {
            analyticsSection.style.display = 'block';
        }
    } catch (error) {
        console.error('Ошибка загрузки аналитики:', error);
    }
}

// Загрузить транзакции
async function loadTransactions() {
    try {
        const response = await fetch(`${API_URL}/transactions/`, {
            credentials: 'include'
        });
        const transactions = await response.json();
        displayTransactions(transactions);
    } catch (error) {
        console.error('Ошибка загрузки транзакций:', error);
        const listEl = document.getElementById('transactionsList');
        if (listEl) {
            listEl.innerHTML = '<div class="empty-state"><p>Ошибка загрузки данных</p></div>';
        }
    }
}

// Отобразить транзакции
function displayTransactions(transactions) {
    const container = document.getElementById('transactionsList');
    if (!container) return;
    
    // Фильтрация
    let filtered = transactions;
    if (currentFilter !== 'all') {
        filtered = transactions.filter(t => t.type === currentFilter);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Нет транзакций</p></div>';
        return;
    }
    
    container.innerHTML = filtered.map(transaction => {
        const categories = CATEGORIES[transaction.type];
        const categoryName = categories[transaction.category] || transaction.category_display;
        const date = new Date(transaction.date).toLocaleString('ru-RU');
        
        return `
            <div class="transaction-item" data-id="${transaction.id}">
                <div class="transaction-info">
                    <div class="transaction-category">${categoryName}</div>
                    ${transaction.description ? `<div class="transaction-description">${transaction.description}</div>` : ''}
                    <div class="transaction-date">${date}</div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'}${formatMoney(transaction.amount)}
                </div>
                <div class="transaction-actions">
                    <button class="btn-icon" onclick="editTransaction(${transaction.id})">✏️</button>
                    <button class="btn-icon" onclick="deleteTransaction(${transaction.id})">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

// Обработка отправки формы (с CSRF токеном)
async function handleFormSubmit(e) {
    e.preventDefault();
    console.log('Начинаем отправку формы...');
    
    const typeEl = document.getElementById('type');
    const categoryEl = document.getElementById('category');
    const amountEl = document.getElementById('amount');
    const dateEl = document.getElementById('date');
    const descriptionEl = document.getElementById('description');
    
    if (!typeEl || !categoryEl || !amountEl || !dateEl) {
        console.error('Не все поля формы найдены!');
        alert('Ошибка: не все поля формы найдены');
        return;
    }
    
    const data = {
        type: typeEl.value,
        category: categoryEl.value,
        amount: amountEl.value,
        date: dateEl.value,
        description: descriptionEl ? descriptionEl.value : ''
    };
    
    console.log('Данные для отправки:', data);
    
    // Получаем CSRF токен
    const csrftoken = getCookie('csrftoken');
    
    try {
        let response;
        const headers = {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken  // Добавляем CSRF токен
        };
        
        if (editingId) {
            console.log('Обновляем транзакцию:', editingId);
            response = await fetch(`${API_URL}/transactions/${editingId}/`, {
                method: 'PUT',
                headers: headers,
                credentials: 'include',
                body: JSON.stringify(data)
            });
        } else {
            console.log('Создаем новую транзакцию');
            response = await fetch(`${API_URL}/transactions/`, {
                method: 'POST',
                headers: headers,
                credentials: 'include',
                body: JSON.stringify(data)
            });
        }
        
        console.log('Ответ сервера:', response.status);
        
        if (response.ok) {
            console.log('Успешно сохранено!');
            alert('Транзакция успешно добавлена! ✅');
            
            // Очистка формы
            document.getElementById('transactionForm').reset();
            setCurrentDateTime();
            editingId = null;
            
            // Обновление данных
            await loadBalance();
            await loadAnalytics();
            await loadTransactions();
            await loadCalendar();
        } else {
            const errorData = await response.json();
            console.error('Ошибка от сервера:', errorData);
            alert('Ошибка при сохранении: ' + JSON.stringify(errorData));
        }
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        alert('Ошибка при сохранении транзакции: ' + error.message);
    }
}

// Редактирование транзакции
async function editTransaction(id) {
    try {
        const response = await fetch(`${API_URL}/transactions/${id}/`, {
            credentials: 'include'
        });
        const transaction = await response.json();
        
        document.getElementById('type').value = transaction.type;
        updateCategoryOptions(transaction.type);
        document.getElementById('category').value = transaction.category;
        document.getElementById('amount').value = transaction.amount;
        document.getElementById('date').value = new Date(transaction.date).toISOString().slice(0, 16);
        
        const descEl = document.getElementById('description');
        if (descEl) {
            descEl.value = transaction.description || '';
        }
        
        editingId = id;
        
        // Прокрутка к форме
        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Ошибка загрузки транзакции:', error);
        alert('Ошибка при загрузке транзакции');
    }
}

// Удаление транзакции
async function deleteTransaction(id) {
    if (!confirm('Вы уверены, что хотите удалить эту транзакцию?')) {
        return;
    }
    
    const csrftoken = getCookie('csrftoken');
    
    try {
        const response = await fetch(`${API_URL}/transactions/${id}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': csrftoken
            },
            credentials: 'include'
        });
        
        if (response.ok) {
            alert('Транзакция удалена! ✅');
            await loadBalance();
            await loadAnalytics();
            await loadTransactions();
            await loadCalendar();
        }
    } catch (error) {
        console.error('Ошибка удаления:', error);
        alert('Ошибка при удалении транзакции');
    }
}

// Фильтрация транзакций
async function filterTransactions(type) {
    currentFilter = type;
    await loadTransactions();
}

// Форматирование денег
function formatMoney(amount) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount) + ' ₸';
}

// ============ КАЛЕНДАРЬ ============
let currentCalendarDate = new Date();
let calendarData = {};

async function loadCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth() + 1;
    
    try {
        const response = await fetch(`${API_URL}/transactions/calendar/?year=${year}&month=${month}`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        calendarData = {};
        data.forEach(day => {
            calendarData[day.date] = day;
        });
        
        renderCalendar();
    } catch (error) {
        console.error('Ошибка загрузки календаря:', error);
    }
}

function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // Обновляем заголовок
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                       'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    document.getElementById('calendarMonthYear').textContent = `${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    
    // Заголовки дней недели
    const dayHeaders = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        grid.appendChild(header);
    });
    
    // Пустые ячейки до первого дня
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        grid.appendChild(emptyDay);
    }
    
    // Дни месяца
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayData = calendarData[dateStr];
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        
        // Проверка на сегодня
        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            dayDiv.classList.add('today');
        }
        
        // Цветовое кодирование
        if (dayData) {
            const hasIncome = dayData.total_income > 0;
            const hasExpense = dayData.total_expense > 0;
            
            if (hasIncome && hasExpense) {
                dayDiv.classList.add('has-both');
            } else if (hasIncome) {
                dayDiv.classList.add('has-income');
            } else if (hasExpense) {
                dayDiv.classList.add('has-expense');
            }
            
            dayDiv.innerHTML = `
                <div class="calendar-day-number">${day}</div>
                ${hasIncome ? `<div class="calendar-day-income">+${formatMoney(dayData.total_income)}</div>` : ''}
                ${hasExpense ? `<div class="calendar-day-expense">-${formatMoney(dayData.total_expense)}</div>` : ''}
            `;
            
            dayDiv.onclick = () => showDayDetails(dateStr, dayData);
        } else {
            dayDiv.innerHTML = `<div class="calendar-day-number">${day}</div>`;
        }
        
        grid.appendChild(dayDiv);
    }
}

function changeMonth(delta) {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + delta);
    loadCalendar();
}

function showDayDetails(date, data) {
    const modal = document.getElementById('dayModal');
    const dateObj = new Date(date);
    const dateFormatted = dateObj.toLocaleDateString('ru-RU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    document.getElementById('modalDate').textContent = dateFormatted;
    
    const container = document.getElementById('modalTransactions');
    container.innerHTML = data.transactions.map(t => {
        const categories = CATEGORIES[t.type];
        const categoryName = categories[t.category] || t.category;
        
        return `
            <div class="modal-transaction-item">
                <div>
                    <div class="transaction-category">${categoryName}</div>
                    ${t.description ? `<div class="transaction-description">${t.description}</div>` : ''}
                </div>
                <div class="transaction-amount ${t.type}">
                    ${t.type === 'income' ? '+' : '-'}${formatMoney(t.amount)}
                </div>
            </div>
        `;
    }).join('');
    
    modal.style.display = 'block';
}

function closeDayModal() {
    document.getElementById('dayModal').style.display = 'none';
}

// Закрытие модального окна при клике вне его
window.onclick = function(event) {
    const modal = document.getElementById('dayModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// Функция для получения CSRF токена из cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}