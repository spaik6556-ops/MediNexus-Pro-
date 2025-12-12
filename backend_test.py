#!/usr/bin/env python3
"""
MediNexus Pro+ Backend API Testing Suite
Tests all API endpoints with JWT authentication
"""

import requests
import sys
import json
from datetime import datetime, timedelta
import time

class MediNexusAPITester:
    def __init__(self, base_url="https://medinexus-pro.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.session = requests.Session()
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        self.log(f"🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}", "PASS")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}", "FAIL")
                self.log(f"   Response: {response.text[:200]}", "ERROR")
                self.failed_tests.append({
                    'name': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:200]
                })
                return False, {}

        except Exception as e:
            self.log(f"❌ {name} - Error: {str(e)}", "ERROR")
            self.failed_tests.append({
                'name': name,
                'error': str(e)
            })
            return False, {}

    def test_health_check(self):
        """Test basic health endpoints"""
        self.log("=== HEALTH CHECK TESTS ===")
        self.run_test("API Root", "GET", "", 200)
        self.run_test("Health Check", "GET", "health", 200)

    def test_authentication(self):
        """Test user registration and login"""
        self.log("=== AUTHENTICATION TESTS ===")
        
        # Test user registration
        test_user = {
            "email": "test@medinexus.com",
            "password": "TestPass123!",
            "full_name": "Тест Пользователь",
            "role": "patient",
            "phone": "+7 999 123-45-67"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            self.log(f"✅ Token obtained: {self.token[:20]}...", "SUCCESS")
        else:
            # Try login with existing user
            login_data = {
                "email": test_user["email"],
                "password": test_user["password"]
            }
            success, response = self.run_test(
                "User Login",
                "POST",
                "auth/login",
                200,
                data=login_data
            )
            if success and 'access_token' in response:
                self.token = response['access_token']
                self.user_id = response['user']['id']
                self.log(f"✅ Login successful, token: {self.token[:20]}...", "SUCCESS")

        # Test get current user
        if self.token:
            self.run_test("Get Current User", "GET", "auth/me", 200)

    def test_symptom_checker(self):
        """Test AI symptom analysis"""
        self.log("=== SYMPTOM CHECKER TESTS ===")
        
        if not self.token:
            self.log("❌ No auth token, skipping symptom tests", "SKIP")
            return

        symptom_data = {
            "symptoms": ["головная боль", "температура"],
            "duration": "2 дня",
            "severity": "moderate",
            "additional_info": "Тест симптомов"
        }
        
        success, response = self.run_test(
            "Analyze Symptoms",
            "POST",
            "v1/symptoms/analyze",
            200,
            data=symptom_data
        )
        
        if success:
            # Wait a bit for AI processing
            time.sleep(2)
            self.log(f"✅ AI Analysis completed: {response.get('triage_level', 'unknown')}", "SUCCESS")
        
        # Test symptom history
        self.run_test("Get Symptom History", "GET", "v1/symptoms/history", 200)

    def test_lab_results(self):
        """Test lab results management"""
        self.log("=== LAB RESULTS TESTS ===")
        
        if not self.token:
            self.log("❌ No auth token, skipping lab tests", "SKIP")
            return

        lab_data = {
            "test_name": "Гемоглобин",
            "value": 145.5,
            "unit": "г/л",
            "reference_range": "120-160",
            "lab_name": "Тестовая лаборатория",
            "notes": "Тестовый анализ"
        }
        
        success, response = self.run_test(
            "Create Lab Result",
            "POST",
            "v1/labs",
            200,
            data=lab_data
        )
        
        lab_id = response.get('id') if success else None
        
        # Test get all labs
        self.run_test("Get Lab Results", "GET", "v1/labs", 200)
        
        # Test lab trends
        if lab_id:
            self.run_test("Get Lab Trends", "GET", f"v1/labs/trends/{lab_data['test_name']}", 200)

    def test_documents(self):
        """Test document management"""
        self.log("=== DOCUMENTS TESTS ===")
        
        if not self.token:
            self.log("❌ No auth token, skipping document tests", "SKIP")
            return

        doc_data = {
            "title": "Тестовый документ",
            "document_type": "lab_report",
            "description": "Это тестовый медицинский документ для проверки AI-анализа"
        }
        
        success, response = self.run_test(
            "Create Document",
            "POST",
            "v1/documents",
            200,
            data=doc_data
        )
        
        doc_id = response.get('id') if success else None
        
        # Test get all documents
        self.run_test("Get Documents", "GET", "v1/documents", 200)
        
        # Test delete document
        if doc_id:
            self.run_test("Delete Document", "DELETE", f"v1/documents/{doc_id}", 200)

    def test_care_plans(self):
        """Test care plan management"""
        self.log("=== CARE PLANS TESTS ===")
        
        if not self.token:
            self.log("❌ No auth token, skipping care plan tests", "SKIP")
            return

        plan_data = {
            "title": "Тестовый план лечения",
            "description": "План для тестирования системы",
            "goals": ["Улучшить общее состояние", "Снизить давление"],
            "medications": [
                {"name": "Тестовый препарат", "dosage": "10мг", "frequency": "1 раз в день"}
            ],
            "lifestyle_recommendations": ["Больше двигаться", "Правильно питаться"]
        }
        
        success, response = self.run_test(
            "Create Care Plan",
            "POST",
            "v1/care-plans",
            200,
            data=plan_data
        )
        
        plan_id = response.get('id') if success else None
        
        # Test get care plans
        self.run_test("Get Care Plans", "GET", "v1/care-plans", 200)
        
        # Test update plan status
        if plan_id:
            self.run_test("Update Plan Status", "PUT", f"v1/care-plans/{plan_id}/status?status=completed", 200)

    def test_appointments(self):
        """Test appointment management"""
        self.log("=== APPOINTMENTS TESTS ===")
        
        if not self.token:
            self.log("❌ No auth token, skipping appointment tests", "SKIP")
            return

        # First get doctors
        success, doctors_response = self.run_test("Get Doctors", "GET", "v1/doctors", 200)
        
        if success and doctors_response:
            doctors = doctors_response if isinstance(doctors_response, list) else []
            if doctors:
                doctor_id = doctors[0]['id']
            else:
                # Create a mock doctor ID for testing
                doctor_id = "test-doctor-id"
                self.log("⚠️ No doctors found, using mock ID", "WARN")
        else:
            doctor_id = "test-doctor-id"
            self.log("⚠️ Could not fetch doctors, using mock ID", "WARN")

        # Create appointment
        future_date = (datetime.now() + timedelta(days=1)).isoformat()
        appt_data = {
            "doctor_id": doctor_id,
            "appointment_date": future_date,
            "appointment_type": "video",
            "reason": "Тестовая консультация"
        }
        
        success, response = self.run_test(
            "Create Appointment",
            "POST",
            "v1/appointments",
            200,
            data=appt_data
        )
        
        appt_id = response.get('id') if success else None
        
        # Test get appointments
        self.run_test("Get Appointments", "GET", "v1/appointments", 200)
        self.run_test("Get Upcoming Appointments", "GET", "v1/appointments?upcoming_only=true", 200)
        
        # Test update appointment status
        if appt_id:
            self.run_test("Cancel Appointment", "PUT", f"v1/appointments/{appt_id}/status?status=cancelled", 200)

    def test_vitals(self):
        """Test vitals management"""
        self.log("=== VITALS TESTS ===")
        
        if not self.token:
            self.log("❌ No auth token, skipping vitals tests", "SKIP")
            return

        vital_data = {
            "vital_type": "heart_rate",
            "value": "72",
            "unit": "уд/мин"
        }
        
        success, response = self.run_test(
            "Create Vital",
            "POST",
            "v1/vitals",
            200,
            data=vital_data
        )
        
        # Test get vitals
        self.run_test("Get Vitals", "GET", "v1/vitals", 200)
        self.run_test("Get Latest Vitals", "GET", "v1/vitals/latest", 200)

    def test_twin_core(self):
        """Test Digital Twin core functionality"""
        self.log("=== DIGITAL TWIN TESTS ===")
        
        if not self.token:
            self.log("❌ No auth token, skipping twin tests", "SKIP")
            return

        # Test twin aggregate
        self.run_test("Get Twin Aggregate", "GET", "v1/twin/aggregate", 200)
        
        # Test twin timeline
        self.run_test("Get Twin Timeline", "GET", "v1/twin/timeline", 200)
        self.run_test("Get Twin Timeline Limited", "GET", "v1/twin/timeline?limit=5", 200)

    def test_video_calls(self):
        """Test Agora Video Call functionality"""
        self.log("=== VIDEO CALL TESTS ===")
        
        if not self.token:
            self.log("❌ No auth token, skipping video tests", "SKIP")
            return

        # Test video token generation
        token_data = {
            "channel": "test-channel-123",
            "appointment_id": "test-appointment-id"
        }
        
        success, response = self.run_test(
            "Generate Video Token",
            "POST",
            "v1/video/token",
            200,
            data=token_data
        )
        
        if success:
            self.log(f"✅ Video token generated: {response.get('token', '')[:20]}...", "SUCCESS")
            
            # Test end video call
            self.run_test(
                "End Video Call",
                "POST",
                f"v1/video/end/{token_data['appointment_id']}?duration_minutes=5",
                200
            )

    def test_health_sync(self):
        """Test Health Sync functionality"""
        self.log("=== HEALTH SYNC TESTS ===")
        
        if not self.token:
            self.log("❌ No auth token, skipping health sync tests", "SKIP")
            return

        # Test device connection
        device_data = {
            "device_type": "apple_health",
            "device_id": "test-device-123"
        }
        
        success, response = self.run_test(
            "Connect Health Device",
            "POST",
            "v1/health-sync/connect",
            200,
            data=device_data
        )
        
        # Test get connected devices
        self.run_test("Get Connected Devices", "GET", "v1/health-sync/devices", 200)
        
        # Test sync health data
        sync_data = {
            "device_type": "apple_health",
            "records": [
                {
                    "device_type": "apple_health",
                    "data_type": "steps",
                    "value": 8500,
                    "unit": "steps",
                    "recorded_at": datetime.now().isoformat()
                },
                {
                    "device_type": "apple_health",
                    "data_type": "heart_rate",
                    "value": 72,
                    "unit": "bpm",
                    "recorded_at": datetime.now().isoformat()
                }
            ]
        }
        
        self.run_test(
            "Sync Health Data",
            "POST",
            "v1/health-sync/data",
            200,
            data=sync_data
        )
        
        # Test health summary
        self.run_test("Get Health Summary", "GET", "v1/health-sync/summary?days=7", 200)

    def test_radiology_ai(self):
        """Test Radiology AI functionality"""
        self.log("=== RADIOLOGY AI TESTS ===")
        
        if not self.token:
            self.log("❌ No auth token, skipping radiology tests", "SKIP")
            return

        # Test radiology analysis
        analysis_data = {
            "image_type": "ct",
            "body_region": "chest",
            "clinical_context": "Пациент жалуется на боль в груди, подозрение на пневмонию"
        }
        
        success, response = self.run_test(
            "Analyze Radiology Image",
            "POST",
            "v1/radiology/analyze",
            200,
            data=analysis_data
        )
        
        if success:
            # Wait for AI processing
            time.sleep(3)
            self.log(f"✅ Radiology AI analysis completed: {response.get('impression', '')[:50]}...", "SUCCESS")
        
        # Test get analyses history
        self.run_test("Get Radiology Analyses", "GET", "v1/radiology/analyses", 200)

    def test_b2b_clinic(self):
        """Test B2B Clinic functionality"""
        self.log("=== B2B CLINIC TESTS ===")
        
        if not self.token:
            self.log("❌ No auth token, skipping B2B tests", "SKIP")
            return

        # Test clinic creation
        clinic_data = {
            "name": "Тестовая клиника MediNexus",
            "address": "г. Москва, ул. Тестовая, д. 1",
            "phone": "+7 999 123-45-67",
            "email": "test-clinic@medinexus.com",
            "specialties": ["Терапия", "Кардиология"]
        }
        
        success, response = self.run_test(
            "Create Clinic",
            "POST",
            "v1/b2b/clinic",
            200,
            data=clinic_data
        )
        
        if success:
            # Test get clinic
            self.run_test("Get Clinic", "GET", "v1/b2b/clinic", 200)
            
            # Test clinic stats
            self.run_test("Get Clinic Stats", "GET", "v1/b2b/clinic/stats", 200)
            
            # Test clinic patients
            self.run_test("Get Clinic Patients", "GET", "v1/b2b/clinic/patients", 200)

    def test_notifications(self):
        """Test Push Notifications functionality"""
        self.log("=== NOTIFICATIONS TESTS ===")
        
        if not self.token:
            self.log("❌ No auth token, skipping notifications tests", "SKIP")
            return

        # Test push subscription
        subscription_data = {
            "endpoint": "https://fcm.googleapis.com/fcm/send/test-endpoint",
            "keys": {
                "p256dh": "test-p256dh-key",
                "auth": "test-auth-key"
            },
            "device_type": "web"
        }
        
        self.run_test(
            "Subscribe Push Notifications",
            "POST",
            "v1/notifications/subscribe",
            200,
            data=subscription_data
        )
        
        # Test create notification
        notification_data = {
            "title": "Тестовое уведомление",
            "message": "Это тестовое уведомление для проверки системы",
            "notification_type": "system"
        }
        
        success, response = self.run_test(
            "Create Notification",
            "POST",
            "v1/notifications",
            200,
            data=notification_data
        )
        
        notif_id = response.get('id') if success else None
        
        # Test get notifications
        self.run_test("Get Notifications", "GET", "v1/notifications", 200)
        self.run_test("Get Unread Count", "GET", "v1/notifications/unread-count", 200)
        
        # Test mark as read
        if notif_id:
            self.run_test("Mark Notification Read", "PUT", f"v1/notifications/{notif_id}/read", 200)
        
        # Test mark all as read
        self.run_test("Mark All Notifications Read", "PUT", "v1/notifications/read-all", 200)

    def run_all_tests(self):
        """Run all test suites"""
        start_time = datetime.now()
        self.log("🚀 Starting MediNexus Pro+ API Tests")
        
        try:
            self.test_health_check()
            self.test_authentication()
            self.test_symptom_checker()
            self.test_lab_results()
            self.test_documents()
            self.test_care_plans()
            self.test_appointments()
            self.test_vitals()
            self.test_twin_core()
            # Phase 1 expansion tests
            self.test_video_calls()
            self.test_health_sync()
            self.test_radiology_ai()
            self.test_b2b_clinic()
            self.test_notifications()
            
        except KeyboardInterrupt:
            self.log("❌ Tests interrupted by user", "ERROR")
        except Exception as e:
            self.log(f"❌ Unexpected error: {str(e)}", "ERROR")
        
        # Print results
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        self.log("=" * 50)
        self.log("📊 TEST RESULTS SUMMARY")
        self.log(f"Total tests: {self.tests_run}")
        self.log(f"Passed: {self.tests_passed}")
        self.log(f"Failed: {len(self.failed_tests)}")
        self.log(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        self.log(f"Duration: {duration:.2f}s")
        
        if self.failed_tests:
            self.log("\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                error_msg = test.get('error', f"Expected {test.get('expected')}, got {test.get('actual')}")
                self.log(f"  - {test['name']}: {error_msg}")
        
        return len(self.failed_tests) == 0

def main():
    """Main test runner"""
    tester = MediNexusAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())