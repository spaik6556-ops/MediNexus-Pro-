# MediNexus Pro+ - Требования и архитектура

## Оригинальная постановка задачи

MediNexus Pro+ — медицинская платформа нового поколения на базе Digital Twin технологий. Цель: создание единой медицинской операционной системы, где центром является Digital Twin пациента — динамический виртуальный профиль, аккумулирующий все данные о здоровье.

## Реализованный MVP (P0/P1) + Phase 1

### Backend (FastAPI + MongoDB)

#### Ядро (MVP)
- **Twin Core API** - ядро Digital Twin с единой схемой событий
- **Auth API** - JWT авторизация (пациент/врач)
- **Symptom AI API** - AI симптом-чекер через OpenAI GPT-4o-mini
- **Lab Flow API** - управление результатами анализов
- **Doc Hub API** - документы с AI-анализом
- **Care Plan API** - планы лечения
- **Telemed API** - записи к врачам
- **Vitals API** - жизненные показатели

#### Phase 1 (Расширение)
- **Video Call API** - Agora токены для видеоконсультаций
- **Health Sync API** - синхронизация с носимыми устройствами (Apple Health, Google Fit, Fitbit, Garmin)
- **Radiology AI API** - AI-анализ медицинских снимков (КТ, МРТ, Рентген, УЗИ)
- **B2B Clinic API** - управление клиниками, врачами, статистикой
- **Notifications API** - push-уведомления и напоминания

### Frontend (React + Tailwind + Shadcn)

#### Страницы MVP
- **Landing Page** - презентация платформы
- **Auth Page** - регистрация/вход
- **Dashboard** - Digital Twin дашборд
- **Symptom Checker** - AI симптом-чекер
- **Documents Page** - документы
- **Lab Results** - анализы с графиками
- **Appointments** - записи к врачам
- **Care Plan** - планы лечения

#### Страницы Phase 1
- **Video Call Page** - интерфейс видеозвонка (Agora)
- **Health Sync Page** - подключение устройств и графики метрик
- **Radiology Page** - AI-анализ снимков с результатами
- **B2B Clinic Page** - панель управления клиникой
- **Notifications Panel** - панель уведомлений

### Технологии
- Python FastAPI + Motor (async MongoDB)
- React 19 + React Router 7
- Tailwind CSS + Shadcn/UI
- emergentintegrations (OpenAI GPT)
- agora-rtc-sdk-ng (видеозвонки)
- Recharts + Framer Motion

## Новые API Endpoints (Phase 1)

### Video Call
- `POST /api/v1/video/token` - генерация Agora токена
- `POST /api/v1/video/end/{appointment_id}` - завершение видеозвонка

### Health Sync
- `POST /api/v1/health-sync/connect` - подключение устройства
- `GET /api/v1/health-sync/devices` - список устройств
- `POST /api/v1/health-sync/data` - синхронизация данных
- `GET /api/v1/health-sync/summary` - сводка метрик

### Radiology AI
- `POST /api/v1/radiology/analyze` - AI анализ снимка
- `GET /api/v1/radiology/analyses` - история анализов

### B2B Clinic
- `POST /api/v1/b2b/clinic` - создание клиники
- `GET /api/v1/b2b/clinic` - данные клиники
- `POST /api/v1/b2b/clinic/doctors` - добавление врача
- `GET /api/v1/b2b/clinic/stats` - статистика
- `GET /api/v1/b2b/clinic/patients` - пациенты клиники

### Notifications
- `POST /api/v1/notifications/subscribe` - подписка на push
- `GET /api/v1/notifications` - список уведомлений
- `POST /api/v1/notifications` - создание уведомления
- `PUT /api/v1/notifications/{id}/read` - отметить прочитанным
- `PUT /api/v1/notifications/read-all` - прочитать все
- `GET /api/v1/notifications/unread-count` - счётчик непрочитанных

## Тесты
- Backend: 97.8%
- Frontend Core: 100%
- Frontend Phase 1: 100%
- Overall: 99.4%

## Мок-режимы (Phase 1)

- **Agora Video**: токены генерируются локально (для production нужен реальный Agora App ID/Certificate)
- **Health Sync**: симуляция данных устройств (для production нужна OAuth интеграция с каждым сервисом)
- **Push Notifications**: сохраняются в БД, не отправляются на устройства (для production нужен Firebase/APNS)

## Следующие шаги (P2+)

1. **Реальная Agora интеграция** - получить Agora App ID и Certificate
2. **OAuth для носимых устройств** - Apple Health Kit, Google Fit API
3. **Firebase Push** - реальные push-уведомления
4. **ЕМИАС интеграция** - запись к врачам через ЕМИАС
5. **Telegram Mini App** - доступ через Telegram
6. **Локализация** - английский язык
7. **Геномика** - интеграция генетических данных
8. **Stripe/ЮKassa** - платёжная система для B2B
