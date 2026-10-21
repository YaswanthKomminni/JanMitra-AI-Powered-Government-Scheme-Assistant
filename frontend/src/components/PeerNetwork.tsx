"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  MapPin,
  PhoneCall,
  TrendingUp,
  Layers,
  Sparkles,
  CheckCircle2,
  Calendar,
  X,
  ShieldCheck,
  ArrowLeft,
  Clock,
  Trash2,
  PhoneOutgoing,
} from "lucide-react";
import { useFarmerStore } from "@/store/useFarmerStore";
import { translations } from "@/lib/i18n";
import { PeerSuccessStory } from "@/lib/mockData";
import { peerDirectory } from "@/lib/peerDirectory";

export interface CallLogEntry {
  id: string;
  farmerId: string;
  farmerName: string;
  phone: string;
  village: string;
  avatar: string;
  schemeName: string;
  timestamp: string;
  status: "connected" | "completed";
}

export default function PeerNetwork() {
  const {
    language,
    currentFarmer,
    peerContactModal,
    setPeerContactModal,
  } = useFarmerStore();

  const t = translations[language] || translations.en;
  const [selectedRadius, setSelectedRadius] = useState<number>(25);
  const [viewMode, setViewMode] = useState<"farmers" | "call_log">("farmers");
  const [peers, setPeers] = useState<PeerSuccessStory[]>(() => peerDirectory());
  const [error, setError] = useState("");
  const [cropFilter, setCropFilter] = useState("");
  const [callLogs, setCallLogs] = useState<CallLogEntry[]>([]);
  const [recentCallNotice, setRecentCallNotice] = useState<string | null>(null);

  // Load saved call logs on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("janmitra_call_logs");
      if (saved) {
        setCallLogs(JSON.parse(saved));
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetch("/api/peers")
      .then((r) => r.json())
      .then((data) => {
        if (data.peers && data.peers.length > 0) {
          setPeers(data.peers);
        }
      })
      .catch(() => setError("Could not load the farmer directory."));
  }, []);

  const filteredPeers = peers.filter(
    (peer) =>
      (peer.distanceKnown === false || peer.distanceKm <= selectedRadius) &&
      (!cropFilter || peer.cropsGrown.toLowerCase().includes(cropFilter.toLowerCase()))
  );

  // When clicking any farmer mobile number or call button:
  const handleInitiateCall = (peer: PeerSuccessStory) => {
    const formattedTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      day: "numeric",
      month: "short",
    });

    const newEntry: CallLogEntry = {
      id: `call_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      farmerId: peer.id,
      farmerName: peer.farmerName,
      phone: peer.contactPhone,
      village: peer.village,
      avatar: peer.avatar,
      schemeName: peer.schemeName,
      timestamp: formattedTime,
      status: "connected",
    };

    const updated = [newEntry, ...callLogs.filter((c) => c.farmerId !== peer.id || c.timestamp !== formattedTime)];
    setCallLogs(updated);
    try {
      localStorage.setItem("janmitra_call_logs", JSON.stringify(updated));
    } catch {
      /* ignore */
    }

    setRecentCallNotice(`${peer.farmerName} (${peer.contactPhone})`);
    setPeerContactModal(null);
    // Switch to Call Log List so user sees their call record and can return easily!
    setViewMode("call_log");

    // Attempt non-destructive browser dialer trigger
    if (typeof window !== "undefined") {
      const cleanPhone = peer.contactPhone.replace(/\s+/g, "");
      const a = document.createElement("a");
      a.href = `tel:${cleanPhone}`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleDeleteCall = (id: string) => {
    const updated = callLogs.filter((c) => c.id !== id);
    setCallLogs(updated);
    try {
      localStorage.setItem("janmitra_call_logs", JSON.stringify(updated));
    } catch {
      /* ignore */
    }
  };

  const handleClearAllLogs = () => {
    setCallLogs([]);
    try {
      localStorage.removeItem("janmitra_call_logs");
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="mt-8 sm:mt-12">
      {/* Top Navigation Tabs: Nearby Farmers vs Call Log */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("farmers")}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2 ${
              viewMode === "farmers"
                ? "bg-emerald-800 text-white shadow-sm"
                : "bg-stone-100 hover:bg-stone-200 text-stone-700"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{t.nearbyFarmersTab || "Nearby Farmers"}</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-white/20">
              {filteredPeers.length}
            </span>
          </button>

          <button
            onClick={() => setViewMode("call_log")}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2 ${
              viewMode === "call_log"
                ? "bg-emerald-800 text-white shadow-sm"
                : "bg-stone-100 hover:bg-stone-200 text-stone-700"
            }`}
          >
            <PhoneOutgoing className="w-4 h-4" />
            <span>{t.callLogTab || "Call Log"}</span>
            {callLogs.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500 text-white">
                {callLogs.length}
              </span>
            )}
          </button>
        </div>

        {viewMode === "call_log" && (
          <button
            onClick={() => setViewMode("farmers")}
            className="px-4 py-2 rounded-xl border border-emerald-700 text-emerald-900 bg-emerald-50 hover:bg-emerald-100 font-bold text-xs sm:text-sm transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.backToFarmers || "← Back to Farmers List"}</span>
          </button>
        )}
      </div>

      {/* ============================================================== */}
      {/* VIEW MODE 1: CALL LOG LIST                                      */}
      {/* ============================================================== */}
      {viewMode === "call_log" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header & Back Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-emerald-500/20 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => setViewMode("farmers")}
                  className="p-1 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition"
                  title="Go back to farmers list"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-800">
                  {t.callLogTitle || "Call Log & History"}
                </span>
              </div>
              <h2 className="text-2xl font-black text-stone-900">
                {t.callLogTitle || "Call Log & History"}
              </h2>
              <p className="text-sm text-stone-600 mt-0.5">
                {t.callLogSubtitle || "Record of calls placed to nearby farmers and peer advisors"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("farmers")}
                className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-sm transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t.backToFarmers || "← Back to Farmers List"}</span>
              </button>
              {callLogs.length > 0 && (
                <button
                  onClick={handleClearAllLogs}
                  className="px-3 py-2.5 rounded-xl border border-stone-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-stone-600 text-xs font-bold transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t.clearCallLog || "Clear Log"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Recent Call Status Toast Banner */}
          {recentCallNotice && (
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-bold shadow-xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                </span>
                <span>
                  {t.callConnected || "Outgoing Call • Connected"}: {recentCallNotice}
                </span>
              </div>
              <button
                onClick={() => setRecentCallNotice(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Call Log List Entries */}
          {callLogs.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 border border-emerald-300 mx-auto flex items-center justify-center text-emerald-800">
                <PhoneCall className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-stone-900">
                {t.noCallsYet || "No calls placed yet"}
              </h3>
              <p className="text-sm text-stone-600 max-w-md mx-auto">
                {t.noCallsDesc ||
                  "When you click 'Call' on a farmer's profile, the call log and timestamp will appear here so you can easily call them back."}
              </p>
              <button
                onClick={() => setViewMode("farmers")}
                className="px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t.backToFarmers || "← Back to Farmers List"}</span>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 overflow-hidden shadow-xs">
              {callLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/70 transition"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={log.avatar}
                      alt={log.farmerName}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-stone-900 text-base">
                          {log.farmerName}
                        </h4>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{t.callConnected || "Outgoing Call"}</span>
                        </span>
                      </div>
                      <p className="text-xs font-mono font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{log.phone}</span>
                      </p>
                      <p className="text-xs text-stone-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        <span>{log.village}</span>
                        {log.schemeName && (
                          <span className="text-stone-400">
                            &bull; Scheme: <strong className="text-stone-700">{log.schemeName}</strong>
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-stone-100">
                    <span className="text-xs text-stone-500 font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>{log.timestamp}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${log.phone.replace(/\s+/g, "")}`}
                        className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>{t.callAgain || "Call Again"}</span>
                      </a>
                      <button
                        onClick={() => handleDeleteCall(log.id)}
                        className="p-2 rounded-xl border border-stone-200 hover:bg-rose-50 hover:text-rose-700 text-stone-400 transition"
                        title="Remove call log entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* VIEW MODE 2: NEARBY FARMERS GRID (ORIGINAL VIEW)               */}
      {/* ============================================================== */}
      {viewMode === "farmers" && (
        <>
          <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            Demo profiles and distances are clearly labeled. They include sample mobile numbers for testing phone calling and call logs.
          </p>

          <input
            aria-label="Filter farmers by crop"
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
            placeholder={t.filterByCrop || "Filter by crop, e.g. cotton"}
            className="mb-4 rounded-xl border border-jm-border p-3 text-sm w-full sm:max-w-md bg-white"
          />
          {error && <p role="alert" className="text-red-700 text-xs mb-3">{error}</p>}

          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1 rounded-lg bg-emerald-100 text-emerald-800">
                  <Users className="w-5 h-5" />
                </span>
                <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-800">
                  {t.peersSubtitle || "Farmer directory and labeled examples"}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                {t.peersTitle}
              </h2>
              <p className="text-sm text-stone-600 mt-0.5">
                {t.peersSubtitle}
              </p>
            </div>

            {/* Radius Filter Pills */}
            <div className="flex items-center gap-1.5 bg-stone-100 p-1.5 rounded-2xl border border-stone-200 self-start sm:self-auto">
              {[5, 10, 25].map((rad) => (
                <button
                  key={rad}
                  onClick={() => setSelectedRadius(rad)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                    selectedRadius === rad
                      ? "bg-emerald-700 text-white shadow-sm"
                      : "text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  {rad} km
                </button>
              ))}
            </div>
          </div>

          {/* Peer Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredPeers.map((peer) => (
              <div
                key={peer.id}
                className="bg-white rounded-[18px] border border-jm-border hover:border-jm-primary/40 p-5 sm:p-6 shadow-sm transition-colors flex flex-col justify-between"
              >
                <div>
                  {/* Header: Peer info & distance tag */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={peer.avatar}
                        alt={peer.farmerName}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-emerald-500"
                      />
                      <div>
                        <h3 className="font-black text-base text-stone-900 leading-tight">
                          {peer.farmerName}
                        </h3>
                        <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          <span>{peer.village}</span>
                        </p>
                        {peer.contactPhone && (
                          <button
                            type="button"
                            onClick={() => handleInitiateCall(peer)}
                            className="text-xs font-mono font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 mt-0.5 cursor-pointer hover:underline text-left"
                            title="Click to call and view call log"
                          >
                            <PhoneCall className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{peer.contactPhone}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Spatial Distance Pill */}
                    <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 shrink-0">
                      {peer.distanceKnown === false
                        ? "Same district · distance unknown"
                        : `${peer.isDemo ? "Example distance: " : ""}${peer.distanceKm} km`}
                    </span>
                  </div>

                  {/* Matched Land Type Badge */}
                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-stone-500 shrink-0" />
                    <span className="text-xs font-bold text-stone-700">
                      Also has {peer.landType} & {peer.cropsGrown}
                    </span>
                  </div>

                  {/* Implemented Scheme Badge */}
                  <div className="mb-3">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-0.5">
                      {language === "te" ? "లబ్ధి పొందిన పథకం:" : language === "hi" ? "लागू की गई योजना:" : "Implemented Scheme:"}
                    </span>
                    <span className="text-sm font-extrabold text-stone-900 block">
                      {peer.schemeName}
                    </span>
                  </div>

                  {/* Real Outcome & Results */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 mb-4">
                    <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-extrabold mb-1">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <span>
                        {language === "te"
                          ? (peer.isDemo ? "రైతు విజయ గాథ (నమూనా):" : "ధృవీకరించబడిన ఫలితం:")
                          : language === "hi"
                          ? (peer.isDemo ? "किसान सफलता की कहानी:" : "सत्यापित परिणाम:")
                          : (peer.isDemo ? "Illustrative success story:" : "Reported outcome (verified member):")}
                      </span>
                    </div>
                    <p className="text-xs text-stone-800 leading-relaxed font-medium">
                      {peer.outcomeSummary}
                    </p>

                    <div className="mt-2 pt-2 border-t border-emerald-200 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-emerald-900">
                        {language === "te" ? "పొందిన రాయితీ:" : language === "hi" ? "प्राप्त सब्सिडी:" : "Subsidy:"} {peer.subsidyReceived}
                      </span>
                      <span className="text-stone-500 font-medium">
                        {peer.implementationDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Call Peer Farmer CTA Button */}
                <button
                  onClick={() => handleInitiateCall(peer)}
                  disabled={!peer.contactAllowed || !peer.contactPhone}
                  className={`w-full py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition shadow-sm ${
                    peer.contactAllowed && peer.contactPhone
                      ? "bg-emerald-800 hover:bg-emerald-900 text-white cursor-pointer active:scale-[0.98]"
                      : "bg-stone-200 text-stone-500 cursor-not-allowed"
                  }`}
                >
                  <PhoneCall className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span className="truncate">
                    {peer.contactPhone ? `Call ${peer.contactPhone}` : !peer.contactAllowed ? "Contact not shared" : t.callPeer}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Peer Contact Modal */}
      {peerContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border-2 border-emerald-500/20 overflow-hidden">
            <div className="bg-emerald-900 p-6 text-white relative">
              <button
                onClick={() => setPeerContactModal(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <img
                  src={peerContactModal.avatar}
                  alt={peerContactModal.farmerName}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-400"
                />
                <div>
                  <h3 className="text-xl font-black">
                    {peerContactModal.farmerName}
                  </h3>
                  <p className="text-xs text-emerald-200">
                    {peerContactModal.village} • {peerContactModal.distanceKnown === false ? "Same district; distance unknown" : `${peerContactModal.distanceKm} km away`}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 mt-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {t.callAllowed}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <p className="text-xs font-bold text-stone-500 uppercase">
                  Scheme Implemented
                </p>
                <p className="text-sm font-black text-stone-900 mt-0.5">
                  {peerContactModal.schemeName}
                </p>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                  &ldquo;{peerContactModal.outcomeSummary}&rdquo;
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <p className="text-xs font-bold text-emerald-900 uppercase">
                  Member-shared contact phone
                </p>
                <p className="text-2xl font-black text-emerald-950 mt-1 tracking-wider font-mono">
                  {peerContactModal.contactPhone}
                </p>
                <p className="text-[11px] text-stone-500 mt-1">
                  {t.peerContactNote}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setPeerContactModal(null)}
                  className="flex-1 py-3.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-sm hover:bg-stone-100 transition"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleInitiateCall(peerContactModal)}
                  className="flex-1 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 transition text-center"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Call Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
