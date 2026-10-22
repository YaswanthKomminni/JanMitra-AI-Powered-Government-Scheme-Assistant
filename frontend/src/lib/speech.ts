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
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  let wanted = false;
  let running = false;
  let committed = "";
  let sessionText = "";
  let restartTimer: ReturnType<typeof setTimeout> | undefined;
  let retryDelay = 250;
  const join = (a: string, b: string) => [a.trim(), b.trim()].filter(Boolean).join(" ");
  const clearRestart = () => { if (restartTimer) clearTimeout(restartTimer); restartTimer = undefined; };
  const finish = (error?: string) => {
    if (!wanted) return;
    wanted = false;
    clearRestart();
    try { if (running) recognition.abort(); } catch { /* Already stopped. */ }
    running = false;
    if (error) handlers.onError(error);
    handlers.onEnd();
  };
  const startNative = () => {
    if (!wanted || running) return;
    try { running = true; recognition.start(); }
    catch { running = false; finish("start-failed"); }
  };
  recognition.onresult = (event: any) => {
    if (!wanted) return;
    // Results replace the current browser session's transcript. Appending only
    // resultIndex loses final segments or duplicates interim words on updates.
    sessionText = Array.from(event.results as ArrayLike<any>).map((result: any) => String(result[0]?.transcript || "").trim()).filter(Boolean).join(" ");
    retryDelay = 250;
    if (sessionText) handlers.onResult(join(committed, sessionText));
  };
  recognition.onerror = (event: any) => {
    if (!wanted) return;
    if (["no-speech", "network", "aborted"].includes(event.error)) {
      // These browsers end recognition after silence even in continuous mode.
      // Keep the user's listening session on and restart from onend.
      retryDelay = event.error === "network" ? Math.min(5000, Math.max(1000, retryDelay * 2)) : 250;
      return;
    }
    finish(event.error || "recognition-failed");
  };
  recognition.onend = () => {
    running = false;
    if (!wanted) return;
    committed = join(committed, sessionText);
    sessionText = "";
    clearRestart();
    restartTimer = setTimeout(startNative, retryDelay);
  };
  return {
    start() {
      if (wanted) return;
      committed = ""; sessionText = ""; retryDelay = 250;
      wanted = true; startNative();
    },
    stop() { finish(); },
    abort() { finish(); },
  };
}

export const microphoneCopy: Record<SupportedLanguage, { start: string; stop: string; unsupported: string; permission: string; unavailable: string }> = {
  en: {start:"Turn microphone on",stop:"Turn microphone off",unsupported:"Voice input is not supported in this browser. Please type your question or use a browser with speech recognition.",permission:"Microphone access was denied. Allow microphone access in your browser and try again.",unavailable:"The microphone could not start. Check your microphone and browser speech-recognition connection, then try again."},
  te: {start:"మైక్ ఆన్ చేయండి",stop:"మైక్ ఆఫ్ చేయండి",unsupported:"ఈ బ్రౌజర్‌లో వాయిస్ ఇన్‌పుట్ లేదు. ప్రశ్న టైప్ చేయండి లేదా వాయిస్ సపోర్ట్ ఉన్న బ్రౌజర్ వాడండి.",permission:"మైక్ అనుమతి లేదు. బ్రౌజర్‌లో మైక్ అనుమతించి మళ్లీ ప్రయత్నించండి.",unavailable:"మైక్ ప్రారంభం కాలేదు. మైక్, బ్రౌజర్ వాయిస్ కనెక్షన్ సరిచూసి మళ్లీ ప్రయత్నించండి."},
  hi: {start:"माइक चालू करें",stop:"माइक बंद करें",unsupported:"इस ब्राउज़र में वॉइस इनपुट उपलब्ध नहीं है। प्रश्न लिखें या वॉइस पहचान वाला ब्राउज़र उपयोग करें।",permission:"माइक की अनुमति नहीं मिली। ब्राउज़र में माइक की अनुमति देकर फिर कोशिश करें।",unavailable:"माइक शुरू नहीं हुआ। माइक और ब्राउज़र की वॉइस सेवा जाँचकर फिर कोशिश करें।"},
  ta: {start:"மைக்கை இயக்கவும்",stop:"மைக்கை அணைக்கவும்",unsupported:"இந்த உலாவியில் குரல் உள்ளீடு இல்லை. கேள்வியைத் தட்டச்சு செய்யவும் அல்லது குரல் ஆதரவுள்ள உலாவியைப் பயன்படுத்தவும்.",permission:"மைக் அனுமதி மறுக்கப்பட்டது. உலாவியில் மைக் அனுமதி கொடுத்து மீண்டும் முயலவும்.",unavailable:"மைக் தொடங்கவில்லை. மைக் மற்றும் உலாவி குரல் இணைப்பைச் சரிபார்த்து மீண்டும் முயலவும்."},
  kn: {start:"ಮೈಕ್ ಆನ್ ಮಾಡಿ",stop:"ಮೈಕ್ ಆಫ್ ಮಾಡಿ",unsupported:"ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಇನ್‌ಪುಟ್ ಇಲ್ಲ. ಪ್ರಶ್ನೆ ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಧ್ವನಿ ಬೆಂಬಲಿತ ಬ್ರೌಸರ್ ಬಳಸಿ.",permission:"ಮೈಕ್ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಅನುಮತಿ ನೀಡಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",unavailable:"ಮೈಕ್ ಪ್ರಾರಂಭವಾಗಲಿಲ್ಲ. ಮೈಕ್ ಮತ್ತು ಬ್ರೌಸರ್ ಧ್ವನಿ ಸಂಪರ್ಕ ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."},
  bn: {start:"মাইক চালু করুন",stop:"মাইক বন্ধ করুন",unsupported:"এই ব্রাউজারে ভয়েস ইনপুট নেই। প্রশ্ন লিখুন বা ভয়েস সমর্থিত ব্রাউজার ব্যবহার করুন।",permission:"মাইকের অনুমতি দেওয়া হয়নি। ব্রাউজারে অনুমতি দিয়ে আবার চেষ্টা করুন।",unavailable:"মাইক চালু হয়নি। মাইক ও ব্রাউজারের ভয়েস সংযোগ দেখে আবার চেষ্টা করুন।"},
};
