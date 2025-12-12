# MediNexus Pro+ - Требования и архитектура

## Оригинальная постановка задачи

MediNexus Pro+ — медицинская платформа нового поколения на базе Digital Twin технологий. Цель: создание единой медицинской операционной системы, где центром является Digital Twin пациента — динамический виртуальный профиль, аккумулирующий все данные о здоровье.

## Реализованный MVP (P0/P1)

### Backend (FastAPI + MongoDB)
- **Twin Core API** - ядро Digital Twin с единой схемой событий
- **Auth API** - JWT авторизация (пациент/врач)
- **Symptom AI API** - AI симптом-чекер через OpenAI GPT-4o-mini
- **Lab Flow API** - управление результатами анализов
- **Doc Hub API** - документы с AI-анализом
- **Care Plan API** - планы лечения
- **Telemed API** - записи к врачам (мок для видеозвонков)
- **Vitals API** - жизненные показатели

### Frontend (React + Tailwind + Shadcn)
- **Landing Page** - презентация платформы на русском языке
- **Auth Page** - регистрация/вход с выбором роли
- **Dashboard** - главный Digital Twin дашборд
- **Symptom Checker** - пошаговый AI-чекер симптомов
- **Documents Page** - управление медицинскими документами
- **Lab Results** - анализы с графиками динамики
- **Appointments** - записи к врачам
- **Care Plan** - планы лечения

### Технологии
- Python FastAPI + Motor (async MongoDB)
- React 19 + React Router 7
- Tailwind CSS + Shadcn/UI
- emergentintegrations (OpenAI GPT)
- Recharts для графиков
- Framer Motion для анимаций

## API Endpoints

### Auth
- `POST /api/auth/register` - регистрация
- `POST /api/auth/login` - вход
- `GET /api/auth/me` - текущий пользователь

### Twin Core
- `POST /api/v1/twin/events` - создание события
- `GET /api/v1/twin/timeline` - временная шкала
- `GET /api/v1/twin/aggregate` - агрегированные данные

### Symptoms
- `POST /api/v1/symptoms/analyze` - AI анализ симптомов
- `GET /api/v1/symptoms/history` - история проверок

### Labs
- `POST /api/v1/labs` - добавить анализ
- `GET /api/v1/labs` - список анализов
- `GET /api/v1/labs/trends/{test_name}` - динамика показателя

### Documents
- `POST /api/v1/documents` - создать документ
- `GET /api/v1/documents` - список документов
- `DELETE /api/v1/documents/{id}` - удалить

### Care Plans
- `POST /api/v1/care-plans` - создать план
- `GET /api/v1/care-plans` - список планов
- `PUT /api/v1/care-plans/{id}/status` - обновить статус

### Appointments
- `POST /api/v1/appointments` - создать запись
- `GET /api/v1/appointments` - список записей
- `PUT /api/v1/appointments/{id}/status` - обновить статус

### Vitals
- `POST /api/v1/vitals` - добавить показатель
- `GET /api/v1/vitals` - список показателей
- `GET /api/v1/vitals/latest` - последние значения

## Следующие шаги (P2+)

1. **Реальная интеграция Telemed** - Agora/WebRTC для видеозвонков
2. **Radiology AI** - анализ медицинских снимков
3. **Health Sync** - интеграция с wearables (Apple Health, Google Fit)
4. **ЕМИАС интеграция** - запись к врачам через ЕМИАС
5. **B2B панель** - white-label для клиник
6. **Telegram Mini App** - доступ через Telegram
7. **Локализация** - мультиязычность
8. **Геномика** - интеграция генетических данных

## Мок-режимы

- **Видеоконсультации**: генерируются mock-ссылки вида `https://meet.medinexus.pro/{id}`, реальный видеозвонок не реализован
