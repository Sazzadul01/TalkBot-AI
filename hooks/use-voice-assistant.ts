"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export type AssistantState = "idle" | "listening" | "thinking" | "searching" | "speaking";

type PermissionStatus = "prompt" | "granted" | "denied" | "unsupported";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface UseVoiceAssistantOptions {
  wakeWord?: string;
  onStateChange?: (state: AssistantState) => void;
}

// Keywords that trigger real-time search
const SEARCH_TRIGGERS = [
  "weather",
  "news",
  "current",
  "today",
  "latest",
  "price",
  "stock",
  "score",
  "who is",
  "what is",
  "when is",
  "where is",
  "how much",
  "search",
  "look up",
  "find",
  "update",
  "updates",
  "live",
  "breaking",
  "trend",
  "trending",
  "bangladesh",
  "sports",
  "football",
  "cricket",
  "match",
  "result", 
];

function shouldSearch(text: string): boolean {
  const lowerText = text.toLowerCase();
  return SEARCH_TRIGGERS.some((trigger) => lowerText.includes(trigger));
}

export function useVoiceAssistant(options: UseVoiceAssistantOptions = {}) {
  const { wakeWord = "sazzad", onStateChange } = options;

  const [state, setState] = useState<AssistantState>("idle");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isWakeWordActive, setIsWakeWordActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<number[]>(new Array(32).fill(0));
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>("prompt");
  const [isRecognitionActive, setIsRecognitionActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("Systems initializing...");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // New Add

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const updateState = useCallback(
    (newState: AssistantState, message?: string) => {
      setState(newState);
      if (message) setStatusMessage(message);
      else {
        const defaultMessages: Record<AssistantState, string> = {
          idle: "Standing by...",
          listening: "Voice channel active...",
          thinking: "Neural processing...",
          searching: "Accessing global network...",
          speaking: "Transmitting response...",
        };
        setStatusMessage(defaultMessages[newState]);
      }
      onStateChange?.(newState);
    },
    [onStateChange]
  );

  // Initialize audio analyzer for visualizations
  const initAudioAnalyzer = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      const updateAudioData = () => {
        if (analyserRef.current && state === "listening") {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          setAudioData(Array.from(dataArray).slice(0, 32));
        }
        animationFrameRef.current = requestAnimationFrame(updateAudioData);
      };

      updateAudioData();
    } catch (err) {
      console.error("Failed to initialize audio analyzer:", err);
    }
  }, [state]);

  // Stop audio analyzer
  const stopAudioAnalyzer = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setAudioData(new Array(32).fill(0));
  }, []);

  // Search for real-time information
  const searchQuery = useCallback(async (query: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) return null;

      const data = await res.json();
      return data.results;
    } catch (err) {
      console.error("Search error:", err);
      return null;
    }
  }, []);

  // Get AI response with streaming text effect
  const getResponse = useCallback(
    async (userMessage: string) => {
      updateState("thinking", "Neural processing initiated...");

      const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
      setMessages(newMessages);
      setResponse("");
      setIsStreaming(true);

      try {
        // Check if we need real-time search
        let searchResults = null;
        if (shouldSearch(userMessage)) {
          updateState("searching", "Accessing live internet...");
          await new Promise(r => setTimeout(r, 500));
          setStatusMessage("Scanning global network...");
          searchResults = await searchQuery(userMessage);
          updateState("thinking", "Analyzing search results...");
        }

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages,
            searchResults,
          }),
        });

        if (!res.ok) throw new Error("Failed to get response");

        const data = await res.json();
        const assistantMessage = data.response;

        // Streaming text effect - reveal characters gradually
        setIsStreaming(true);
        for (let i = 0; i <= assistantMessage.length; i++) {
          setResponse(assistantMessage.substring(0, i));
          await new Promise(r => setTimeout(r, 15));
        }
        setIsStreaming(false);

        setMessages([...newMessages, { role: "assistant", content: assistantMessage }]);

        // Convert to speech
        await speakResponse(assistantMessage);
      } catch (err) {
        console.error("Response error:", err);
        setStatusMessage("Connection error detected...");
        updateState("idle", "Systems standing by...");
        setIsStreaming(false);
      }
    },
    [messages, searchQuery, updateState]
  );

  // Text-to-speech via ElevenLabs
  const speakResponse = useCallback(
    async (text: string) => {
      setIsSpeaking(true);

      if (recognitionRef.current) {
      recognitionRef.current.stop();
      }

      updateState("speaking", "Transmitting audio response...");

      try {
        const res = await fetch("/api/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (!res.ok) {
          throw new Error("Failed to generate speech");
        }

        const audioBlob = await res.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        if (audioRef.current) {
          audioRef.current.pause();
        }

        audioRef.current = new Audio(audioUrl);
        
        audioRef.current.onerror = () => {
          updateState("idle", "Audio transmission failed...");
          setIsWakeWordActive(false);
        };
        //New Add
        audioRef.current.onended = () => {
  setIsSpeaking(false);

  updateState("idle", "Standing by...");
  setIsWakeWordActive(false);

  URL.revokeObjectURL(audioUrl);

  if (recognitionRef.current && isRecognitionActive) {
    recognitionRef.current.start();
  }
};

        await audioRef.current.play();
      } catch (err) {
        console.error("Speech synthesis error:", err);
        // Fallback to browser TTS
        const utterance = new SpeechSynthesisUtterance(text);
        // new add 
        utterance.onend = () => {
  setIsSpeaking(false);

  updateState("idle", "Standing by...");
  setIsWakeWordActive(false);

  if (recognitionRef.current && isRecognitionActive) {
    recognitionRef.current.start();
  }
};

        speechSynthesis.speak(utterance);
      }
    },
    [updateState]
  );

  // Initialize speech recognition
  const initRecognition = useCallback(() => {
    if (typeof window === "undefined") return null;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in your browser.");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (isSpeaking) return;  // Add line
      const current = event.resultIndex;
      const result = event.results[current];
      const transcriptText = result[0].transcript.toLowerCase();

      // Voice Commands
      if (transcriptText.includes("stop")) {
  stopListening();
  updateState("idle", "Voice channel stopped...");
  return;
}

// Wake word activation
if (
  transcriptText.includes("start") ||
  transcriptText.includes("sazzad")
) {
  setIsWakeWordActive(true);
  updateState("listening", "Voice channel active...");
  setTranscript("");
  initAudioAnalyzer();
}


      // Clear any existing silence timeout
    setTranscript(result[0].transcript);

if (result.isFinal && result[0].transcript.trim()) {
  const userQuery = result[0].transcript.trim();

  silenceTimeoutRef.current = setTimeout(() => {
    stopAudioAnalyzer();
    getResponse(userQuery);
  }, 1500);
}
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      
      if (event.error === "not-allowed") {
        setPermissionStatus("denied");
        setStatusMessage("Voice channel offline...");
        setError(null);
        setIsRecognitionActive(false);
      } else if (event.error === "no-speech") {
        // This is normal, just restart
      } else if (event.error === "aborted") {
        // User or system stopped - don't show error
        setIsRecognitionActive(false);
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      // Only restart if recognition is supposed to be active and permission is granted
      if (isRecognitionActive && permissionStatus === "granted") {
        try {
          recognition.start();
        } catch (e) {
          // Recognition already started or failed
          setIsRecognitionActive(false);
        }
      }
    };

    return recognition;
  }, [
    wakeWord,
    isWakeWordActive,
    updateState,
    initAudioAnalyzer,
    stopAudioAnalyzer,
    getResponse,
    isRecognitionActive,
    permissionStatus,
  ]);

  // Request microphone permission explicitly
  const requestMicrophonePermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately - we just needed to get permission
      stream.getTracks().forEach(track => track.stop());
      setPermissionStatus("granted");
      setError(null);
      return true;
    } catch (err) {
      console.error("Microphone permission denied:", err);
      setPermissionStatus("denied");
      setStatusMessage("Voice channel offline... Switching to text interface...");
      setError(null);
      return false;
    }
  }, []);

  // Start listening
  const startListening = useCallback(async () => {
    // Check if speech recognition is supported
    if (typeof window === "undefined") return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setPermissionStatus("unsupported");
      setError("Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    // Request permission first if not already granted
    if (permissionStatus !== "granted") {
      const granted = await requestMicrophonePermission();
      if (!granted) return;
    }

    // Initialize recognition if needed
    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
    }

    if (recognitionRef.current) {
      try {
        setIsRecognitionActive(true);
        recognitionRef.current.start();
        setError(null);
      } catch (e) {
        // Recognition might already be running
        console.error("Failed to start recognition:", e);
      }
    }
  }, [initRecognition, permissionStatus, requestMicrophonePermission]);

  // Stop listening
  const stopListening = useCallback(() => {
    setIsRecognitionActive(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    stopAudioAnalyzer();
    updateState("idle");
    setIsWakeWordActive(false);
  }, [stopAudioAnalyzer, updateState]);

  // Manual activation (click to talk)
  const activateManually = useCallback(() => {
    setIsWakeWordActive(true);
    updateState("listening");
    setTranscript("");
    initAudioAnalyzer();
    startListening();
  }, [updateState, initAudioAnalyzer, startListening]);

  // Send a text query directly (bypasses voice)
  const sendTextQuery = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setTranscript(text);
    setError(null);
    await getResponse(text.trim());
  }, [getResponse]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      stopAudioAnalyzer();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [stopAudioAnalyzer]);

  return {
    state,
    transcript,
    response,
    messages,
    isWakeWordActive,
    error,
    audioData,
    permissionStatus,
    statusMessage,
    isStreaming,
    startListening,
    stopListening,
    activateManually,
    sendTextQuery,
  };
}
