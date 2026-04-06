<div align="center">

```
███╗   ███╗███████╗██████╗ ██╗ ██████╗ ██╗   ██╗██╗██████╗ ███████╗
████╗ ████║██╔════╝██╔══██╗██║██╔════╝ ██║   ██║██║██╔══██╗██╔════╝
██╔████╔██║█████╗  ██║  ██║██║██║  ███╗██║   ██║██║██║  ██║█████╗
██║╚██╔╝██║██╔══╝  ██║  ██║██║██║   ██║██║   ██║██║██║  ██║██╔══╝
██║ ╚═╝ ██║███████╗██████╔╝██║╚██████╔╝╚██████╔╝██║██████╔╝███████╗
╚═╝     ╚═╝╚══════╝╚═════╝ ╚═╝ ╚═════╝  ╚═════╝ ╚═╝╚═════╝ ╚══════╝
```

**AI-Powered Medical Assistance for Travelers**

_You're sick. Alone. In a country where you don't speak the language._
_MediGuide finds the right doctor, explains your symptoms, and keeps your family informed._

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?style=flat-square&logo=google)](https://deepmind.google/gemini)

</div>

---

## The Problem

Every year, **2.3 billion** people travel internationally. When they get sick abroad, they face a triple barrier: they don't know which hospital to go to, they can't communicate their symptoms to the doctor, and their family back home has no idea what's happening.

MediGuide solves all three in under 90 seconds.

---

## What It Does

```
Patient feels ill
       ↓
Describe symptoms in any language
       ↓
AI triage → severity score + specialty recommendation
       ↓
Google Places → real nearby hospitals, ranked by match score
       ↓
One-tap booking → AI-written intake note for the doctor
       ↓
Family report → sent to loved ones in plain language
```

### Key Features

- **Clinical AI Triage** — Gemini 2.5 Flash assesses severity (1–10), detects red flags, recommends the right specialty, and triggers a second opinion for borderline cases
- **Real-Time Hospital Search** — Google Places API finds actual hospitals near the patient's GPS location, ranked by distance, rating, specialty match, and whether they're open right now
- **Multilingual Symptom Card** — A translated card the patient shows directly to the doctor — no interpreter needed
- **Smart Escalation** — Python-based red flag detection that overrides the AI score if critical keywords are found (chest pain, difficulty breathing, etc.)
- **Age/Gender Adjustments** — Automatically escalates severity for high-risk groups (elderly + cardiac, children with fever, etc.)
- **Family Report** — One click generates a compassionate, jargon-free medical summary with cost breakdown, shareable via email or WhatsApp
- **Emergency Fast-Track** — Score ≥ 8 triggers an emergency call banner with direct dial to 112

---

## Tech Stack

### Backend

| Layer         | Technology                                        |
| ------------- | ------------------------------------------------- |
| API Framework | FastAPI (async)                                   |
| AI / LLM      | Google Gemini 2.5 Flash via LangChain             |
| Hospital Data | Google Places API (Nearby Search + Place Details) |
| Database      | PostgreSQL via SQLAlchemy (async)                 |
| Auth Webhooks | Clerk + Svix                                      |
| Runtime       | Python 3.11+ with Uvicorn                         |

### Frontend

| Layer      | Technology                            |
| ---------- | ------------------------------------- |
| Framework  | Next.js 16.2 (App Router)             |
| Language   | TypeScript 5                          |
| Styling    | Tailwind CSS 4 + custom CSS variables |
| Components | Radix UI + shadcn/ui                  |
| Auth       | Clerk (Next.js SDK)                   |
| Fonts      | Bebas Neue (display) + Barlow (body)  |

---

## Project Structure

```
mediguide/
├── backend/
│   ├── main.py                        # FastAPI app, middleware, router registration
│   ├── requirements.txt
│   └── src/
│       ├── database/
│       │   └── db.py                  # Async SQLAlchemy engine + session
│       ├── models/
│       │   └── models.py              # User, SymptomReport, Booking tables
│       ├── routes/
│       │   ├── triage.py              # POST /triage — core AI triage + hospital search
│       │   ├── bookings.py            # POST /bookings, POST /bookings/family-report
│       │   ├── translate.py           # POST /translate — multilingual support
│       │   └── webhooks.py            # POST /webhooks/clerk — user sync
│       ├── schemas/
│       │   └── schemas.py             # Pydantic response schemas
│       └── utils.py                   # Clerk auth helper
│
└── frontend/
    ├── app/
    │   ├── layout.tsx                 # Root layout — nav, Clerk provider, fonts
    │   ├── globals.css                # Design system — colors, animations, utilities
    │   ├── page.tsx                   # / — Landing page
    │   ├── triage/page.tsx            # /triage — Symptom input + GPS
    │   ├── results/page.tsx           # /results — AI assessment + hospital cards
    │   ├── book/page.tsx              # /book — Patient form + emergency contact
    │   └── confirmation/page.tsx      # /confirmation — Confirmed + family report
    ├── lib/
    │   └── api.ts                     # Typed API client for all backend calls
    └── components/ui/                 # shadcn/ui components
```

---

## API Reference

### `POST /triage`

The core endpoint. Runs AI triage and hospital search in parallel.

**Request**

```json
{
  "symptoms": "Severe chest pain radiating to my left arm, started 20 minutes ago",
  "latitude": 35.6762,
  "longitude": 139.6503,
  "language": "en",
  "radius_meters": 15000,
  "age": 52,
  "gender": "male"
}
```

**Response**

```json
{
  "report_id": 42,
  "severity": "emergency",
  "severity_score": 9,
  "severity_color": "red",
  "urgency_label": "emergency",
  "recommended_specialty": "Cardiologist",
  "ai_summary": "Symptoms are consistent with possible acute cardiac event...",
  "action_advice": "Call emergency services immediately. Do not drive yourself.",
  "symptom_card": "胸の激しい痛みが左腕に広がっています。20分前から始まりました...",
  "confidence_score": 0.94,
  "red_flags": ["chest pain", "male 40+ with possible cardiac symptoms"],
  "escalation_action": "CALL_EMERGENCY",
  "escalation_message": "🚨 Call 112 immediately or go to nearest Emergency Room.",
  "hospitals": [...],
  "emergency_call_advised": true,
  "total_hospitals_found": 12
}
```

### `POST /bookings`

Creates a booking and generates a clinical intake note for hospital staff.

### `POST /bookings/family-report`

Generates a compassionate, plain-language summary for the patient's family.

### `POST /translate`

Translates any text to 15 languages with phonetic romanization for non-Latin scripts.

---

## How the Triage Agent Works

```
Incoming symptoms
       │
       ├─► Python red flag scan (keyword match, instant)
       │
       ├─► Gemini 2.5 Flash primary assessment
       │       - Severity score 1–10
       │       - Specialty mapping
       │       - Confidence score
       │       - Symptom card translation
       │
       ├─► Age/gender adjustments (pure Python rules)
       │       - Child < 5 with fever → +1 severity, → Pediatrician
       │       - Elderly + cardiac → +1 severity
       │       - Male 40+ + chest pain → red flag added
       │
       ├─► Escalation override
       │       - If red flags found and score < 8 → force to 8 (HIGH)
       │
       └─► Second opinion (borderline cases: score 5 or 6 only)
               - Second Gemini call with senior reviewer prompt
               - Conservative: if in doubt, escalate
```

The triage agent and Google Places fetch run via `asyncio.gather` — in parallel, not sequentially. The LangChain `invoke()` call is wrapped in `asyncio.to_thread()` to keep the FastAPI event loop non-blocking.

### Hospital Scoring

Each Google Places result is scored:

| Factor                                       | Points |
| -------------------------------------------- | ------ |
| Distance (closer = better, scaled to radius) | 0–35   |
| Google rating (× 5)                          | 0–25   |
| Open right now                               | +15    |
| Closed                                       | −20    |
| Confirmed `hospital` type in Places data     | +10    |
| Emergency type + severity ≥ 8                | +20    |

---

## Setup & Installation

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL database
- Google Cloud account (Places API enabled)
- Gemini API key
- Clerk account

### 1. Clone the repo

```bash
git clone https://github.com/your-org/mediguide.git
cd mediguide
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/mediguide
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_PLACES_API_KEY=your_google_places_api_key
CLERK_WEBHOOK_SECRET=whsec_...
CLERK_SECRET_KEY=sk_test_...
JWT_KEY=your_clerk_jwt_key
```

Start the server:

```bash
uvicorn main:app --reload --port 8000
```

The database tables are created automatically on first startup via `init_db()`.

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Clerk webhook (local dev)

Use [ngrok](https://ngrok.com) or Clerk's dev tunnel to expose your local backend, then add the webhook endpoint in your Clerk dashboard:

```
https://your-tunnel.ngrok.io/webhooks/clerk
```

Enable the `user.created` event.

---

## Environment Variables

### Backend

| Variable                | Required | Description                                                |
| ----------------------- | -------- | ---------------------------------------------------------- |
| `DATABASE_URL`          | ✅       | PostgreSQL connection string (use `postgresql+asyncpg://`) |
| `GEMINI_API_KEY`        | ✅       | Google Gemini API key                                      |
| `GOOGLE_PLACES_API_KEY` | ✅       | Google Cloud Places API key                                |
| `CLERK_WEBHOOK_SECRET`  | ✅       | Svix webhook signing secret from Clerk dashboard           |
| `CLERK_SECRET_KEY`      | ✅       | Clerk backend secret key                                   |
| `JWT_KEY`               | ✅       | Clerk JWT verification key                                 |

### Frontend

| Variable                            | Required | Description           |
| ----------------------------------- | -------- | --------------------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅       | Clerk publishable key |
| `CLERK_SECRET_KEY`                  | ✅       | Clerk secret key      |
| `NEXT_PUBLIC_API_URL`               | ✅       | Backend API base URL  |

---

## Google Cloud Setup

You need two APIs enabled in Google Cloud Console:

1. **Places API (New)** — for `nearbysearch` and `place details`
2. _(Optional)_ **Maps JavaScript API** — if you add a map view later

Restrict your API key to these APIs and your domain in production.

---

## Database Schema

```
users
  id, clerk_id, email, name, avatar_url, created_at

symptom_reports
  id, user_id*, symptoms_raw, triage_result (JSON),
  severity, recommended_specialty,
  user_latitude, user_longitude, user_language, created_at

bookings
  id, user_id*, symptom_report_id*,
  hospital_place_id, hospital_name, hospital_address, hospital_phone,
  patient_name, patient_age, patient_gender, patient_blood_type, patient_allergies,
  emergency_contact_name, emergency_contact_phone, emergency_contact_email,
  status, ambulance_requested, notes, estimated_cost_usd,
  family_report_sent, family_report_text, created_at
```

_nullable foreign keys — works without auth for emergency access_

Hospital data is **not stored** — it's fetched live from Google Places on every triage request, so results are always real and up to date.

---

## Design System

The UI uses a custom dark clinical theme — no external component libraries for core styling:

| Token                  | Value     | Usage                         |
| ---------------------- | --------- | ----------------------------- |
| `--background`         | `#070b0f` | App background                |
| `--card`               | `#111820` | Card surfaces                 |
| `--primary`            | `#00d4a8` | Teal accent, CTAs, highlights |
| `--foreground`         | `#dceaf7` | Primary text                  |
| `--foreground-dim`     | `#8aa0b8` | Secondary text                |
| `--severity-emergency` | `#ef4444` | Red — emergency severity      |
| `--severity-high`      | `#f97316` | Orange — high severity        |
| `--severity-medium`    | `#f59e0b` | Amber — medium severity       |
| `--severity-low`       | `#22c55e` | Green — low severity          |

Display font: **Bebas Neue** — bold, clinical, memorable.
Body font: **Barlow** — clean, readable, modern.

---

## Roadmap

### Phase 1 — Current MVP

- [x] AI triage with severity scoring
- [x] Real-time hospital search via Google Places
- [x] Booking flow with patient intake note
- [x] Multilingual symptom card
- [x] Family report generation
- [x] Clerk authentication

### Phase 2 — Next

- [ ] In-app live translation during doctor visits (audio)
- [ ] WhatsApp notification integration (Twilio)
- [ ] Push notifications for booking status
- [ ] Hospital reviews and wait-time data

### Phase 3 — Scale

- [ ] Insurance claim assistance
- [ ] Direct hospital API integrations
- [ ] Offline mode for low-connectivity areas
- [ ] Mobile apps (React Native)

---

## Important Disclaimers

> **MediGuide is not a substitute for professional medical advice, diagnosis, or treatment.** The AI triage system is designed to assist travelers in finding appropriate care quickly — not to replace a doctor's judgment. In a life-threatening emergency, always call your local emergency number first.

> The confidence score and severity assessment are AI-generated estimates. Always follow the advice of a licensed medical professional.

---

## License

Proprietary — All rights reserved © MediGuide 2025

---

<div align="center">

Built for travelers. Designed for emergencies. Powered by AI.

</div>
