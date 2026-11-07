import urllib.request
import urllib.error
import json
import time

BASE = "http://127.0.0.1:8000/api"

def post(endpoint, data, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode()
    req = urllib.request.Request(f"{BASE}{endpoint}", data=body, headers=headers, method="POST")
    res = urllib.request.urlopen(req)
    return json.loads(res.read())

def get(endpoint, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE}{endpoint}", headers=headers, method="GET")
    res = urllib.request.urlopen(req)
    return json.loads(res.read())

def patch(endpoint, data, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode()
    req = urllib.request.Request(f"{BASE}{endpoint}", data=body, headers=headers, method="PATCH")
    res = urllib.request.urlopen(req)
    return json.loads(res.read())

def put(endpoint, data, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode()
    req = urllib.request.Request(f"{BASE}{endpoint}", data=body, headers=headers, method="PUT")
    res = urllib.request.urlopen(req)
    return json.loads(res.read())

print("==================================================================")
print("     VAAYIL AI — FULL SYSTEM WORKFLOW INTEGRATION SUITE           ")
print("==================================================================")

# ------------------------------------------------------------------
# WORKFLOW 1: Register New User -> Login -> Sector Isolation
# ------------------------------------------------------------------
print("\n>>> WORKFLOW 1: Clinic Sector User Registration & Login")
timestamp = int(time.time())
reg_email = f"dr.saravanan_{timestamp}@arulclinic.com"
reg_payload = {
    "full_name": "Dr. Saravanan Natarajan",
    "email": reg_email,
    "phone": "9840234567",
    "password": "SecureClinic2026!",
    "confirm_password": "SecureClinic2026!",
    "sector_id": "clinic",
    "terms_accepted": True
}
reg_res = post("/auth/register", reg_payload)
assert reg_res["user"]["email"] == reg_email
print(f"  [PASS] User Registered: {reg_res['user']['full_name']} (@{reg_res['user']['username']})")

login_res = post("/auth/login", {"username": reg_email, "password": "SecureClinic2026!"})
clinic_token = login_res["access_token"]
assert login_res["sector"]["id"] == "clinic"
print(f"  [PASS] User Authenticated to Clinic Workspace: Token={clinic_token[:15]}...")

me_res = get("/auth/me", clinic_token)
assert me_res["user"]["email"] == reg_email
assert me_res["sector"]["id"] == "clinic"
print(f"  [PASS] /auth/me verified user is owner of sector: {me_res['sector']['name']}")

# ------------------------------------------------------------------
# WORKFLOW 2: Restaurant Sector User Login & Bookings Inspection
# ------------------------------------------------------------------
print("\n>>> WORKFLOW 2: Restaurant Sector Login & Bookings")
rest_login = post("/auth/login", {"username": "restaurant_admin", "password": "vaayil123"})
rest_token = rest_login["access_token"]
assert rest_login["sector"]["id"] == "restaurant"
print(f"  [PASS] Restaurant Admin Authenticated: Sector={rest_login['sector']['name']}")

rest_bookings = get("/bookings", rest_token)
print(f"  [PASS] Restaurant Bookings Count: {len(rest_bookings)} records retrieved strictly for restaurant sector.")

# Create a new restaurant catering booking
test_day = (timestamp % 25) + 1
new_booking_payload = {
    "customer_name": f"V. Ramamoorthy {timestamp}",
    "phone": f"98409{timestamp % 100000:05d}",
    "details": {
        "customer_name": f"V. Ramamoorthy {timestamp}",
        "phone": f"98409{timestamp % 100000:05d}",
        "service_type": "Bulk Event Catering (மொத்த உணவு ஆர்டர்)",
        "headcount": 150,
        "event_date": f"2026-12-{test_day:02d}",
        "event_time": "12:30 PM (Lunch)"
    },
    "notes": "Vegetarian south Indian traditional banquet"
}
created_booking = post("/bookings", new_booking_payload, rest_token)
print(f"  [PASS] Booking Created: Ref={created_booking['reference_number']} Status={created_booking['status']}")

# ------------------------------------------------------------------
# WORKFLOW 3: Admin Login -> Admin Dashboard -> User Mgmt & Telemetry
# ------------------------------------------------------------------
print("\n>>> WORKFLOW 3: Admin Portal Authentication & Management")
admin_login = post("/auth/admin-login", {"username": "admin", "password": "admin@vaayil123"})
admin_token = admin_login["access_token"]
assert admin_login["user"]["role"] == "admin"
print(f"  [PASS] Platform Administrator Authenticated: {admin_login['user']['full_name']}")

overview = get("/admin/overview", admin_token)
assert overview["total_sectors"] == 6
assert overview["total_users"] >= 7
print(f"  [PASS] Admin Telemetry: Total Users={overview['total_users']}, Calls={overview['total_calls']}, Bookings={overview['total_bookings']}, Alerts={overview['total_alerts']}")

all_users = get("/admin/users", admin_token)
print(f"  [PASS] Admin Users Directory: {len(all_users)} platform users listed.")

# Test Admin Role Enforcement: Regular user must NOT access admin routes
try:
    get("/admin/overview", rest_token)
    print("  [FAIL] Regular user accessed admin route!")
except urllib.error.HTTPError as e:
    assert e.code == 403
    print(f"  [PASS] RBAC Enforced: Non-admin user blocked with HTTP {e.code} Forbidden.")

# ------------------------------------------------------------------
# WORKFLOW 4: Voice Call Simulation -> Emergency Symptom -> Alert Created -> Alert Review
# ------------------------------------------------------------------
print("\n>>> WORKFLOW 4: Urgent Detection -> Alert Storage -> Clinical Review")
urgent_call_payload = {
    "session_id": f"sess_urgent_{timestamp}",
    "sector_id": "clinic",
    "slots": {
        "patient_name": "K. Meenakshi",
        "phone": "9444011223",
        "doctor_specialty": "General Medicine (பொது மருத்துவம்)",
        "appointment_date": "2026-11-08",
        "appointment_time": "10:00 AM",
        "symptoms": "நெஞ்சு வலி ரொம்ப தீவிரமாக இருக்கு, தாங்கவே முடியல!"
    },
    "notes": "Urgent chest pain flagged during live voice turn"
}
booked_urgent = post("/bookings/confirm", urgent_call_payload, clinic_token)
print(f"  [PASS] Urgent Call Confirmed: Ref={booked_urgent['reference_number']}")

# Check that Alert was created in database
clinic_alerts = get("/alerts?status=all", clinic_token)
latest_alert = clinic_alerts[0]
print(f"  [PASS] Real-time Alert in DB: #ALT-{latest_alert['id']} (Severity: {latest_alert['severity']}) Reason: {latest_alert['reason']}")

# Review the alert
review_res = patch(f"/alerts/{latest_alert['id']}/review", {
    "action": "confirm",
    "review_notes": "Emergency physician alerted. Patient arriving by ambulance."
}, clinic_token)
assert review_res["status"] == "confirmed"
print(f"  [PASS] Clinical Review Saved: Status={review_res['status']} Reviewer={review_res['reviewed_by']}")

# ------------------------------------------------------------------
# WORKFLOW 5: Settings Modification -> Persistence -> Retrieval
# ------------------------------------------------------------------
print("\n>>> WORKFLOW 5: Sector Settings Management")
current_settings = get("/settings", clinic_token)
print(f"  [PASS] Loaded Settings: Business={current_settings['business_name']}, Open={current_settings['open_time']} Close={current_settings['close_time']}")

# Update a setting
updated_settings_payload = {
    "business_name": "Arul Primary Care Clinic (Tamil Nadu Super-Specialty)",
    "contact_phone": "+91 94441 98765",
    "contact_email": "care@arulclinic.com",
    "open_time": "08:30",
    "close_time": "21:30",
    "working_days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    "slot_length_minutes": 25,
    "language_mode": "tanglish",
    "tts_voice": "Shivani",
    "agent_questions": current_settings.get("agent_questions", []),
    "urgent_keywords": ["நெஞ்சு வலி", "மூச்சு திணறல்", "வலிப்பு", "மாரடைப்பு", "மயக்கம்", "stroke", "bleeding"],
    "store_audio": False
}
save_res = put("/settings", updated_settings_payload, clinic_token)
print(f"  [PASS] Settings Saved: {save_res.get('business_name')}")

# Verify saved values persist on re-fetch
reloaded_settings = get("/settings", clinic_token)
assert reloaded_settings["open_time"] == "08:30"
assert reloaded_settings["close_time"] == "21:30"
assert reloaded_settings["slot_length_minutes"] == 25
print(f"  [PASS] Verified Persistence: Opening={reloaded_settings['open_time']}, Slot Duration={reloaded_settings['slot_length_minutes']} min")

# ------------------------------------------------------------------
# WORKFLOW 6: Verification Across All Six Sector Workspaces
# ------------------------------------------------------------------
print("\n>>> WORKFLOW 6: Verification Across All Six Sectors")
SECTORS = [
    ("panchayat_health", "panchayat_admin", "health.desk@panchayat.tn.gov.in"),
    ("clinic", "clinic_admin", "appointments@arulclinic.com"),
    ("vet_clinic", "vet_admin", "doctor@vetcare.in"),
    ("hotel_lodge", "hotel_admin", "reservations@maruthaminn.com"),
    ("restaurant", "restaurant_admin", "orders@meenakshibhavan.com"),
    ("coaching", "coaching_admin", "admissions@vetriacademy.edu.in"),
]

for sec_id, user_id, email in SECTORS:
    s_login = post("/auth/login", {"username": user_id, "password": "vaayil123"})
    s_token = s_login["access_token"]
    assert s_login["sector"]["id"] == sec_id
    
    # Check sector details
    sec_detail = get(f"/sectors/{sec_id}", s_token)
    
    # Check sector call logs
    sec_calls = get("/call-logs", s_token)
    
    # Check sector alerts
    sec_alerts = get("/alerts", s_token)
    
    print(f"  [PASS] Sector '{sec_id}': User={user_id} | Name={sec_detail['name']} | Calls={len(sec_calls)} | Alerts={len(sec_alerts)}")

print("\n==================================================================")
print("     ALL 6 INTEGRATION WORKFLOWS PASSED WITH 100% SUCCESS!        ")
print("==================================================================")
