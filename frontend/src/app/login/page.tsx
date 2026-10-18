"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sprout,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  UserPlus,
  LogIn,
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
  PhoneCall,
  Wheat,
  Database,
  RefreshCw,
} from "lucide-react";
import { useFarmerStore } from "@/store/useFarmerStore";
import { DEMO_FARMERS } from "@/lib/mockData";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithPhone, signupFarmer, setCurrentFarmer, setLanguage } = useFarmerStore();

  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [authMethod, setAuthMethod] = useState<"otp" | "password">("otp");

  // Sign In states
  const [phone, setPhone] = useState("9876543210");
  const [password, setPassword] = useState("1234");
  const [showPassword, setShowPassword] = useState(false);
  const [otpStep, setOtpStep] = useState<"enter_phone" | "enter_otp">("enter_phone");
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const [showKeypad, setShowKeypad] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sign Up states
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
    preferredLanguage: "te",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Live Database Connection Status
  const [dbStatus, setDbStatus] = useState<{
    loading: boolean;
    connected: boolean;
    userCount?: number;
    schemeCount?: number;
    error?: string;
  }>({ loading: true, connected: false });

  const [dbPasswordInput, setDbPasswordInput] = useState("");
  const [isUpdatingDb, setIsUpdatingDb] = useState(false);
  const [showDbConfig, setShowDbConfig] = useState(false);

  const checkDbStatus = async () => {
    setDbStatus((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch("/api/db-status");
      const data = await res.json();
      setDbStatus({
        loading: false,
        connected: Boolean(data.connected),
        userCount: data.userCount,
        schemeCount: data.schemeCount,
        error: data.error,
      });
      if (!data.connected) {
        setShowDbConfig(true);
      }
    } catch (e: any) {
      setDbStatus({ loading: false, connected: false, error: e.message });
    }
  };

  useEffect(() => {
    checkDbStatus();
  }, []);

  const handleConnectDatabase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingDb(true);
    try {
      const res = await fetch("/api/db-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: dbPasswordInput }),
      });
      const data = await res.json();
      if (data.success) {
        setDbStatus({
          loading: false,
          connected: true,
          userCount: data.userCount,
          schemeCount: data.schemeCount,
        });
        setFeedback({
          type: "success",
          message: "Connected to MySQL JanMithra successfully! Farmer data will now be stored in the database.",
        });
        setShowDbConfig(false);
      } else {
        setFeedback({
          type: "error",
          message: data.message || "Failed to authenticate with MySQL.",
        });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setIsUpdatingDb(false);
    }
  };

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
      setFeedback({ type: "success", message: "OTP sent to +91 " + phone });
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
      setTimeout(() => router.push("/"), 800);
    } else {
      setFeedback({ type: "error", message: result.message || "Login failed." });
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupForm.name.trim() || signupForm.phone.length < 10) {
      setFeedback({ type: "error", message: "Please enter full name and valid 10-digit mobile." });
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    const result = await signupFarmer(signupForm);
    setIsLoading(false);

    if (result.success) {
      setFeedback({
        type: "success",
        message: "Account created and saved in JanMithra MySQL database! Opening dashboard...",
      });
      setTimeout(() => router.push("/"), 1000);
    } else {
      setFeedback({ type: "error", message: result.message || "Registration failed." });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-stone-900 to-emerald-900 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      {/* Database Connectivity Banner */}
      <div className="max-w-4xl w-full mx-auto mb-4 rounded-2xl border p-4 shadow-sm bg-white border-stone-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${dbStatus.connected ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-stone-900">
                  Backend MySQL: JanMithra Connection
                </span>
                {dbStatus.loading ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                    Checking...
                  </span>
                ) : dbStatus.connected ? (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    Live Connected
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    Password Needed
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-600 mt-0.5">
                {dbStatus.connected
                  ? `Connected to MySQL localhost:3306 (JanMithra) • ${dbStatus.userCount || 3} Registered Farmers`
                  : "MySQL connection requires your root password to authenticate and save signups."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!dbStatus.connected && (
              <button
                type="button"
                onClick={() => setShowDbConfig(!showDbConfig)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition"
              >
                {showDbConfig ? "Hide DB Setup" : "Enter MySQL Password"}
              </button>
            )}
            <button
              type="button"
              onClick={checkDbStatus}
              className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 transition"
              title="Refresh connection status"
            >
              <RefreshCw className={`w-4 h-4 ${dbStatus.loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Collapsible Password Input */}
        {showDbConfig && !dbStatus.connected && (
          <form onSubmit={handleConnectDatabase} className="mt-3 pt-3 border-t border-amber-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="password"
              value={dbPasswordInput}
              onChange={(e) => setDbPasswordInput(e.target.value)}
              placeholder="Enter MySQL root password used in JanMithra"
              className="text-xs px-3 py-2 rounded-lg border border-stone-300 flex-1 focus:outline-none focus:border-emerald-600"
            />
            <button
              type="submit"
              disabled={isUpdatingDb}
              className="text-xs font-bold px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition active:scale-95 disabled:opacity-50"
            >
              {isUpdatingDb ? "Testing Connection..." : "Save & Connect"}
            </button>
          </form>
        )}
      </div>

      {/* Container */}
      <div className="max-w-4xl w-full mx-auto grid grid-cols-1 md:grid-cols-12 bg-white rounded-3xl shadow-2xl border border-emerald-500/20 overflow-hidden">
        {/* Left Side: Brand & Benefits */}
        <div className="md:col-span-5 bg-gradient-to-br from-emerald-800 to-emerald-950 p-8 text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600/60 border border-emerald-400/30 flex items-center justify-center text-white shadow-lg">
                <Sprout className="w-7 h-7 text-emerald-200" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight leading-none">JanMithra</h1>
                <p className="text-xs text-emerald-200/90 font-bold mt-1">
                  AI Government Scheme Assistant
                </p>
              </div>
            </div>

            <div className="space-y-4 my-8">
              <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                <Wheat className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-sm">4,706+ Welfare Schemes</h4>
                  <p className="text-xs text-emerald-100/70">
                    PM-KISAN, PM-KUSUM Solar, PMFBY Crop Insurance & Soil Health.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                <ShieldCheck className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-sm">Vision OCR Verification</h4>
                  <p className="text-xs text-emerald-100/70">
                    Scan Land Patta or Soil Cards for instant eligibility checks.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                <BadgeCheck className="w-5 h-5 text-cyan-300 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-sm">PostGIS Peer Network</h4>
                  <p className="text-xs text-emerald-100/70">
                    Connect with nearby farmers who already received subsidies.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-emerald-800/80 text-xs text-emerald-300 flex items-center justify-between">
            <span>MySQL: JanMithra DB</span>
            <span className="font-bold flex items-center gap-1">
              <PhoneCall className="w-3.5 h-3.5" /> Kisan: 1551
            </span>
          </div>
        </div>

        {/* Right Side: Sign In / Sign Up Form */}
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            {/* Tab Switcher */}
            <div className="flex rounded-2xl bg-stone-100 p-1 border border-stone-200 mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setFeedback(null);
                }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-black transition flex items-center justify-center gap-2 ${
                  activeTab === "login"
                    ? "bg-white text-emerald-950 shadow-sm"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In (Login)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("signup");
                  setFeedback(null);
                }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-black transition flex items-center justify-center gap-2 ${
                  activeTab === "signup"
                    ? "bg-white text-emerald-950 shadow-sm"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>New Farmer Registration</span>
              </button>
            </div>

            {/* Feedback notification */}
            {feedback && (
              <div
                className={`mb-5 p-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 ${
                  feedback.type === "success"
                    ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                    : "bg-red-50 text-red-900 border border-red-200"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Forms */}
            {activeTab === "login" ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="flex items-center justify-between p-1 bg-stone-50 rounded-xl border border-stone-200 text-xs font-bold text-stone-700">
                  <button
                    type="button"
                    onClick={() => setAuthMethod("otp")}
                    className={`flex-1 py-1.5 rounded-lg transition ${
                      authMethod === "otp"
                        ? "bg-white text-emerald-900 shadow-sm font-black"
                        : "hover:text-stone-900"
                    }`}
                  >
                    Login with OTP (Recommended)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMethod("password")}
                    className={`flex-1 py-1.5 rounded-lg transition ${
                      authMethod === "password"
                        ? "bg-white text-emerald-900 shadow-sm font-black"
                        : "hover:text-stone-900"
                    }`}
                  >
                    Login with Password
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-stone-700 mb-1.5">
                    10-Digit Mobile Number
                  </label>
                  <div className="flex items-center rounded-2xl border-2 border-emerald-600/80 bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 overflow-hidden shadow-sm">
                    <span className="px-4 py-3 bg-emerald-50 text-emerald-900 font-black text-base border-r border-emerald-200">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="Enter mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="w-full px-4 py-3 text-lg font-bold text-stone-900 focus:outline-none tracking-wider"
                    />
                  </div>
                </div>

                {authMethod === "otp" ? (
                  otpStep === "enter_phone" ? (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={phone.length !== 10 || isLoading}
                      className="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-base shadow-md flex items-center justify-center gap-2 transition"
                    >
                      <span>Send OTP</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black uppercase text-stone-700">
                          Enter 4-Digit OTP
                        </label>
                        <button
                          type="button"
                          onClick={() => setOtpStep("enter_phone")}
                          className="text-xs font-bold text-emerald-700 hover:underline"
                        >
                          Change Number
                        </button>
                      </div>

                      <div className="flex justify-center gap-3">
                        {[0, 1, 2, 3].map((idx) => (
                          <input
                            key={idx}
                            ref={(el) => {
                              otpInputRefs.current[idx] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={otpDigits[idx]}
                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            className="w-14 h-16 rounded-2xl border-2 border-emerald-500 bg-emerald-50/50 text-stone-900 text-center text-3xl font-black focus:border-emerald-600 focus:bg-white focus:outline-none shadow-sm"
                          />
                        ))}
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-base shadow-lg shadow-emerald-800/30 flex items-center justify-center gap-2 active:scale-98 transition"
                      >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                        <span>Verify & Open Dashboard</span>
                      </button>
                    </div>
                  )
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-black uppercase text-stone-700 mb-1.5">
                        Password / PIN
                      </label>
                      <div className="relative flex items-center rounded-2xl border border-stone-300 bg-white overflow-hidden">
                        <Lock className="w-5 h-5 text-stone-400 ml-3.5 shrink-0" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Password"
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
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      <span>Sign In with Password</span>
                    </button>
                  </div>
                )}

                {/* 1-Click Demo Profiles */}
                <div className="pt-3 border-t border-stone-200">
                  <p className="text-xs font-black uppercase text-stone-500 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Quick Demo Profiles:</span>
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {DEMO_FARMERS.map((df) => (
                      <button
                        key={df.id}
                        type="button"
                        onClick={() => {
                          setCurrentFarmer(df);
                          router.push("/");
                        }}
                        className="p-2 rounded-2xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition text-left flex items-center gap-2 active:scale-95"
                      >
                        <img
                          src={df.avatarUrl}
                          alt={df.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <div className="overflow-hidden">
                          <p className="font-black text-xs text-stone-900 truncate">
                            {df.name.split(" ")[0]}
                          </p>
                          <p className="text-[10px] text-emerald-800 truncate">
                            {df.landSizeAcres} Ac
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            ) : (
              /* Sign Up Form */
              <form onSubmit={handleSignupSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Goud"
                      value={signupForm.name}
                      onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-300 text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Mobile Number *</label>
                    <div className="flex items-center rounded-xl border border-stone-300 overflow-hidden bg-white">
                      <span className="bg-stone-100 px-2.5 py-2.5 text-xs font-bold text-stone-600">+91</span>
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
                        className="w-full p-2.5 text-sm font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">State</label>
                    <select
                      value={signupForm.state}
                      onChange={(e) => setSignupForm({ ...signupForm, state: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-300 bg-white text-sm font-semibold"
                    >
                      <option value="Telangana">Telangana</option>
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Punjab">Punjab</option>
                      <option value="West Bengal">West Bengal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Village & District</label>
                    <input
                      type="text"
                      placeholder="Kothur, Rangareddy"
                      value={`${signupForm.village}, ${signupForm.district}`}
                      onChange={(e) => {
                        const parts = e.target.value.split(",");
                        setSignupForm({
                          ...signupForm,
                          village: parts[0] ? parts[0].trim() : "",
                          district: parts[1] ? parts[1].trim() : "",
                        });
                      }}
                      className="w-full p-2.5 rounded-xl border border-stone-300 text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Land Size (Acres)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={signupForm.landSizeAcres}
                      onChange={(e) =>
                        setSignupForm({ ...signupForm, landSizeAcres: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl border border-stone-300 text-sm font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Soil Type</label>
                    <select
                      value={signupForm.soilType}
                      onChange={(e) => setSignupForm({ ...signupForm, soilType: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-300 bg-white text-sm font-semibold"
                    >
                      <option value="black_soil">Black Soil (Regur)</option>
                      <option value="red_soil">Red Sandy Loam</option>
                      <option value="alluvial">Alluvial Fertile Soil</option>
                      <option value="dryland">Dryland Soil</option>
                      <option value="wetland">Wetland / Clay Alluvial</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-4 py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-base shadow-lg shadow-emerald-800/30 flex items-center justify-center gap-2 active:scale-98 transition"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <BadgeCheck className="w-5 h-5" />}
                  <span>Register & Save into JanMithra Database</span>
                </button>
              </form>
            )}
          </div>

          <div className="pt-4 text-center">
            <Link
              href="/"
              className="text-xs font-bold text-emerald-800 hover:underline"
            >
              ← Back to Main Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
