# CrisisLink: AI-Powered Emergency Triage System
**Hackathon Project Summary for AI/LLM Context**

## 1. Project Overview
CrisisLink is a Next.js web application designed to bridge the communication gap during emergencies. It allows victims to input distress messages (via text in any language or via microphone audio) and uses advanced AI to translate, extract critical triage data, and automatically dispatch help.

## 2. Tech Stack
- **Framework:** Next.js (App Router), React, TypeScript
- **Styling:** Tailwind CSS, Lucide React (Icons)
- **AI Model:** Google Gemini 3.6 Flash (@google/genai SDK)
- **Email Delivery:** Resend SDK
- **APIs Used:** Browser Geolocation API, Nominatim OpenStreetMap API (Reverse Geocoding)
- **Deployment:** Vercel

## 3. Core Features & Capabilities
### A. Multilingual & Multimodal Triage (Gemini 3.6 Flash)
- **Text:** Accepts text in any language.
- **Audio:** Uses the browser's MediaRecorder API to capture microphone audio as audio/webm, converts it to Base64, and feeds it directly to Gemini as inlineData.
- **Structured Extraction:** Forces Gemini to output a strict JSON schema containing:
  - severity (Critical, High, Medium, Low)
  - location (Extracted from text or fallback to GPS)
  - symptoms (Array of key injuries/hazards)
  - key_details (1-2 sentence summary)
  - translation (Direct English translation)
  - emergency_number (Dynamically localized based on region)

### B. Intelligent Location & Routing
- **Reverse Geocoding:** Automatically prompts the user for GPS access (navigator.geolocation). Converts raw coordinates (Lat/Lng) into a readable street address using the free Nominatim API.
- **Dynamic Emergency Numbers:** Gemini reads the reverse-geocoded address and dynamically determines the local emergency number (e.g., 911 in the US, 112 in Europe, 100 in India) for the frontend "Escalate" button.

### C. Automated Volunteer Dispatch
- Uses the **Resend API** to instantly fire off a highly structured email to registered volunteer responders the moment the AI finishes parsing the emergency.
- The UI actively reflects this state with a "Pinging Local Volunteers..." indicator.

## 4. Architecture Flow
1. **User Input:** User types a message or records audio. GPS is fetched and reverse-geocoded.
2. **API Route (/api/triage):** Frontend sends { text, audioBase64, mimeType, gpsLocation } to the Next.js backend.
3. **AI Processing:** The backend constructs a prompt instructing Gemini to act as an emergency dispatcher. It feeds the text/audio and the GPS string to Gemini.
4. **Email Dispatch:** The backend receives the parsed JSON from Gemini, formats it into an alert template, and sends it via Resend.
5. **UI Update:** The backend returns the JSON to the frontend, which renders the Triage Dashboard and dynamic emergency buttons.
