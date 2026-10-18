"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Camera,
  Image as ImageIcon,
  Sparkles,
  Bot,
  User,
  HelpCircle,
  CheckCircle2,
  X,
  FileText,
  UploadCloud,
} from "lucide-react";
import { useFarmerStore } from "@/store/useFarmerStore";
import { translations } from "@/lib/i18n";
import { createSpeechRecognizer } from "@/lib/speech";
import LiveCameraCapture from "@/components/LiveCameraCapture";

export default function ChatAssistant() {
  const {
    language,
    currentFarmer,
    chatMessages,
    sendChatMessage,
    handleClarificationChip,
    isListening,
    setIsListening,
    speakMessage,
    stopAudio,
    isSpeaking,
    speakingMessageId,
    setVerificationModalOpen,
  } = useFarmerStore();

  const [inputVal, setInputVal] = useState("");
  const [selectedFile, setSelectedFile] = useState<{
    base64: string;
    name: string;
    type: string;
    size: string;
    isImage: boolean;
  } | null>(null);
  const [speechActive, setSpeechActive] = useState(false);
  const [liveCameraOpen, setLiveCameraOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognizerRef = useRef<any>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  const t = translations[language];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isImg = file.type.startsWith("image/");
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSelectedFile({
          base64: ev.target?.result as string,
          name: file.name,
          type: file.type || "application/octet-stream",
          size: (file.size / 1024).toFixed(1) + " KB",
          isImage: isImg,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isListening]);

  // Handle Speech Recognition
  const toggleSpeechRecognition = () => {
    if (speechActive) {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
      setSpeechActive(false);
      setIsListening(false);
      return;
    }

    const recognizer = createSpeechRecognizer(language, {
      onResult: (transcript) => {
        setInputVal(transcript);
      },
      onError: (err) => {
        console.warn("Recognition error:", err);
        setSpeechActive(false);
        setIsListening(false);
      },
      onEnd: () => {
        setSpeechActive(false);
        setIsListening(false);
      },
    });

    if (recognizer) {
      try {
        recognizer.start();
        recognizerRef.current = recognizer;
        setSpeechActive(true);
        setIsListening(true);
      } catch (e) {
        console.error("Failed to start speech recognition:", e);
      }
    } else {
      // Fallback simulation for demonstration if browser lacks mic permissions or Web Speech API
      setSpeechActive(true);
      setIsListening(true);
      setTimeout(() => {
        if (language === "te") {
          setInputVal("పీఎం కుసుమ్ సోలార్ పంపు సబ్సిడీ వివరాలు ఏమిటి?");
        } else if (language === "hi") {
          setInputVal("पीएम कुसुम सोलर पंप योजना के लिए कैसे आवेदन करें?");
        } else {
          setInputVal("How can I apply for PM-KUSUM 60% solar pump subsidy?");
        }
        setSpeechActive(false);
        setIsListening(false);
      }, 2000);
    }
  };

  const handleSend = () => {
    if (!inputVal.trim() && !selectedFile) return;
    sendChatMessage(
      inputVal.trim() ||
        (selectedFile?.isImage
          ? "Please inspect this attached crop/document photo using AI Vision"
          : `Please analyze this attached government document: ${selectedFile?.name}`),
      selectedFile?.base64,
      selectedFile?.name,
      selectedFile?.type
    );
    setInputVal("");
    setSelectedFile(null);
    if (chatFileInputRef.current) {
      chatFileInputRef.current.value = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-emerald-100 shadow-xl overflow-hidden flex flex-col h-[650px] max-h-[80vh]">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-emerald-950 p-4 sm:p-5 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-700/80 border border-emerald-500/30 flex items-center justify-center text-white shadow-inner">
            <Bot className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base tracking-tight">
                {t.chatAssistantTitle}
              </h3>
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-700 text-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Llama 3.3 Active
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 hidden sm:block">
              {t.chatSubtitle}
            </p>
          </div>
        </div>

        {/* OCR Scan shortcut in chat header */}
        <button
          onClick={() => setVerificationModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-bold transition active:scale-95 border border-emerald-500/30"
          title={t.uploadDoc}
        >
          <Camera className="w-4 h-4 text-emerald-300" />
          <span className="hidden sm:inline">OCR Scan</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-stone-50/50">
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`flex items-start gap-2.5 max-w-[88%] sm:max-w-[78%] ${
                msg.sender === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  msg.sender === "user"
                    ? "bg-stone-800 text-white"
                    : "bg-emerald-700 text-white"
                }`}
              >
                {msg.sender === "user" ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-300" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={`p-4 rounded-3xl shadow-sm text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-emerald-800 text-white rounded-tr-none font-medium"
                    : "bg-white text-stone-900 border border-stone-200 rounded-tl-none font-normal"
                }`}
              >
                {msg.image && (
                  msg.image.startsWith("data:image/") || (!msg.fileType?.includes("pdf") && !msg.fileType?.includes("doc") && !msg.fileType?.includes("text")) ? (
                    <img
                      src={msg.image}
                      alt="Uploaded inspection"
                      className="w-full max-h-56 object-contain rounded-2xl mb-3 border border-stone-200 bg-stone-900"
                    />
                  ) : (
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 border border-white/20 mb-3 text-white">
                      <FileText className="w-8 h-8 text-emerald-300 shrink-0" />
                      <div className="text-xs truncate">
                        <p className="font-bold truncate">{msg.fileName || "Uploaded Document"}</p>
                        <p className="opacity-80 text-[10px]">Verified Document File</p>
                      </div>
                    </div>
                  )
                )}
                <p className="whitespace-pre-line">{msg.text}</p>

                {/* Footer of Bubble: Timestamp & Audio Readout Button */}
                <div
                  className={`mt-2 pt-2 flex items-center justify-between text-[11px] ${
                    msg.sender === "user"
                      ? "text-emerald-200 border-t border-emerald-700"
                      : "text-stone-500 border-t border-stone-100"
                  }`}
                >
                  <span>{msg.timestamp}</span>

                  {/* Read Out Loud TTS Button for AI responses */}
                  {msg.sender === "ai" && (
                    <button
                      onClick={() =>
                        speakingMessageId === msg.id
                          ? stopAudio()
                          : speakMessage(msg.id, msg.text)
                      }
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition ${
                        speakingMessageId === msg.id
                          ? "bg-emerald-100 text-emerald-900 ring-2 ring-emerald-500"
                          : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                      }`}
                      title="Read out loud in regional voice"
                    >
                      {speakingMessageId === msg.id ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-emerald-800" />
                          <span className="text-[10px]">Stop Audio</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span className="text-[10px]">Listen Voice</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Dynamic Clarification Chips below AI response */}
            {msg.sender === "ai" && msg.clarificationChips && (
              <div className="mt-3 ml-10 max-w-[85%]">
                <p className="text-[11px] font-bold text-stone-600 mb-1.5 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{t.clarificationPrompt}</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {msg.clarificationChips.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleClarificationChip(chip)}
                      className="px-3 py-1.5 rounded-full text-xs font-bold bg-white text-emerald-900 border-2 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-500 active:scale-95 transition shadow-sm"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Listening Wave Indicator */}
        {isListening && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl max-w-md animate-in fade-in">
            <div className="flex items-center gap-1 h-6">
              <span className="w-1.5 bg-emerald-600 rounded-full wave-bar"></span>
              <span className="w-1.5 bg-emerald-600 rounded-full wave-bar"></span>
              <span className="w-1.5 bg-emerald-600 rounded-full wave-bar"></span>
              <span className="w-1.5 bg-emerald-600 rounded-full wave-bar"></span>
              <span className="w-1.5 bg-emerald-600 rounded-full wave-bar"></span>
            </div>
            <p className="text-sm font-bold text-emerald-900">
              {t.listening}
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Area */}
      <div className="p-3 sm:p-4 bg-white border-t border-stone-200">
        {/* Selected File / Image Preview Strip */}
        {selectedFile && (
          <div className="mb-3 flex items-center justify-between p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="relative">
                {selectedFile.isImage ? (
                  <img
                    src={selectedFile.base64}
                    alt="Attached"
                    className="w-12 h-12 object-cover rounded-xl border border-emerald-400 shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-400 flex items-center justify-center text-emerald-800 shadow-sm">
                    <FileText className="w-6 h-6" />
                  </div>
                )}
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    if (chatFileInputRef.current) chatFileInputRef.current.value = "";
                  }}
                  className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-600 text-white rounded-full shadow hover:bg-red-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="text-xs">
                <p className="font-extrabold text-emerald-950 flex items-center gap-1.5 truncate max-w-[220px] sm:max-w-md">
                  {selectedFile.isImage ? (
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  )}
                  <span className="truncate">{selectedFile.name}</span>
                </p>
                <p className="text-[11px] text-emerald-800 font-medium">
                  {selectedFile.size} • Ready for AI OCR Document & Scheme Analysis
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedFile(null);
                if (chatFileInputRef.current) chatFileInputRef.current.value = "";
              }}
              className="text-xs font-bold text-stone-500 hover:text-stone-800 px-2 py-1 rounded-lg hover:bg-emerald-100"
            >
              Remove
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Hidden File Input for Documents and Images */}
          <input
            ref={chatFileInputRef}
            type="file"
            accept="image/*,application/pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Take Live Camera Photo */}
          <button
            onClick={() => setLiveCameraOpen(true)}
            className="p-3 sm:p-3.5 rounded-2xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 transition active:scale-95 shrink-0 border border-emerald-300 shadow-sm"
            title="Take Live Photo with Webcam/Camera"
          >
            <Camera className="w-5 h-5 text-emerald-900" />
          </button>

          {/* Quick Attach Document or Image File */}
          <button
            onClick={() => chatFileInputRef.current?.click()}
            className="p-3 sm:p-3.5 rounded-2xl bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-700 transition active:scale-95 shrink-0"
            title="Attach Document or Photo (PDF, Image, DOCX, TXT)"
          >
            <UploadCloud className="w-5 h-5 text-stone-600" />
          </button>

          {/* Large Push-To-Talk Voice Button */}
          <button
            onClick={toggleSpeechRecognition}
            className={`p-3 sm:p-3.5 rounded-2xl font-black text-sm transition active:scale-95 shrink-0 flex items-center justify-center ${
              speechActive
                ? "bg-red-600 text-white ring-4 ring-red-200 animate-pulse"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30"
            }`}
            title={t.pushToTalk}
          >
            {speechActive ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          {/* Text input */}
          <div className="flex-1 flex items-center bg-stone-100 rounded-2xl px-4 py-2 border border-stone-200 focus-within:border-emerald-600 focus-within:bg-white transition">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedFile ? `Analyze ${selectedFile.name}...` : t.typePlaceholder}
              className="w-full bg-transparent text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none"
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!inputVal.trim() && !selectedFile}
            className={`p-3 sm:p-3.5 rounded-2xl transition active:scale-95 shrink-0 ${
              inputVal.trim() || selectedFile
                ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-md shadow-emerald-800/20"
                : "bg-stone-100 text-stone-400 cursor-not-allowed"
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Live Camera Modal for In-Browser Capture */}
      {liveCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl">
            <LiveCameraCapture
              category="crop_disease"
              title="Snap Live Photo with Webcam / Mobile Camera"
              onCapture={(base64) => {
                setSelectedFile({
                  base64,
                  name: `Live_Scan_${Date.now()}.jpg`,
                  type: "image/jpeg",
                  size: "Live Photo",
                  isImage: true,
                });
                setLiveCameraOpen(false);
              }}
              onCancel={() => setLiveCameraOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
