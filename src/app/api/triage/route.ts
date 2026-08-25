import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

// Initialize the Gemini API client
// It automatically picks up the GEMINI_API_KEY environment variable
const ai = new GoogleGenAI({});

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text input is required' }, { status: 400 });
    }

    // We use gemini-2.5-flash as it's fast and perfect for quick data extraction
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Error in triage API:', error);
    return NextResponse.json(
      { error: 'Failed to process the text. Please check your API key and try again.' },
      { status: 500 }
    );
  }
}
