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

// Clean text for speech synthesis (strip markdown, emojis, asterisks, bullets, technical symbols)
export function sanitizeTextForSpeech(text: string): string {
  return text
    .replace(/[🌾🏛️📜📋✅⚠️💡•▪🎯👉🔹]/g, "")
    .replace(/[*_#`~\[\]]/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/(\n|\r)+/g, ". ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Robust Native Spoken Voice Readout
 * 1. Primary: Native Regional Voice via /api/tts streaming endpoint (guarantees authentic
 *    native speaker accent in Telugu, Tamil, Hindi, Kannada, Bengali, and English across all devices).
 * 2. Secondary Fallback: Browser Web Speech API (with strict language-matching voices).
 */
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

  // Primary: Play native regional spoken audio via /api/tts
  try {
    const audioUrl = `/api/tts?lang=${encodeURIComponent(lang)}&text=${encodeURIComponent(cleanText)}`;
    const audio = new Audio(audioUrl);
    currentAudioElement = audio;

    audio.onended = () => {
      currentAudioElement = null;
      if (onEnd) onEnd();
    };

    audio.onerror = () => {
      console.warn("Audio endpoint stream failed, attempting browser SpeechSynthesis fallback...");
      currentAudioElement = null;
      playWebSpeechSynthesisFallback(cleanText, lang, onEnd, onError);
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((e) => {
        console.warn("Audio autoplay policy prevented direct play, falling back to Web Speech:", e);
        playWebSpeechSynthesisFallback(cleanText, lang, onEnd, onError);
      });
    }

    return true;
  } catch (err) {
    console.warn("Failed to initialize Audio, falling back to SpeechSynthesis:", err);
    return playWebSpeechSynthesisFallback(cleanText, lang, onEnd, onError);
  }
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
