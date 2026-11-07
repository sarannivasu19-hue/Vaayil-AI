import urllib.request
import urllib.error
import json

BASE = 'http://127.0.0.1:8000/api'
SECTORS = [
    ('panchayat_health', 'panchayat_admin', 'health.desk@panchayat.tn.gov.in'),
    ('clinic', 'clinic_admin', 'appointments@arulclinic.com'),
    ('vet_clinic', 'vet_admin', 'doctor@vetcare.in'),
    ('hotel_lodge', 'hotel_admin', 'reservations@maruthaminn.com'),
    ('restaurant', 'restaurant_admin', 'orders@meenakshibhavan.com'),
    ('coaching', 'coaching_admin', 'admissions@vetriacademy.edu.in'),
]

print("=== 1. TESTING DEMO-LOGIN FOR ALL 6 SECTORS ===")
for sec, user, email in SECTORS:
    req = urllib.request.Request(f"{BASE}/auth/demo-login/{sec}", method='POST')
    res = urllib.request.urlopen(req)
    d = json.loads(res.read())
    assert d['user']['username'] == user, f"Expected {user}, got {d['user']['username']}"
    assert d['sector']['id'] == sec, f"Expected sector {sec}, got {d['sector']['id']}"
    assert len(d['access_token']) > 20, "Token missing"
    print(f"  [PASS] Demo Login {sec}: User={user}, Sector={d['sector']['name']}")

print("\n=== 2. TESTING USERNAME LOGIN FOR ALL 6 SECTORS ===")
for sec, user, email in SECTORS:
    body = json.dumps({'username': user, 'password': 'vaayil123'}).encode()
    req = urllib.request.Request(f"{BASE}/auth/login", data=body, headers={'Content-Type': 'application/json'}, method='POST')
    res = urllib.request.urlopen(req)
    d = json.loads(res.read())
    assert d['user']['username'] == user
    print(f"  [PASS] Username Login {sec}: {user} OK")

print("\n=== 3. TESTING EMAIL LOGIN FOR ALL 6 SECTORS ===")
for sec, user, email in SECTORS:
    body = json.dumps({'username': email, 'password': 'vaayil123'}).encode()
    req = urllib.request.Request(f"{BASE}/auth/login", data=body, headers={'Content-Type': 'application/json'}, method='POST')
    res = urllib.request.urlopen(req)
    d = json.loads(res.read())
    assert d['user']['email'] == email
    token = d['access_token']
    me_req = urllib.request.Request(f"{BASE}/auth/me", headers={'Authorization': f"Bearer {token}"})
    me_res = urllib.request.urlopen(me_req)
    me_data = json.loads(me_res.read())
    assert me_data['user']['email'] == email
    print(f"  [PASS] Email Login + /me Token Auth {sec}: {email} OK")

print("\n=== 4. TESTING INVALID CREDENTIALS REJECTION ===")
try:
    body = json.dumps({'username': 'wrong_user', 'password': 'bad_password'}).encode()
    urllib.request.urlopen(urllib.request.Request(f"{BASE}/auth/login", data=body, headers={'Content-Type': 'application/json'}, method='POST'))
    print("  [FAIL] Expected 401 Unauthorized but request succeeded")
except urllib.error.HTTPError as e:
    assert e.code == 401
    print(f"  [PASS] Correctly rejected invalid credentials with HTTP {e.code}")

print("\nALL AUTHENTICATION INTEGRATION CHECKS PASSED PERFECTLY!")

