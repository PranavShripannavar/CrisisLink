import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

// Initialize the Gemini API client
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export async function POST(request: Request) {
  try {
    const { text, audioBase64, mimeType, gpsLocation } = await request.json();

    if (!text && !audioBase64) {
      return NextResponse.json({ error: 'Text or audio input is required' }, { status: 400 });
    }

    // Prepare contents array for Gemini
    const contents: any[] = [
      {
        text: `You are an expert emergency medical dispatcher assistant. 
        Your job is to analyze incoming distress messages (which may be text or audio), translate them to English if necessary, 
        and extract key triage information. ${gpsLocation ? `\n\nThe user's exact device GPS address is: ${gpsLocation}. If the user does not specify a location in their message, use this GPS address as the location, but keep it concise (e.g. just the street and city).` : ''} 
        
        Analyze the following message:`
      }
    ];

    if (text && text !== "🎤 [Audio message recorded]") {
      contents.push({ text: `\n\nText Message: "${text}"` });
    }

    if (audioBase64 && mimeType) {
      contents.push({
        inlineData: {
          data: audioBase64,
          mimeType: mimeType
        }
      });
    }

    // We fallback to gemini-2.0-flash as it's highly stable and avoids 503 errors
    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: contents,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    severity: {
                        type: Type.STRING,
                        description: "The severity level of the emergency. Must be exactly one of: Critical, High, Medium, Low.",
                        enum: ["Critical", "High", "Medium", "Low"]
                    },
                    location: {
                        type: Type.STRING,
                        description: "The location of the emergency extracted from the message or GPS."
                    },
                    emergency_number: {
                        type: Type.STRING,
                        description: "The standard emergency phone number for the identified location (e.g., 911 for US, 112 for EU, 100 or 112 for India)."
                    },
                    symptoms: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "List of key symptoms, injuries, or hazards mentioned."
                    },
                    key_details: {
                        type: Type.STRING,
                        description: "A short, 1-2 sentence summary of what is happening."
                    },
                    translation: {
                        type: Type.STRING,
                        description: "The direct English translation of the user's message. If it is already in English, return the original message."
                    }
                },
                required: ["severity", "location", "emergency_number", "symptoms", "key_details", "translation"]
            }
        }
    });

    const resultText = response.text;
    if (!resultText) {
        throw new Error("No response text from Gemini");
    }
    
    const parsedData = JSON.parse(resultText);

    // ==========================================
    // RESEND SDK INTEGRATION: Dispatch Email
    // ==========================================
    try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        // Format the email body
        const emailBody = `
🚨 EMERGENCY TRIAGE ALERT 🚨
Severity: ${parsedData.severity}
Location: ${parsedData.location}

Summary: ${parsedData.key_details}

Symptoms: ${parsedData.symptoms?.join(", ")}

Original Translated Text: 
"${parsedData.translation}"
        `;

        // Proactively send a message to the volunteer via Resend
        await resend.emails.send({
            from: 'CrisisLink <onboarding@resend.dev>',
            to: ['shripannavarpranav@gmail.com'], // Your volunteer email
            subject: `[${parsedData.severity.toUpperCase()}] Emergency Alert at ${parsedData.location}`,
            text: emailBody
        });
        
        console.log("Resend SDK: Volunteer email dispatched successfully.");
    } catch (emailErr) {
        // We log the error but don't crash the main API response so the UI still works
        console.error("Failed to send email via Resend SDK:", emailErr);
    }
    // ==========================================

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Error in triage API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process the text.' },
      { status: 500 }
    );
  }
}
