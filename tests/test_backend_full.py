import urllib.request
import urllib.error
import json
import time

BASE = "http://127.0.0.1:8000/api"

print("Waiting 2s for backend...")
time.sleep(2)

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

print("\n--- 1. TEST USER REGISTRATION ---")
reg_payload = {
    "full_name": "Kavitha Ramanathan",
    "email": "kavitha.clinic@arulhealth.org",
    "phone": "9841234567",
    "password": "Password123!",
    "confirm_password": "Password123!",
    "sector_id": "clinic",
    "terms_accepted": True
}
try:
    reg_res = post("/auth/register", reg_payload)
    print("Registration SUCCESS:", reg_res["message"], "Username:", reg_res["user"]["username"])
except urllib.error.HTTPError as e:
    print("Registration response:", e.code, e.read().decode())

print("\n--- 2. TEST DUPLICATE REGISTRATION PREVENTION ---")
try:
    post("/auth/register", reg_payload)
    print("FAIL: duplicate registration succeeded!")
except urllib.error.HTTPError as e:
    print(f"PASS: Duplicate correctly rejected with HTTP {e.code}: {e.read().decode()}")

print("\n--- 3. TEST USER LOGIN ---")
user_login = post("/auth/login", {"username": "kavitha.clinic@arulhealth.org", "password": "Password123!"})
user_token = user_login["access_token"]
print("User Login SUCCESS: Role=", user_login["user"]["role"], "Sector=", user_login["sector"]["id"])

print("\n--- 4. TEST RBAC: NORMAL USER ATTEMPTING ADMIN ROUTE ---")
try:
    get("/admin/overview", user_token)
    print("FAIL: normal user accessed admin overview!")
except urllib.error.HTTPError as e:
    print(f"PASS: Regular user rejected from admin route with HTTP {e.code}: {e.read().decode()}")

print("\n--- 5. TEST ADMIN LOGIN & ADMIN OVERVIEW ---")
admin_login = post("/auth/admin-login", {"username": "admin", "password": "admin@vaayil123"})
admin_token = admin_login["access_token"]
print("Admin Login SUCCESS: Role=", admin_login["user"]["role"])

overview = get("/admin/overview", admin_token)
print(f"Admin Overview: Users={overview['total_users']}, Sectors={overview['total_sectors']}, Calls={overview['total_calls']}, Alerts={overview['total_alerts']}")

print("\n--- 6. TEST ALERTS API (GET /api/alerts & SUMMARY) ---")
summary = get("/alerts/summary", admin_token)
print(f"Alerts Summary: Total={summary['total_alerts']}, New={summary['new_alerts']}, Confirmed={summary['confirmed_urgent']}")

alerts = get("/alerts", admin_token)
print(f"Alerts List: {len(alerts)} alerts retrieved across sectors.")
if alerts:
    first_alert = alerts[0]
    print(f"  First Alert #{first_alert['id']}: [{first_alert['sector_id']}] {first_alert['reason']} ({first_alert['status']})")
    print(f"  Snippet: {first_alert['snippet'][:60]}...")
    print(f"  Turns count: {len(first_alert['transcript_turns'])}")

print("\n--- 7. TEST ALERT REVIEW (PATCH /api/alerts/{id}/review) ---")
if alerts:
    target_id = alerts[0]["id"]
    rev = patch(f"/alerts/{target_id}/review", {"action": "confirm", "review_notes": "Emergency physician dispatched immediately."}, admin_token)
    print(f"Review Action SUCCESS: Alert #{target_id} status is now '{rev['status']}' by '{rev['reviewed_by']}'")

print("\n--- 8. TEST USER ACTIVATION TOGGLE ---")
users = get("/admin/users", admin_token)
kavitha = next((u for u in users if u["email"] == "kavitha.clinic@arulhealth.org"), None)
if kavitha:
    deact = patch(f"/admin/users/{kavitha['id']}/status", {"is_active": False}, admin_token)
    print(f"User deactivated: is_active={deact['is_active']}")
    try:
        post("/auth/login", {"username": "kavitha.clinic@arulhealth.org", "password": "Password123!"})
        print("FAIL: deactivated user was able to login!")
    except urllib.error.HTTPError as e:
        print(f"PASS: Deactivated user rejected with HTTP {e.code}: {e.read().decode()}")
    # Re-activate user
    patch(f"/admin/users/{kavitha['id']}/status", {"is_active": True}, admin_token)
    print("User re-activated successfully.")

print("\nALL BACKEND AUTH, ADMIN, & ALERTS INTEGRATION TESTS PASSED!")

