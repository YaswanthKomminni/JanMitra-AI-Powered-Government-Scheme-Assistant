"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  UserPlus,
  LogIn,
  MapPin,
  Trees,
  Droplets,
  Languages,
  AlertCircle,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  Keyboard,
  Building2,
  BadgeCheck,
} from "lucide-react";
import { useFarmerStore } from "@/store/useFarmerStore";
import { SUPPORTED_LANGUAGES, translations } from "@/lib/i18n";
import { DEMO_FARMERS } from "@/lib/mockData";

export default function AuthModal() {
  const {
    authModalOpen,
    setAuthModalOpen,
    language,
    setLanguage,
    loginWithPhone,
    signupFarmer,
    setCurrentFarmer,
  } = useFarmerStore();

  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [authMethod, setAuthMethod] = useState<"otp" | "password">("otp");

  // Login states
  const [phone, setPhone] = useState("9876543210");
  const [password, setPassword] = useState("1234");
  const [showPassword, setShowPassword] = useState(false);
  const [otpStep, setOtpStep] = useState<"enter_phone" | "enter_otp">("enter_phone");
  const [otpDigits, setOtpDigits] = useState(["5", "2", "8", "9"]);
  const [showKeypad, setShowKeypad] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Signup states
  const [signupForm, setSignupForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "1234",
    state: "Telangana",
    district: "Rangareddy",
    village: "Kothur Gramam",
    landSizeAcres: "3.5",
    soilType: "black_soil",
    irrigationType: "drip",
    primaryCrops: "Cotton, Chilli, Red Gram",
    annualIncomeSlab: "Below ₹2.5 Lakhs",
    preferredLanguage: language,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const t = translations[language];

  if (!authModalOpen) return null;

  // Handle OTP digit changes with keyboard auto-advance
  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const newOtp = [...otpDigits];
    newOtp[index] = digit;
    setOtpDigits(newOtp);

    if (digit && index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // On-screen tactile keypad press handler
  const handleKeypadPress = (val: string) => {
    if (activeTab === "login") {
      if (otpStep === "enter_phone") {
        if (val === "backspace") {
          setPhone((prev) => prev.slice(0, -1));
        } else if (phone.length < 10) {
          setPhone((prev) => prev + val);
        }
      } else {
        if (val === "backspace") {
          const emptyIdx = otpDigits.findLastIndex((d) => d !== "");
          if (emptyIdx !== -1) {
            const copy = [...otpDigits];
            copy[emptyIdx] = "";
            setOtpDigits(copy);
            otpInputRefs.current[emptyIdx]?.focus();
          }
        } else {
          const firstEmpty = otpDigits.findIndex((d) => d === "");
          if (firstEmpty !== -1) {
            handleOtpChange(firstEmpty, val);
          }
        }
      }
    }
  };

  const handleSendOtp = () => {
    if (phone.length === 10) {
      setOtpStep("enter_otp");
      setFeedback({ type: "success", message: "OTP sent to +91 " + phone + " (Demo OTP: 5289)" });
    } else {
      setFeedback({ type: "error", message: "Please enter a valid 10-digit mobile number." });
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setFeedback({ type: "error", message: "Please enter a valid 10-digit mobile number." });
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    const otpCode = otpDigits.join("");
    const result = await loginWithPhone(phone, otpCode);
    setIsLoading(false);

    if (result.success) {
      setFeedback({ type: "success", message: result.message || "Logged in successfully!" });
      setTimeout(() => setAuthModalOpen(false), 800);
    } else {
      setFeedback({ type: "error", message: result.message || "Login failed." });
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupForm.name.trim()) {
      setFeedback({ type: "error", message: "Please enter the farmer's full name." });
      return;
    }
    if (signupForm.phone.length < 10) {
      setFeedback({ type: "error", message: "Please enter a valid 10-digit phone number." });
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    const result = await signupFarmer(signupForm);
    setIsLoading(false);

    if (result.success) {
      setFeedback({
        type: "success",
        message: "Account saved to JanMithra database! Opening your dashboard...",
      });
      setTimeout(() => setAuthModalOpen(false), 1000);
    } else {
      setFeedback({ type: "error", message: result.message || "Registration failed." });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-md animate-in fade-in">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-emerald-950 p-6 text-white relative">
          <button
            onClick={() => setAuthModalOpen(false)}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-700/80 text-emerald-200 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>JanMithra Secure Portal</span>
            </span>
            <span className="text-xs text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-600/40">
              MySQL Connected
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            {activeTab === "login" ? "Farmer Sign In" : "New Farmer Registration"}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
            {activeTab === "login"
              ? "Access personalized welfare subsidies, PM-KISAN, and peer farmer stories."
              : "Register your agricultural land and profile directly into JanMithra database."}
          </p>

          {/* Tab Selector */}
          <div className="mt-4 flex rounded-2xl bg-emerald-950/70 p-1 border border-emerald-700/50">
            <button
              onClick={() => {
                setActiveTab("login");
                setFeedback(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 ${
                activeTab === "login"
                  ? "bg-white text-emerald-950 shadow-md"
                  : "text-emerald-200 hover:text-white"
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In (Login)</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("signup");
                setFeedback(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 ${
                activeTab === "signup"
                  ? "bg-white text-emerald-950 shadow-md"
                  : "text-emerald-200 hover:text-white"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Sign Up (Register)</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`px-5 py-3 text-xs sm:text-sm font-bold flex items-center gap-2.5 transition animate-in fade-in ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-900 border-b border-emerald-200"
                : "bg-red-50 text-red-900 border-b border-red-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === "login" ? (
            /* ================= SIGN IN TAB ================= */
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              {/* Login Method Toggle (OTP vs Password) */}
              <div className="flex items-center justify-between p-1 bg-stone-100 rounded-xl border border-stone-200 text-xs font-bold text-stone-700">
                <button
                  type="button"
                  onClick={() => setAuthMethod("otp")}
                  className={`flex-1 py-1.5 rounded-lg transition ${
                    authMethod === "otp" ? "bg-white text-emerald-900 shadow-sm font-black" : "hover:text-stone-900"
                  }`}
                >
                  Login via OTP (Recommended)
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod("password")}
                  className={`flex-1 py-1.5 rounded-lg transition ${
                    authMethod === "password" ? "bg-white text-emerald-900 shadow-sm font-black" : "hover:text-stone-900"
                  }`}
                >
                  Login via Password / PIN
                </button>
              </div>

              {/* Mobile Number Input */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-stone-700 mb-2">
                  Mobile Number (Registered with Aadhaar / JanMithra)
                </label>
                <div className="flex items-center rounded-2xl border-2 border-emerald-600/80 bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition overflow-hidden shadow-sm">
                  <span className="px-4 py-3 bg-emerald-50 text-emerald-900 font-extrabold text-base border-r border-emerald-200">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    required
                    maxLength={10}
                    placeholder="Enter 10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="w-full px-4 py-3 text-lg font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none tracking-wider"
                  />
                  <Smartphone className="w-5 h-5 text-emerald-700 mr-4 shrink-0" />
                </div>
              </div>

              {/* OTP or Password Field */}
              {authMethod === "otp" ? (
                otpStep === "enter_phone" ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={phone.length !== 10 || isLoading}
                    className={`w-full py-3.5 rounded-2xl font-black text-base shadow-md flex items-center justify-center gap-2 transition ${
                      phone.length === 10 && !isLoading
                        ? "bg-emerald-700 hover:bg-emerald-800 text-white active:scale-98"
                        : "bg-stone-200 text-stone-400 cursor-not-allowed"
                    }`}
                  >
                    <span>Get Login OTP</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                ) : (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase tracking-wider text-stone-700">
                        Enter 4-Digit OTP (Demo: 5289)
                      </label>
                      <button
                        type="button"
                        onClick={() => setOtpStep("enter_phone")}
                        className="text-xs font-bold text-emerald-700 hover:underline"
                      >
                        Change Mobile Number
                      </button>
                    </div>

                    {/* 4 Interactive Digit Boxes */}
                    <div className="flex justify-center gap-3">
                      {[0, 1, 2, 3].map((idx) => (
                        <input
                          key={idx}
                          ref={(el) => (otpInputRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={otpDigits[idx]}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className="w-14 h-16 rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 text-stone-900 text-center text-3xl font-black focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
                        />
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-base shadow-lg shadow-emerald-800/30 flex items-center justify-center gap-2 active:scale-98 transition"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                      )}
                      <span>{isLoading ? "Authenticating..." : "Verify OTP & Enter"}</span>
                    </button>
                  </div>
                )
              ) : (
                /* Password Flow */
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-stone-700 mb-2">
                      Farmer PIN / Password
                    </label>
                    <div className="relative flex items-center rounded-2xl border border-stone-300 bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition overflow-hidden">
                      <Lock className="w-5 h-5 text-stone-400 ml-3.5 shrink-0" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Default PIN: 1234"
                        className="w-full px-3 py-3 text-base font-bold text-stone-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="px-3 text-stone-400 hover:text-stone-700"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-base shadow-lg shadow-emerald-800/30 flex items-center justify-center gap-2 active:scale-98 transition"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                    )}
                    <span>{isLoading ? "Signing In..." : "Sign In with Password"}</span>
                  </button>
                </div>
              )}

              {/* Optional On-Screen Keypad Toggle for Touchscreens */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowKeypad(!showKeypad)}
                  className="w-full py-2 px-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Keyboard className="w-4 h-4 text-emerald-700" />
                  <span>{showKeypad ? "Hide Tactile Keypad" : "Show On-Screen Numeric Keypad"}</span>
                </button>

                {showKeypad && (
                  <div className="mt-3 p-3 bg-stone-100 rounded-2xl border border-stone-200 animate-in fade-in">
                    <div className="grid grid-cols-3 gap-2">
                      {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleKeypadPress(num)}
                          className="h-12 rounded-xl bg-white text-stone-900 text-lg font-black shadow-sm active:bg-emerald-100 active:scale-95 transition flex items-center justify-center border border-stone-200 hover:border-emerald-400"
                        >
                          {num}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          if (otpStep === "enter_phone") setPhone("");
                          else setOtpDigits(["", "", "", ""]);
                        }}
                        className="h-12 rounded-xl bg-stone-200 text-stone-600 text-xs font-bold active:bg-stone-300 transition flex items-center justify-center uppercase"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => handleKeypadPress("0")}
                        className="h-12 rounded-xl bg-white text-stone-900 text-lg font-black shadow-sm active:bg-emerald-100 active:scale-95 transition flex items-center justify-center border border-stone-200 hover:border-emerald-400"
                      >
                        0
                      </button>
                      <button
                        type="button"
                        onClick={() => handleKeypadPress("backspace")}
                        className="h-12 rounded-xl bg-stone-200 text-stone-800 text-sm font-bold active:bg-stone-300 transition flex items-center justify-center"
                      >
                        ⌫ Back
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Instant 1-Click Demo Profiles */}
              <div className="pt-3 border-t border-stone-200">
                <p className="text-xs font-black uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>1-Click Demo Farmer Profiles:</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {DEMO_FARMERS.map((df) => (
                    <button
                      key={df.id}
                      type="button"
                      onClick={() => {
                        setCurrentFarmer(df);
                        setAuthModalOpen(false);
                      }}
                      className="p-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 transition text-left flex items-center gap-2.5 active:scale-95"
                    >
                      <img
                        src={df.avatarUrl}
                        alt={df.name}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/50"
                      />
                      <div className="overflow-hidden">
                        <p className="font-black text-xs text-stone-900 truncate">
                          {df.name}
                        </p>
                        <p className="text-[10px] text-emerald-800 font-bold truncate">
                          {df.state.slice(0, 9)} • {df.landSizeAcres} Ac
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            /* ================= SIGN UP TAB ================= */
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Farmer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Komminni Yaswanth"
                    value={signupForm.name}
                    onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                    className="w-full p-3 rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold text-stone-900"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    10-Digit Mobile Number *
                  </label>
                  <div className="flex items-center rounded-xl border border-stone-300 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 overflow-hidden bg-white">
                    <span className="bg-stone-100 px-3 py-3 text-xs font-bold text-stone-700 border-r border-stone-200">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9876543210"
                      value={signupForm.phone}
                      onChange={(e) =>
                        setSignupForm({
                          ...signupForm,
                          phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                        })
                      }
                      className="w-full px-3 py-3 text-sm font-semibold text-stone-900 focus:outline-none"
                    />
                  </div>
                </div>

                {/* State */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    State
                  </label>
                  <select
                    value={signupForm.state}
                    onChange={(e) => setSignupForm({ ...signupForm, state: e.target.value })}
                    className="w-full p-3 rounded-xl border border-stone-300 bg-white text-sm font-semibold text-stone-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="Telangana">Telangana</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Punjab">Punjab</option>
                    <option value="West Bengal">West Bengal</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Rajasthan">Rajasthan</option>
                  </select>
                </div>

                {/* District & Village */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    District & Village
                  </label>
                  <input
                    type="text"
                    placeholder="Rangareddy, Kothur"
                    value={`${signupForm.district}, ${signupForm.village}`}
                    onChange={(e) => {
                      const parts = e.target.value.split(",");
                      setSignupForm({
                        ...signupForm,
                        district: parts[0] ? parts[0].trim() : "",
                        village: parts[1] ? parts[1].trim() : "",
                      });
                    }}
                    className="w-full p-3 rounded-xl border border-stone-300 text-sm font-semibold text-stone-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Land Size */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                    <Trees className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Landholding Size (Acres)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={signupForm.landSizeAcres}
                    onChange={(e) =>
                      setSignupForm({ ...signupForm, landSizeAcres: e.target.value })
                    }
                    className="w-full p-3 rounded-xl border border-stone-300 text-sm font-semibold text-stone-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Soil Classification */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Soil Classification
                  </label>
                  <select
                    value={signupForm.soilType}
                    onChange={(e) => setSignupForm({ ...signupForm, soilType: e.target.value })}
                    className="w-full p-3 rounded-xl border border-stone-300 bg-white text-sm font-semibold text-stone-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="black_soil">Black Soil (Regur)</option>
                    <option value="red_soil">Red Sandy Loam</option>
                    <option value="alluvial">Alluvial Fertile Soil</option>
                    <option value="dryland">Dryland Soil</option>
                    <option value="wetland">Wetland / Clay Alluvial</option>
                  </select>
                </div>

                {/* Irrigation System */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Irrigation System</span>
                  </label>
                  <select
                    value={signupForm.irrigationType}
                    onChange={(e) =>
                      setSignupForm({ ...signupForm, irrigationType: e.target.value })
                    }
                    className="w-full p-3 rounded-xl border border-stone-300 bg-white text-sm font-semibold text-stone-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="drip">Drip Irrigation</option>
                    <option value="borewell">Borewell / Tube Well</option>
                    <option value="canal">Canal Irrigation</option>
                    <option value="rainfed">Rainfed (Dryland)</option>
                  </select>
                </div>

                {/* Preferred Language */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                    <Languages className="w-3.5 h-3.5 text-amber-600" />
                    <span>Preferred Language</span>
                  </label>
                  <select
                    value={signupForm.preferredLanguage}
                    onChange={(e) =>
                      setSignupForm({ ...signupForm, preferredLanguage: e.target.value })
                    }
                    className="w-full p-3 rounded-xl border border-stone-300 bg-white text-sm font-semibold text-stone-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="te">తెలుగు (Telugu)</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="ta">தமிழ் (Tamil)</option>
                    <option value="kn">ಕನ್ನಡ (Kannada)</option>
                    <option value="bn">বাংলা (Bengali)</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-5 py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-base shadow-lg shadow-emerald-800/30 flex items-center justify-center gap-2 active:scale-98 transition"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <BadgeCheck className="w-5 h-5 text-emerald-300" />
                )}
                <span>
                  {isLoading ? "Saving to JanMithra Database..." : "Save Farmer Profile & Register"}
                </span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
