"use client";

import ChatText from "@/components/ChatText";
import React, { useState, useRef, useEffect, useMemo } from "react";
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
  X,
  FileText,
  UploadCloud,
  History,
  Loader2,
  AlertCircle,
  RotateCcw,
  Lock,
  LogIn,
  UserPlus,
  MessageSquarePlus,
  CheckCheck,
  Paperclip,
} from "lucide-react";
import { useFarmerStore, getInitialChatMessage, type ChatMessage } from "@/store/useFarmerStore";
import { translations } from "@/lib/i18n";
import { createSpeechRecognizer } from "@/lib/speech";
import LiveCameraCapture from "@/components/LiveCameraCapture";
import ConversationSidebar from "@/components/ConversationSidebar";
import { classifyBase64Image } from "@/lib/visionClassifier";

function formatTime(msg: ChatMessage): string {
  const raw = msg.createdAt || msg.timestamp;
  const d = new Date(raw);
  if (!raw || Number.isNaN(d.getTime())) return msg.timestamp || "";
  const sameDay = d.toDateString() === new Date().toDateString();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return sameDay ? time : `${d.toLocaleDateString([], { day: "numeric", month: "short" })}, ${time}`;
}

export default function ChatAssistant({ variant = "full" }: { variant?: "full" | "compact" }) {
  const {
    language,
    currentFarmer,
    isAuthenticated,
    authStatus,
    chatMessages,
    sendChatMessage,
    retryChatMessage,
    handleClarificationChip,
    isListening,
    setIsListening,
    speakMessage,
    stopAudio,
    speakingMessageId,
    setVerificationModalOpen,
    requireAuth,
    setAuthModalOpen,
    setActiveTab,
    activeConversationId,
    conversations,
    messagesLoading,
    chatError,
    isAwaitingReply,
    composerDraft,
    clearComposerDraft,
    startNewConversation,
  } = useFarmerStore();

  const [inputVal, setInputVal] = useState("");
  const [savedDocumentSelected, setSavedDocumentSelected] = useState(false);
  useEffect(() => { setSavedDocumentSelected(!!new URLSearchParams(window.location.search).get("document")); }, []);
  const [draftRestored, setDraftRestored] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    base64: string;
    name: string;
    type: string;
    size: string;
    isImage: boolean;
    classification?: any;
  } | null>(null);
  const [speechActive, setSpeechActive] = useState(false);
  const [liveCameraOpen, setLiveCameraOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognizerRef = useRef<any>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const t = translations[language];
  const isFull = variant === "full";
  const activeTitle = conversations.find((c) => c.id === activeConversationId)?.title;

  // Greeting is shown at the top of every chat but never stored in the database.
  const greeting = useMemo(
    () => (isAuthenticated ? getInitialChatMessage(language, currentFarmer.name || "") : null),
    [isAuthenticated, language, currentFarmer.name]
  );

  // A question typed before signing in comes back here; the user must press Send.
  useEffect(() => {
    if (composerDraft && isAuthenticated) {
      setInputVal(composerDraft.text);
      setDraftRestored(true);
      clearComposerDraft();
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [composerDraft, isAuthenticated, clearComposerDraft]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isImg = file.type.startsWith("image/");
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string;
        let classification: any = null;
        if (isImg && base64) {
          try {
            classification = await classifyBase64Image(base64, file.name);
          } catch (e) {
            console.warn("[chat] Classification error:", e);
          }
        }
        setSelectedFile({
          base64,
          name: file.name,
          type: file.type || "application/octet-stream",
          size: (file.size / 1024).toFixed(1) + " KB",
          isImage: isImg,
          classification,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isListening, isAwaitingReply]);

  /** Guests are asked to sign in before any AI interaction. */
  const gate = (): boolean => {
    if (isAuthenticated) return true;
    requireAuth({ type: "open_chat" });
    return false;
  };

  // Handle Speech Recognition
  const toggleSpeechRecognition = () => {
    if (!gate()) return;
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
    if (isAwaitingReply) return;
    const defaultPrompt = selectedFile?.isImage
      ? (t as any).inspectDocPrompt || "Please inspect this attached crop/document photo using AI Vision"
      : (t as any).inspectDocFilePrompt
        ? `${(t as any).inspectDocFilePrompt}: ${selectedFile?.name}`
        : `Please analyze this attached government document: ${selectedFile?.name}`;

    // For guests this opens the sign-in modal and keeps the question.
    sendChatMessage(
      inputVal.trim() || defaultPrompt,
      selectedFile?.base64,
      selectedFile?.name,
      selectedFile?.type,
      selectedFile?.classification
    );
    if (!isAuthenticated) return; // keep the typed text visible behind the modal
    setInputVal("");
    setDraftRestored(false);
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

  // Which saved user message is still waiting for an answer (e.g. the assistant failed before a refresh)?
  const lastIndex = chatMessages.length - 1;

  const renderMessage = (msg: ChatMessage, idx: number) => {
    const isUser = msg.sender === "user";
    const awaitingAnswer =
      isUser && msg.status === "saved" && idx === lastIndex && !isAwaitingReply && !messagesLoading;
    return (
      <div key={msg.id} className={`jm-message flex flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div className={`flex items-start gap-2.5 max-w-[88%] sm:max-w-[78%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
          {/* Avatar */}
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
              isUser ? "bg-stone-800 text-white" : "bg-emerald-700 text-white"
            }`}
          >
            {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
          </div>

          {/* Bubble */}
          <div
            className={`p-4 rounded-3xl shadow-sm text-sm leading-relaxed ${
              isUser
                ? `bg-emerald-800 text-white rounded-tr-none font-medium ${msg.status === "failed" ? "ring-2 ring-red-400" : ""}`
                : "bg-white text-stone-900 border border-stone-200 rounded-tl-none font-normal"
            }`}
          >
            {msg.image &&
              (msg.image.startsWith("data:image/") ||
              (!msg.fileType?.includes("pdf") && !msg.fileType?.includes("doc") && !msg.fileType?.includes("text")) ? (
                <div className="relative rounded-2xl overflow-hidden mb-3 border border-stone-700 bg-stone-950 group">
                  <img
                    src={msg.image}
                    alt="Uploaded inspection"
                    className="w-full max-h-60 object-contain"
                  />
                  {/* YOLOv8 Targeting Reticle 4 Corner Markers */}
                  <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-emerald-400 shadow-md" />
                  <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-emerald-400 shadow-md" />
                  <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-emerald-400 shadow-md" />
                  <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-emerald-400 shadow-md" />

                  {/* Classification HUD Badge */}
                  <div className="absolute top-2.5 left-6 bg-stone-950/90 backdrop-blur-md px-2.5 py-0.5 rounded-md text-[10px] font-black text-emerald-300 flex items-center gap-1.5 border border-emerald-500/50 shadow-lg">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Image uploaded</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 border border-white/20 mb-3 text-white">
                  <FileText className="w-8 h-8 text-emerald-300 shrink-0" />
                  <div className="text-xs truncate">
                    <p className="font-bold truncate">{msg.fileName || "Uploaded Document"}</p>
                    <p className="opacity-80 text-[10px]">Uploaded document file</p>
                  </div>
                </div>
              ))}
            {/* Restored history: the file itself is not stored, only its name */}
            {!msg.image && msg.fileName && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/10 border border-white/20 mb-2 text-xs">
                <Paperclip className="w-4 h-4 shrink-0" />
                <span className="truncate font-bold">{msg.fileName}</span>
              </div>
            )}
            <ChatText text={msg.text} />
            {!isUser && msg.searchSuggestionsHtml && <iframe title="Google Search suggestions" srcDoc={msg.searchSuggestionsHtml}
              sandbox="allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer" className="mt-3 w-full h-28 border-0" />}
            {!isUser && msg.docDetection?.extractionCoverage && <p className="mt-2 text-xs text-stone-500">
              {msg.docDetection.extractionCoverage.totalPages ? `Checked text on ${msg.docDetection.extractionCoverage.pagesRead} of ${msg.docDetection.extractionCoverage.totalPages} pages. ` : "Document text extracted. "}
              {msg.docDetection.extractionCoverage.unreadablePages?.length ? `Pages without readable text: ${msg.docDetection.extractionCoverage.unreadablePages.join(", ")}. ` : ""}
              {msg.docDetection.extractionCoverage.truncated ? "Extraction reached its processing limit; remaining content is not included." : ""}
            </p>}

            {/* Document Verification Status Pill */}
            {!isUser && msg.docDetection && (
              <div className="mt-3 pt-2.5 border-t border-stone-200/80 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1.5">
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{(msg.docDetection.analysisQuality === "partial" || msg.docDetection.extractionCoverage?.truncated || msg.docDetection.extractionCoverage?.unreadablePages?.length) ? "Partly read" : msg.docDetection.extractionCoverage ? "Document read" : "Image analyzed"}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setVerificationModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>View Details</span>
                </button>
              </div>
            )}

            {/* Footer of Bubble: Timestamp, delivery status & Audio Readout Button */}
            <div
              className={`mt-2 pt-2 flex items-center justify-between gap-3 text-[11px] ${
                isUser ? "text-emerald-200 border-t border-emerald-700" : "text-stone-500 border-t border-stone-100"
              }`}
            >
              <span className="flex items-center gap-1.5">
                {formatTime(msg)}
                {isUser && msg.status === "sending" && (
                  <span className="flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Saving…
                  </span>
                )}
                {isUser && msg.status === "saved" && (
                  <span className="flex items-center gap-0.5" title="Saved to your history">
                    <CheckCheck className="w-3.5 h-3.5" />
                  </span>
                )}
              </span>

              {/* Read Out Loud TTS Button for AI responses */}
              {!isUser && (
                <button
                  onClick={() => (speakingMessageId === msg.id ? stopAudio() : speakMessage(msg.id, msg.text))}
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
                      <span className="text-[10px]">Hear the key points</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Failed / unanswered message: explain and offer retry */}
        {isUser && (msg.status === "failed" || awaitingAnswer) && (
          <div className="mt-1.5 mr-10 max-w-[85%] flex items-center gap-2 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl px-2.5 py-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{msg.status === "failed" ? msg.error || "Not sent." : "This question has no answer yet."}</span>
            <button
              onClick={() => msg.clientMessageId && retryChatMessage(msg.clientMessageId)}
              disabled={isAwaitingReply || !msg.clientMessageId}
              className="ml-1 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-red-300 text-red-800 hover:bg-red-100 disabled:opacity-50"
            >
              <RotateCcw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        {/* Dynamic Clarification Chips below AI response */}
        {!isUser && msg.clarificationChips && msg.clarificationChips.length > 0 && (
          <div className="mt-3 ml-10 max-w-[85%]">
            <p className="text-[11px] font-bold text-stone-600 mb-1.5 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
              <span>{t.clarificationPrompt}</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {msg.clarificationChips.map((chip, idx2) => (
                <button
                  key={idx2}
                  onClick={() => handleClarificationChip(chip)}
                  disabled={isAwaitingReply}
                  className="px-3 py-1.5 rounded-full text-xs font-bold bg-white text-emerald-900 border-2 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-500 transition shadow-sm disabled:opacity-50"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const chatPanel = (
    <div className="flex-1 min-w-0 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-emerald-950 p-4 sm:p-5 text-white flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {isFull && isAuthenticated && (
            <button
              onClick={() => setHistoryOpen(true)}
              className="md:hidden p-2 rounded-xl bg-emerald-700/80 border border-emerald-500/30"
              aria-label="Show conversation history"
            >
              <History className="w-5 h-5 text-emerald-200" />
            </button>
          )}
          <div className="w-10 h-10 rounded-2xl bg-emerald-700/80 border border-emerald-500/30 flex items-center justify-center text-white shadow-inner shrink-0">
            <Bot className="w-6 h-6 text-emerald-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base tracking-tight truncate">{t.chatAssistantTitle}</h3>
              <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-700 text-emerald-200 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                {isAuthenticated ? (t.farmerAssistantBadge || "Farmer assistant") : (t.signInToChat || "Sign in to chat")}
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 truncate">
              {isAuthenticated ? activeTitle || (t as any).newConversationLabel || "New conversation" : t.chatSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isFull && isAuthenticated && (
            <button
              onClick={() => setActiveTab("chat")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-bold transition border border-emerald-500/30"
              title="Open all conversations"
            >
              <History className="w-4 h-4 text-emerald-300" />
              <span className="hidden sm:inline">History</span>
            </button>
          )}
          {!isFull && isAuthenticated && (
            <button
              onClick={() => startNewConversation()}
              disabled={isAwaitingReply}
              className="p-1.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white border border-emerald-500/30 disabled:opacity-50"
              title="New chat"
              aria-label="New chat"
            >
              <MessageSquarePlus className="w-4 h-4 text-emerald-300" />
            </button>
          )}
          {/* OCR Scan shortcut in chat header */}
          <button
            onClick={() => setVerificationModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-bold transition border border-emerald-500/30"
            title={t.uploadDoc}
          >
            <Camera className="w-4 h-4 text-emerald-300" />
            <span className="hidden sm:inline">OCR Scan</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      {savedDocumentSelected && <div className="border-b border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">Your selected private profile document is available in this chat. Ask for a detailed summary or a specific fact. <button className="ml-2 underline" onClick={() => { const url = new URL(window.location.href); url.searchParams.delete("document"); window.history.replaceState(null,"",url); setSavedDocumentSelected(false); }}>Clear selection</button></div>}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-stone-50/50" aria-live="polite">
        {!isAuthenticated ? (
          /* Guest: explain why signing in is needed */
          <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center mb-3">
              <Lock className="w-7 h-7 text-emerald-800" />
            </div>
            <h4 className="text-lg font-black text-stone-900">
              {(t as any).chatLockedTitle || "Sign in to ask JanMithra AI"}
            </h4>
            <p className="text-sm text-stone-600 max-w-sm mt-1">
              {(t as any).chatLockedBody ||
                "Create a free account or sign in to chat with the assistant. Your questions and answers are saved so you can continue later on any device."}
            </p>
            {authStatus !== "unknown" && (
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <button
                  onClick={() => setAuthModalOpen(true, "login")}
                  className="px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" /> Sign In
                </button>
                <button
                  onClick={() => setAuthModalOpen(true, "signup")}
                  className="px-4 py-2.5 rounded-2xl bg-white border-2 border-emerald-300 text-emerald-900 font-black text-sm flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" /> Create Account
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {greeting && renderMessage(greeting, -1)}

            {messagesLoading && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm font-bold text-stone-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading conversation…
              </div>
            )}

            {chatError && (
              <div role="alert" className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs font-bold text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="flex-1">{chatError}</span>
                {activeConversationId && (
                  <button
                    onClick={() => useFarmerStore.getState().openConversation(activeConversationId)}
                    className="px-2 py-1 rounded-lg bg-white border border-red-300 hover:bg-red-100"
                  >
                    Reload
                  </button>
                )}
              </div>
            )}

            {chatMessages.map((m, i) => renderMessage(m, i))}

            {isAwaitingReply && (
              <div className="flex items-center gap-2.5" aria-label="Assistant is typing">
                <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <div className="px-4 py-3 rounded-3xl rounded-tl-none bg-white border border-stone-200 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" />
                </div>
              </div>
            )}
          </>
        )}

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
            <p className="text-sm font-bold text-emerald-900">{t.listening}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Area */}
      <div className="p-3 sm:p-4 bg-white border-t border-stone-200">
        {draftRestored && inputVal && (
          <div className="mb-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-900 flex items-center justify-between gap-2">
            <span>Welcome! Your question is ready below — press Send to ask it.</span>
            <button onClick={() => setDraftRestored(false)} aria-label="Dismiss">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

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
            onClick={() => gate() && setLiveCameraOpen(true)}
            className="p-3 sm:p-3.5 rounded-2xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 transition shrink-0 border border-emerald-300 shadow-sm"
            title="Take Live Photo with Webcam/Camera"
          >
            <Camera className="w-5 h-5 text-emerald-900" />
          </button>

          {/* Quick Attach Document or Image File */}
          <button
            onClick={() => gate() && chatFileInputRef.current?.click()}
            className="p-3 sm:p-3.5 rounded-2xl bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-700 transition shrink-0"
            title="Attach Document or Photo (PDF, Image, DOCX, TXT)"
          >
            <UploadCloud className="w-5 h-5 text-stone-600" />
          </button>

          {/* Large Push-To-Talk Voice Button */}
          <button
            onClick={toggleSpeechRecognition}
            className={`p-3 sm:p-3.5 rounded-2xl font-black text-sm transition shrink-0 flex items-center justify-center ${
              speechActive
                ? "bg-red-600 text-white ring-4 ring-red-200 animate-pulse"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30"
            }`}
            title={t.pushToTalk}
          >
            {speechActive ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text input */}
          <div className="flex-1 flex items-center bg-stone-100 rounded-2xl px-4 py-2 border border-stone-200 focus-within:border-emerald-600 focus-within:bg-white transition min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={4000}
              placeholder={selectedFile ? `Analyze ${selectedFile.name}...` : t.typePlaceholder}
              aria-label="Type your question"
              className="w-full bg-transparent text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none"
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={(!inputVal.trim() && !selectedFile) || isAwaitingReply}
            aria-label="Send"
            className={`p-3 sm:p-3.5 rounded-2xl transition shrink-0 ${
              (inputVal.trim() || selectedFile) && !isAwaitingReply
                ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-md shadow-emerald-800/20"
                : "bg-stone-100 text-stone-400 cursor-not-allowed"
            }`}
          >
            {isAwaitingReply ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`bg-white rounded-2xl border border-stone-200 overflow-hidden flex relative ${
        isFull ? "h-[calc(100dvh-8rem)] min-h-[480px]" : "h-[650px] max-h-[80vh]"
      }`}
    >
      {/* Conversation history (full view, signed in) */}
      {isFull && isAuthenticated && (
        <>
          <div className="hidden w-72 shrink-0">
            <ConversationSidebar />
          </div>
          {historyOpen && (
            <div className="md:hidden absolute inset-0 z-20 flex">
              <div className="w-[85%] max-w-xs h-full shadow-2xl">
                <ConversationSidebar onSelect={() => setHistoryOpen(false)} />
              </div>
              <button
                className="flex-1 bg-stone-950/40"
                onClick={() => setHistoryOpen(false)}
                aria-label="Close conversation history"
              />
            </div>
          )}
        </>
      )}

      {chatPanel}

      {/* Live Camera Modal for In-Browser Capture */}
      {liveCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl">
            <LiveCameraCapture
              category="auto_detect"
              title="Snap Live Photo with Webcam / Mobile Camera"
              onCapture={async (base64) => {
                const fileName = `Live_Scan_${Date.now()}.jpg`;
                let classification: any = null;
                try {
                  classification = await classifyBase64Image(base64, fileName, "auto_detect");
                } catch (e) {
                  console.warn("[chat] Live scan classification error:", e);
                }
                setSelectedFile({
                  base64,
                  name: fileName,
                  type: "image/jpeg",
                  size: "Live Photo",
                  isImage: true,
                  classification,
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
