import { cleanSpokenText } from "@/lib/speechText";
import { SupportedLanguage } from "./i18n";

export const LANGUAGE_BCP47_MAP: Record<SupportedLanguage, string> = {
  en: "en-IN",
  hi: "hi-IN",
  te: "te-IN",
  ta: "ta-IN",
  kn: "kn-IN",
  bn: "bn-IN",
};

// Global audio element reference to track ongoing audio playback
let currentAudioElement: HTMLAudioElement | null = null;
let speechRequest: AbortController | null = null;
let speechGeneration = 0;
let audioObjectUrl: string | null = null;

// Clean text for speech synthesis (strip markdown, emojis, asterisks, bullets, technical symbols)
export function sanitizeTextForSpeech(text: string): string {
  return cleanSpokenText(text).replace(/[🌾🏛️📜📋✅⚠️💡▪🎯👉🔹]/g, "").replace(/\s+/g, " ").trim();
}

/** Play a prepared briefing through server speech, with a matching browser voice as fallback. */
export function speakText(
  text: string,
  lang: SupportedLanguage = "en",
  onEnd?: () => void,
  onError?: (err: any) => void
): boolean {
  if (typeof window === "undefined") return false;

  // Stop any currently playing audio or speech
  stopSpeaking();

  const cleanText = sanitizeTextForSpeech(text);
  if (!cleanText) return false;

  const generation = speechGeneration;
  const controller = new AbortController();
  speechRequest = controller;
  fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: cleanText.slice(0, 2400), lang, customApiKey: localStorage.getItem("janmitra_custom_vision_key") || undefined }),
    signal: AbortSignal.any([controller.signal, AbortSignal.timeout(35000)]) })
    .then(async response => {
      if (!response.ok) throw new Error("Speech service unavailable");
      const report = response.headers.get("X-Model-Report");
      if (report && generation === speechGeneration) { try { window.dispatchEvent(new CustomEvent("janmitra:model-report", { detail: JSON.parse(decodeURIComponent(report)) })); } catch { /* Ignore malformed diagnostic metadata. */ } }
      const blob = await response.blob();
      if (generation !== speechGeneration) return;
      audioObjectUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioObjectUrl);
      currentAudioElement = audio;
      let failed = false;
      const fallback = () => {
        if (failed || generation !== speechGeneration) return;
        failed = true;
        audio.pause(); currentAudioElement = null;
        if (audioObjectUrl) { URL.revokeObjectURL(audioObjectUrl); audioObjectUrl = null; }
        playWebSpeechSynthesisFallback(cleanText, lang, onEnd, onError);
      };
      audio.onended = () => {
        currentAudioElement = null;
        if (audioObjectUrl) { URL.revokeObjectURL(audioObjectUrl); audioObjectUrl = null; }
        if (generation === speechGeneration) onEnd?.();
      };
      audio.onerror = fallback;
      audio.play().catch(fallback);
    }).catch(() => { if (generation === speechGeneration) playWebSpeechSynthesisFallback(cleanText, lang, onEnd, onError); });
  return true;
}

/**
 * Fallback to Web Speech API
 */
function playWebSpeechSynthesisFallback(
  cleanText: string,
  lang: SupportedLanguage,
  onEnd?: () => void,
  onError?: (err: any) => void
): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    if (onError) onError("SpeechSynthesis not supported");
    return false;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  const targetLang = LANGUAGE_BCP47_MAP[lang] || "en-IN";
  utterance.lang = targetLang;
  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find(
    (v) =>
      v.lang.toLowerCase() === targetLang.toLowerCase() ||
      v.lang.toLowerCase().startsWith(lang) ||
      v.name.toLowerCase().includes(lang)
  );

  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (event) => {
    console.error("SpeechSynthesis error:", event);
    if (onError) onError(event);
  };

  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking() {
  speechGeneration++;
  speechRequest?.abort(); speechRequest = null;
  if (audioObjectUrl) { URL.revokeObjectURL(audioObjectUrl); audioObjectUrl = null; }
  if (typeof window !== "undefined") {
    // 1. Stop audio element
    if (currentAudioElement) {
      try {
        currentAudioElement.pause();
        currentAudioElement.currentTime = 0;
      } catch (e) {
        // ignore
      }
      currentAudioElement = null;
    }

    // 2. Stop browser speech synthesis
    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
    }
  }
}

// Browser Web Speech recognition interface
export interface SpeechRecognitionResultHandler {
  onResult: (transcript: string) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}

export function createSpeechRecognizer(
  lang: SupportedLanguage,
  handlers: SpeechRecognitionResultHandler
) {
  if (typeof window === "undefined") return null;

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.warn("SpeechRecognition not supported in this browser.");
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = LANGUAGE_BCP47_MAP[lang] || "en-IN";
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: any) => {
    let interimTranscript = "";
    let finalTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    const transcript = finalTranscript || interimTranscript;
    if (transcript) {
      handlers.onResult(transcript);
    }
  };

  recognition.onerror = (event: any) => {
    console.error("Speech recognition error:", event.error);
    handlers.onError(event.error);
  };

  recognition.onend = () => {
    handlers.onEnd();
  };

  return recognition;
}
