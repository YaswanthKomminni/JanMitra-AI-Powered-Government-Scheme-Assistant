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
  sendChatMessage: (text: string, image?: string, fileName?: string, fileType?: string) => Promise<void>;
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
  const postChat = async (msg: ChatMessage, attachment?: { data: string; fileName?: string; fileType?: string }) => {
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
    set({ language: lang });

    // Automatically update existing chat messages into the newly selected language
    const currentMessages = get().chatMessages;
    const farmer = get().currentFarmer;
    const t = translations[lang] as any;

    const updatedMessages = currentMessages.map((msg) => {
      // 1. Initial greeting
      if (msg.id === "msg_init" || msg.id === "msg_01") {
        return getInitialChatMessage(lang, farmer.name);
      }

      // 2. Verified document AI response
      if (
        msg.sender === "ai" &&
        (msg.docDetection ||
          msg.text.includes("🏛️") ||
          msg.text.includes("Sale Deed") ||
          msg.text.includes("ధరణి") ||
          msg.text.includes("धरणी") ||
          msg.text.includes("తరணி") ||
          msg.text.includes("ధృవీకరించబడిన") ||
          msg.text.includes("పత్ర వివరాలు") ||
          msg.text.includes("దస్తావేజు") ||
          msg.text.includes("దస్త్రం") ||
          msg.text.includes("విక్రయ") ||
          msg.text.includes("விற்பனை") ||
          msg.text.includes("ಮಾರಾಟ") ||
          msg.text.includes("বিক্রয়") ||
          msg.text.includes("Analyzed Successfully") ||
          msg.text.includes("విజయవంతంగా విశ్లేషించబడింది") ||
          msg.text.includes("வெற்றிகரமாக பகுப்பாய்வு"))
      ) {
        const det = msg.docDetection || get().verificationResult || {
          title: "Telangana Dharani Registered Sale Deed (0.2250 Ac.Gts)",
          confidenceScore: 0.98,
          detectionSummary: "Farmland Registered Deed of Sale (Sale Deed) - Warangal District",
          extractedData: {
            docType: "Registered Sale Deed (Farmland)",
            ownerName: "Banothu Venkanna",
            sellerName: "Narala Navya Sri",
            surveyNumber: "Survey No: 65/ఆ/1 (Redlawada)",
            extentAcGts: "0.2250 Ac.Gts",
            considerationAmount: "₹1,26,518",
            passBookNumber: "T22090081201",
            districtMandal: "Redlawada (V), Nekkonda (M), Warangal Dist",
            natureOfDeed: "Absolute Sale of Agricultural Land",
          },
          schemesUnlocked: [
            "Dharani Auto-Mutation & e-Passbook",
            "PM-KISAN ₹6,000/year DBT",
            "Rythu Bharosa / Rythu Bandhu Farm Investment Support",
            "Kisan Credit Card (KCC) Concessional 4% Loan",
            "PM-KUSUM 60% Solar Water Pump",
          ],
        };
        const localized = formatDocumentAnalysisReply(det, lang);
        return {
          ...msg,
          text: localized.text,
          clarificationChips: localized.chips,
          docDetection: det,
        };
      }

      // 3. User default inspect image message
      if (
        msg.sender === "user" &&
        msg.image &&
        (msg.text.includes("inspect this attached") ||
          msg.text.includes("పరిశీలించండి") ||
          msg.text.includes("విశ్లేషించండి") ||
          msg.text.includes("विश्लेषण") ||
          msg.text.includes("ஆய்வு") ||
          msg.text.includes("ಪರಿಶೀಲಿಸಿ") ||
          msg.text.includes("পরীক্ষা"))
      ) {
        return {
          ...msg,
          text: t.inspectDocPrompt || "Please inspect this attached crop/document photo using AI Vision",
        };
      }

      // 4. User default inspect file message
      if (
        msg.sender === "user" &&
        msg.fileName &&
        !msg.image &&
        (msg.text.includes("analyze this attached") ||
          msg.text.includes("పరిశీలించండి") ||
          msg.text.includes("విశ్లేషించండి") ||
          msg.text.includes("विश्लेषण") ||
          msg.text.includes("ஆய்வு") ||
          msg.text.includes("ಪರಿಶೀಲಿಸಿ") ||
          msg.text.includes("পরীক্ষা"))
      ) {
        return {
          ...msg,
          text: `${t.inspectDocFilePrompt || "Please analyze this attached government document"}: ${msg.fileName}`,
        };
      }

      // 5. Conversational AI responses in chat history
      if (msg.sender === "ai" && !msg.docDetection) {
        const text = msg.text;

        // Farmer Profile inquiry response
        if (
          text.includes("రైతు ప్రొఫైల్") ||
          text.includes("Farmer Profile") ||
          text.includes("किसान प्रोफ़ाइल") ||
          text.includes("விவசாயி சுயவிவரம்") ||
          text.includes("ರೈತರ ಪ್ರೊಫೈಲ್") ||
          text.includes("কৃষক প্রোফাইল")
        ) {
          const formatted = formatFarmerProfileReply(get().currentFarmer, lang);
          return {
            ...msg,
            text: formatted.text,
            clarificationChips: formatted.chips,
          };
        }

        // Whitefly pest control
        if (
          text.includes("Whitefly") ||
          text.includes("whiteflies") ||
          text.includes("తెల్లదోమ") ||
          text.includes("सफेद मक्खी") ||
          text.includes("வெள்ளை ஈ") ||
          text.includes("ಬಿಳಿ ನೊಣ") ||
          text.includes("সাদা মাছি")
        ) {
          if (lang === "te") {
            return {
              ...msg,
              text: "మీ పత్తి చేనులో తెల్లదోమ (Whitefly) తెగులు గుర్తించబడింది. ఆకులు ముడుచుకుని తేనెజిగురు కారుతుంది. నివారణకు: ఎకరాకు వేపనూనె 10,000 ppm 2ml/లీటరు లేదా డయాఫెంథియురాన్ 50% WP 1గ్రాము/లీటరు నీటిలో కలిపి సాయంత్రం వేళ పిచికారీ చేయండి.",
              clarificationChips: ["పిచికారీ సమయం ఎప్పుడు?", "మందుల షాపు వివరాలు", "పంట నష్టం బీమా వర్తిస్తుందా?"],
            };
          } else if (lang === "hi") {
            return {
              ...msg,
              text: "कपास में सफेद मक्खी (Whitefly) का प्रकोप पहचाना गया है। पत्तियां मुड़ने और चिपचिपा स्राव की समस्या के लिए: नीम का तेल 10,000 ppm @ 2 मिली/लीटर पानी, या डायफेंथियूरॉन 50% WP @ 1 ग्राम/लीटर का शाम को छिड़काव करें।",
              clarificationChips: ["दवा छिड़काव का समय", "नजदीकी कृषि केंद्र", "फसल बीमा क्लेम प्रक्रिया"],
            };
          } else if (lang === "ta") {
            return {
              ...msg,
              text: "பருத்தியில் வெள்ளை ஈ (Whitefly) தாக்குதல் கண்டறியப்பட்டுள்ளது. இலைகள் சுருங்கி தேன் போன்ற பிசின் வடிகிறது. தடுப்பு முறை: ஏக்கருக்கு வேப்பெண்ணெய் 10,000 ppm @ 2 மிலி/லிட்டர் அல்லது டயாபெந்தியூரான் 50% WP @ 1 கிராம்/லிட்டர் தண்ணீரில் கலந்து மாலை வேளையில் தெளிக்கவும்.",
              clarificationChips: ["மருந்து தெளிக்கும் நேரம் எப்போது?", "அருகிலுள்ள உழவர் மருந்தகம்", "பயிர் காப்பீட்டு உதவி"],
            };
          } else if (lang === "kn") {
            return {
              ...msg,
              text: "ಹತ್ತಿ ಬೆಳೆಯಲ್ಲಿ ಬಿಳಿ ನೊಣ (Whitefly) ಬಾಧೆ ಕಂಡುಬಂದಿದೆ. ಎಲೆಗಳು ಸುರುಟಿಕೊಂಡು ಜಿಗುಟು ಸ್ರವಿಸುತ್ತದೆ. ನಿಯಂತ್ರಣಕ್ಕೆ: ಎಕರೆಗೆ ಬೇವಿನ ಎಣ್ಣೆ 10,000 ppm @ 2 ಮಿಲಿ/ಲೀಟರ್ ಅಥವಾ ಡಯಾಫೆಂಥಿಯುರಾನ್ 50% WP @ 1 ಗ್ರಾಂ/ಲೀಟರ್ ನೀರಿನಲ್ಲಿ ಬೆರೆಸಿ ಸಂಜೆ ವೇಳೆ ಸಿಂಪಡಿಸಿ.",
              clarificationChips: ["ಸಿಂಪಡಣೆ ಸಮಯ ಯಾವಾಗ?", "ಔಷಧಿ ಅಂಗಡಿ ವಿವರ", "ಬೆಳೆ ವಿಮೆ ಲಭ್ಯವಿದೆಯೇ?"],
            };
          } else if (lang === "bn") {
            return {
              ...msg,
              text: "তুলা ফসলে সাদা মাছি (Whitefly) আক্রমণ সনাক্ত করা হয়েছে। পাতা কুঁকড়ে যাচ্ছে ও আঠালো ভাব হচ্ছে। দমনের জন্য: প্রতি লিটার জলে নিম তেল 10,000 ppm @ ২ মিলি বা ডায়াফেন্থিউরন 50% WP @ ১ গ্রাম মিশিয়ে বিকেলের দিকে স্প্রে করুন।",
              clarificationChips: ["স্প্রে করার সঠিক সময়", "নিকটবর্তী কৃষি সেবা কেন্দ্র", "ফসল বীমা সুবিধা"],
            };
          } else {
            return {
              ...msg,
              text: "For Whitefly nymph pest control on Cotton: Spray Neem Oil (10,000 ppm) @ 2ml/litre water, or Diafenthiuron 50% WP @ 1g/litre water during cooler evening hours. Ensure spray covers underside of the leaves.",
              clarificationChips: ["Spray schedule", "Eligible under PMFBY crop insurance?", "Upload photo for scan"],
            };
          }
        }

        // PM-KUSUM Solar pump
        if (
          text.includes("PM-KUSUM") ||
          text.includes("solar") ||
          text.includes("pump") ||
          text.includes("కుసుమ్") ||
          text.includes("సోలార్") ||
          text.includes("सोलर") ||
          text.includes("சோலார்") ||
          text.includes("ಸೋಲಾರ್") ||
          text.includes("সৌর")
        ) {
          if (lang === "te") {
            return {
              ...msg,
              text: "PM-KUSUM పథకం ద్వారా 60% సబ్సిడీతో 5HP సోలార్ పంపు లభిస్తుంది. మీ పొలానికి కరెంట్ బిల్లు లేదా డీజిల్ ఖర్చు ఉండదు. మీ దగ్గరలోని రైతు రామేశ్వర్ రెడ్డి (3.8 కి.మీ) దీనిని అమర్చి నెలకు ₹4,600 డీజిల్ ఆదా చేసుకున్నారు. మీ దగ్గర బోరుబావి ఉందా?",
              clarificationChips: ["అవును, బోరుబావి ఉంది", "బావి ఉంది", "కొత్తగా వేయాలి", "సబ్సిడీ అర్హతలు చూపించు"],
            };
          } else if (lang === "hi") {
            return {
              ...msg,
              text: "पीएम-कुसुम योजना के तहत 60% सरकारी सब्सिडी पर 5HP सोलर पंप मिल रहा है। आपके पड़ोस में रामेश्वर जी (3.8 किमी दूर) ने इसे लगवाकर हर महीने ₹4,600 डीजल का बचाया। क्या आपके पास वर्तमान में बोरवेल या कुआं है?",
              clarificationChips: ["हाँ, बोरवेल है", "कुआं है", "नया बोरवेल लगवाना है", "आवश्यक दस्तावेज़ बताएं"],
            };
          } else if (lang === "ta") {
            return {
              ...msg,
              text: "PM-KUSUM திட்டத்தின் கீழ் 60% அரசு மானியத்துடன் 5HP சோலார் பம்ப் கிடைக்கிறது. உங்கள் வயலுக்கு மின் கட்டணம் அல்லது டீசல் செலவு இருக்காது. உங்கள் அண்டை விவசாயி ராமேஸ்வர ரெட்டி (3.8 கி.மீ) இதனை அமைத்து மாதம் ₹4,600 டீசல் சேமித்துள்ளார். உங்களிடம் ஆழ்துளை கிணறு உள்ளதா?",
              clarificationChips: ["ஆம், ஆழ்துளை கிணறு உள்ளது", "திறந்த கிணறு உள்ளது", "புதிதாக அமைக்க வேண்டும்", "மானிய தகுதிகள் காட்டு"],
            };
          } else if (lang === "kn") {
            return {
              ...msg,
              text: "PM-KUSUM ಯೋಜನೆಯಡಿ 60% ಸಬ್ಸಿಡಿಯೊಂದಿಗೆ 5HP ಸೋಲಾರ್ ಪಂಪ್ ಲಭ್ಯವಿದೆ. ನಿಮ್ಮ ಜಮೀನಿಗೆ ವಿದ್ಯುತ್ ಬಿಲ್ ಅಥವಾ ಡೀಸೆಲ್ ವೆಚ್ಚ ಇರುವುದಿಲ್ಲ. ನಿಮ್ಮ ನೆರೆಯ ರಾಮೇಶ್ವರ್ ರೆಡ್ಡಿ (3.8 ಕಿ.ಮೀ) ಇದನ್ನು ಅಳವಡಿಸಿ ತಿಂಗಳಿಗೆ ₹4,600 ಡೀಸೆಲ್ ಉಳಿಸಿದ್ದಾರೆ. ನಿಮ್ಮಲ್ಲಿ ಕೊಳವೆಬಾವಿ ಇದೆಯೇ?",
              clarificationChips: ["ಹೌದು, ಕೊಳವೆಬಾವಿ ಇದೆ", "ಬಾವಿ ಇದೆ", "ಹೊಸದಾಗಿ ಕೊರೆಯಬೇಕು", "ಸಬ್ಸಿಡಿ ಅರ್ಹತೆಗಳನ್ನು ತೋರಿಸಿ"],
            };
          } else if (lang === "bn") {
            return {
              ...msg,
              text: "PM-KUSUM প্রকল্পের অধীনে ৬০% সরকারি ভর্তুকিতে ৫HP সৌর পাম্প পাওয়া যাচ্ছে। আপনার জমিতে বিদ্যুৎ বিল বা ডিজেল খরচ থাকবে না। আপনার প্রতিবেশী রামেশ্বর রেড্ডি (৩.৮ কিমি) এটি বসিয়ে মাসে ₹৪,৬০০ ডিজেল বাঁচিয়েছেন। আপনার কি সাবমার্সিবল বা নলকূপ আছে?",
              clarificationChips: ["হ্যাঁ, নলকূপ আছে", "কুয়ো আছে", "নতুন বসাতে হবে", "ভর্তুকির যোগ্যতা দেখান"],
            };
          } else {
            return {
              ...msg,
              text: "Under PM-KUSUM Scheme Component-B, you are eligible for 60% subsidy on a 5HP Solar Pump (Subsidy value ₹1,32,000). Your neighbor Rameshwar Reddy (3.8 km away in Kothur) installed this and saved ₹4,600/month on diesel! What is your existing water source type?",
              clarificationChips: ["I have a Borewell", "Open Irrigation Well", "Canal Water only", "What documents are needed?"],
            };
          }
        }

        // PM-KISAN installment
        if (
          text.includes("PM-KISAN") ||
          text.includes("16వ విడత") ||
          text.includes("16वीं किस्त") ||
          text.includes("16வது தவணை") ||
          text.includes("16ನೇ ಕಂತು") ||
          text.includes("১৬তম কিস্তি")
        ) {
          if (lang === "te") {
            return {
              ...msg,
              text: "మీ PM-KISAN 16వ విడత ₹2,000 ప్రాసెస్ చేయబడింది. మీ ఆధార్ ఈ-కేవైసీ మరియు ధరణి రికార్డులు మీ SBI బ్యాంక్ ఖాతా (చివరి అంకెలు •••• 4108) తో లింక్ చేయబడ్డాయి.",
              clarificationChips: ["తదుపరి విడత తేదీ?", "రసీదు డౌన్‌లోడ్", "భూమి లింకేజీ స్థితి"],
            };
          } else if (lang === "hi") {
            return {
              ...msg,
              text: "आपकी PM-KISAN 16वीं किस्त ₹2,000 स्वीकृत हो चुकी है। आपका आधार ई-केवाईसी और भूमि रिकॉर्ड आपके एसबीआई खाते (•••• 4108) से लिंक हैं।",
              clarificationChips: ["अगली किस्त की तारीख?", "भुगतान रसीद डाउनलोड करें", "भूमि लिंकेज जांचें"],
            };
          } else if (lang === "ta") {
            return {
              ...msg,
              text: "உங்கள் PM-KISAN 16வது தவணை ₹2,000 அங்கீகரிக்கப்பட்டுவிட்டது. உங்கள் ஆதார் இ-கேஒய்சி மற்றும் நில ஆவணங்கள் உங்கள் எஸ்பிஐ வங்கி கணக்குடன் (•••• 4108) இணைக்கப்பட்டுள்ளன.",
              clarificationChips: ["அடுத்த தவணை எப்போது?", "கட்டண ரசீது பதிவிறக்கம்", "நில இணைப்பு நிலை"],
            };
          } else if (lang === "kn") {
            return {
              ...msg,
              text: "ನಿಮ್ಮ PM-KISAN 16ನೇ ಕಂತು ₹2,000 ಪ್ರಕ್ರಿಯೆಗೊಂಡಿದೆ. ನಿಮ್ಮ ಆಧಾರ್ ಇ-ಕೆವೈಸಿ ಮತ್ತು ಭೂ ದಾಖಲೆಗಳು ನಿಮ್ಮ ಎಸ್‌ಬಿಐ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ (•••• 4108) ಲಿಂಕ್ ಆಗಿವೆ.",
              clarificationChips: ["ಮುಂದಿನ ಕಂತಿನ ದಿನಾಂಕ?", "ಪಾವತಿ ರಶೀದಿ ಡೌನ್‌ಲೋಡ್", "ಭೂಮಿ ಲಿಂಕ್ ಸ್ಥಿತಿ"],
            };
          } else if (lang === "bn") {
            return {
              ...msg,
              text: "আপনার PM-KISAN ১৬তম কিস্তি ₹২,০০০ অনুমোদিত হয়েছে। আপনার আধার ই-কেওয়াইসি এবং জমির রেকর্ড আপনার এসবিআই অ্যাকাউন্টের সাথে (•••• ৪১০৮) লিঙ্ক করা রয়েছে।",
              clarificationChips: ["পরের কিস্তির তারিখ?", "পেমেন্ট রশিদ ডাউনলোড", "জমির লিঙ্ক স্ট্যাটাস"],
            };
          } else {
            return {
              ...msg,
              text: "Your PM-KISAN 16th installment of ₹2,000 is processed. Your Aadhaar e-KYC and Dharani Land Record are verified and linked to your SBI Bank Account ending in •••• 4108.",
              clarificationChips: ["Next installment date?", "Download Payment Receipt", "Check land linkage"],
            };
          }
        }

        // Greetings & Pleasantries
        if (
          (text.includes("నమస్కారం") && (text.includes("బాగున్నారా") || text.includes("ఎలా ఉన్నారు") || text.includes("వ్యవసాయ మిత్రుడిని"))) ||
          (text.includes("नमस्ते") && (text.includes("कैसे हैं") || text.includes("कृषि साथी") || text.includes("सलाहकार"))) ||
          (text.includes("வணக்கம்") && (text.includes("நலமாக") || text.includes("தோழன்"))) ||
          (text.includes("ನಮಸ್ಕಾರ") && (text.includes("ಹೇಗಿದ್ದೀರಿ") || text.includes("ಸಂಗಾತಿ"))) ||
          (text.includes("নমস্কার") && (text.includes("কেমন আছেন") || text.includes("সহায়ক"))) ||
          (text.includes("Namaste") && (text.includes("doing") || text.includes("companion")))
        ) {
          const farmer = get().currentFarmer;
          if (lang === "te") {
            return {
              ...msg,
              text: `నమస్కారం ${farmer.name || "రమేష్"} గారు! ఎలా ఉన్నారు? నేను మీ జనమిత్ర డిజిటల్ వ్యవసాయ మిత్రుడిని. కొత్తూరులో మీకున్న 3.5 ఎకరాల చేనులో పత్తి, మిర్చి పంటలు బాగున్నాయా? ఈరోజు మీ వ్యవసాయానికి లేదా ఏదైనా ప్రభుత్వ సబ్సిడీ పథకానికి సంబంధించి నేను ఏ విధంగా సహాయపడగలను?`,
              clarificationChips: ["నా వివరాలు చెప్పు", "సోలార్ పంపు 60% సబ్సిడీ", "పంట తెగులు సలహా", "PM-KISAN ₹6,000 స్థితి"],
            };
          } else if (lang === "hi") {
            return {
              ...msg,
              text: `नमस्ते ${farmer.name || "रमेश"} जी! आप कैसे हैं? मैं आपका जनमित्रा कृषि सलाहकार हूँ। कोथुर में आपकी 3.5 एकड़ भूमि पर कपास और मिर्च की फसल कैसी है? आज मैं आपकी खेती या सरकारी योजनाओं में किस प्रकार सहायता कर सकता हूँ?`,
              clarificationChips: ["मेरी जानकारी बताएं", "सोलर पंप 60% सब्सिडी", "फसल कीट सलाह", "PM-KISAN स्थिति"],
            };
          } else if (lang === "ta") {
            return {
              ...msg,
              text: `வணக்கம் ${farmer.name || "ரமேஷ்"} அவர்களே! நலமாக உள்ளீர்களா? நான் உங்கள் ஜனமித்ரா விவசாய ஆலோசகர். கொத்தூரில் உங்கள் 3.5 ஏக்கர் நிலத்தில் பயிர்கள் நலமா? இன்று உங்கள் விவசாயத்திற்கு நான் எவ்வாறு உதவ முடியும்?`,
              clarificationChips: ["என் விவரங்கள் சொல்", "சோலார் பம்ப் 60% மானியம்", "பூச்சி மேலாண்மை", "PM-KISAN நிலை"],
            };
          } else if (lang === "kn") {
            return {
              ...msg,
              text: `ನಮಸ್ಕಾರ ${farmer.name || "ರಮೇಶ್"} ಅವರೇ! ಹೇಗಿದ್ದೀರಿ? ನಾನು ನಿಮ್ಮ ಜನಮಿತ್ರ ಕೃಷಿ ಮಿತ್ರ. ಕೊತ್ತೂರಿನಲ್ಲಿ ನಿಮ್ಮ 3.5 ಎಕರೆ ಜಮೀನಿನಲ್ಲಿ ಬೆಳೆಗಳು ಚೆನ್ನಾಗಿವೆಯೇ? ಇಂದು ನಿಮ್ಮ ಕೃಷಿಗೆ ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?`,
              clarificationChips: ["ನನ್ನ ವಿವರ ತಿಳಿಸಿ", "ಸೋಲಾರ್ ಪಂಪ್ 60% ಸಬ್ಸಿಡಿ", "ಕೀಟ ನಿಯಂತ್ರಣ ಸಲಹೆ", "PM-KISAN ಸ್ಥಿತಿ"],
            };
          } else if (lang === "bn") {
            return {
              ...msg,
              text: `নমস্কার ${farmer.name || "রমেশ"} বাবু! কেমন আছেন? আমি আপনার জনমিত্র কৃষি সহকারী। কোথুরে আপনার ৩.৫ একর জমিতে ফসলের অবস্থা কেমন? আজ আপনার চাষের কাজে আমি কীভাবে সাহায্য করতে পারি?`,
              clarificationChips: ["আমার তথ্য বলুন", "সৌর পাম্প ৬০% ভর্তুকি", "কীটপতঙ্গ পরামর্শ", "PM-KISAN স্থিতি"],
            };
          } else {
            return {
              ...msg,
              text: `Namaste ${farmer.name || "Ramesh"} Ji! How are you doing? I am your JanMithra farm companion. How are the cotton and chilli crops on your 3.5 Acres in Kothur? How can I assist your farming or scheme applications today?`,
              clarificationChips: ["Tell me about me", "Apply for PM-KUSUM 60%", "Pest control advice", "Check PM-KISAN ₹6,000 status"],
            };
          }
        }

        // Kisan Credit Card / Loans
        if (
          text.includes("కిసాన్ క్రెడిట్ కార్డ్") ||
          text.includes("किसान क्रेडिट कार्ड") ||
          text.includes("Kisan Credit Card") ||
          text.includes("రాయితీ వడ్డీకే బ్యాంకు పంట రుణం") ||
          text.includes("रियायती ब्याज दर पर कृषि ऋण")
        ) {
          if (lang === "te") {
            return {
              ...msg,
              text: "రమేష్ గారు, మీకున్న 3.5 ఎకరాల నల్లరేగడి పట్టా భూమి ఆధారంగా కిసాన్ క్రెడిట్ కార్డ్ (KCC) ద్వారా కేవలం 4% రాయితీ వడ్డీకే బ్యాంకు పంట రుణం పొందవచ్చు. ఎకరాకు సుమారు రూ. 45,000 నుండి రూ. 60,000 వరకు రుణం మంజూరవుతుంది. మీ ధరణి పట్టాదారు పాస్ పుస్తకం మరియు ఆధార్ కార్డు సమర్పిస్తే మీ స్థానిక బ్యాంకులోనే ఇది సులభంగా పూర్తవుతుంది. దరఖాస్తు విధానం చెప్పమంటారా?",
              clarificationChips: ["KCC వడ్డీ రేటు ఎంత?", "ఏ బ్యాంకులో దరఖాస్తు చేయాలి?", "కావలసిన పత్రాలు", "దరఖాస్తు ఫారం"],
            };
          } else if (lang === "hi") {
            return {
              ...msg,
              text: "रमेश जी, आपकी 3.5 एकड़ काली मिट्टी की भूमि के आधार पर आप किसान क्रेडिट कार्ड (KCC) द्वारा मात्र 4% रियायती ब्याज दर पर कृषि ऋण प्राप्त कर सकते हैं। प्रति एकड़ ₹45,000 से ₹60,000 तक का ऋण स्वीकृत होता है। धरणी पट्टा पासबुक और आधार कार्ड देकर अपनी स्थानीय बैंक शाखा से तुरंत आवेदन कर सकते हैं। क्या आप आवेदन प्रक्रिया जानना चाहते हैं?",
              clarificationChips: ["KCC ब्याज दर", "आवश्यक दस्तावेज़", "नजदीकी बैंक शाखा", "ऋण आवेदन"],
            };
          } else {
            return {
              ...msg,
              text: "Ramesh Ji, with your 3.5 Acres of verified farmland in Kothur, you can avail a Kisan Credit Card (KCC) crop loan at a concessional interest rate of just 4%! You are eligible for approximately ₹45,000 to ₹60,000 per acre. Submit your Dharani Patta Passbook and Aadhaar at your local bank to get started.",
              clarificationChips: ["What documents are needed?", "Check KCC interest rate", "Eligible banks in Kothur", "Apply now"],
            };
          }
        }

        // Smart empathetic fallback
        if (
          text.includes("శ్రద్ధగా గమనించాను") ||
          text.includes("అర్థమైంది! మీ") ||
          text.includes("समझा! आपकी") ||
          text.includes("समझ लिया है") ||
          text.includes("புரிந்தது! உங்கள்") ||
          text.includes("ತಿಳಿಯಿತು! ನಿಮ್ಮ") ||
          text.includes("ಬುঝেছি! আপনার") ||
          text.includes("Understood! With your") ||
          text.includes("noted your question")
        ) {
          const farmer = get().currentFarmer;
          if (lang === "te") {
            return {
              ...msg,
              text: `నమస్కారం ${farmer.name || "రమేష్"} గారు! మీ ప్రశ్నను శ్రద్ధగా గమనించాను. కొత్తూరులో మీకున్న ${farmer.landSizeAcres} ఎకరాల నల్లరేగడి భూమి మరియు పత్తి, మిర్చి పంటలను దృష్టిలో ఉంచుకుని నేను సహాయం చేస్తాను. మీకు పంటల సాగు పద్ధతులు, పురుగుమందులు, ఎరువుల మోతాదు లేదా ప్రభుత్వం అందించే సబ్సిడీ పథకాలలో ఏ అంశంపై సలహా కావాలో అడగండి, వెంటనే సరైన పరిష్కారం అందిస్తాను!`,
              clarificationChips: ["సోలార్ పంపు 60% సబ్సిడీ", "PM-KISAN డబ్బుల వివరాలు", "పంట తెగులు సలహా", "సమీప రైతులతో మాట్లాడండి"],
            };
          } else if (lang === "hi") {
            return {
              ...msg,
              text: `नमस्ते ${farmer.name || "रमेश"} जी! मैंने आपका प्रश्न समझ लिया है। कोथुर में आपकी ${farmer.landSizeAcres} एकड़ काली मिट्टी और फसलों को ध्यान में रखते हुए मैं आपकी पूरी मदद करूँगा। आपको खेती की तकनीक, खाद, कीट नियंत्रण या सरकारी सब्सिडी योजनाओं में से किस विषय पर जानकारी चाहिए?`,
              clarificationChips: ["सोलर पंप 60% सब्सिडी", "PM-KISAN ₹6,000 स्थिति", "कीट नियंत्रण सलाह", "आसपास के किसान से जुड़ें"],
            };
          } else if (lang === "ta") {
            return {
              ...msg,
              text: `வணக்கம் ${farmer.name || "ரமேஷ்"} அவர்களே! உங்கள் கேள்வியைப் புரிந்து கொண்டேன். கொத்தூரில் உங்கள் ${farmer.landSizeAcres} ஏக்கர் கரிசல் மண் நிலத்திற்கு பயனுள்ள அரசு திட்டங்கள் மற்றும் விவசாய ஆலோசனைகளை வழங்க நான் தயாராக உள்ளேன். உங்களுக்கு என்ன குறிப்பிட்ட வழிகாட்டுதல் தேவை?`,
              clarificationChips: ["சோலார் பம்ப் 60% மானியம்", "PM-KISAN தகுதி நிலை", "பூச்சி மேலாண்மை", "விவசாயியுடன் பேசுங்கள்"],
            };
          } else if (lang === "kn") {
            return {
              ...msg,
              text: `ನಮಸ್ಕಾರ ${farmer.name || "ರಮೇಶ್"} ಅವರೇ! ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಅರ್ಥಮಾಡಿಕೊಂಡಿದ್ದೇನೆ. ಕೊತ್ತೂರಿನಲ್ಲಿ ನಿಮ್ಮ ${farmer.landSizeAcres} ಎಕರೆ ಜಮೀನಿಗೆ ಸೂಕ್ತವಾದ ಕೃಷಿ ಮಾಹಿತಿ ಮತ್ತು ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ವಿವರಗಳನ್ನು ನೀಡಲು ಸಿದ್ಧನಿದ್ದೇನೆ. ನಿಮಗೆ ಯಾವ ನಿರ್ದಿಷ್ಟ ಮಾಹಿತಿ ಬೇಕು?`,
              clarificationChips: ["ಸೋಲಾರ್ ಪಂಪ್ 60% ಸಬ್ಸಿಡಿ", "PM-KISAN ವಿವರಗಳು", "ಬೆಳೆ ಕೀಟ ಸಲಹೆ", "ರೈತರೊಂದಿಗೆ ಮಾತನಾಡಿ"],
            };
          } else if (lang === "bn") {
            return {
              ...msg,
              text: `নমস্কার ${farmer.name || "রমেশ"} বাবু! আমি আপনার প্রশ্ন বুঝতে পেরেছি। কোথুরে আপনার ${farmer.landSizeAcres} একর জমির উপযোগী কৃষি পরামর্শ ও সরকারি প্রকল্পের সহায়তার জন্য আমি প্রস্তুত। আপনি কোন বিষয়ে বিস্তারিত জানতে চান?`,
              clarificationChips: ["সৌর পাম্প ৬০% ভর্তুকি", "PM-KISAN ₹৬,০০০ স্থিতি", "কীটপতঙ্গ নিয়ন্ত্রণ", "কৃষকের সাথে যোগাযোগ"],
            };
          } else {
            return {
              ...msg,
              text: `Namaste ${farmer.name || "Ramesh"} Ji! I have noted your question carefully. Considering your ${farmer.landSizeAcres} Acres of Black Soil and crops in ${farmer.village}, I am here to help with crop advisory, fertilizers, pest control, or government welfare subsidies. What specific information would you like to explore?`,
              clarificationChips: ["Solar Pump 60% Subsidy", "Check PM-KISAN ₹6,000", "Pest & Disease Advisory", "Connect with nearby peer farmers"],
            };
          }
        }
      }

      return msg;
    });

    set({ chatMessages: updatedMessages });
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

  sendChatMessage: async (text, image, fileName, fileType) => {
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
      status: "sending",
      timestamp: new Date().toISOString(),
    };
    set((state) => ({ chatMessages: [...state.chatMessages, userMsg] }));

    await postChat(userMsg, image ? { data: image, fileName, fileType } : undefined);
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
      msg.image ? { data: msg.image, fileName: msg.fileName, fileType: msg.fileType } : undefined
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

    // 1. Strict Agricultural & Scheme Scope Check
    const classification = await classifyBase64Image(fileBase64, fileName, category);

    if (!classification.isAgriRelated) {
      set({
        verificationScanning: false,
        verificationResult: null,
        outOfScopeError: {
          title: "Image Out of Scope",
          message: classification.message,
          reason: `Detected: ${classification.metrics.dominantDomain}. JanMithra is dedicated exclusively to agriculture, crop disease diagnostics, and government farmer schemes.`,
          previewUrl: fileBase64,
          suggestions: [
            "Capture a clear photo of an affected farm crop or plant leaf for disease diagnosis.",
            "Take a photo of an official Land Patta, RoR 1B, Soil Health Card, or Farmer ID.",
            "Avoid everyday indoor items, clothes, or non-agricultural objects.",
          ],
        },
      });
      return false;
    }

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
            title: "Image Out of Scope",
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

  confirmExtractedData: () => {
    const result = get().verificationResult;
    if (!result) return;

    // Send to backend PostgreSQL JanMithra
    try {
      fetch("/api/verify-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType: result.docType,
          title: result.title,
          confidenceScore: result.confidenceScore,
          extractedData: result.extractedData,
          previewUrl: result.previewUrl,
        }),
      }).catch((err) => console.warn("Background verify-doc sync notice:", err));
    } catch (e) {
      // ignore
    }

    // If land record, update farmer land size
    if (result.extractedData.landAreaAcres) {
      set((state) => ({
        currentFarmer: {
          ...state.currentFarmer,
          landSizeAcres: result.extractedData.landAreaAcres || state.currentFarmer.landSizeAcres,
          verifiedDocsCount: state.currentFarmer.verifiedDocsCount + 1,
        },
        verificationModalOpen: false,
      }));
    } else {
      set((state) => ({
        currentFarmer: {
          ...state.currentFarmer,
          verifiedDocsCount: state.currentFarmer.verifiedDocsCount + 1,
        },
        verificationModalOpen: false,
      }));
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
