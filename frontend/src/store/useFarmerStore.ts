import { create } from "zustand";
import { SupportedLanguage, translations } from "@/lib/i18n";
import {
  FarmerProfile,
  Scheme,
  PeerSuccessStory,
  MockOcrResult,
  GUEST_FARMER,
  SCHEMES_DATABASE,
  NEARBY_PEERS,
  MOCK_OCR_PRESETS,
} from "@/lib/mockData";
import { speakText, stopSpeaking } from "@/lib/speech";
import { classifyBase64Image } from "@/lib/visionClassifier";
import {
  ChatMessage,
  ConversationSummary,
  getInitialChatMessage,
  formatDocumentAnalysisReply,
  formatFarmerProfileReply,
  generateTextReply,
} from "@/lib/chatEngine";

// Re-exported so existing imports from the store keep working.
export type { ChatMessage, ConversationSummary };
export { getInitialChatMessage, formatDocumentAnalysisReply, formatFarmerProfileReply };

export interface OutOfScopeError {
  title: string;
  message: string;
  reason: string;
  previewUrl: string;
  suggestions: string[];
}

export type TabId = "dashboard" | "schemes" | "peers" | "chat" | "verify";

/** What the visitor was trying to do when we asked them to sign in. */
export type PendingAction =
  | { type: "open_chat" }
  | { type: "send_message"; text: string }
  | { type: "open_verification" };

export interface AuthResult {
  success: boolean;
  message: string;
  field?: string;
}

export interface SignupForm {
  name: string;
  phone: string;
  email?: string;
  password: string;
  confirmPassword: string;
  state?: string;
  district?: string;
  village?: string;
  landSizeAcres?: string;
  soilType?: string;
  irrigationType?: string;
  primaryCrops?: string;
  annualIncomeSlab?: string;
  preferredLanguage?: string;
}

interface FarmerState {
  language: SupportedLanguage;
  currentFarmer: FarmerProfile;

  // Authentication (the server session is the source of truth)
  authStatus: "unknown" | "authenticated" | "guest";
  isAuthenticated: boolean;
  authModalOpen: boolean;
  authModalMode: "login" | "signup";
  authModalReason: string | null;
  pendingAction: PendingAction | null;
  /** A question typed before signing in, restored into the chat box afterwards. */
  composerDraft: { text: string; nonce: number } | null;
  authNotice: string | null;

  activeTab: TabId;
  selectedCategoryFilter: string;

  // Modals & Details
  selectedScheme: Scheme | null;
  peerContactModal: PeerSuccessStory | null;
  verificationModalOpen: boolean;

  // Conversations & chat (persisted in PostgreSQL)
  conversations: ConversationSummary[];
  conversationsLoading: boolean;
  conversationsError: string | null;
  activeConversationId: string | null;
  chatMessages: ChatMessage[];
  messagesLoading: boolean;
  chatError: string | null;
  isAwaitingReply: boolean;

  // Speech
  isListening: boolean;
  isSpeaking: boolean;
  speakingMessageId: string | null;

  // Document OCR Verification
  verificationScanning: boolean;
  verificationResult: MockOcrResult | null;
  outOfScopeError: OutOfScopeError | null;
  selectedPresetKey: string | null;

  // Actions
  setLanguage: (lang: SupportedLanguage) => void;
  setCurrentFarmer: (farmer: FarmerProfile) => void;
  setAuthModalOpen: (open: boolean, mode?: "login" | "signup") => void;
  initAuth: (opts?: { silent?: boolean }) => Promise<void>;
  requireAuth: (action: PendingAction, reason?: string) => boolean;
  login: (phone: string, password: string) => Promise<AuthResult>;
  signup: (form: SignupForm) => Promise<AuthResult>;
  logout: () => Promise<AuthResult>;
  clearComposerDraft: () => void;
  setActiveTab: (tab: TabId) => void;
  setSelectedCategoryFilter: (category: string) => void;
  setSelectedScheme: (scheme: Scheme | null) => void;
  setPeerContactModal: (peer: PeerSuccessStory | null) => void;
  setVerificationModalOpen: (open: boolean) => void;
  clearOutOfScopeError: () => void;

  // Conversation Actions
  loadConversations: (opts?: { openLatest?: boolean }) => Promise<void>;
  openConversation: (id: string) => Promise<void>;
  startNewConversation: () => void;
  deleteConversation: (id: string) => Promise<AuthResult>;

  // Chat Actions
  sendChatMessage: (text: string, image?: string, fileName?: string, fileType?: string, classification?: any) => Promise<void>;
  retryChatMessage: (clientMessageId: string) => Promise<void>;
  handleClarificationChip: (chipText: string) => void;
  setIsListening: (listening: boolean) => void;
  speakMessage: (id: string, text: string) => void;
  stopAudio: () => void;

  // OCR Verification Actions
  startMockVerification: (presetKey: string) => void;
  analyzeUploadedFile: (
    fileBase64: string,
    fileName: string,
    fileType: string,
    category?: string
  ) => Promise<boolean>;
  confirmExtractedData: () => void;
  resetVerification: () => void;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const AUTH_REASON_CHAT =
  "Please sign in or create a free account to use the JanMithra assistant. Signing in saves your conversations so you can continue them later.";
const AUTH_REASON_VERIFY =
  "Please sign in or create a free account to scan and verify documents with JanMithra AI.";

/** Per-user pointer to the last opened conversation (not sensitive; no tokens). */
const lastConversationKey = (farmerId: string) => `janmitra:lastConversation:${farmerId}`;
function rememberConversation(farmerId: string, conversationId: string | null) {
  try {
    if (conversationId) localStorage.setItem(lastConversationKey(farmerId), conversationId);
    else localStorage.removeItem(lastConversationKey(farmerId));
  } catch {
    /* storage unavailable */
  }
}
function recallConversation(farmerId: string): string | null {
  try {
    return localStorage.getItem(lastConversationKey(farmerId));
  } catch {
    return null;
  }
}

function newClientId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return "cm_" + crypto.randomUUID().replace(/-/g, "");
    }
  } catch {
    /* fall through */
  }
  return "cm_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
}

async function readJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function upsertConversation(list: ConversationSummary[], conv: ConversationSummary | null | undefined) {
  if (!conv) return list;
  const next = [conv, ...list.filter((c) => c.id !== conv.id)];
  return next.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));
}

/** Incremented whenever the visible conversation changes, so late responses don't land in the wrong chat. */
let chatViewToken = 0;

const SIGNED_OUT_STATE = {
  currentFarmer: GUEST_FARMER,
  isAuthenticated: false,
  authStatus: "guest" as const,
  conversations: [] as ConversationSummary[],
  conversationsError: null,
  activeConversationId: null,
  chatMessages: [] as ChatMessage[],
  chatError: null,
  isAwaitingReply: false,
  messagesLoading: false,
  verificationModalOpen: false,
  verificationResult: null,
  composerDraft: null,
};

export const useFarmerStore = create<FarmerState>((set, get) => {
  /** Apply a freshly authenticated user and restore their history. */
  const applyAuthenticatedUser = (user: FarmerProfile) => {
    const switchedUser = get().currentFarmer.id !== user.id;
    chatViewToken++;
    set({
      currentFarmer: user,
      isAuthenticated: true,
      authStatus: "authenticated",
      authNotice: null,
      ...(switchedUser
        ? { conversations: [], activeConversationId: null, chatMessages: [], chatError: null }
        : {}),
    });
    const lang = (user.preferredLanguage as SupportedLanguage) || get().language;
    if (translations[lang]) get().setLanguage(lang);
    get().loadConversations({ openLatest: true });
  };

  /** Run whatever the visitor was trying to do before signing in. */
  const completePendingAction = () => {
    const action = get().pendingAction;
    set({ pendingAction: null, authModalOpen: false, authModalReason: null });
    if (!action) return;
    if (action.type === "open_chat") {
      set({ activeTab: "chat" });
    } else if (action.type === "send_message") {
      // Never auto-send: put the question back in the box for the user to confirm.
      set({ activeTab: "chat", composerDraft: { text: action.text, nonce: Date.now() } });
    } else if (action.type === "open_verification") {
      set({ verificationModalOpen: true });
    }
  };

  /** Called when the server says the session is gone (expired / signed out elsewhere). */
  const handleSessionExpired = (pending?: PendingAction) => {
    stopSpeaking();
    chatViewToken++;
    set({
      ...SIGNED_OUT_STATE,
      activeTab: get().activeTab === "chat" ? "dashboard" : get().activeTab,
      pendingAction: pending || null,
      authModalOpen: true,
      authModalMode: "login",
      authModalReason: "Your session has ended. Please sign in again to continue.",
    });
  };

  /** POST a message to the server; shared by send and retry. */
  const postChat = async (msg: ChatMessage, attachment?: { data: string; fileName?: string; fileType?: string; classification?: any }) => {
    const token = chatViewToken;
    const cmid = msg.clientMessageId!;
    const markMessage = (patch: Partial<ChatMessage>) =>
      set((state) => ({
        chatMessages: state.chatMessages.map((m) => (m.clientMessageId === cmid && m.sender === "user" ? { ...m, ...patch } : m)),
      }));

    set({ isAwaitingReply: true, chatError: null });
    let res: Response;
    try {
      res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: get().activeConversationId,
          clientMessageId: cmid,
          text: msg.text,
          language: get().language,
          attachment,
          customApiKey: typeof window !== "undefined" ? localStorage.getItem("janmitra_custom_vision_key") || undefined : undefined,
        }),
      });
    } catch {
      if (token === chatViewToken) {
        markMessage({ status: "failed", error: "Network error — your message was NOT sent. Check your connection and tap Retry." });
        set({ isAwaitingReply: false });
      }
      return;
    }

    const data = await readJson(res);

    if (res.status === 401) {
      handleSessionExpired({ type: "send_message", text: msg.text });
      return;
    }

    // The conversation may now exist on the server even if the reply failed.
    if (data?.conversation) {
      set((state) => ({ conversations: upsertConversation(state.conversations, data.conversation) }));
    }
    if (token !== chatViewToken) return; // user switched chats meanwhile; history already updated

    if (data?.conversation?.id && get().activeConversationId !== data.conversation.id) {
      set({ activeConversationId: data.conversation.id });
      rememberConversation(get().currentFarmer.id, data.conversation.id);
    }

    if (res.ok && data?.success) {
      set((state) => ({
        isAwaitingReply: false,
        chatMessages: [
          ...state.chatMessages.map((m) =>
            m.clientMessageId === cmid && m.sender === "user"
              ? { ...m, ...data.userMessage, image: m.image, status: "saved" as const, error: undefined }
              : m
          ),
          // avoid showing a reply twice if a retry returned an already-stored answer
          ...(state.chatMessages.some((m) => m.id === data.aiMessage?.id) ? [] : [data.aiMessage]),
        ],
      }));
      return;
    }

    if (res.status === 404) {
      set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== state.activeConversationId),
      }));
    }
    markMessage({
      status: "failed",
      error:
        data?.message ||
        (res.status >= 500 ? "The server could not save your message. Tap Retry." : "Your message could not be sent."),
      ...(data?.userMessage?.id ? { id: data.userMessage.id, createdAt: data.userMessage.createdAt } : {}),
    });
    set({ isAwaitingReply: false });
  };

  return {
  language: "en",
  currentFarmer: GUEST_FARMER,
  authStatus: "unknown",
  isAuthenticated: false,
  authModalOpen: false,
  authModalMode: "login",
  authModalReason: null,
  pendingAction: null,
  composerDraft: null,
  authNotice: null,
  activeTab: "dashboard",
  selectedCategoryFilter: "all",

  selectedScheme: null,
  peerContactModal: null,
  verificationModalOpen: false,

  conversations: [],
  conversationsLoading: false,
  conversationsError: null,
  activeConversationId: null,
  chatMessages: [],
  messagesLoading: false,
  chatError: null,
  isAwaitingReply: false,

  isListening: false,
  isSpeaking: false,
  speakingMessageId: null,

  verificationScanning: false,
  verificationResult: null,
  outOfScopeError: null,
  selectedPresetKey: null,

  clearOutOfScopeError: () => set({ outOfScopeError: null }),

  setLanguage: (lang) => {
    // Saved answers are part of the conversation, not templates to regenerate on a locale change.
    set((state) => ({ language: lang, chatMessages: state.chatMessages.map((msg) =>
      msg.id === "msg_init" || msg.id === "msg_01" ? getInitialChatMessage(lang, state.currentFarmer.name) : msg
    ) }));
  },

  setCurrentFarmer: (farmer) => {
    set({
      currentFarmer: farmer,
    });
    get().setLanguage((farmer.preferredLanguage as SupportedLanguage) || "en");
  },

  setAuthModalOpen: (open, mode) => {
    if (open) {
      set({ authModalOpen: true, authModalMode: mode || get().authModalMode });
    } else {
      // Closing without signing in abandons the pending action (a typed question stays in the box).
      set({ authModalOpen: false, authModalReason: null, pendingAction: null });
    }
  },

  initAuth: async (opts) => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await readJson(res);
        if (data?.authenticated && data.user) {
          // Only re-hydrate if the user changed or we were not signed in yet.
          if (!get().isAuthenticated || get().currentFarmer.id !== data.user.id) {
            applyAuthenticatedUser(data.user);
          } else {
            set({ currentFarmer: data.user });
          }
          return;
        }
      }
      if (res.status === 401) {
        if (get().isAuthenticated) {
          handleSessionExpired();
        } else {
          set({ ...SIGNED_OUT_STATE });
        }
        return;
      }
      // 503 etc: we cannot tell. Keep current state, show a notice.
      if (!opts?.silent) {
        set({
          authStatus: get().isAuthenticated ? "authenticated" : "guest",
          authNotice: "JanMithra could not reach its database to check your sign-in. Some features may be unavailable.",
        });
      }
    } catch {
      if (!opts?.silent) {
        set({
          authStatus: get().isAuthenticated ? "authenticated" : "guest",
          authNotice: "Network problem: could not check your sign-in status.",
        });
      }
    }
  },

  requireAuth: (action, reason) => {
    if (get().isAuthenticated) return true;
    set({
      pendingAction: action,
      authModalOpen: true,
      authModalMode: get().authModalMode,
      authModalReason:
        reason || (action.type === "open_verification" ? AUTH_REASON_VERIFY : AUTH_REASON_CHAT),
    });
    return false;
  },

  login: async (phone, password) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await readJson(res);
      if (res.ok && data.success && data.user) {
        applyAuthenticatedUser(data.user);
        completePendingAction();
        return { success: true, message: data.message || "Signed in." };
      }
      return { success: false, message: data.message || "Sign-in failed. Please try again.", field: data.field };
    } catch {
      return { success: false, message: "Network error: could not reach JanMithra. Please check your connection." };
    }
  },

  signup: async (form) => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await readJson(res);
      if (res.ok && data.success && data.user) {
        applyAuthenticatedUser(data.user);
        completePendingAction();
        return { success: true, message: data.message || "Account created." };
      }
      return { success: false, message: data.message || "Registration failed. Please try again.", field: data.field };
    } catch {
      return { success: false, message: "Network error: could not reach JanMithra. Please check your connection." };
    }
  },

  logout: async () => {
    let result: AuthResult = { success: true, message: "You have been signed out." };
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      const data = await readJson(res);
      if (!res.ok) result = { success: false, message: data.message || "Could not end your session on the server." };
    } catch {
      result = { success: false, message: "Network error: your session could not be ended on the server." };
    }
    // Always clear everything personal from this browser.
    stopSpeaking();
    chatViewToken++;
    set({
      ...SIGNED_OUT_STATE,
      activeTab: "dashboard",
      pendingAction: null,
      authModalOpen: false,
      authModalReason: null,
      isSpeaking: false,
      speakingMessageId: null,
      authNotice: result.success ? null : result.message,
    });
    return result;
  },

  clearComposerDraft: () => set({ composerDraft: null }),

  setActiveTab: (tab) => {
    if (tab === "chat" && !get().isAuthenticated) {
      get().requireAuth({ type: "open_chat" });
      return;
    }
    set({ activeTab: tab });
  },

  setSelectedCategoryFilter: (category) => set({ selectedCategoryFilter: category }),

  setSelectedScheme: (scheme) => set({ selectedScheme: scheme }),

  setPeerContactModal: (peer) => set({ peerContactModal: peer }),

  setVerificationModalOpen: (open) => {
    if (open && !get().isAuthenticated) {
      get().requireAuth({ type: "open_verification" });
      return;
    }
    set({ verificationModalOpen: open });
  },

  setIsListening: (listening) => set({ isListening: listening }),

  /* ---------------- Conversations ---------------- */

  loadConversations: async (opts) => {
    if (!get().isAuthenticated) return;
    const farmerId = get().currentFarmer.id;
    set({ conversationsLoading: true, conversationsError: null });
    try {
      const res = await fetch("/api/conversations", { cache: "no-store" });
      if (res.status === 401) {
        handleSessionExpired();
        return;
      }
      const data = await readJson(res);
      if (!res.ok || !data.success) {
        set({
          conversationsLoading: false,
          conversationsError: data.message || "Could not load your conversations.",
        });
        return;
      }
      if (get().currentFarmer.id !== farmerId) return; // user changed meanwhile
      const list: ConversationSummary[] = data.conversations || [];
      set({ conversations: list, conversationsLoading: false });

      if (opts?.openLatest) {
        const remembered = recallConversation(farmerId);
        const target = list.find((c) => c.id === remembered)?.id || list[0]?.id;
        if (target) await get().openConversation(target);
        else get().startNewConversation();
      }
    } catch {
      set({ conversationsLoading: false, conversationsError: "Network error while loading your conversations." });
    }
  },

  openConversation: async (id) => {
    if (!get().isAuthenticated) return;
    const token = ++chatViewToken;
    set({ activeConversationId: id, chatMessages: [], messagesLoading: true, chatError: null, isAwaitingReply: false });
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(id)}`, { cache: "no-store" });
      if (token !== chatViewToken) return;
      if (res.status === 401) {
        handleSessionExpired({ type: "open_chat" });
        return;
      }
      const data = await readJson(res);
      if (res.status === 404) {
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          messagesLoading: false,
          chatError: "That conversation no longer exists.",
          activeConversationId: null,
        }));
        rememberConversation(get().currentFarmer.id, null);
        return;
      }
      if (!res.ok || !data.success) {
        set({ messagesLoading: false, chatError: data.message || "Could not load this conversation." });
        return;
      }
      set((state) => ({
        chatMessages: data.messages || [],
        messagesLoading: false,
        conversations: upsertConversation(state.conversations, data.conversation),
      }));
      rememberConversation(get().currentFarmer.id, id);
    } catch {
      if (token === chatViewToken) {
        set({ messagesLoading: false, chatError: "Network error while loading this conversation." });
      }
    }
  },

  startNewConversation: () => {
    chatViewToken++;
    set({ activeConversationId: null, chatMessages: [], chatError: null, messagesLoading: false, isAwaitingReply: false });
    if (get().isAuthenticated) rememberConversation(get().currentFarmer.id, null);
  },

  deleteConversation: async (id) => {
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.status === 401) {
        handleSessionExpired();
        return { success: false, message: "Please sign in again." };
      }
      const data = await readJson(res);
      if (!res.ok && res.status !== 404) {
        return { success: false, message: data.message || "Could not delete the conversation." };
      }
      set((state) => ({ conversations: state.conversations.filter((c) => c.id !== id) }));
      if (get().activeConversationId === id) get().startNewConversation();
      return { success: true, message: "Conversation deleted." };
    } catch {
      return { success: false, message: "Network error: the conversation was not deleted." };
    }
  },

  /* ---------------- Chat ---------------- */

  sendChatMessage: async (text, image, fileName, fileType, classification) => {
    const trimmed = (text || "").trim();
    if (!trimmed) return;
    if (!get().isAuthenticated) {
      get().requireAuth({ type: "send_message", text: trimmed });
      return;
    }
    if (get().isAwaitingReply) return;

    const clientMessageId = newClientId();
    const userMsg: ChatMessage = {
      id: `local_${clientMessageId}`,
      clientMessageId,
      sender: "user",
      text: trimmed,
      image,
      fileName,
      fileType,
      classification,
      status: "sending",
      timestamp: new Date().toISOString(),
    };
    set((state) => ({ chatMessages: [...state.chatMessages, userMsg] }));

    await postChat(userMsg, image ? { data: image, fileName, fileType, classification } : undefined);
  },

  retryChatMessage: async (clientMessageId) => {
    if (!get().isAuthenticated) {
      const msg = get().chatMessages.find((m) => m.clientMessageId === clientMessageId);
      get().requireAuth({ type: "send_message", text: msg?.text || "" });
      return;
    }
    if (get().isAwaitingReply) return;
    const msg = get().chatMessages.find((m) => m.clientMessageId === clientMessageId && m.sender === "user");
    if (!msg) return;
    set((state) => ({
      chatMessages: state.chatMessages.map((m) =>
        m === msg ? { ...m, status: "sending" as const, error: undefined } : m
      ),
    }));
    await postChat(
      { ...msg, status: "sending" },
      msg.image ? { data: msg.image, fileName: msg.fileName, fileType: msg.fileType, classification: msg.classification } : undefined
    );
  },

  handleClarificationChip: (chipText) => {
    const lower = chipText.toLowerCase();
    if (
      lower.includes("modal") ||
      lower.includes("scanner") ||
      lower.includes("చూడండి") ||
      lower.includes("देखें") ||
      lower.includes("open document") ||
      lower.includes("మార్చు") ||
      lower.includes("update") ||
      lower.includes("अपडेट") ||
      lower.includes("மாற்று") ||
      lower.includes("ಬದಲಾಯಿಸಿ") ||
      lower.includes("পরিবর্তন") ||
      lower.includes("కార్డు స్కాన్") ||
      lower.includes("कार्ड स्कैन") ||
      lower.includes("soil card")
    ) {
      set({ verificationModalOpen: true });
      return;
    }
    if (
      lower.includes("సమీప రైతు") ||
      lower.includes("రైతులతో మాట్లాడండి") ||
      lower.includes("किसान से जुड़ें") ||
      lower.includes("விவசாயியுடன் பேசுங்கள்") ||
      lower.includes("ರೈತರೊಂದಿಗೆ ಮಾತನಾಡಿ") ||
      lower.includes("কৃষকের সাথে") ||
      lower.includes("peer")
    ) {
      set({ activeTab: "peers" });
      return;
    }
    if (
      lower.includes("అన్ని పథకాలు") ||
      lower.includes("పాత్ పథకాలు") ||
      lower.includes("पात्र सरकारी योजनाएं") ||
      lower.includes("அனைத்து அரசு திட்டங்கள்") ||
      lower.includes("ಎಲ್ಲಾ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು") ||
      lower.includes("যোগ্য সরকারি প্রকল্প") ||
      lower.includes("eligible schemes")
    ) {
      set({ activeTab: "schemes" });
      return;
    }
    get().sendChatMessage(chipText);
  },

  speakMessage: (id, text) => {
    const lang = get().language;
    set({ isSpeaking: true, speakingMessageId: id });

    speakText(
      text,
      lang,
      () => set({ isSpeaking: false, speakingMessageId: null }),
      () => set({ isSpeaking: false, speakingMessageId: null })
    );
  },

  stopAudio: () => {
    stopSpeaking();
    set({ isSpeaking: false, speakingMessageId: null });
  },

  startMockVerification: (presetKey) => {
    const preset = MOCK_OCR_PRESETS[presetKey];
    if (!preset) return;

    set({
      selectedPresetKey: presetKey,
      verificationScanning: true,
      verificationResult: null,
      outOfScopeError: null,
    });

    // Simulate Llama 3.2 Vision OCR latency
    setTimeout(() => {
      set({
        verificationScanning: false,
        verificationResult: preset,
        outOfScopeError: null,
      });
    }, 2200);
  },

  analyzeUploadedFile: async (fileBase64, fileName, fileType, category = "auto_detect") => {
    set({
      verificationScanning: true,
      verificationResult: null,
      outOfScopeError: null,
      selectedPresetKey: null,
    });

    // 1. Client-side pixel domain hints
    let classification: any = null;
    try {
      classification = await classifyBase64Image(fileBase64, fileName, category);
    } catch (e) {
      console.warn("Client-side classification notice:", e);
    }

    const customApiKey =
      typeof window !== "undefined"
        ? localStorage.getItem("janmitra_custom_vision_key") || undefined
        : undefined;

    try {
      const res = await fetch("/api/ocr/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64,
          fileName,
          fileType,
          docCategory: category,
          classification,
          customApiKey,
        }),
      });

      if (res.status === 401) {
        set({ verificationScanning: false, verificationModalOpen: false });
        handleSessionExpired({ type: "open_verification" });
        return false;
      }
      const data = await res.json();
      if (data.isOutOfScope || !data.success) {
        set({
          verificationScanning: false,
          verificationResult: null,
          outOfScopeError: {
            title: data.isOutOfScope ? "Irrelevant image" : "Could not read this upload",
            message: data.message || "Image does not appear to be related to agriculture or government schemes.",
            reason: data.reason || "The uploaded photo does not contain identifiable farm crops, soil, or official farmer documents.",
            previewUrl: fileBase64,
            suggestions: data.suggestions || [
              "Capture a clear photo of an affected farm crop or plant leaf for disease diagnosis.",
              "Take a photo of an official Land Patta, RoR 1B, Soil Health Card, or Farmer ID.",
            ],
          },
        });
        return false;
      }

      if (data.success && data.detection) {
        set({
          verificationScanning: false,
          verificationResult: data.detection,
          outOfScopeError: null,
        });
        return true;
      }
    } catch (e: any) {
      console.warn("Failed to reach /api/ocr/analyze:", e);
      set({
        verificationScanning: false,
        verificationResult: null,
        outOfScopeError: {
          title: "Analysis Error",
          message: "Could not reach the JanMithra vision server.",
          reason: e?.message || "Network timeout or connection error during image analysis.",
          previewUrl: fileBase64,
          suggestions: [
            "Please check your internet connection and try again.",
            "Capture a clear, well-lit photo of the agricultural document or crop leaf.",
            "Ensure the file size is less than 8 MB.",
          ],
        },
      });
      return false;
    }

    return false;
  },

  confirmExtractedData: async () => {
    const result = get().verificationResult as any;
    if (!result || result.analysisQuality === "partial") return;
    try {
      if (!result.analysisRecordId) throw new Error("This analysis could not be saved. Please scan again before confirming.");
      const response = await fetch("/api/verify-doc", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisRecordId: result.analysisRecordId }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Could not save your review.");
      await get().initAuth({ silent: true });
      set({ verificationModalOpen: false });
    } catch (error) {
      set({ verificationResult: { ...result, saveError: error instanceof Error ? error.message : "Could not save your review. Please retry." } as any });
    }
  },

  resetVerification: () => {
    set({
      verificationScanning: false,
      verificationResult: null,
      outOfScopeError: null,
      selectedPresetKey: null,
    });
  },
};
});
