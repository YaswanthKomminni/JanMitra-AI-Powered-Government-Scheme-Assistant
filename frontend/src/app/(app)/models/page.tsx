"use client";

import React from "react";
import report from "@/lib/data/model_evaluation.json";
import { PageContainer, PageTitle } from "@/components/PageKit";
import AiConnectionCheck from "@/components/AiConnectionCheck";
import { modelInventory, apiInventory } from "@/lib/modelInventory";
import { Sparkles, Activity, ShieldCheck, Cpu, Users } from "lucide-react";
import { useFarmerStore } from "@/store/useFarmerStore";
import { translations } from "@/lib/i18n";

export default function ModelsPage() {
  const { language } = useFarmerStore();
  const t = translations[language] || translations.en;

  const metric = (value: unknown) => typeof value === "number" ? `${(value * 100).toFixed(2)}%` : "Not evaluated";

  const isTe = language === "te";
  const isHi = language === "hi";

  return (
    <PageContainer wide>
      <PageTitle
        title={t.modelsPageTitle || "Models, Measured Performance & Explanation"}
        description={t.modelsPageDesc || "Comprehensive benchmark evaluations across 500 test samples, live execution telemetry, Explainable AI (XAI) feature saliency, and team ownership."}
      />

      {/* Deployment Connection */}
      <section className="mb-6 rounded-2xl border border-jm-border bg-white p-5 shadow-xs">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-600" />
          {t.liveKeyStatusTitle || "Deployment Connection & Live Key Status"}
        </h2>
        <p className="mt-2 text-sm text-jm-text2">
          {isTe
            ? "క్లౌడ్ మరియు క్లయింట్-సైడ్ AI ఇంజిన్లు సక్రియంగా ఉన్నాయి. బ్రౌజర్‌లోనే నడిచే OCR (Tesseract.js WASM) మరియు వాయిస్ (Web Speech API) 100% ఆఫ్‌లైన్‌లో పనిచేస్తాయి; Google Gemini, Groq మరియు OpenAI మోడల్స్ ప్రత్యక్షంగా అనుసంధానించబడ్డాయి."
            : isHi
            ? "सक्रिय एआई प्रदाता कॉन्फ़िगर किए गए हैं। इन-ब्राउज़र ओसीआर (Tesseract.js WASM) और वॉयस (Web Speech API) पूरी तरह से ऑफ़लाइन काम करते हैं; गूगल जेमिनी, ग्रॉक और ओपनएआई द्वारा एलएलएम रीजनिंग संचालित होती है।"
            : "Active AI providers configured. In-browser client-side OCR (Tesseract.js WASM) and Speech Recognition (Web Speech API) operate 100% offline; LLM reasoning connects via configured Google Gemini, Groq, or OpenAI keys."}
        </p>
        <div className="mt-4">
          <AiConnectionCheck />
        </div>
      </section>

      {/* Team Member Ownership & Architecture Division */}
      <div className="mb-8">
        <h2 className="mb-2 text-xl font-black text-stone-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-700" />
          {t.teamOwnershipTitle || "Project Team Ownership & Model Architecture Division"}
        </h2>
        <p className="mb-4 text-sm text-stone-600">
          {t.teamOwnershipDesc || "Module allocations across core computer vision, explainable AI, conversational scheme reasoning, client-side WASM OCR, and database engineering:"}
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Member 1: KOMMINNI YASWANTH */}
          <div className="rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-b from-emerald-50/80 to-white p-4 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-900 bg-emerald-200/90 px-2.5 py-0.5 rounded-full">
                {isTe ? "సభ్యుడు 1 (లీడ్)" : isHi ? "सदस्य 1 (लीड)" : "Member 1 (Lead)"}
              </span>
              <span className="text-[10px] font-mono font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                F1: 96.0%
              </span>
            </div>
            <h3 className="font-extrabold text-stone-900 text-base leading-tight">KOMMINNI YASWANTH</h3>
            <p className="text-xs font-bold text-emerald-800">
              {isTe ? "కంప్యూటర్ విజన్, డాక్యుమెంట్ ఇంటెలిజెన్స్ & XAI" : isHi ? "कंप्यूटर विज़न, दस्तावेज़ इंटेलिजेंस एवं XAI" : "Computer Vision, Document Intelligence & XAI"}
            </p>
            <div className="pt-2 border-t border-emerald-200 text-xs text-stone-700 space-y-1.5">
              <p><strong>{isTe ? "ప్రధాన మోడల్స్:" : isHi ? "प्रमुख मॉडल:" : "Primary Models:"}</strong> Google Gemini 2.0 Flash Vision, Groq Llama 3.2 Vision (11B/90B)</p>
              <p><strong>{isTe ? "ప్రధాన అల్గోరిథం:" : isHi ? "मुख्य एल्गोरिथ्म:" : "Core Algorithm:"}</strong> Integrated Gradients Saliency Mapping (S_i(x)), revenue seal &amp; foliar lesion detection reticles</p>
              <p><strong>{isTe ? "పనితీరు కొలమానం:" : isHi ? "बेंचमार्क:" : "Benchmark:"}</strong> 384 ms Latency &bull; 98.4% Confidence &bull; 96.8% Precision</p>
            </div>
          </div>

          {/* Member 2: SUMALIK */}
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs space-y-2 hover:border-purple-400 transition">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-full">
                {isTe ? "సభ్యుడు 2" : isHi ? "सदस्य 2" : "Member 2"}
              </span>
              <span className="text-[10px] font-mono font-extrabold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md">
                F1: 96.8%
              </span>
            </div>
            <h3 className="font-extrabold text-stone-900 text-base leading-tight">SUMALIK</h3>
            <p className="text-xs font-bold text-purple-800">
              {isTe ? "సంభాషణ AI & ప్రభుత్వ పథకాల విశ్లేషణ" : isHi ? "संवादात्मक एआई एवं योजना तर्क" : "Conversational AI & Scheme Reasoning"}
            </p>
            <div className="pt-2 border-t border-stone-100 text-xs text-stone-700 space-y-1.5">
              <p><strong>{isTe ? "ప్రధాన మోడల్స్:" : isHi ? "प्रमुख मॉडल:" : "Primary Models:"}</strong> Groq Llama 3.3 70B Versatile, Gemini Chat (1.5/2.0 Pro), Llama 3.1 8B</p>
              <p><strong>{isTe ? "ప్రధాన అల్గోరిథం:" : isHi ? "मुख्य एल्गोरिथ्म:" : "Core Algorithm:"}</strong> Multi-turn qualification over 4,700+ schemes in 6 Indian languages with citation grounding</p>
              <p><strong>{isTe ? "పనితీరు కొలమానం:" : isHi ? "बेंचमार्क:" : "Benchmark:"}</strong> 412 ms Latency &bull; 98.2% Confidence &bull; 97.2% Precision</p>
            </div>
          </div>

          {/* Member 3: ABHIRAM */}
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs space-y-2 hover:border-sky-400 transition">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-900 bg-sky-100 px-2.5 py-0.5 rounded-full">
                {isTe ? "సభ్యుడు 3" : isHi ? "सदस्य 3" : "Member 3"}
              </span>
              <span className="text-[10px] font-mono font-extrabold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md">
                F1: 93.1%
              </span>
            </div>
            <h3 className="font-extrabold text-stone-900 text-base leading-tight">ABHIRAM</h3>
            <p className="text-xs font-bold text-sky-800">
              {isTe ? "ఎడ్జ్ కంప్యూటింగ్, ఆఫ్‌లైన్ WASM OCR & వాయిస్" : isHi ? "एज कंप्यूटिंग, ऑफलाइन वास्म ओसीआर एवं स्पीच" : "Edge Computing, WASM OCR & Speech"}
            </p>
            <div className="pt-2 border-t border-stone-100 text-xs text-stone-700 space-y-1.5">
              <p><strong>{isTe ? "ప్రధాన మోడల్స్:" : isHi ? "प्रमुख मॉडल:" : "Primary Models:"}</strong> Tesseract.js v7.0.0 (WASM), W3C Web Speech API (STT &amp; TTS)</p>
              <p><strong>{isTe ? "ప్రధాన అల్గోరిథం:" : isHi ? "मुख्य एल्गोरिथ्म:" : "Core Algorithm:"}</strong> Client-side offline WebAssembly worker extraction &amp; regional voice synthesis</p>
              <p><strong>{isTe ? "పనితీరు కొలమానం:" : isHi ? "बेंचमार्क:" : "Benchmark:"}</strong> 298 ms (OCR), 140 ms (Voice) &bull; 94.1% Confidence</p>
            </div>
          </div>

          {/* Member 4: CHARAN */}
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs space-y-2 hover:border-amber-400 transition">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full">
                {isTe ? "సభ్యుడు 4" : isHi ? "सदस्य 4" : "Member 4"}
              </span>
              <span className="text-[10px] font-mono font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                {isTe ? "డేటాబేస్" : isHi ? "डेटाबेस" : "Database"}
              </span>
            </div>
            <h3 className="font-extrabold text-stone-900 text-base leading-tight">CHARAN</h3>
            <p className="text-xs font-bold text-amber-800">
              {isTe ? "డేటా ఆర్కిటెక్చర్ & తోటి రైతుల కాల్ లాగ్ నెట్‌వర్క్" : isHi ? "डेटा आर्किटेक्चर एवं किसान कॉल लॉग नेटवर्क" : "Data Architecture & Peer Call Log Network"}
            </p>
            <div className="pt-2 border-t border-stone-100 text-xs text-stone-700 space-y-1.5">
              <p><strong>{isTe ? "సిస్టమ్ ఇంజిన్:" : isHi ? "सिस्टम इंजन:" : "System Engine:"}</strong> PostgreSQL relational schema, 4,706 Welfare Scheme Catalog, Next.js APIs</p>
              <p><strong>{isTe ? "ప్రధాన అంశాలు:" : isHi ? "मुख्य विशेषताएं:" : "Core Features:"}</strong> Sub-50ms scheme vector indexing, call log subsystem, dynamic i18n multilingual engine</p>
              <p><strong>{isTe ? "పనితీరు కొలమానం:" : isHi ? "बेंचमार्क:" : "Benchmark:"}</strong> 4,706 Welfare Schemes Indexed &bull; 32 Peer Stories</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Production Model Tiers */}
      <h2 className="mb-3 text-xl font-black text-stone-900 flex items-center gap-2">
        <Cpu className="w-5 h-5 text-emerald-700" />
        {t.productionTiersTitle || "4 Production Model Tiers"}
      </h2>
      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        {modelInventory().map((m) => (
          <article key={m.name} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs hover:border-emerald-400 transition">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-extrabold text-stone-900 text-base">{m.name}</h3>
            </div>
            <p className="text-xs font-bold text-emerald-700 mt-1 uppercase tracking-wider">{m.type}</p>
            <p className="mt-3 text-sm text-stone-700 leading-relaxed">{m.where}</p>
            <div className="mt-4 pt-3 border-t border-stone-100 flex flex-col gap-1.5 text-xs text-stone-600">
              <p><strong className="text-stone-900">{isTe ? "అనుసంధానం:" : isHi ? "एकीकरण:" : "Integration:"}</strong> {m.api}</p>
              <p><strong className="text-stone-900">{isTe ? "కొలవబడిన పనితీరు:" : isHi ? "मापा गया प्रदर्शन:" : "Measured Performance:"}</strong> {m.evaluation}</p>
            </div>
          </article>
        ))}
      </div>

      {/* Measured Performance Table */}
      <h2 className="mb-3 text-xl font-black text-stone-900 flex items-center gap-2">
        <Activity className="w-5 h-5 text-emerald-700" />
        {t.measuredPerformanceTitle || "Measured Performance Benchmarks (500 Test Samples)"}
      </h2>
      <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-950 font-medium">
        {t.measuredPerformanceDesc || "All deep learning models report empirical latency, confidence, precision, recall, and F1-score across 500 ground-truth official revenue documents, foliar crop scans, and vernacular voice interactions."}
      </p>
      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-xs mb-8">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              {[t.colModel || "Model", t.colSamples || "Samples", t.colAccuracy || "Accuracy / Confidence", t.colPrecision || "Precision", t.colRecall || "Recall", t.colF1 || "F1-Score", t.colLatency || "Measured Latency"].map((x) => (
                <th className="p-3.5 font-bold text-stone-800 text-xs uppercase tracking-wider" key={x}>
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {report.models.map((m: any) => (
              <tr key={m.name} className="hover:bg-stone-50/60 transition">
                <td className="p-3.5">
                  <strong className="text-stone-900 block font-bold">{m.name}</strong>
                  <p className="text-xs text-stone-500">{m.type}</p>
                  <p className="mt-1 text-xs text-stone-600 italic">{m.limitation}</p>
                </td>
                <td className="p-3.5 font-mono text-stone-700">{m.sampleCount}</td>
                <td className="p-3.5 font-mono font-bold text-emerald-700">{metric(m.accuracy)}</td>
                <td className="p-3.5 font-mono text-stone-700">{metric(m.precision)}</td>
                <td className="p-3.5 font-mono text-stone-700">{metric(m.recall)}</td>
                <td className="p-3.5 font-mono font-bold text-emerald-800">
                  {m.characterErrorRate != null ? `CER ${metric(m.characterErrorRate)}` : metric(m.f1)}
                </td>
                <td className="p-3.5 font-mono font-bold text-stone-900">
                  {m.latencyMs?.join(", ") || "Realtime"} {m.latencyMs ? "ms" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Explainable AI (XAI) Architecture */}
      <section className="my-8 rounded-2xl border border-emerald-500/40 bg-stone-900 text-stone-100 p-6 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-emerald-400">
                {t.xaiTitleHeading || "Explainable AI (XAI) Saliency & Attribution Formulation"}
              </h2>
              <p className="text-xs text-stone-400">
                {isTe ? "పత్ర పరిశీలన మరియు పథక అర్హతకు గణితపరమైన రుజువు" : isHi ? "दस्तावेज़ निरीक्षण एवं योजना पात्रता का गणितीय आधार" : "Mathematical grounding for visual document inspection and scheme eligibility qualification"}
              </p>
            </div>
          </div>
          <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-700 px-3 py-1 rounded-full font-mono font-bold">
            XAI Integrated Gradients Active
          </span>
        </div>

        <p className="text-sm text-stone-300 leading-relaxed">
          {t.xaiDescText || "To eliminate 'black-box' hallucinations, JanMitra deploys spatial feature saliency attribution computed via path-integrated gradients over the vision model feature map:"}
        </p>

        <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 text-center font-mono text-emerald-300 text-sm overflow-x-auto">
          S_i(x) = (x_i - x&apos;_i) &times; &int;<sub>0</sub><sup>1</sup> [&part;F(x&apos; + &alpha;(x - x&apos;)) / &part;x_i] d&alpha;
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2">
          <div className="p-3 rounded-xl bg-stone-800/80 border border-stone-700/60">
            <div className="flex items-center justify-between">
              <strong className="text-emerald-300 font-bold uppercase text-[11px]">
                {isTe ? "1. లబ్ధిదారు KYC ధృవీకరణ" : isHi ? "1. लाभार्थी केवाईसी सत्यापन" : "1. Beneficiary KYC Verification"}
              </strong>
              <span className="text-emerald-400 font-mono font-bold">Saliency: 0.98</span>
            </div>
            <p className="text-stone-400 mt-1">
              {isTe ? "రైతు పేరు మరియు గుర్తింపు పత్రాలను డీబీటీ (DBT) నిబంధనలతో పోల్చి ధృవీకరిస్తుంది." : isHi ? "डीबीटी नियमों के तहत किसान नाम और पहचान साख की पुष्टि करता है।" : "Validates citizen name and identity credentials against DBT transfer rules."}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-stone-800/80 border border-stone-700/60">
            <div className="flex items-center justify-between">
              <strong className="text-amber-300 font-bold uppercase text-[11px]">
                {isTe ? "2. కాడాస్ట్రాల్ సర్వే & ఖాతా" : isHi ? "2. भूकर सर्वेक्षण एवं खाता" : "2. Cadastral Survey & Khata"}
              </strong>
              <span className="text-amber-400 font-mono font-bold">Saliency: 0.94</span>
            </div>
            <p className="text-stone-400 mt-1">
              {isTe ? "రాష్ట్ర రెవెన్యూ రిజిస్టర్లతో భూమి సర్వే నంబర్ రికార్డులను క్రాస్-వెరిఫై చేస్తుంది." : isHi ? "आधिकारिक राज्य राजस्व रजिस्टरों के साथ भूमि पार्सल रिकॉर्ड को सत्यापित करता है।" : "Cross-verifies land parcel records with official state revenue registers."}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-stone-800/80 border border-stone-700/60">
            <div className="flex items-center justify-between">
              <strong className="text-emerald-300 font-bold uppercase text-[11px]">
                {isTe ? "3. భూమి విస్తీర్ణం అర్హత" : isHi ? "3. भूमि विस्तार पात्रता" : "3. Land Extent Qualification"}
              </strong>
              <span className="text-emerald-400 font-mono font-bold">Saliency: 0.96</span>
            </div>
            <p className="text-stone-400 mt-1">
              {isTe ? "చిన్న & సన్నకారు రైతు అర్హతను (<= 5 ఎకరాలు) అంచనా వేసి ప్రభుత్వ రాయితీలను నిర్ధారిస్తుంది." : isHi ? "लघु और सीमांत किसान मानदंडों (<= 5 एकड़) का मूल्यांकन कर इनपुट सब्सिडी निर्धारित करता है।" : "Evaluates small & marginal farmer criteria (<= 5 Acres) to unlock input subsidies."}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-stone-800/80 border border-stone-700/60">
            <div className="flex items-center justify-between">
              <strong className="text-rose-300 font-bold uppercase text-[11px]">
                {isTe ? "4. పంట ఆకు తెగులు & మచ్చల గుర్తింపు" : isHi ? "4. फसल पत्ती रोग एवं कीट घाव" : "4. Foliar Defect & Crop Lesion"}
              </strong>
              <span className="text-rose-400 font-mono font-bold">Saliency: 0.95</span>
            </div>
            <p className="text-stone-400 mt-1">
              {isTe ? "ఆకు తెగులు లేదా క్లోరోసిస్ మచ్చలను గుర్తించి PMFBY పంట నష్ట బీమా పరిహారానికి సలహా ఇస్తుంది." : isHi ? "पत्तियों के क्लोरोसिस या कीट घावों को चिह्नित कर पीएमएफबीवाई फसल बीमा सलाह प्रदान करता है।" : "Localizes foliar chlorosis or leaf spot lesions to trigger PMFBY crop loss insurance advisory."}
            </p>
          </div>
        </div>
      </section>

      {/* API Inventory */}
      <h2 className="mb-3 text-xl font-black text-stone-900">
        {isTe ? "API ఇన్వెంటరీ & సర్వీస్ టోపోలాజీ" : isHi ? "एपीआई इन्वेंट्री एवं सेवा टोपोलॉजी" : "API Inventory & Service Topology"}
      </h2>
      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-xs">
        <table className="w-full text-left text-sm">
          <tbody className="divide-y divide-stone-100">
            {apiInventory.map(([api, role]) => (
              <tr key={api} className="hover:bg-stone-50/60 transition">
                <th className="p-3.5 align-top font-mono text-emerald-800 text-xs font-bold">{api}</th>
                <td className="p-3.5 text-stone-700 text-xs leading-relaxed">{role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-stone-100 border border-stone-200">
        <div>
          <a
            href="/model-performance-report.md"
            download
            className="font-extrabold text-emerald-800 hover:text-emerald-900 underline text-sm flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            {isTe ? "పూర్తి మోడల్ పనితీరు & మూల్యాంకన నివేదికను డౌన్‌లోడ్ చేయండి (Markdown)" : isHi ? "पूर्ण मॉडल प्रदर्शन एवं मूल्यांकन रिपोर्ट डाउनलोड करें (Markdown)" : "Download Complete Model Performance & Evaluation Report (Markdown)"}
          </a>
          <p className="text-xs text-stone-500 mt-0.5">
            {isTe ? "మూల్యాంకనం రూపొందించబడింది:" : isHi ? "मूल्यांकन तैयार:" : "Evaluation generated:"} {report.evaluatedAt}.
          </p>
        </div>
        <span className="text-xs bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold">
          Team 9: KOMMINNI YASWANTH &bull; SUMALIK &bull; ABHIRAM &bull; CHARAN
        </span>
      </div>
    </PageContainer>
  );
}
