"use client";

import { useState, useRef, useCallback } from "react";

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
}

interface VoiceRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
  error: string | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export function useVoiceRecognition(): VoiceRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  });

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalTranscriptRef = useRef("");

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError(
        "Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.",
      );
      return;
    }

    if (isListening) {
      return; // Already listening
    }

    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!recognitionRef.current) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false; // Changed to false for better stability
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-US";
        recognitionRef.current.maxAlternatives = 1;

        recognitionRef.current.onstart = () => {
          setIsListening(true);
          setError(null);
        };

        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPiece = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcriptPiece + " ";
            } else {
              interimTranscript += transcriptPiece;
            }
          }

          // Update final transcript reference
          if (finalTranscript) {
            finalTranscriptRef.current += finalTranscript;
          }

          // Update display with accumulated final + current interim
          const fullText = finalTranscriptRef.current + interimTranscript;
          setTranscript(fullText);
        };

        recognitionRef.current.onerror = (
          event: SpeechRecognitionErrorEvent,
        ) => {
          console.error("Speech recognition error:", event.error);

          // Handle different error types
          if (
            event.error === "not-allowed" ||
            event.error === "permission-denied"
          ) {
            setError(
              "Microphone access denied. Please allow microphone permissions in your browser settings.",
            );
          } else if (event.error === "network") {
            setError(
              "Network error. Speech recognition requires an internet connection.",
            );
          } else if (event.error === "no-speech") {
            setError("No speech detected. Please try again.");
          } else if (event.error === "aborted") {
            // Aborted errors are usually intentional (user clicked stop)
            setError(null);
          } else {
            setError(`Speech recognition error: ${event.error}`);
          }

          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);

          // Auto-restart if we were listening and stopped due to silence
          // This provides a "continuous" experience without the network errors
          if (isListening && !error) {
            // Small delay before restarting
            setTimeout(() => {
              if (recognitionRef.current && !error) {
                try {
                  recognitionRef.current.start();
                } catch {
                  // Already started or other error, ignore
                }
              }
            }, 100);
          }
        };
      }

      // Start recognition
      recognitionRef.current.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setError("Failed to start speech recognition. Please try again.");
      setIsListening(false);
    }
  }, [isSupported, isListening, error]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        setIsListening(false);
      } catch (err) {
        console.error("Error stopping recognition:", err);
      }
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    finalTranscriptRef.current = "";
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    error,
  };
}
