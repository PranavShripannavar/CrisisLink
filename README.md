
# ðŸ†˜ CrisisLink

**AI-Powered Emergency Triage & Volunteer Dispatch System**

CrisisLink bridges the communication gap in emergencies. A victim in distress â€” speaking any language, in any panic-driven, broken message â€” can reach out by text or voice, and CrisisLink instantly translates it, extracts life-critical details, and alerts nearby volunteer responders. No forms. No delays. No language barrier.

---

## ðŸš¨ The Problem

When something goes wrong, people don't call in perfect sentences. They're panicked, injured, speaking a local dialect, or too hurt to type clearly. Emergency systems built around rigid forms and English-only hotlines lose critical seconds â€” and in an emergency, seconds save lives.

## ðŸ’¡ The Solution

CrisisLink lets anyone send a raw distress message â€” typed in any language, or spoken into their microphone â€” and an AI triage engine does the rest:

1. **Understands** the message (any language, text or audio)
2. **Extracts** what matters: severity, symptoms, location, a clear summary
3. **Locates** the victim via GPS + reverse geocoding
4. **Escalates** with the correct local emergency number
5. **Dispatches** volunteer responders automatically via email â€” in seconds

---

## âœ¨ Key Features

### ðŸŒ Multilingual & Multimodal Triage
- Accepts **text in any language** â€” no translation step required from the user
- Accepts **live microphone audio**, recorded in-browser and sent straight to the AI
- Outputs a strict, structured JSON triage record every time:

| Field | Description |
|---|---|
| `severity` | Critical / High / Medium / Low |
| `location` | Extracted from message, or GPS fallback |
| `symptoms` | Key injuries / hazards, as a list |
| `key_details` | 1â€“2 sentence human-readable summary |
| `translation` | Direct English translation of the message |
| `emergency_number` | Correct local emergency number for the region |

### ðŸ“ Intelligent Location & Routing
- Requests GPS access and **reverse-geocodes** coordinates into a readable street address
- **Dynamically resolves the correct local emergency number** (e.g. 911, 112, 100) based on where the victim actually is â€” no hardcoded country logic

### ðŸ“£ Automated Volunteer Dispatch
- The moment triage data is parsed, CrisisLink **automatically emails registered volunteer responders** with the full structured alert
- The UI reflects this live with a "Pinging Local Volunteers..." status, so the user knows help is already on the way

---

## ðŸ—ï¸ How It Works

```
 â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
 â”‚   Victim      â”‚  text/  â”‚   Next.js Frontend â”‚  POST   â”‚  /api/triage       â”‚
 â”‚  (browser)    â”‚  audio  â”‚  + GPS capture      â”‚ â”€â”€â”€â”€â”€â”€â–¶ â”‚  (API Route)      â”‚
 â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                                                    â”‚
                                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                                    â–¼                                                                â–¼
                         â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                                         â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                         â”‚  Nominatim (OSM)     â”‚                                         â”‚  Google Gemini       â”‚
                         â”‚  Reverse Geocoding   â”‚                                         â”‚  (text + audio in)   â”‚
                         â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                                         â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                                                                                        â”‚
                                                                                             structured triage JSON
                                                                                                        â”‚
                                                                                                        â–¼
                                                                                            â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                                                                                            â”‚   Resend API          â”‚
                                                                                            â”‚  Volunteer email alert â”‚
                                                                                            â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                                                                                        â”‚
                                                                                                        â–¼
                                                                                          Triage Dashboard renders
                                                                                          in the victim's browser
```

**Step by step:**
1. The victim types a message or records audio; the browser also fetches GPS coordinates and reverse-geocodes them.
2. The frontend sends `{ text, audioBase64, mimeType, gpsLocation }` to the `/api/triage` Next.js API route.
3. The backend prompts Gemini â€” acting as an emergency dispatcher â€” with the text/audio plus the GPS string.
4. Gemini returns structured triage JSON, which the backend formats into an alert and sends via Resend to volunteer responders.
5. The same JSON is returned to the frontend, which renders the Triage Dashboard and a one-tap "Escalate" button dialing the correct local emergency number.
