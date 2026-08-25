import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

// Initialize the Gemini API client
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export async function POST(request: Request) {
  try {
    const { text, audioBase64, mimeType } = await request.json();

    if (!text && !audioBase64) {
      return NextResponse.json({ error: 'Text or audio input is required' }, { status: 400 });
    }

    // Prepare contents array for Gemini
    const contents: any[] = [
      {
        text: `You are an expert emergency medical dispatcher assistant. 
        Your job is to analyze incoming distress messages (which may be text or audio), translate them to English if necessary, 
        and extract key triage information. Analyze the following message:`
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

    // We use gemini-3.6-flash as it's fast and perfect for quick data extraction and multimodal understanding
    const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: contents,
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
