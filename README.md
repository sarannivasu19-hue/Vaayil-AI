# Vaayil AI (வாயில் AI)
> **Tagline:** Every business. One voice at the door.  
> **Platform:** Tamil & Tanglish Voice Agent Platform for Local Businesses and Public Services.  
> **Challenge:** Built for the Gnani AI Internship Challenge.

---

## 🏛️ Project Overview
Small businesses and public offices miss critical calls because staff are overwhelmed or away from the desk. **Vaayil AI** provides **one voice-agent engine** powering **multiple sector workspaces**. 

The voice agent converses naturally with callers in **Tamil and Tanglish**, systematically captures sector-specific slots, flags urgent emergencies (directing to 108/112), and delivers call intelligence to business owners.

---

## 📦 Sector Packages Architecture (`backend/app/sectors/`)
Every sector is implemented as a self-contained, decoupled configuration package. **Adding a new sector requires creating only one package file** in `backend/app/sectors/` without touching engine code.

### The 6 Core Sector Packages:
1. **Panchayat / Govt Health Desk (`panchayat_health.py`)** *(Main sector, most polished)*:
   - **Slots:** `citizen_name`, `phone`, `village_ward`, `service_type` (vaccination, nurse home visit, health camp token, sanitation, fever alert), `preferred_date`, `preferred_time`, `details_note`.
   - **Urgent Keywords:** Chest pain, snake bite, breathless, infant fever, heavy bleeding.
2. **Primary Care Clinic (`clinic.py`)**:
   - **Slots:** `patient_name`, `phone`, `doctor_specialty`, `appointment_date`, `appointment_time`, `symptoms_note`.
   - **Conflict Detection:** Prevents double-booking same doctor specialty / slot.
3. **Veterinary & Cattle Care (`vet_clinic.py`)**:
   - **Slots:** `owner_name`, `phone`, `animal_type` (cow, goat, dog, cat, buffalo, poultry), `visit_mode` (clinic vs farm visit), `appointment_date`, `appointment_time`, `health_concern`.
4. **Hotel & Lodge (`hotel_lodge.py`)**:
   - **Slots:** `guest_name`, `phone`, `room_type` (Standard AC, Deluxe, Family Suite, Non-AC), `checkin_date`, `checkout_date`, `guests_count`, `special_requests`.
   - **Conflict Detection:** Date range check preventing overlapping bookings on room categories.
5. **Restaurant & Catering (`restaurant.py`)**:
   - **Slots:** `customer_name`, `phone`, `service_type` (Table dining vs Bulk catering), `headcount`, `event_date`, `event_time`, `menu_notes`.
6. **Coaching Centre (`coaching.py`)**:
   - **Slots:** `student_name`, `phone`, `target_exam` (TNPSC Grp 1/2/4, NEET, Banking), `enquiry_type` (Free demo class, fee structure, admission), `preferred_batch`, `demo_date`, `academic_notes`.

---

## 🔑 Demo Accounts & Sector Isolation
Each sector has a dedicated synthetic owner account for testing. **Sector data isolation is enforced at the database and API level**:

| Sector | Username | Password | Role | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Panchayat Health** | `panchayat_admin` | `vaayil123` | Owner | Selvi Anitha (Village Health Nurse) |
| **Clinic** | `clinic_admin` | `vaayil123` | Owner | Dr. Karthik Sundaram (M.B.B.S.) |
| **Veterinary Clinic** | `vet_admin` | `vaayil123` | Owner | Dr. Murugan Velu (B.V.Sc) |
| **Hotel / Lodge** | `hotel_admin` | `vaayil123` | Owner | R. Senthil Nathan (Front Desk) |
| **Restaurant** | `restaurant_admin` | `vaayil123` | Owner | Chef Sundaram Chettiar |
| **Coaching Centre** | `coaching_admin` | `vaayil123` | Owner | Prof. Vigneshwaran K |

*(Note: Clicking any sector on the hub allows instant login via the **⚡ 1-Click Enter** button).*

---

## 🚀 Quickstart Guide

### 1. Backend Server
```bash
# Windows PowerShell
$env:PYTHONPATH="backend"
.\backend\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Endpoint: `http://127.0.0.1:8000`
- Swagger Documentation: `http://127.0.0.1:8000/docs`

### 2. Frontend Web Application
```bash
cd frontend
npm run dev
```
- Frontend Web App: `http://127.0.0.1:5173`

---

## 🧪 Automated Tests (Phase 1 & Phase 2)
Run the 13 automated tests covering auth, sector package dynamic discovery, sector isolation, bookings CRUD, and conflict detection:

```bash
$env:PYTHONPATH="backend"
.\backend\venv\Scripts\python.exe -m pytest -v backend\tests\test_phase1.py backend\tests\test_phase2.py
```

### Verified Test Cases:
- `test_packages_registry_discovery`: 6 packages auto-discovered with multi-language prompts.
- `test_sector_detail_slots`: Dynamic slot definitions with pure Tamil and Tanglish questions.
- `test_demo_load_bookings`: Clearly labelled synthetic bookings seeded per sector.
- `test_sector_data_isolation`: Confirms Clinic user cannot read, update, or cancel Panchayat bookings (returns 403 Forbidden).
- `test_bookings_crud_workflow`: Full CRUD lifecycle (create, list, search, update notes, cancel).
- `test_conflict_detection`: Double-booking overlapping slots returns HTTP 409 Conflict.
- `test_missing_required_slots_validation`: Missing required slot inputs return HTTP 422.

---

## 🔬 Testing & Limitations (Phase 9)

Vaayil AI includes two dedicated diagnostic and safety auditing tools built directly into every sector workspace: the **Noise Lab** and the **Safety Test Sheet**.

### 1. Vaayil Noise Lab
The **Noise Lab** provides an empirical, reproducible benchmark of genuine **Gnani Prisma v3.0 (STT)** robustness against acoustic degradation.

#### Degradation Physics & Mathematics
When an audio sample is uploaded or recorded, the backend synthesizes multiple controlled acoustic variants:
1. **Original (Clean Baseline):** Unaltered 16-bit PCM WAV (16 kHz).
2. **Additive Gaussian Noise (AWGN):** Synthesizes stationary uncorrelated noise scaled to target Signal-to-Noise Ratio (SNR) in decibels:
   $$P_{\text{noise}} = \frac{P_{\text{signal}}}{10^{(\text{SNR}_{\text{dB}} / 10)}}$$
   - **Light Noise (20 dB SNR):** Simulates quiet indoor environments, ceiling fans, or gentle AC hum.
   - **Medium Noise (10 dB SNR):** Simulates rural tea stalls, busy offices, or moderate ambient chatter.
   - **Heavy Noise (3 dB SNR):** Simulates loud bus stands, roadside traffic, or crowded public markets.
3. **PSTN Telephony Simulation:**
   - **Bandpass Filtering:** 4th-order Butterworth filter restricted to the ITU-T G.712 speech passband (**300 Hz – 3400 Hz**).
   - **Downsampling:** Decimated to **8000 Hz** (G.711 / GSM FR PSTN standard sample rate) and reconstructed to 16000 Hz.
   - **Non-Linear Soft Saturation:** Compression via $y = \tanh(1.4 \cdot x) / 1.4$ simulating analog microphone diaphragm saturation and mu-law companding.
   - **Line Hiss:** Injects 30 dB SNR channel thermal noise.

#### Accuracy Metric & Formula
Every variant is passed through the real Gnani Prisma STT API (`POST /stt/v3`). Transcripts are evaluated against the reference text using tokenized Levenshtein dynamic programming:
- **Word Error Rate (WER):**
  $$\text{WER} = \frac{S + D + I}{N_{\text{ref}}}$$
  *(where $S$ = Substitutions, $D$ = Deletions, $I$ = Insertions, $N_{\text{ref}}$ = Total words in reference sentence)*
- **Word Match Accuracy %:**
  $$\text{Word Match Accuracy} = \max\left(0.0, 1.0 - \min(1.0, \text{WER})\right) \times 100\%$$

#### Limitations & Honest Caveats
- **Stationary vs Non-Stationary Noise:** Real-world acoustic noise in Tamil Nadu (tea shop tumbler clatter, bus horns, sudden wind) is highly non-stationary and bursty. Synthetic Gaussian noise is stationary.
- **Adaptive Codecs:** Mobile cellular networks (VoLTE / 4G) use adaptive multi-rate codecs (AMR-WB / EVS) and active noise-suppression chips that behave differently from linear filtering.
- **Temporary Storage Policy:** No audio is permanently stored on disk. All temporary WAV files are deleted in a `finally` block immediately after calling Prisma.

---

### 2. Safety Test Sheet (Urgent-Case Triage)
The **Safety Test Sheet** audits the rule-based safety triage detector against a rigorous **180-sentence ground-truth dataset** across Tamil script, Tanglish, and English for the **Health Help Desk**, **Clinic**, and **Veterinary Clinic** sectors.

#### Benchmark Categories
- **`urgent_true`:** Acute, life-threatening symptoms (e.g., severe chest pain, snake bites, baby dyspnea, cattle dystocia, animal organophosphate poisoning).
- **`normal_call`:** Routine inquiries, vaccination appointments, prescription refills, civil sanitation complaints.
- **`negated`:** Explicit symptom negations (e.g., *"no chest pain"*, *"nenju vali illa"*, *"rathapokku illai"*). Must **NOT** trigger an emergency alert.
- **`past_event`:** Historical medical episodes (e.g., *"last year I had a heart attack"*, *"munnadi nenju vali irundhadhu ippo sari"*). Must **NOT** trigger an emergency alert.
- **`spelling_variant` & `transcript_error`:** Common STT errors and phonetic misspellings (e.g., *"nenjovaly"*, *"accidant"*).

#### Metrics & Confusion Matrix
- **Recall (Sensitivity):** $\frac{\text{TP}}{\text{TP} + \text{FN}}$ — The critical safety metric measuring what fraction of real emergencies were successfully intercepted.
- **False Alarm Rate:** $\frac{\text{FP}}{\text{FP} + \text{TN}}$ — Percentage of ordinary callers unnecessarily alarmed or routed to emergency services.
- **Specificity:** $\frac{\text{TN}}{\text{TN} + \text{FP}}$ — Percentage of non-emergencies correctly permitted to proceed.
- **Clinical Disclaimer:** **"Keyword-based alert, not a medical diagnosis."** The voice agent explicitly directs callers to dial **108 (Ambulance)** or **112 (Emergency Services)** and alerts human staff; it never provides clinical diagnoses.

#### Weak Spots & Rule Improvement Protocol
The benchmark exposes real weaknesses:
1. Non-standard Tanglish phonetic spellings not in the current keyword dictionary (e.g., `CL-49` *"nenjovaly"* vs *"nenju vali"*).
2. Complex temporal clauses in past events that lack explicit prepositional anchors.
Per project safety rules, **all proposed rule improvements are staged for user review and approval before modifying production detection logic**.

---

## 🗺️ Implementation Roadmap
- **[x] Phase 1:** Project structure, backend, database models, health check, Vaayil Hub 3D scene & demo auth.
- **[x] Phase 2:** Sector packages config system, workspace shell (collapsible sidebar & mobile bottom nav), Bookings CRUD, conflict detection & Demo Mode.
- **[x] Phase 3:** Audio recording/upload & genuine Gnani Prisma STT integration with editable transcript.
- **[x] Phase 4:** Slot-filling state machine & Tamil/Tanglish number/date/time parsing.
- **[x] Phase 5:** Genuine Gnani Timbre TTS integration & interactive 3D Voice Orb.
- **[x] Phase 6:** Confirmation, transactional save, call logs, insights, urgent detection & review queue.
- **[x] Phase 7:** Remaining sectors polish (Veterinary, Restaurant, Coaching) & Live Analytics Dashboard.
- **[x] Phase 8:** 3D Vaayil Hub with central portal, orbital sector nodes, and premium UI polish.
- **[x] Phase 9:** Noise Lab, DSP degradation pipeline, and Safety Test Sheet with 180-sentence benchmark.
- **[ ] Phase 10:** Polish, responsiveness, comprehensive automated test suites & deployment.

---

## 🧪 Testing and Limitations

### Noise Lab

The **Noise Lab** (accessible from the sidebar: *Noise Lab*) lets you stress-test Gnani Prisma STT under controlled synthetic noise conditions.

#### How to run a Noise Lab test
1. Navigate to **Noise Lab** in the workspace sidebar.
2. Record a clean audio sample (use the **Record Clean Audio** button) or upload a `.wav`/`.webm` file.
3. Type the **exact sentence spoken** in the *Reference Text* field, or pick a preset.
4. Select noise levels (Light / Medium / Heavy) and optionally enable PSTN Phone Simulation.
5. Click **Run Real Noise Benchmark on Prisma STT**.
6. Results appear side-by-side: the original baseline and each degraded variant, with real Prisma transcripts.
7. Optionally **Save Run** to store results, or **Export CSV** for a spreadsheet.

#### Tamil sentence example
> Record yourself saying: **"நாளைக்கு மருத்துவர் appointment காலை 10 மணிக்கு confirm பண்ணுங்க"**  
> Type that sentence as the Reference Text and select language mode **Tanglish**.

#### Metrics explained
| Metric | Meaning |
|--------|---------|
| **Word Accuracy %** | Percentage of reference words correctly transcribed. Higher is better. |
| **WER % (Word Error Rate)** | Fraction of words with substitution, deletion or insertion errors. **Lower is better.** Formula: `WER = (S + D + I) / N_ref` |
| **S / D / I** | Substitutions / Deletions / Insertions — the three error types in Levenshtein alignment. |
| **Latency (ms)** | Round-trip time for the Prisma API call. |

#### ⚠️ Limitations
- **Synthetic noise is a rough test, not a guarantee of real-world performance.** Real telephony involves codec artefacts, room acoustics, speaker variation and network jitter that this lab cannot fully replicate.
- The lab uses `librosa` and `soundfile` for DSP; results depend on the input file format and sample rate.
- Prisma API quotas and network latency affect results independently of audio quality.
- Raw audio is never stored permanently — temporary files are deleted immediately after each experiment.
- WER is computed on word tokens; it does not distinguish semantic importance (missing "no" before "chest pain" counts the same as missing "appointment").

---

### Safety Test Sheet

The **Safety Test Sheet** (sidebar: *Safety Test Sheet*) benchmarks the keyword-based urgent-case detector against a labelled dataset of 180 sentences (60 each for Health Help Desk, Clinic and Veterinary sectors).

#### How to run a benchmark
1. Navigate to **Safety Test Sheet** in the workspace sidebar.
2. Select a sector filter (All Sectors / Health Help Desk / Clinic / Veterinary).
3. The benchmark runs automatically on page load; click the sector filter buttons to re-run for a subset.
4. Review results across four tabs: **Overview**, **Misses**, **False Alarms** and **Suggestions**.

#### Safety Test Sheet run example
1. Open Safety Test Sheet.
2. Click **Health Help Desk (60)** filter.
3. Observe the Recall %, False Alarm Rate % and confusion matrix.
4. Click the **Misses** tab to see which real urgent cases the detector failed to catch.
5. Click the **Suggestions** tab for proposed keyword additions — these are presented for review only; the production detector is **not changed** until you approve.

#### Dataset categories
| Category | Description |
|----------|-------------|
| `urgent_case` | Real emergencies — chest pain, heavy bleeding, accidents, snake bite, etc. Must be caught. |
| `normal_call` | Routine calls — bookings, inquiries, prescription refills. Must NOT be flagged. |
| `negated` | Sentences with explicit negation ("no chest pain", "nenju vali illa"). Must NOT trigger alert. |
| `past_event` | Historical mentions ("last year I had a heart attack"). Must NOT trigger alert. |
| `spelling_variant` | Common STT errors and phonetic variants ("nenjovaly", "accidant"). |

#### Metrics explained
| Metric | Formula | Target |
|--------|---------|--------|
| **Recall (Sensitivity)** | TP / (TP + FN) | As high as possible — missing an emergency is the most dangerous error |
| **False Alarm Rate** | FP / (FP + TN) | As low as possible — unnecessary alarms erode trust |
| **Specificity** | TN / (TN + FP) | Complement of false alarm rate |
| **Accuracy** | (TP + TN) / Total | Overall correct classifications |

#### ⚠️ Limitations
- **Keyword-based alert, not a medical diagnosis.** The detector matches words and phrases; it has no clinical reasoning capability.
- Negation and past-event handling uses simple pattern rules — complex, nested or unusual sentence structures may evade detection.
- The 180-sentence dataset covers common scenarios but cannot represent the full diversity of real caller language.
- Results depend on the current keyword list in Settings. Editing keywords changes recall and false-alarm rates.
- Always verify any flagged alert with a qualified medical or veterinary professional before taking clinical action.
- The system is designed to alert human staff, not to replace them.
