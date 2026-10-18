"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { useFarmerStore } from "@/store/useFarmerStore";
import { translations } from "@/lib/i18n";
import { NEARBY_PEERS, PeerSuccessStory } from "@/lib/mockData";

export default function PeerNetwork() {
  const {
    language,
    currentFarmer,
    peerContactModal,
    setPeerContactModal,
  } = useFarmerStore();

  const t = translations[language];
  const [selectedRadius, setSelectedRadius] = useState<number>(25);

  const filteredPeers = NEARBY_PEERS.filter(
    (peer) => peer.distanceKm <= selectedRadius
  );

  return (
    <section className="mt-12">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-emerald-100 text-emerald-800">
              <Users className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-800">
              PostGIS Spatial Matching (25km Radius)
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
            className="bg-white rounded-3xl border-2 border-emerald-100 hover:border-emerald-300 p-6 shadow-md hover:shadow-xl transition-all flex flex-col justify-between group"
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
                  </div>
                </div>

                {/* Spatial Distance Pill */}
                <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 shrink-0">
                  {peer.distanceKm} km away
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
                  Implemented Scheme:
                </span>
                <span className="text-sm font-extrabold text-stone-900 block">
                  {peer.schemeName}
                </span>
              </div>

              {/* Real Outcome & Results */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 mb-4">
                <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-extrabold mb-1">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Verified Outcome:</span>
                </div>
                <p className="text-xs text-stone-800 leading-relaxed font-medium">
                  {peer.outcomeSummary}
                </p>

                <div className="mt-2 pt-2 border-t border-emerald-200 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-emerald-900">
                    Subsidy: {peer.subsidyReceived}
                  </span>
                  <span className="text-stone-500 font-medium">
                    {peer.implementationDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Call Peer Farmer CTA Button */}
            <button
              onClick={() => setPeerContactModal(peer)}
              disabled={!peer.contactAllowed}
              className={`w-full py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition shadow-sm ${
                peer.contactAllowed
                  ? "bg-emerald-800 hover:bg-emerald-900 text-white active:scale-98"
                  : "bg-stone-200 text-stone-500 cursor-not-allowed"
              }`}
            >
              <PhoneCall className="w-4 h-4 text-emerald-300" />
              <span>{t.callPeer}</span>
            </button>
          </div>
        ))}
      </div>

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
                    {peerContactModal.village} • {peerContactModal.distanceKm} km away
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
                  Verified Contact Phone
                </p>
                <p className="text-2xl font-black text-emerald-950 mt-1 tracking-wider">
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
                <a
                  href={`tel:${peerContactModal.contactPhone.replace(/\s+/g, "")}`}
                  className="flex-1 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 active:scale-98 transition text-center"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Call Now</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
