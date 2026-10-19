"use client";

import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  Droplets,
  Eye,
  EyeOff,
  Keyboard,
  Languages,
  Loader2,
  Lock,
  LogIn,
  Mail,
  Smartphone,
  Trees,
  UserPlus,
} from "lucide-react";
import { useFarmerStore, type SignupForm } from "@/store/useFarmerStore";

/**
 * Shared sign-in / sign-up form. Used by the AuthModal, the /login page and
 * AuthGate so every entry point talks to the same server-side session.
 *
 * Login is by mobile number + password. (The old "OTP" option was removed: it
 * never sent or verified a real OTP.)
 */

const STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Gujarat", "Haryana", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Other",
];

const INCOME_SLABS = ["Below ₹1.5 Lakhs", "Below ₹2.5 Lakhs", "₹2.5 – 5 Lakhs", "Above ₹5 Lakhs"];

const inputCls =
  "w-full p-2.5 rounded-xl border border-stone-300 bg-white text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";
const errCls = "border-red-400 focus:border-red-500 focus:ring-red-500/20";

function passwordHint(pw: string): string | null {
  if (!pw) return null;
  if (pw.length < 8) return "At least 8 characters";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Use at least one letter and one number";
  return null;
}

export default function AuthForm({
  initialMode,
  onSuccess,
}: {
  initialMode?: "login" | "signup";
  onSuccess?: () => void;
}) {
  const { login, signup, language, authModalMode } = useFarmerStore();
  const [mode, setMode] = useState<"login" | "signup">(initialMode || authModalMode || "login");

  // Login
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);

  // Signup
  const [form, setForm] = useState<SignupForm>({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    state: "",
    district: "",
    village: "",
    landSizeAcres: "",
    soilType: "",
    irrigationType: "",
    primaryCrops: "",
    annualIncomeSlab: "",
    preferredLanguage: language,
  });
  const [showProfile, setShowProfile] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [errorField, setErrorField] = useState<string | null>(null);

  useEffect(() => {
    if (initialMode) setMode(initialMode);
  }, [initialMode]);

  const switchMode = (m: "login" | "signup") => {
    setMode(m);
    setFeedback(null);
    setErrorField(null);
  };

  const fail = (message: string, field?: string) => {
    setFeedback({ type: "error", message });
    setErrorField(field || null);
  };

  const handleKeypadPress = (val: string) => {
    if (val === "backspace") setPhone((p) => p.slice(0, -1));
    else if (val === "clear") setPhone("");
    else if (phone.length < 10) setPhone((p) => p + val);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) return fail("Please enter your 10-digit mobile number.", "phone");
    if (!password) return fail("Please enter your password.", "password");
    setIsLoading(true);
    setFeedback(null);
    setErrorField(null);
    const result = await login(phone, password);
    setIsLoading(false);
    if (result.success) {
      setFeedback({ type: "success", message: result.message });
      setPassword("");
      onSuccess?.();
    } else {
      fail(result.message, result.field);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return fail("Please enter your full name.", "name");
    if (!/^[6-9]\d{9}$/.test(form.phone)) return fail("Please enter a valid 10-digit mobile number.", "phone");
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
      return fail("Please enter a valid email address, or leave it empty.", "email");
    const pwHint = passwordHint(form.password) || (!form.password ? "Please choose a password" : null);
    if (pwHint) return fail(`Password: ${pwHint}.`, "password");
    if (form.password !== form.confirmPassword) return fail("Passwords do not match.", "confirmPassword");

    setIsLoading(true);
    setFeedback(null);
    setErrorField(null);
    const result = await signup({ ...form, email: form.email?.trim() });
    setIsLoading(false);
    if (result.success) {
      setFeedback({ type: "success", message: result.message });
      onSuccess?.();
    } else {
      fail(result.message, result.field);
      if (result.field && ["state", "district", "village", "landSizeAcres", "soilType", "irrigationType"].includes(result.field)) {
        setShowProfile(true);
      }
    }
  };

  const f = (k: keyof SignupForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <div>
      {/* Tab Switcher */}
      <div className="flex rounded-2xl bg-stone-100 p-1 border border-stone-200 mb-5" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          onClick={() => switchMode("login")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-black transition flex items-center justify-center gap-2 ${
            mode === "login" ? "bg-white text-emerald-950 shadow-sm" : "text-stone-600 hover:text-stone-900"
          }`}
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          onClick={() => switchMode("signup")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-black transition flex items-center justify-center gap-2 ${
            mode === "signup" ? "bg-white text-emerald-950 shadow-sm" : "text-stone-600 hover:text-stone-900"
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Create Account</span>
        </button>
      </div>

      {feedback && (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
          className={`mb-4 p-3 rounded-2xl text-xs sm:text-sm font-bold flex items-start gap-2.5 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
              : "bg-red-50 text-red-900 border border-red-200"
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

      {mode === "login" ? (
        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          <div>
            <label htmlFor="login-phone" className="block text-xs font-black uppercase tracking-wider text-stone-700 mb-1.5">
              Mobile Number
            </label>
            <div
              className={`flex items-center rounded-2xl border-2 bg-white overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/20 ${
                errorField === "phone" ? "border-red-400" : "border-emerald-600/80 focus-within:border-emerald-600"
              }`}
            >
              <span className="px-4 py-3 bg-emerald-50 text-emerald-900 font-black text-base border-r border-emerald-200">+91</span>
              <input
                id="login-phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="w-full px-4 py-3 text-lg font-bold text-stone-900 placeholder:text-stone-400 placeholder:text-base placeholder:font-semibold focus:outline-none tracking-wider"
              />
              <Smartphone className="w-5 h-5 text-emerald-700 mr-4 shrink-0" />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-xs font-black uppercase tracking-wider text-stone-700 mb-1.5">
              Password
            </label>
            <div
              className={`relative flex items-center rounded-2xl border bg-white overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 ${
                errorField === "password" ? "border-red-400" : "border-stone-300 focus-within:border-emerald-600"
              }`}
            >
              <Lock className="w-5 h-5 text-stone-400 ml-3.5 shrink-0" />
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full px-3 py-3 text-base font-bold text-stone-900 placeholder:text-stone-400 placeholder:font-semibold focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="px-3 text-stone-400 hover:text-stone-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-70 text-white font-black text-base shadow-lg shadow-emerald-800/30 flex items-center justify-center gap-2 transition"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5 text-emerald-300" />}
            <span>{isLoading ? "Signing in..." : "Sign In"}</span>
          </button>

          {/* On-screen numeric keypad for the mobile number (touchscreens) */}
          <div>
            <button
              type="button"
              onClick={() => setShowKeypad(!showKeypad)}
              className="w-full py-2 px-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600 text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <Keyboard className="w-4 h-4 text-emerald-700" />
              <span>{showKeypad ? "Hide Numeric Keypad" : "Show On-Screen Numeric Keypad"}</span>
            </button>
            {showKeypad && (
              <div className="mt-3 p-3 bg-stone-100 rounded-2xl border border-stone-200 grid grid-cols-3 gap-2">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "backspace"].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => handleKeypadPress(k)}
                    className={`h-12 rounded-xl text-lg font-black shadow-sm transition flex items-center justify-center border ${
                      k.length > 1 ? "bg-stone-200 text-stone-700 text-xs uppercase border-stone-200" : "bg-white text-stone-900 border-stone-200 hover:border-emerald-400"
                    }`}
                  >
                    {k === "backspace" ? "⌫ Back" : k === "clear" ? "Clear" : k}
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="text-center text-xs text-stone-600">
            New to JanMithra?{" "}
            <button type="button" onClick={() => switchMode("signup")} className="font-black text-emerald-800 hover:underline">
              Create a free account
            </button>
          </p>
        </form>
      ) : (
        <form onSubmit={handleSignup} className="space-y-3.5" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="su-name" className="block text-xs font-bold text-stone-700 mb-1">Full Name *</label>
              <input
                id="su-name"
                name="name"
                autoComplete="name"
                placeholder="e.g. Lakshmi Prasanna"
                value={form.name}
                onChange={f("name")}
                className={`${inputCls} ${errorField === "name" ? errCls : ""}`}
              />
            </div>

            <div>
              <label htmlFor="su-phone" className="block text-xs font-bold text-stone-700 mb-1">Mobile Number *</label>
              <div
                className={`flex items-center rounded-xl border overflow-hidden bg-white focus-within:ring-2 focus-within:ring-emerald-500/20 ${
                  errorField === "phone" ? "border-red-400" : "border-stone-300 focus-within:border-emerald-600"
                }`}
              >
                <span className="bg-stone-100 px-2.5 py-2.5 text-xs font-bold text-stone-600">+91</span>
                <input
                  id="su-phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  maxLength={10}
                  placeholder="10-digit number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                  className="w-full p-2.5 text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="su-email" className="block text-xs font-bold text-stone-700 mb-1">
                Email <span className="font-medium text-stone-500">(optional)</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  id="su-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={f("email")}
                  className={`${inputCls} pl-9 ${errorField === "email" ? errCls : ""}`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="su-password" className="block text-xs font-bold text-stone-700 mb-1">Password *</label>
              <input
                id="su-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Min 8 chars, letters + numbers"
                value={form.password}
                onChange={f("password")}
                className={`${inputCls} ${errorField === "password" ? errCls : ""}`}
              />
              {passwordHint(form.password) && (
                <p className="text-[11px] text-amber-700 font-semibold mt-1">{passwordHint(form.password)}</p>
              )}
            </div>

            <div>
              <label htmlFor="su-confirm" className="block text-xs font-bold text-stone-700 mb-1">Confirm Password *</label>
              <input
                id="su-confirm"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={f("confirmPassword")}
                className={`${inputCls} ${errorField === "confirmPassword" ? errCls : ""}`}
              />
              {form.confirmPassword && form.confirmPassword !== form.password && (
                <p className="text-[11px] text-red-700 font-semibold mt-1">Passwords do not match</p>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-stone-600 select-none">
            <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
            Show passwords
          </label>

          {/* Optional farm profile */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40">
            <button
              type="button"
              onClick={() => setShowProfile(!showProfile)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
              aria-expanded={showProfile}
            >
              <span>
                <span className="block text-sm font-black text-emerald-950">Farm profile (optional)</span>
                <span className="block text-[11px] text-stone-600">
                  Location, land, soil & crops help JanMithra match schemes to you.
                </span>
              </span>
              <ChevronDown className={`w-5 h-5 text-emerald-800 transition ${showProfile ? "rotate-180" : ""}`} />
            </button>

            {showProfile && (
              <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="su-state" className="block text-xs font-bold text-stone-700 mb-1">State</label>
                  <select id="su-state" value={form.state} onChange={f("state")} className={inputCls}>
                    <option value="">Select state</option>
                    {STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="su-district" className="block text-xs font-bold text-stone-700 mb-1">District</label>
                  <input id="su-district" placeholder="e.g. Guntur" value={form.district} onChange={f("district")} className={inputCls} maxLength={60} />
                </div>
                <div>
                  <label htmlFor="su-village" className="block text-xs font-bold text-stone-700 mb-1">Village / Town</label>
                  <input id="su-village" placeholder="e.g. Tenali" value={form.village} onChange={f("village")} className={inputCls} maxLength={100} />
                </div>
                <div>
                  <label htmlFor="su-land" className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                    <Trees className="w-3.5 h-3.5 text-emerald-700" /> Land Size (Acres)
                  </label>
                  <input
                    id="su-land"
                    type="number"
                    step="0.1"
                    min="0"
                    max="999"
                    placeholder="e.g. 2.5"
                    value={form.landSizeAcres}
                    onChange={f("landSizeAcres")}
                    className={`${inputCls} ${errorField === "landSizeAcres" ? errCls : ""}`}
                  />
                </div>
                <div>
                  <label htmlFor="su-soil" className="block text-xs font-bold text-stone-700 mb-1">Soil Type</label>
                  <select id="su-soil" value={form.soilType} onChange={f("soilType")} className={inputCls}>
                    <option value="">Not sure / skip</option>
                    <option value="black_soil">Black Soil (Regur)</option>
                    <option value="red_soil">Red Sandy Loam</option>
                    <option value="alluvial">Alluvial Fertile Soil</option>
                    <option value="dryland">Dryland Soil</option>
                    <option value="wetland">Wetland / Clay Alluvial</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="su-irrigation" className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-cyan-600" /> Irrigation
                  </label>
                  <select id="su-irrigation" value={form.irrigationType} onChange={f("irrigationType")} className={inputCls}>
                    <option value="">Not sure / skip</option>
                    <option value="drip">Drip Irrigation</option>
                    <option value="borewell">Borewell / Tube Well</option>
                    <option value="canal">Canal Irrigation</option>
                    <option value="rainfed">Rainfed (Dryland)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="su-crops" className="block text-xs font-bold text-stone-700 mb-1">Main Crops</label>
                  <input id="su-crops" placeholder="e.g. Paddy, Cotton" value={form.primaryCrops} onChange={f("primaryCrops")} className={inputCls} maxLength={255} />
                </div>
                <div>
                  <label htmlFor="su-income" className="block text-xs font-bold text-stone-700 mb-1">Annual Income</label>
                  <select id="su-income" value={form.annualIncomeSlab} onChange={f("annualIncomeSlab")} className={inputCls}>
                    <option value="">Prefer not to say</option>
                    {INCOME_SLABS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="su-lang" className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                    <Languages className="w-3.5 h-3.5 text-amber-600" /> Preferred Language
                  </label>
                  <select id="su-lang" value={form.preferredLanguage} onChange={f("preferredLanguage")} className={inputCls}>
                    <option value="te">తెలుగు (Telugu)</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="ta">தமிழ் (Tamil)</option>
                    <option value="kn">ಕನ್ನಡ (Kannada)</option>
                    <option value="bn">বাংলা (Bengali)</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-70 text-white font-black text-base shadow-lg shadow-emerald-800/30 flex items-center justify-center gap-2 transition"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <BadgeCheck className="w-5 h-5 text-emerald-300" />}
            <span>{isLoading ? "Creating your account..." : "Create Account & Continue"}</span>
          </button>

          <p className="text-center text-xs text-stone-600">
            Already registered?{" "}
            <button type="button" onClick={() => switchMode("login")} className="font-black text-emerald-800 hover:underline">
              Sign in
            </button>
          </p>
        </form>
      )}
    </div>
  );
}
