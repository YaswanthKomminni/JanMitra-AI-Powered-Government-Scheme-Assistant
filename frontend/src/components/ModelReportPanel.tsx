"use client";
import type { ModelReport } from "@/lib/modelReport";
import { useFarmerStore } from "@/store/useFarmerStore";
import { translations } from "@/lib/i18n";
const copy = {
 en: { none: "No model inference recorded for this answer.", completed: "completed", failed: "failed", note: "Actual request measurements. Confidence and similarity are not accuracy.", report: "View model evaluation and XAI report" },
 te: { none: "ఈ సమాధానానికి మోడల్ అమలు నమోదు కాలేదు.", completed: "పూర్తయింది", failed: "విఫలమైంది", note: "ఇవి నిజమైన అభ్యర్థన కొలతలు. విశ్వాస స్కోరు ఖచ్చితత్వం కాదు.", report: "మోడల్ మూల్యాంకనం, XAI నివేదిక చూడండి" },
 hi: { none: "इस उत्तर के लिए मॉडल निष्पादन दर्ज नहीं है।", completed: "पूरा हुआ", failed: "विफल", note: "ये वास्तविक अनुरोध के माप हैं। विश्वास या समानता सटीकता नहीं है।", report: "मॉडल मूल्यांकन और XAI रिपोर्ट देखें" },
 ta: { none: "இந்தப் பதிலுக்கு மாதிரி இயக்கம் பதிவாகவில்லை.", completed: "முடிந்தது", failed: "தோல்வி", note: "உண்மையான கோரிக்கை அளவீடுகள். நம்பிக்கை அல்லது ஒற்றுமை துல்லியம் அல்ல.", report: "மாதிரி மதிப்பீடு மற்றும் XAI அறிக்கை" },
 kn: { none: "ಈ ಉತ್ತರಕ್ಕೆ ಮಾದರಿ ಕಾರ್ಯಾಚರಣೆ ದಾಖಲಾಗಿಲ್ಲ.", completed: "ಪೂರ್ಣ", failed: "ವಿಫಲ", note: "ನಿಜವಾದ ವಿನಂತಿ ಅಳತೆಗಳು. ವಿಶ್ವಾಸ ಅಥವಾ ಹೋಲಿಕೆ ನಿಖರತೆ ಅಲ್ಲ.", report: "ಮಾದರಿ ಮೌಲ್ಯಮಾಪನ ಮತ್ತು XAI ವರದಿ" },
 bn: { none: "এই উত্তরের জন্য মডেল চালানোর রেকর্ড নেই।", completed: "সম্পূর্ণ", failed: "ব্যর্থ", note: "প্রকৃত অনুরোধের পরিমাপ। বিশ্বাস বা সাদৃশ্য নির্ভুলতা নয়।", report: "মডেল মূল্যায়ন ও XAI রিপোর্ট দেখুন" },
};
export default function ModelReportPanel({ report }: { report?: ModelReport }) {
 const language = useFarmerStore(s => s.language);
 if (!report || (!report.runs?.length && !report.explanation)) return null;
 const l = copy[language];
 const runs = report.runs || [];
 const succeeded = runs.filter(r => r.status === "completed").length;
 return <details className="mt-3 rounded-xl border border-jm-border bg-jm-surface p-3 text-xs text-jm-text2">
  <summary className="cursor-pointer font-semibold">{translations[language].modelsButtonLabel} · {succeeded}/{runs.length} {l.completed}</summary>
  {!runs.length && <p className="mt-2">{l.none}</p>}
  {runs.map((r,i) => <div key={i} className="mt-3 border-t border-jm-border pt-2"><strong>{r.model}</strong><p>{r.task} · {r.status === "completed" ? l.completed : l.failed} · {r.latencyMs} ms</p>{r.inputTokens != null && <p>Input tokens: {r.inputTokens} · Output tokens: {r.outputTokens ?? "—"}</p>}{r.score != null && <p>Score: {r.score.toFixed(4)}</p>}{r.detail && <p>{r.detail}</p>}</div>)}
  {report.explanation && <div className="mt-3"><strong>{report.explanation.method}</strong><ul className="list-disc pl-4">{report.explanation.evidence.map((text,i) => <li key={i}>{text}</li>)}</ul></div>}
  <p className="mt-3">{l.note}</p><a className="underline" href="/models">{l.report}</a>
 </details>;
}
