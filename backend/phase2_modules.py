# MediNexus Pro+ Phase 2: Billing, OAuth, FCM, Health Insights

from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from enum import Enum
import os
import uuid
import logging

from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, 
    CheckoutSessionResponse, 
    CheckoutStatusResponse, 
    CheckoutSessionRequest
)

logger = logging.getLogger(__name__)

# ==================== BILLING CONFIG ====================
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

# Predefined B2B Subscription Plans (amounts in USD)
SUBSCRIPTION_PLANS = {
    "starter": {
        "id": "starter",
        "name": "Стартовый",
        "name_en": "Starter",
        "price": 99.00,
        "currency": "usd",
        "features": [
            "До 5 врачей",
            "До 100 пациентов/месяц",
            "Базовая аналитика",
            "Email поддержка"
        ],
        "limits": {
            "doctors": 5,
            "patients_per_month": 100,
            "video_minutes": 500
        }
    },
    "professional": {
        "id": "professional",
        "name": "Профессиональный",
        "name_en": "Professional",
        "price": 299.00,
        "currency": "usd",
        "features": [
            "До 20 врачей",
            "До 500 пациентов/месяц",
            "Расширенная аналитика",
            "AI-инсайты",
            "Приоритетная поддержка"
        ],
        "limits": {
            "doctors": 20,
            "patients_per_month": 500,
            "video_minutes": 2000
        },
        "popular": True
    },
    "enterprise": {
        "id": "enterprise",
        "name": "Корпоративный",
        "name_en": "Enterprise",
        "price": 799.00,
        "currency": "usd",
        "features": [
            "Неограниченно врачей",
            "Неограниченно пациентов",
            "Полная аналитика",
            "AI-инсайты + Radiology AI",
            "Выделенный менеджер",
            "SLA 99.9%",
            "Кастомизация"
        ],
        "limits": {
            "doctors": -1,  # unlimited
            "patients_per_month": -1,
            "video_minutes": -1
        }
    }
}

# ==================== MODELS ====================
class SubscriptionPlan(BaseModel):
    id: str
    name: str
    name_en: str
    price: float
    currency: str
    features: List[str]
    limits: Dict[str, int]
    popular: bool = False

class CheckoutRequest(BaseModel):
    plan_id: str
    origin_url: str

class CheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str

class SubscriptionStatus(BaseModel):
    clinic_id: str
    plan_id: Optional[str]
    plan_name: Optional[str]
    status: str  # active, cancelled, past_due, trialing
    current_period_end: Optional[str]
    features: List[str]

class PaymentTransaction(BaseModel):
    id: str
    clinic_id: str
    plan_id: str
    amount: float
    currency: str
    session_id: str
    status: str  # initiated, paid, failed, expired
    created_at: str
    completed_at: Optional[str] = None

# ==================== BILLING ROUTER ====================
billing_router = APIRouter(prefix="/api/v1/billing", tags=["billing"])

@billing_router.get("/plans", response_model=List[SubscriptionPlan])
async def get_subscription_plans():
    """Get available B2B subscription plans"""
    return [SubscriptionPlan(**plan) for plan in SUBSCRIPTION_PLANS.values()]

@billing_router.get("/plans/{plan_id}", response_model=SubscriptionPlan)
async def get_plan(plan_id: str):
    """Get specific plan details"""
    if plan_id not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=404, detail="Plan not found")
    return SubscriptionPlan(**SUBSCRIPTION_PLANS[plan_id])

@billing_router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout_session(
    request: CheckoutRequest,
    http_request: Request,
    db = None  # Will be injected
):
    """Create Stripe checkout session for B2B subscription"""
    # Validate plan
    if request.plan_id not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")
    
    plan = SUBSCRIPTION_PLANS[request.plan_id]
    
    # Build URLs from origin
    success_url = f"{request.origin_url}/b2b/billing/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{request.origin_url}/b2b/billing"
    
    # Initialize Stripe
    webhook_url = f"{str(http_request.base_url)}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    # Create checkout request
    checkout_req = CheckoutSessionRequest(
        amount=plan["price"],
        currency=plan["currency"],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "plan_id": request.plan_id,
            "plan_name": plan["name"],
            "type": "b2b_subscription"
        }
    )
    
    # Create session
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_req)
    
    return CheckoutResponse(
        checkout_url=session.url,
        session_id=session.session_id
    )

@billing_router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, http_request: Request):
    """Get checkout session status"""
    webhook_url = f"{str(http_request.base_url)}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
    
    return {
        "session_id": session_id,
        "status": status.status,
        "payment_status": status.payment_status,
        "amount": status.amount_total / 100,  # Convert cents to dollars
        "currency": status.currency,
        "metadata": status.metadata
    }

# ==================== HEALTH OAUTH CONFIG ====================
# OAuth configuration for Apple Health and Google Fit
HEALTH_OAUTH_CONFIG = {
    "apple_health": {
        "name": "Apple Health",
        "auth_url": "https://appleid.apple.com/auth/authorize",
        "token_url": "https://appleid.apple.com/auth/token",
        "scopes": ["healthkit.read"],
        "client_id": os.environ.get("APPLE_CLIENT_ID", ""),
        "client_secret": os.environ.get("APPLE_CLIENT_SECRET", ""),
        "redirect_uri_path": "/api/v1/health-oauth/apple/callback"
    },
    "google_fit": {
        "name": "Google Fit",
        "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "scopes": [
            "https://www.googleapis.com/auth/fitness.activity.read",
            "https://www.googleapis.com/auth/fitness.heart_rate.read",
            "https://www.googleapis.com/auth/fitness.sleep.read",
            "https://www.googleapis.com/auth/fitness.body.read"
        ],
        "client_id": os.environ.get("GOOGLE_CLIENT_ID", ""),
        "client_secret": os.environ.get("GOOGLE_CLIENT_SECRET", ""),
        "redirect_uri_path": "/api/v1/health-oauth/google/callback"
    }
}

# ==================== HEALTH OAUTH ROUTER ====================
health_oauth_router = APIRouter(prefix="/api/v1/health-oauth", tags=["health-oauth"])

class OAuthInitRequest(BaseModel):
    provider: str  # apple_health, google_fit
    origin_url: str

class OAuthInitResponse(BaseModel):
    auth_url: str
    state: str

@health_oauth_router.post("/init", response_model=OAuthInitResponse)
async def init_health_oauth(request: OAuthInitRequest):
    """Initialize OAuth flow for health data providers"""
    if request.provider not in HEALTH_OAUTH_CONFIG:
        raise HTTPException(status_code=400, detail="Invalid provider")
    
    config = HEALTH_OAUTH_CONFIG[request.provider]
    state = str(uuid.uuid4())
    
    # Build redirect URI
    redirect_uri = f"{request.origin_url}{config['redirect_uri_path']}"
    
    # Build authorization URL
    scopes = " ".join(config["scopes"]) if request.provider == "google_fit" else ",".join(config["scopes"])
    
    if request.provider == "google_fit":
        auth_url = (
            f"{config['auth_url']}?"
            f"client_id={config['client_id']}&"
            f"redirect_uri={redirect_uri}&"
            f"response_type=code&"
            f"scope={scopes}&"
            f"state={state}&"
            f"access_type=offline&"
            f"prompt=consent"
        )
    else:  # Apple
        auth_url = (
            f"{config['auth_url']}?"
            f"client_id={config['client_id']}&"
            f"redirect_uri={redirect_uri}&"
            f"response_type=code&"
            f"scope={scopes}&"
            f"state={state}&"
            f"response_mode=form_post"
        )
    
    return OAuthInitResponse(auth_url=auth_url, state=state)

@health_oauth_router.get("/providers")
async def get_health_providers():
    """Get available health data providers"""
    providers = []
    for key, config in HEALTH_OAUTH_CONFIG.items():
        providers.append({
            "id": key,
            "name": config["name"],
            "configured": bool(config["client_id"])
        })
    return providers

# ==================== FCM NOTIFICATIONS ====================
# Firebase Cloud Messaging configuration
FCM_CONFIG = {
    "server_key": os.environ.get("FCM_SERVER_KEY", ""),
    "project_id": os.environ.get("FIREBASE_PROJECT_ID", "medinexus-pro")
}

class FCMToken(BaseModel):
    token: str
    device_type: str  # web, ios, android
    device_name: Optional[str] = None

class FCMNotification(BaseModel):
    title: str
    body: str
    data: Optional[Dict[str, str]] = None
    icon: Optional[str] = None

fcm_router = APIRouter(prefix="/api/v1/fcm", tags=["fcm"])

@fcm_router.post("/register")
async def register_fcm_token(token_data: FCMToken, user_id: str = None):
    """Register FCM token for push notifications"""
    # In production, save to database
    return {
        "status": "registered",
        "token_preview": token_data.token[:20] + "...",
        "device_type": token_data.device_type
    }

@fcm_router.post("/send")
async def send_push_notification(notification: FCMNotification, target_user_id: str):
    """Send push notification to user (admin only)"""
    # In production, use firebase-admin to send
    return {
        "status": "sent",
        "title": notification.title,
        "target": target_user_id
    }

# ==================== TDD: AI HEALTH INSIGHTS ====================
"""
# Technical Design Document: AI Health Insights Module

## 1. Overview
AI Health Insights analyzes patient's aggregated health data from Digital Twin 
to generate personalized recommendations, risk assessments, and actionable insights.

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      AI Health Insights                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ Data Layer   │───▶│ Analysis     │───▶│ Presentation │      │
│  │              │    │ Engine       │    │ Layer        │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ Twin Core    │    │ GPT-4o-mini  │    │ React UI     │      │
│  │ Health Sync  │    │ Prompt Eng.  │    │ Dashboard    │      │
│  │ Lab Flow     │    │ RAG (future) │    │ Notifications│      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

## 3. Data Sources
- Vitals (heart_rate, blood_pressure, temperature, oxygen_saturation)
- Lab Results (all biomarkers with trends)
- Symptoms history (from Symptom AI)
- Activity data (steps, sleep, calories from Health Sync)
- Medications (from Care Plans)
- Demographics (age, gender, chronic conditions)

## 4. Analysis Types

### 4.1 Daily Health Score (0-100)
Calculated from:
- Vitals deviation from personal baseline: 40%
- Activity goals achievement: 25%
- Sleep quality: 20%
- Medication adherence: 15%

### 4.2 Risk Assessments
- Cardiovascular risk (based on BP, HR, cholesterol, activity)
- Diabetes risk (glucose trends, weight, activity)
- Sleep disorder indicators
- Stress level estimation

### 4.3 Personalized Recommendations
Categories:
- Lifestyle (exercise, diet, sleep)
- Monitoring (which metrics to track)
- Prevention (screenings, vaccinations)
- Alerts (abnormal trends)

## 5. API Endpoints

### GET /api/v1/insights/daily
Returns daily health score and key metrics summary.

### GET /api/v1/insights/weekly-report
Returns comprehensive weekly analysis with trends.

### GET /api/v1/insights/risks
Returns calculated risk assessments.

### GET /api/v1/insights/recommendations
Returns personalized AI recommendations.

### POST /api/v1/insights/ask
Interactive Q&A about health data.

## 6. AI Prompts

### 6.1 Daily Score Prompt
```
You are a health analytics AI. Analyze the patient's data and calculate a health score (0-100).

Patient Data:
- Age: {age}, Gender: {gender}
- Today's vitals: HR {hr} bpm, BP {bp}, SpO2 {spo2}%
- Steps: {steps}, Sleep: {sleep} hours
- Active medications: {medications}

Calculate score based on:
1. Vitals within normal range (40 points)
2. Activity goal achievement (25 points)
3. Sleep quality (20 points)  
4. Overall trend (15 points)

Return JSON: {"score": int, "factors": [...], "highlight": "string"}
```

### 6.2 Recommendations Prompt
```
You are a preventive medicine AI assistant. Based on the patient's profile and health data trends, 
provide personalized recommendations.

Patient Profile:
{profile_json}

Recent Health Data (30 days):
{health_data_json}

Generate 3-5 actionable recommendations in categories:
- Lifestyle changes
- Metrics to monitor
- Preventive actions

Return JSON array with: 
[{"category": str, "title": str, "description": str, "priority": "high|medium|low", "action_type": str}]
```

### 6.3 Risk Assessment Prompt
```
You are a clinical decision support AI. Analyze health data for risk factors.

Patient: {age} y/o {gender}
Medical history: {conditions}
Family history: {family_history}

Recent metrics (30-day averages):
- Blood pressure: {avg_bp}
- Heart rate: {avg_hr}
- Cholesterol: {cholesterol}
- Glucose: {glucose}
- BMI: {bmi}
- Activity level: {activity}

Assess risks for:
1. Cardiovascular disease (ASCVD-like scoring)
2. Type 2 diabetes
3. Hypertension progression

Return JSON: {"risks": [{"name": str, "level": "low|moderate|high", "score": float, "factors": [...]}]}
```

## 7. Implementation Notes

### 7.1 Data Aggregation
- Use MongoDB aggregation pipelines for efficient data collection
- Cache daily scores with TTL of 1 hour
- Pre-compute weekly reports on Sunday nights

### 7.2 AI Model Selection
- Primary: GPT-4o-mini (fast, cost-effective)
- Complex cases: GPT-4o (higher accuracy)
- Future: Fine-tuned model on medical data

### 7.3 Safety & Compliance
- All outputs include medical disclaimer
- No diagnosis - only risk indicators
- Severity thresholds trigger doctor notification
- Full audit logging for compliance

## 8. Database Schema

```javascript
// insights collection
{
  "_id": ObjectId,
  "patient_id": string,
  "date": ISODate,
  "type": "daily_score" | "weekly_report" | "risk_assessment",
  "data": {
    "score": number,
    "factors": [...],
    "recommendations": [...],
    "risks": [...]
  },
  "ai_model": string,
  "created_at": ISODate
}
```

## 9. Timeline
- Week 1: Data aggregation layer
- Week 2: AI prompts & scoring logic
- Week 3: API endpoints & testing
- Week 4: UI integration & polish
"""

# Health Insights Models
class DailyHealthScore(BaseModel):
    score: int = Field(..., ge=0, le=100)
    date: str
    factors: List[Dict[str, Any]]
    highlight: str
    trend: str  # improving, stable, declining

class RiskAssessment(BaseModel):
    name: str
    level: str  # low, moderate, high
    score: float
    factors: List[str]
    recommendation: str

class HealthRecommendation(BaseModel):
    category: str
    title: str
    description: str
    priority: str
    action_type: str

class WeeklyReport(BaseModel):
    week_start: str
    week_end: str
    avg_score: float
    score_trend: List[Dict[str, Any]]
    key_insights: List[str]
    recommendations: List[HealthRecommendation]

# Health Insights Router
insights_router = APIRouter(prefix="/api/v1/insights", tags=["health-insights"])

@insights_router.get("/daily", response_model=DailyHealthScore)
async def get_daily_health_score(user_id: str = None):
    """Get today's health score with AI analysis"""
    # Mock implementation - in production, aggregate data and call AI
    return DailyHealthScore(
        score=78,
        date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        factors=[
            {"name": "Пульс в норме", "contribution": 15, "status": "good"},
            {"name": "Цель по шагам выполнена на 85%", "contribution": 12, "status": "good"},
            {"name": "Сон 6.5 часов (ниже нормы)", "contribution": -5, "status": "warning"},
            {"name": "Артериальное давление стабильно", "contribution": 10, "status": "good"}
        ],
        highlight="Отличная активность сегодня! Рекомендуем увеличить время сна на 30-60 минут.",
        trend="improving"
    )

@insights_router.get("/risks", response_model=List[RiskAssessment])
async def get_risk_assessments(user_id: str = None):
    """Get personalized risk assessments"""
    return [
        RiskAssessment(
            name="Сердечно-сосудистые заболевания",
            level="low",
            score=12.5,
            factors=["Нормальное давление", "Активный образ жизни", "Некурящий"],
            recommendation="Продолжайте поддерживать активный образ жизни"
        ),
        RiskAssessment(
            name="Диабет 2 типа",
            level="moderate",
            score=28.0,
            factors=["Глюкоза на верхней границе нормы", "Семейная история"],
            recommendation="Рекомендуется контроль глюкозы раз в 3 месяца"
        )
    ]

@insights_router.get("/recommendations", response_model=List[HealthRecommendation])
async def get_recommendations(user_id: str = None):
    """Get AI-powered health recommendations"""
    return [
        HealthRecommendation(
            category="lifestyle",
            title="Увеличьте время сна",
            description="Ваш средний сон за неделю 6.2 часа. Для оптимального здоровья рекомендуется 7-8 часов.",
            priority="high",
            action_type="habit_change"
        ),
        HealthRecommendation(
            category="monitoring",
            title="Отслеживайте уровень глюкозы",
            description="Последние показатели на верхней границе нормы. Рекомендуем проверять раз в неделю.",
            priority="medium",
            action_type="tracking"
        ),
        HealthRecommendation(
            category="prevention",
            title="Запланируйте профилактический осмотр",
            description="Прошло более 6 месяцев с последнего визита к терапевту.",
            priority="medium",
            action_type="appointment"
        )
    ]

@insights_router.get("/weekly-report", response_model=WeeklyReport)
async def get_weekly_report(user_id: str = None):
    """Get comprehensive weekly health report"""
    today = datetime.now(timezone.utc)
    week_start = today - timedelta(days=7)
    
    return WeeklyReport(
        week_start=week_start.strftime("%Y-%m-%d"),
        week_end=today.strftime("%Y-%m-%d"),
        avg_score=75.4,
        score_trend=[
            {"date": (today - timedelta(days=6)).strftime("%Y-%m-%d"), "score": 72},
            {"date": (today - timedelta(days=5)).strftime("%Y-%m-%d"), "score": 74},
            {"date": (today - timedelta(days=4)).strftime("%Y-%m-%d"), "score": 76},
            {"date": (today - timedelta(days=3)).strftime("%Y-%m-%d"), "score": 73},
            {"date": (today - timedelta(days=2)).strftime("%Y-%m-%d"), "score": 78},
            {"date": (today - timedelta(days=1)).strftime("%Y-%m-%d"), "score": 77},
            {"date": today.strftime("%Y-%m-%d"), "score": 78}
        ],
        key_insights=[
            "Ваш пульс стабилен и в пределах нормы",
            "Активность выросла на 15% по сравнению с прошлой неделей",
            "Качество сна требует внимания"
        ],
        recommendations=[
            HealthRecommendation(
                category="lifestyle",
                title="Улучшите режим сна",
                description="Ложитесь спать в одно время. Избегайте экранов за час до сна.",
                priority="high",
                action_type="habit_change"
            )
        ]
    )


# Export all routers
def register_phase2_routes(app):
    """Register all Phase 2 routes"""
    app.include_router(billing_router)
    app.include_router(health_oauth_router)
    app.include_router(fcm_router)
    app.include_router(insights_router)
