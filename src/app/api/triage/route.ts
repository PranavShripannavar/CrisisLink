import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

// Initialize the Gemini API client
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text input is required' }, { status: 400 });
    }

    // We use gemini-3.6-flash as it's fast and perfect for quick data extraction
    const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `You are an expert emergency medical dispatcher assistant. 
        Your job is to analyze incoming distress messages, translate them to English if necessary, 
        and extract key triage information. Analyze the following text: "${text}"`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    translation: {
                        type: Type.STRING,
                        description: "The English translation of the text. If already in English, just return the original text."
                    },
                    severity: {
                        type: Type.STRING,
                        description: "The urgency of the situation.",
                        enum: ["Low", "Medium", "High", "Critical"]
                    },
                    location: {
                        type: Type.STRING,
                        description: "The location of the emergency. Return 'Unknown' if not specified."
                    },
                    symptoms: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.STRING
                        },
                        description: "A list of reported symptoms or injuries."
                    },
                    key_details: {
                        type: Type.STRING,
                        description: "A brief 1-2 sentence summary of the emergency."
                    }
                },
                required: ["translation", "severity", "location", "symptoms", "key_details"]
            }
        }
    });

    const resultText = response.text;
    if (!resultText) {
        throw new Error("No response text from Gemini");
    }
    
    const parsedData = JSON.parse(resultText);

    // ==========================================
    // CASPIAN SDK INTEGRATION: Dispatch Email
    // ==========================================
    try {
        const { Caspian } = await import('caspian-sdk');
        const cx = new Caspian();
        
        // Ensure the email channel is registered for outboxing
        // This requires CASPIAN_API_KEY in your Vercel env variables eventually
        await cx.channels.add("email", { 
            via: "hosted", 
            apiKey: process.env.CASPIAN_API_KEY || "dummy-key" 
        });

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

        // Proactively send a message to the volunteer via Caspian
        // In Caspian, you typically dispatch to a specific channel address
        await cx.send({
            channel: "email",
            to: "shripannavarpranav@gmail.com", // Your volunteer email
            subject: `[${parsedData.severity.toUpperCase()}] Emergency Alert at ${parsedData.location}`,
            text: emailBody
        });
        console.log("Caspian SDK: Volunteer email dispatched successfully.");
    } catch (caspianErr) {
        // We log the error but don't crash the main API response so the UI still works
        console.error("Failed to send email via Caspian SDK:", caspianErr);
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
