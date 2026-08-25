# 🆘 CrisisLink

**AI-Powered Emergency Triage & Volunteer Dispatch System**

CrisisLink bridges the communication gap in emergencies. A victim in distress — speaking any language, in any panic-driven, broken message — can reach out by text or voice, and CrisisLink instantly translates it, extracts life-critical details, and alerts nearby volunteer responders. No forms. No delays. No language barrier.

---

## 🚨 The Problem

When something goes wrong, people don't call in perfect sentences. They're panicked, injured, speaking a local dialect, or too hurt to type clearly. Emergency systems built around rigid forms and English-only hotlines lose critical seconds — and in an emergency, seconds save lives.

## 💡 The Solution

CrisisLink lets anyone send a raw distress message — typed in any language, or spoken into their microphone — and an AI triage engine does the rest:

1. **Understands** the message (any language, text or audio)
2. **Extracts** what matters: severity, symptoms, location, a clear summary
3. **Locates** the victim via GPS + reverse geocoding
4. **Escalates** with the correct local emergency number
5. **Dispatches** volunteer responders automatically via email — in seconds

---

## ✨ Key Features

### 🌐 Multilingual & Multimodal Triage
- Accepts **text in any language** — no translation step required from the user
- Accepts **live microphone audio**, recorded in-browser and sent straight to the AI
- Outputs a strict, structured JSON triage record every time:

| Field | Description |
|---|---|
| `severity` | Critical / High / Medium / Low |
| `location` | Extracted from message, or GPS fallback |
| `symptoms` | Key injuries / hazards, as a list |
| `key_details` | 1–2 sentence human-readable summary |
| `translation` | Direct English translation of the message |
| `emergency_number` | Correct local emergency number for the region |

### 📍 Intelligent Location & Routing
- Requests GPS access and **reverse-geocodes** coordinates into a readable street address
- **Dynamically resolves the correct local emergency number** (e.g. 911, 112, 100) based on where the victim actually is — no hardcoded country logic

### 📣 Automated Volunteer Dispatch
- The moment triage data is parsed, CrisisLink **automatically emails registered volunteer responders** with the full structured alert
- The UI reflects this live with a "Pinging Local Volunteers..." status, so the user knows help is already on the way

---

## 🏗️ How It Works

```
 ┌──────────────┐        ┌────────────────────┐        ┌───────────────────┐
 │   Victim      │  text/  │   Next.js Frontend │  POST   │  /api/triage       │
 │  (browser)    │  audio  │  + GPS capture      │ ──────▶ │  (API Route)      │
 └──────────────┘        └────────────────────┘        └─────────┬─────────┘
                                                                    │
                                    ┌───────────────────────────────┼───────────────────────────────┐
                                    ▼                                                                ▼
                         ┌─────────────────────┐                                         ┌─────────────────────┐
                         │  Nominatim (OSM)     │                                         │  Google Gemini       │
                         │  Reverse Geocoding   │                                         │  (text + audio in)   │
                         └─────────────────────┘                                         └──────────┬──────────┘
                                                                                                        │
                                                                                             structured triage JSON
                                                                                                        │
                                                                                                        ▼
                                                                                            ┌─────────────────────┐
                                                                                            │   Resend API          │
                                                                                            │  Volunteer email alert │
                                                                                            └──────────┬──────────┘
                                                                                                        │
                                                                                                        ▼
                                                                                          Triage Dashboard renders
                                                                                          in the victim's browser
```

**Step by step:**
1. The victim types a message or records audio; the browser also fetches GPS coordinates and reverse-geocodes them.
2. The frontend sends `{ text, audioBase64, mimeType, gpsLocation }` to the `/api/triage` Next.js API route.
3. The backend prompts Gemini — acting as an emergency dispatcher — with the text/audio plus the GPS string.
4. Gemini returns structured triage JSON, which the backend formats into an alert and sends via Resend to volunteer responders.
5. The same JSON is returned to the frontend, which renders the Triage Dashboard and a one-tap "Escalate" button dialing the correct local emergency number.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router), React, TypeScript |
| Styling | Tailwind CSS, Lucide React |
| AI | Google Gemini (`@google/genai` SDK) — multilingual, multimodal triage |
| Email | Resend SDK — automated volunteer dispatch |
| Location | Browser Geolocation API + Nominatim (OpenStreetMap) reverse geocoding |
| Deployment | Vercel |

---

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/PranavShripannavar/crisislink.git
cd crisislink

# Install dependencies
npm install

# Add environment variables
cp .env.example .env.local
# Fill in your GEMINI_API_KEY and RESEND_API_KEY

# Run locally
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and grant microphone + location permissions to try a full triage flow.

---

## 🎯 Why It Matters

- **No language barrier** — victims communicate in their own words, in their own language
- **No app install, no account** — open a browser, speak or type
- **Volunteers respond faster** — structured alerts land in inboxes within seconds of the message being sent
- **Works in the worst conditions** — built for panic, not for perfect input
