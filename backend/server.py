from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from enum import Enum
from emergentintegrations.llm.chat import LlmChat, UserMessage
import hashlib
import time
import base64

# Agora Token Builder (simplified implementation)
def build_agora_token(app_id: str, app_cert: str, channel: str, uid: int, expire_seconds: int = 3600) -> str:
    """Generate Agora RTC token for video calls"""
    timestamp = int(time.time()) + expire_seconds
    info = f"{app_id}{channel}{uid}{timestamp}"
    signature = hashlib.sha256(f"{info}{app_cert}".encode()).hexdigest()[:32]
    token_data = f"{app_id}:{channel}:{uid}:{timestamp}:{signature}"
    return base64.b64encode(token_data.encode()).decode()

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'medinexus-pro-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

app = FastAPI(title="MediNexus Pro+ API", version="1.0.0")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ==================== ENUMS ====================
class UserRole(str, Enum):
    PATIENT = "patient"
    DOCTOR = "doctor"
    ADMIN = "admin"

class EventType(str, Enum):
    SYMPTOM = "symptom"
    LAB_RESULT = "lab_result"
    IMAGING = "imaging"
    DIAGNOSIS = "diagnosis"
    TREATMENT = "treatment"
    MEDICATION = "medication"
    OBSERVATION = "observation"
    CONSULTATION = "consultation"
    VITAL = "vital"
    DOCUMENT = "document"

class SourceModule(str, Enum):
    SYMPTOM_AI = "symptom_ai"
    DOC_HUB = "doc_hub"
    RADIOLOGY_AI = "radiology_ai"
    LAB_FLOW = "lab_flow"
    CARE_PLAN = "care_plan"
    TELEMED = "telemed"
    HEALTH_SYNC = "health_sync"
    CARE_TEAM = "care_team"
    MANUAL = "manual"

class TriageLevel(str, Enum):
    EMERGENCY = "emergency"
    URGENT = "urgent"
    STANDARD = "standard"
    ROUTINE = "routine"

class AppointmentStatus(str, Enum):
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# ==================== MODELS ====================
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.PATIENT
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    specialty: Optional[str] = None  # For doctors

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    specialty: Optional[str] = None
    created_at: str
    avatar_url: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Twin Event Models
class TwinEventCreate(BaseModel):
    event_type: EventType
    source_module: SourceModule
    data_payload: Dict[str, Any]
    clinical_confidence: Optional[float] = None
    access_scope: Optional[List[str]] = None

class TwinEvent(BaseModel):
    event_id: str
    patient_id: str
    timestamp: str
    event_type: EventType
    source_module: SourceModule
    data_payload: Dict[str, Any]
    clinical_confidence: Optional[float] = None
    access_scope: Optional[List[str]] = None

# Symptom Checker Models
class SymptomInput(BaseModel):
    symptoms: List[str]
    duration: Optional[str] = None
    severity: Optional[str] = None
    additional_info: Optional[str] = None

class SymptomAnalysis(BaseModel):
    session_id: str
    triage_level: TriageLevel
    possible_conditions: List[Dict[str, Any]]
    recommendations: List[str]
    follow_up_questions: List[str]
    disclaimer: str

# Lab Result Models
class LabResultCreate(BaseModel):
    test_name: str
    value: float
    unit: str
    reference_range: Optional[str] = None
    test_date: Optional[str] = None
    lab_name: Optional[str] = None
    notes: Optional[str] = None

class LabResult(BaseModel):
    id: str
    patient_id: str
    test_name: str
    value: float
    unit: str
    reference_range: Optional[str] = None
    test_date: str
    lab_name: Optional[str] = None
    notes: Optional[str] = None
    status: str  # normal, high, low, critical
    created_at: str

# Document Models
class DocumentCreate(BaseModel):
    title: str
    document_type: str  # lab_report, imaging, prescription, etc.
    description: Optional[str] = None
    file_url: Optional[str] = None

class Document(BaseModel):
    id: str
    patient_id: str
    title: str
    document_type: str
    description: Optional[str] = None
    file_url: Optional[str] = None
    ai_summary: Optional[str] = None
    created_at: str

# Care Plan Models
class CarePlanCreate(BaseModel):
    title: str
    description: str
    goals: List[str]
    medications: Optional[List[Dict[str, Any]]] = None
    lifestyle_recommendations: Optional[List[str]] = None
    follow_up_date: Optional[str] = None

class CarePlan(BaseModel):
    id: str
    patient_id: str
    doctor_id: Optional[str] = None
    title: str
    description: str
    goals: List[str]
    medications: Optional[List[Dict[str, Any]]] = None
    lifestyle_recommendations: Optional[List[str]] = None
    follow_up_date: Optional[str] = None
    status: str  # active, completed, cancelled
    created_at: str
    updated_at: str

# Appointment Models
class AppointmentCreate(BaseModel):
    doctor_id: str
    appointment_date: str
    appointment_type: str  # video, in_person
    reason: Optional[str] = None
    notes: Optional[str] = None

class Appointment(BaseModel):
    id: str
    patient_id: str
    doctor_id: str
    doctor_name: Optional[str] = None
    appointment_date: str
    appointment_type: str
    status: AppointmentStatus
    reason: Optional[str] = None
    notes: Optional[str] = None
    meeting_link: Optional[str] = None
    created_at: str

# Vitals Models
class VitalCreate(BaseModel):
    vital_type: str  # heart_rate, blood_pressure, temperature, weight, etc.
    value: str
    unit: str
    measured_at: Optional[str] = None

class Vital(BaseModel):
    id: str
    patient_id: str
    vital_type: str
    value: str
    unit: str
    measured_at: str
    source: str  # manual, device
    created_at: str

# ==================== HELPERS ====================
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def determine_lab_status(value: float, reference_range: Optional[str]) -> str:
    if not reference_range:
        return "normal"
    try:
        parts = reference_range.replace(" ", "").split("-")
        if len(parts) == 2:
            low, high = float(parts[0]), float(parts[1])
            if value < low * 0.7 or value > high * 1.5:
                return "critical"
            elif value < low:
                return "low"
            elif value > high:
                return "high"
        return "normal"
    except:
        return "normal"

# ==================== AUTH ENDPOINTS ====================
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "full_name": user_data.full_name,
        "role": user_data.role.value,
        "phone": user_data.phone,
        "date_of_birth": user_data.date_of_birth,
        "gender": user_data.gender,
        "specialty": user_data.specialty,
        "created_at": now,
        "avatar_url": None
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user_data.role.value)
    user_response = UserResponse(
        id=user_id,
        email=user_data.email,
        full_name=user_data.full_name,
        role=user_data.role,
        phone=user_data.phone,
        date_of_birth=user_data.date_of_birth,
        gender=user_data.gender,
        specialty=user_data.specialty,
        created_at=now,
        avatar_url=None
    )
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["role"])
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        role=UserRole(user["role"]),
        phone=user.get("phone"),
        date_of_birth=user.get("date_of_birth"),
        gender=user.get("gender"),
        specialty=user.get("specialty"),
        created_at=user["created_at"],
        avatar_url=user.get("avatar_url")
    )
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(**current_user)

@api_router.put("/auth/profile", response_model=UserResponse)
async def update_profile(
    full_name: Optional[str] = None,
    phone: Optional[str] = None,
    date_of_birth: Optional[str] = None,
    gender: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    updates = {}
    if full_name: updates["full_name"] = full_name
    if phone: updates["phone"] = phone
    if date_of_birth: updates["date_of_birth"] = date_of_birth
    if gender: updates["gender"] = gender
    
    if updates:
        await db.users.update_one({"id": current_user["id"]}, {"$set": updates})
    
    updated = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "password": 0})
    return UserResponse(**updated)

# ==================== TWIN CORE ENDPOINTS ====================
@api_router.post("/v1/twin/events", response_model=TwinEvent)
async def create_twin_event(
    event_data: TwinEventCreate,
    current_user: dict = Depends(get_current_user)
):
    event_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    event_doc = {
        "event_id": event_id,
        "patient_id": current_user["id"],
        "timestamp": now,
        "event_type": event_data.event_type.value,
        "source_module": event_data.source_module.value,
        "data_payload": event_data.data_payload,
        "clinical_confidence": event_data.clinical_confidence,
        "access_scope": event_data.access_scope or ["patient"]
    }
    
    await db.twin_events.insert_one(event_doc)
    return TwinEvent(**event_doc)

@api_router.get("/v1/twin/timeline", response_model=List[TwinEvent])
async def get_twin_timeline(
    event_type: Optional[str] = None,
    source_module: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    query = {"patient_id": current_user["id"]}
    
    if event_type:
        query["event_type"] = event_type
    if source_module:
        query["source_module"] = source_module
    if start_date:
        query["timestamp"] = {"$gte": start_date}
    if end_date:
        query.setdefault("timestamp", {})["$lte"] = end_date
    
    events = await db.twin_events.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    return [TwinEvent(**e) for e in events]

@api_router.get("/v1/twin/aggregate")
async def get_twin_aggregate(current_user: dict = Depends(get_current_user)):
    patient_id = current_user["id"]
    
    # Get latest vitals
    latest_vitals = {}
    vital_types = ["heart_rate", "blood_pressure", "temperature", "weight", "oxygen_saturation"]
    for vtype in vital_types:
        vital = await db.vitals.find_one(
            {"patient_id": patient_id, "vital_type": vtype},
            {"_id": 0},
            sort=[("measured_at", -1)]
        )
        if vital:
            latest_vitals[vtype] = vital
    
    # Get active care plans count
    active_plans = await db.care_plans.count_documents({"patient_id": patient_id, "status": "active"})
    
    # Get upcoming appointments
    now = datetime.now(timezone.utc).isoformat()
    upcoming_appointments = await db.appointments.count_documents({
        "patient_id": patient_id,
        "appointment_date": {"$gte": now},
        "status": {"$in": ["scheduled", "confirmed"]}
    })
    
    # Get recent lab results count
    recent_labs = await db.lab_results.count_documents({
        "patient_id": patient_id,
        "created_at": {"$gte": (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()}
    })
    
    # Get documents count
    documents_count = await db.documents.count_documents({"patient_id": patient_id})
    
    return {
        "patient_id": patient_id,
        "latest_vitals": latest_vitals,
        "active_care_plans": active_plans,
        "upcoming_appointments": upcoming_appointments,
        "recent_lab_results": recent_labs,
        "total_documents": documents_count,
        "last_updated": datetime.now(timezone.utc).isoformat()
    }

# ==================== SYMPTOM AI ENDPOINTS ====================
@api_router.post("/v1/symptoms/analyze", response_model=SymptomAnalysis)
async def analyze_symptoms(
    symptom_input: SymptomInput,
    current_user: dict = Depends(get_current_user)
):
    session_id = str(uuid.uuid4())
    
    # Build prompt for AI
    symptoms_text = ", ".join(symptom_input.symptoms)
    prompt = f"""Analyze the following symptoms and provide a medical assessment.

Symptoms: {symptoms_text}
Duration: {symptom_input.duration or 'Not specified'}
Severity: {symptom_input.severity or 'Not specified'}
Additional info: {symptom_input.additional_info or 'None'}

Provide your response in the following JSON format:
{{
    "triage_level": "emergency|urgent|standard|routine",
    "possible_conditions": [
        {{"name": "condition name", "probability": "high|medium|low", "description": "brief description"}}
    ],
    "recommendations": ["recommendation 1", "recommendation 2"],
    "follow_up_questions": ["question 1", "question 2"]
}}

Important: This is for informational purposes only. Always recommend consulting a healthcare professional."""

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message="You are a medical AI assistant. Provide helpful health information while always recommending professional medical consultation. Respond in JSON format only."
        ).with_model("openai", "gpt-4o-mini")
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        # Parse AI response
        import json
        try:
            # Clean response and parse JSON
            response_text = response.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            ai_result = json.loads(response_text.strip())
        except:
            ai_result = {
                "triage_level": "standard",
                "possible_conditions": [{"name": "Assessment pending", "probability": "medium", "description": "Please consult a healthcare professional for accurate diagnosis."}],
                "recommendations": ["Consult a healthcare professional", "Monitor your symptoms"],
                "follow_up_questions": ["How long have you had these symptoms?", "Are symptoms getting worse?"]
            }
    except Exception as e:
        logging.error(f"AI analysis error: {e}")
        ai_result = {
            "triage_level": "standard",
            "possible_conditions": [{"name": "Unable to analyze", "probability": "unknown", "description": "Please consult a healthcare professional."}],
            "recommendations": ["Seek medical advice", "If symptoms are severe, visit emergency services"],
            "follow_up_questions": []
        }
    
    # Save to twin events
    event_doc = {
        "event_id": str(uuid.uuid4()),
        "patient_id": current_user["id"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": EventType.SYMPTOM.value,
        "source_module": SourceModule.SYMPTOM_AI.value,
        "data_payload": {
            "session_id": session_id,
            "input": symptom_input.model_dump(),
            "analysis": ai_result
        },
        "clinical_confidence": 0.7,
        "access_scope": ["patient", "primary_doctor"]
    }
    await db.twin_events.insert_one(event_doc)
    
    return SymptomAnalysis(
        session_id=session_id,
        triage_level=TriageLevel(ai_result.get("triage_level", "standard")),
        possible_conditions=ai_result.get("possible_conditions", []),
        recommendations=ai_result.get("recommendations", []),
        follow_up_questions=ai_result.get("follow_up_questions", []),
        disclaimer="This information is for educational purposes only and should not replace professional medical advice. Please consult a healthcare provider for proper diagnosis and treatment."
    )

@api_router.get("/v1/symptoms/history")
async def get_symptom_history(
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    events = await db.twin_events.find(
        {"patient_id": current_user["id"], "event_type": EventType.SYMPTOM.value},
        {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    return events

# ==================== LAB RESULTS ENDPOINTS ====================
@api_router.post("/v1/labs", response_model=LabResult)
async def create_lab_result(
    lab_data: LabResultCreate,
    current_user: dict = Depends(get_current_user)
):
    lab_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    test_date = lab_data.test_date or now
    
    status = determine_lab_status(lab_data.value, lab_data.reference_range)
    
    lab_doc = {
        "id": lab_id,
        "patient_id": current_user["id"],
        "test_name": lab_data.test_name,
        "value": lab_data.value,
        "unit": lab_data.unit,
        "reference_range": lab_data.reference_range,
        "test_date": test_date,
        "lab_name": lab_data.lab_name,
        "notes": lab_data.notes,
        "status": status,
        "created_at": now
    }
    
    await db.lab_results.insert_one(lab_doc)
    
    # Add to twin events (create clean copy without _id)
    clean_lab_doc = {k: v for k, v in lab_doc.items() if k != '_id'}
    event_doc = {
        "event_id": str(uuid.uuid4()),
        "patient_id": current_user["id"],
        "timestamp": now,
        "event_type": EventType.LAB_RESULT.value,
        "source_module": SourceModule.LAB_FLOW.value,
        "data_payload": clean_lab_doc,
        "clinical_confidence": 1.0,
        "access_scope": ["patient", "primary_doctor"]
    }
    await db.twin_events.insert_one(event_doc)
    
    return LabResult(**lab_doc)

@api_router.get("/v1/labs", response_model=List[LabResult])
async def get_lab_results(
    test_name: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    query = {"patient_id": current_user["id"]}
    if test_name:
        query["test_name"] = {"$regex": test_name, "$options": "i"}
    
    labs = await db.lab_results.find(query, {"_id": 0}).sort("test_date", -1).limit(limit).to_list(limit)
    return [LabResult(**lab) for lab in labs]

@api_router.get("/v1/labs/trends/{test_name}")
async def get_lab_trends(
    test_name: str,
    current_user: dict = Depends(get_current_user)
):
    labs = await db.lab_results.find(
        {"patient_id": current_user["id"], "test_name": {"$regex": test_name, "$options": "i"}},
        {"_id": 0}
    ).sort("test_date", 1).to_list(100)
    
    return {
        "test_name": test_name,
        "data_points": [{"date": lab["test_date"], "value": lab["value"], "status": lab["status"]} for lab in labs],
        "total_count": len(labs)
    }

# ==================== DOCUMENTS ENDPOINTS ====================
@api_router.post("/v1/documents", response_model=Document)
async def create_document(
    doc_data: DocumentCreate,
    current_user: dict = Depends(get_current_user)
):
    doc_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Generate AI summary if we have content
    ai_summary = None
    if doc_data.description and EMERGENT_LLM_KEY:
        try:
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"doc-{doc_id}",
                system_message="You are a medical document analyst. Provide brief, clear summaries of medical documents."
            ).with_model("openai", "gpt-4o-mini")
            
            summary_response = await chat.send_message(
                UserMessage(text=f"Summarize this medical document in 2-3 sentences:\n\nType: {doc_data.document_type}\nTitle: {doc_data.title}\nContent: {doc_data.description}")
            )
            ai_summary = summary_response.strip()
        except:
            pass
    
    doc_doc = {
        "id": doc_id,
        "patient_id": current_user["id"],
        "title": doc_data.title,
        "document_type": doc_data.document_type,
        "description": doc_data.description,
        "file_url": doc_data.file_url,
        "ai_summary": ai_summary,
        "created_at": now
    }
    
    await db.documents.insert_one(doc_doc)
    
    # Add to twin events
    event_doc = {
        "event_id": str(uuid.uuid4()),
        "patient_id": current_user["id"],
        "timestamp": now,
        "event_type": EventType.DOCUMENT.value,
        "source_module": SourceModule.DOC_HUB.value,
        "data_payload": {"document_id": doc_id, "title": doc_data.title, "type": doc_data.document_type},
        "clinical_confidence": None,
        "access_scope": ["patient", "primary_doctor"]
    }
    await db.twin_events.insert_one(event_doc)
    
    return Document(**doc_doc)

@api_router.get("/v1/documents", response_model=List[Document])
async def get_documents(
    document_type: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    query = {"patient_id": current_user["id"]}
    if document_type:
        query["document_type"] = document_type
    
    docs = await db.documents.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return [Document(**doc) for doc in docs]

@api_router.delete("/v1/documents/{doc_id}")
async def delete_document(doc_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.documents.delete_one({"id": doc_id, "patient_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"status": "deleted"}

# ==================== CARE PLAN ENDPOINTS ====================
@api_router.post("/v1/care-plans", response_model=CarePlan)
async def create_care_plan(
    plan_data: CarePlanCreate,
    current_user: dict = Depends(get_current_user)
):
    plan_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    plan_doc = {
        "id": plan_id,
        "patient_id": current_user["id"],
        "doctor_id": None,
        "title": plan_data.title,
        "description": plan_data.description,
        "goals": plan_data.goals,
        "medications": plan_data.medications,
        "lifestyle_recommendations": plan_data.lifestyle_recommendations,
        "follow_up_date": plan_data.follow_up_date,
        "status": "active",
        "created_at": now,
        "updated_at": now
    }
    
    await db.care_plans.insert_one(plan_doc)
    
    # Add to twin events
    event_doc = {
        "event_id": str(uuid.uuid4()),
        "patient_id": current_user["id"],
        "timestamp": now,
        "event_type": EventType.TREATMENT.value,
        "source_module": SourceModule.CARE_PLAN.value,
        "data_payload": {"plan_id": plan_id, "title": plan_data.title},
        "clinical_confidence": None,
        "access_scope": ["patient", "primary_doctor"]
    }
    await db.twin_events.insert_one(event_doc)
    
    return CarePlan(**plan_doc)

@api_router.get("/v1/care-plans", response_model=List[CarePlan])
async def get_care_plans(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"patient_id": current_user["id"]}
    if status:
        query["status"] = status
    
    plans = await db.care_plans.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [CarePlan(**plan) for plan in plans]

@api_router.put("/v1/care-plans/{plan_id}/status")
async def update_care_plan_status(
    plan_id: str,
    status: str,
    current_user: dict = Depends(get_current_user)
):
    result = await db.care_plans.update_one(
        {"id": plan_id, "patient_id": current_user["id"]},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Care plan not found")
    return {"status": "updated"}

# ==================== APPOINTMENTS ENDPOINTS ====================
@api_router.post("/v1/appointments", response_model=Appointment)
async def create_appointment(
    appt_data: AppointmentCreate,
    current_user: dict = Depends(get_current_user)
):
    appt_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    # Get doctor name
    doctor = await db.users.find_one({"id": appt_data.doctor_id}, {"_id": 0, "full_name": 1})
    doctor_name = doctor["full_name"] if doctor else "Unknown"
    
    # Generate meeting link for video appointments (mocked)
    meeting_link = None
    if appt_data.appointment_type == "video":
        meeting_link = f"https://meet.medinexus.pro/{appt_id}"
    
    appt_doc = {
        "id": appt_id,
        "patient_id": current_user["id"],
        "doctor_id": appt_data.doctor_id,
        "doctor_name": doctor_name,
        "appointment_date": appt_data.appointment_date,
        "appointment_type": appt_data.appointment_type,
        "status": AppointmentStatus.SCHEDULED.value,
        "reason": appt_data.reason,
        "notes": appt_data.notes,
        "meeting_link": meeting_link,
        "created_at": now
    }
    
    await db.appointments.insert_one(appt_doc)
    
    # Add to twin events
    event_doc = {
        "event_id": str(uuid.uuid4()),
        "patient_id": current_user["id"],
        "timestamp": now,
        "event_type": EventType.CONSULTATION.value,
        "source_module": SourceModule.TELEMED.value,
        "data_payload": {"appointment_id": appt_id, "type": appt_data.appointment_type, "doctor": doctor_name},
        "clinical_confidence": None,
        "access_scope": ["patient", "primary_doctor"]
    }
    await db.twin_events.insert_one(event_doc)
    
    return Appointment(**appt_doc)

@api_router.get("/v1/appointments", response_model=List[Appointment])
async def get_appointments(
    status: Optional[str] = None,
    upcoming_only: bool = False,
    current_user: dict = Depends(get_current_user)
):
    query = {"patient_id": current_user["id"]}
    if status:
        query["status"] = status
    if upcoming_only:
        query["appointment_date"] = {"$gte": datetime.now(timezone.utc).isoformat()}
    
    appts = await db.appointments.find(query, {"_id": 0}).sort("appointment_date", 1).to_list(100)
    return [Appointment(**appt) for appt in appts]

@api_router.put("/v1/appointments/{appt_id}/status")
async def update_appointment_status(
    appt_id: str,
    status: AppointmentStatus,
    current_user: dict = Depends(get_current_user)
):
    result = await db.appointments.update_one(
        {"id": appt_id, "patient_id": current_user["id"]},
        {"$set": {"status": status.value}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return {"status": "updated"}

# ==================== VITALS ENDPOINTS ====================
@api_router.post("/v1/vitals", response_model=Vital)
async def create_vital(
    vital_data: VitalCreate,
    current_user: dict = Depends(get_current_user)
):
    vital_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    measured_at = vital_data.measured_at or now
    
    vital_doc = {
        "id": vital_id,
        "patient_id": current_user["id"],
        "vital_type": vital_data.vital_type,
        "value": vital_data.value,
        "unit": vital_data.unit,
        "measured_at": measured_at,
        "source": "manual",
        "created_at": now
    }
    
    await db.vitals.insert_one(vital_doc)
    
    # Add to twin events (create clean copy without _id)
    clean_vital_doc = {k: v for k, v in vital_doc.items() if k != '_id'}
    event_doc = {
        "event_id": str(uuid.uuid4()),
        "patient_id": current_user["id"],
        "timestamp": now,
        "event_type": EventType.VITAL.value,
        "source_module": SourceModule.HEALTH_SYNC.value,
        "data_payload": clean_vital_doc,
        "clinical_confidence": 1.0,
        "access_scope": ["patient", "primary_doctor"]
    }
    await db.twin_events.insert_one(event_doc)
    
    return Vital(**vital_doc)

@api_router.get("/v1/vitals", response_model=List[Vital])
async def get_vitals(
    vital_type: Optional[str] = None,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    query = {"patient_id": current_user["id"]}
    if vital_type:
        query["vital_type"] = vital_type
    
    vitals = await db.vitals.find(query, {"_id": 0}).sort("measured_at", -1).limit(limit).to_list(limit)
    return [Vital(**v) for v in vitals]

@api_router.get("/v1/vitals/latest")
async def get_latest_vitals(current_user: dict = Depends(get_current_user)):
    vital_types = ["heart_rate", "blood_pressure", "temperature", "weight", "oxygen_saturation", "blood_glucose"]
    latest = {}
    
    for vtype in vital_types:
        vital = await db.vitals.find_one(
            {"patient_id": current_user["id"], "vital_type": vtype},
            {"_id": 0},
            sort=[("measured_at", -1)]
        )
        if vital:
            latest[vtype] = vital
    
    return latest

# ==================== DOCTORS ENDPOINTS ====================
@api_router.get("/v1/doctors")
async def get_doctors(specialty: Optional[str] = None):
    query = {"role": "doctor"}
    if specialty:
        query["specialty"] = {"$regex": specialty, "$options": "i"}
    
    doctors = await db.users.find(query, {"_id": 0, "password": 0}).to_list(100)
    return doctors

# ==================== HEALTH CHECK ====================
@api_router.get("/")
async def root():
    return {"message": "MediNexus Pro+ API v1.0", "status": "healthy"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
