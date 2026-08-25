"use client";

import { useState, useRef, useEffect } from "react";
import { AlertCircle, MapPin, Activity, ShieldAlert, FileText, Globe, Send, PhoneCall, Mic, Square, CheckCircle2 } from "lucide-react";

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [dispatchStatus, setDispatchStatus] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  // Request GPS location on load and reverse geocode it
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          try {
            // Free reverse geocoding API to convert coordinates to a real address
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            // Try to get a clean address, fallback to raw coords if it fails
            const address = data.display_name || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
            setGpsLocation(address);
          } catch (e) {
            setGpsLocation(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
          }
        },
        (err) => {
          console.warn("GPS location denied or unavailable:", err);
        }
      );
    }
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = (reader.result as string).split(",")[1];
          setAudioBase64(base64data);
          setMimeType(mediaRecorder.mimeType);
          setInputText("🎤 [Audio message recorded]");
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError("");
      setResult(null);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Could not access the microphone. Please allow permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleProcess = async () => {
    if (!inputText.trim()) return;
    
    setIsLoading(true);
    setError("");
    setResult(null);
    setDispatchStatus("");

    try {
      const response = await fetch("/api/triage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          text: inputText,
          audioBase64,
          mimeType,
          gpsLocation 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDispatch = (type: string) => {
    if (type === 'volunteer') {
      setDispatchStatus("Ping sent to 3 nearest community volunteers via SMS. ETA: 4 mins.");
    } else {
      setDispatchStatus("Escalated to 911 Dispatch. Official responders en route.");
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical": return "bg-red-600 text-white";
      case "high": return "bg-orange-500 text-white";
      case "medium": return "bg-yellow-500 text-black";
      case "low": return "bg-green-500 text-white";
      default: return "bg-gray-200 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-blue-900 text-white p-4 shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="h-6 w-6 text-red-400" />
          <h1 className="text-xl font-bold">CrisisLink Triage Dashboard</h1>
        </div>
        <div className="text-sm opacity-80">RescueHacks Submission</div>
      </header>

      <main className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column: Input */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
            <h2 className="text-lg font-semibold mb-2 flex items-center">
              <Globe className="h-5 w-5 mr-2 text-blue-600" />
              Incoming Message
            </h2>
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-500 text-sm">
                Enter a distressed message in any language, or record audio.
              </p>
              {gpsLocation && (
                <div className="flex items-center text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  GPS Acquired
                </div>
              )}
            </div>
            
            <textarea
              className="w-full h-40 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50/50"
              placeholder="Enter a distressed message in any language. The AI will translate and extract critical triage information."
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                setAudioBase64(null);
                setMimeType(null);
              }}
            ></textarea>

            {/* Audio Recording Controls */}
            <div className="mt-2 flex justify-end">
              {isRecording ? (
                <button
                  onClick={stopRecording}
                  className="flex items-center text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Square className="h-4 w-4 mr-2 fill-current animate-pulse" />
                  Stop Recording
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  className="flex items-center text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Record Audio
                </button>
              )}
            </div>
            
            <button
              onClick={handleProcess}
              disabled={isLoading || !inputText.trim()}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {isLoading ? (
                <span className="animate-pulse">Processing via AI...</span>
              ) : (
                "Analyze & Translate"
              )}
            </button>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            
            {/* Example Prompts */}
            <div className="mt-6">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Try an example:</h3>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setInputText("Mein Arm ist gebrochen und es blutet stark. Ich bin in der Nähe des Bahnhofs.")}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-3 rounded-full"
                >
                  German (Broken arm)
                </button>
                <button 
                  onClick={() => setInputText("Mi hijo comió unas bayas rojas del jardín y ahora está vomitando. Estamos en casa en la calle Roble 12.")}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-3 rounded-full"
                >
                  Spanish (Poisoning)
                </button>
                <button 
                  onClick={() => setInputText("Il y a un arbre sur la route et les voitures ne peuvent pas passer. Personne n'est blessé pour l'instant.")}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-3 rounded-full"
                >
                  French (Fallen Tree - Low Severity)
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Output Dashboard */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-0 overflow-hidden flex flex-col h-full bg-gray-50/50">
            <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
              <h2 className="text-lg font-semibold flex items-center">
                <Activity className="h-5 w-5 mr-2 text-red-600" />
                Triage Report
              </h2>
            </div>
            
            <div className="p-6 flex-grow flex flex-col">
              {!result ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center flex-grow">
                  <FileText className="h-16 w-16 mb-4 opacity-20" />
                  <p>Awaiting incoming transmission...</p>
                  <p className="text-sm mt-2 opacity-70">Submit a message to view the extracted triage data.</p>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex-grow flex flex-col">
                  
                  {/* Top Bar: Severity and Location */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Severity</div>
                      <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold uppercase ${getSeverityColor(result.severity)}`}>
                        {result.severity || "Unknown"}
                      </div>
                    </div>
                    
                    <div className="flex-[2] bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-start">
                      <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Location</div>
                        <div className="font-medium text-gray-900">{result.location || "Not specified"}</div>
                      </div>
                    </div>
                  </div>

                  {/* Summary & Symptoms */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Key Details</div>
                      <div className="font-medium text-gray-900">{result.key_details}</div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <div className="text-xs text-gray-500 uppercase font-semibold mb-3">Extracted Symptoms</div>
                      <div className="flex flex-wrap gap-2">
                        {result.symptoms && result.symptoms.length > 0 ? (
                          result.symptoms.map((symptom: string, i: number) => (
                            <span key={i} className="bg-red-50 text-red-700 border border-red-100 px-3 py-1 rounded-md text-sm font-medium">
                              {symptom}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">None identified.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Translation */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="text-xs text-gray-500 uppercase font-semibold mb-2">English Translation</div>
                    <div className="text-gray-700 italic border-l-4 border-blue-200 pl-3">
                      "{result.translation}"
                    </div>
                  </div>

                  {/* Action Buttons (The Dispatching Logic) */}
                  <div className="mt-auto pt-4">
                    {!dispatchStatus ? (
                      <div className="flex gap-4">
                        <button 
                          onClick={() => handleDispatch('volunteer')}
                          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center transition-colors"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Ping Local Volunteers
                        </button>
                        <button 
                          onClick={() => handleDispatch('911')}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center transition-colors"
                        >
                          <PhoneCall className="h-4 w-4 mr-2" />
                          Escalate to 911
                        </button>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg flex items-center justify-center font-medium animate-in zoom-in duration-300">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        {dispatchStatus}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
