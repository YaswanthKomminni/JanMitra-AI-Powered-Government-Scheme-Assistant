# JanMithra model performance and explainability report

Generated: 2026-10-21T09:29:50.141Z

Small fixture audit and in-sample intent audit; not representative held-out benchmark results.

## Model inventory and evaluation

### CLIP ViT-B/32 q8
Pretrained deep learning vision model
Samples: 3. accuracy: 1.000000; precision: 1.000000; recall: 1.000000; f1: 1.000000
Three previously used fixtures; abstentions count as errors. Includes loading time. Not a disease diagnosis benchmark.
Measured latency (ms): [2106, 420, 369]

### Tesseract LSTM OCR
Pretrained neural OCR
Samples: 1. characterErrorRate: 0.000000
One clean synthetic English notice; not representative of photographed, multilingual or blurry documents.
Measured latency (ms): [1018]

### Hashed-vector intent centroid classifier
Classical classifier; not deep learning
Samples: 128. accuracy: 0.343750; precision: 0.374629; recall: 0.330451; f1: 0.343961
128 examples from the training-source dataset; an in-sample audit, not held-out accuracy. This legacy classifier is not used by the current chat intent router.
Measured latency (ms): [193]

### Gemini / Groq / OpenAI language and vision providers
External generative model
Samples: 0.
No labeled live-provider evaluation completed. Actual request latency, tokens and failures are displayed separately.
Measured latency (ms): Not measured; inspect actual request telemetry.

### Gemini TTS
External generative model
Samples: 0.
No labeled live-provider evaluation completed. Actual request latency, tokens and failures are displayed separately.
Measured latency (ms): Not measured; inspect actual request telemetry.

## Execution output in the UI
Each provider/model attempt is reported independently, including failures, latency and token usage when returned by the provider. OCR and CLIP runs are reported independently. Provider response success is not factual-answer accuracy. The UI retains source validation explanations and makes clear when local fallback was used. External LLM and TTS quality has not been measured on a labeled live-provider dataset.

## Explainable AI
1. Document retrieval uses leave-one-term-out ablation. For each query term, remove it and recompute BM25 passage ranking. Display the difference in the top score and the selected supporting passages. This explains ranking, not a causal mechanism inside an LLM.
2. Image explanations use CLIP quadrant occlusion sensitivity: measure the baseline scene score, mask each quadrant with neutral gray, and rerun CLIP. Display signed score changes. This is a scene classifier explanation, not a crop diagnosis or document-authenticity certificate.
3. Generated factual claims are linked to literal source quotes. Source attribution helps inspect grounding; it does not expose proprietary provider weights. No SHAP, attention map or causal guarantee is claimed for external LLMs.

## Evaluation limitations
The CLIP score is based on only three fixtures already used in regression checks. OCR CER is based on one clean synthetic English notice. Intent results are an in-sample audit of 128 training-source examples and are not held-out generalization performance. Regression-test pass rates are software checks, not model accuracy. Larger independent, labeled multilingual document and crop datasets are needed for a defensible production benchmark.

## Reproduction
Run `node scripts/evaluate-models.cjs` from frontend with the private image fixtures installed. The script writes src/lib/data/model_evaluation.json. No personal image, document content, credential or raw provider error is published in this report.

## Not executed
The current implementation does not execute YOLOv8, BERT, HMM or CRF as claimed trained models. PDF/Word extraction and BM25 retrieval are non-neural utilities and are labeled accordingly.


## Integration and deployment inventory

The live Models & XAI page lists model IDs from the configured model overrides (or code defaults) and key presence without exposing any secret. A model listed as supported is not proof that it ran: use the per-answer execution report and Check AI connection.

| Model / service | Role and location | Evaluation status |
| --- | --- | --- |
| Gemini configured Flash LLMs | Chat, document summaries and Q&A, vision, voice briefings; generateContent API | No project-specific labeled cloud accuracy benchmark; actual latency/tokens/failures recorded |
| Gemini Google Search grounding | Official-source research, followed by fetching official evidence | No research-quality benchmark; dated source evidence is required for current deadlines |
| Groq configured text and vision LLMs | Optional chat/document/vision fallback through OpenAI-compatible completions | No project-specific accuracy benchmark; actual model IDs recorded |
| OpenAI configured multimodal LLMs | Optional chat/document/vision fallback through chat completions | No project-specific accuracy benchmark; actual model IDs recorded |
| Xenova/clip-vit-base-patch32 | Local ONNX scene classification and quadrant occlusion XAI | Three-fixture scope audit described above; not crop diagnosis |
| Tesseract English / Telugu LSTM | Local image and scanned-PDF OCR | One clean English notice described above; no Telugu/blur benchmark |
| Gemini configured TTS | Chat speech generation when audio access is available | No MOS, intelligibility or pronunciation benchmark |
| Regional speech service / Web Speech API | Chat speech fallback and browser microphone recognition | Model ID unavailable; no accuracy benchmark |
| pdf-parse / word-extractor / text decoding | Original document extraction before LLM reasoning | Deterministic parsers; retained characters and page coverage, not model accuracy |
| BM25 / leave-one-term-out sensitivity | Query-based source retrieval and ranking explanation | No labeled retrieval-quality benchmark; score is not correctness |
| Literal extraction / conversation memory / source validator | Local fallback, dialogue state and exact evidence checks | Regression tests, not a neural model or chatbot accuracy score |
| Legacy hash-vector classifier | Retained evaluation artifact, not the current chat router | In-sample result above; not held-out validation |

Internal APIs: /api/chat (conversation), /api/ocr/analyze and /api/ocr/answer (upload and follow-ups), /api/ai/check and /api/ai/explain-image (diagnostics/XAI), /api/schemes (saved catalog), /api/peers (district members and demo directory), /api/profile and /api/profile/documents with owned-document endpoints (private personalization), /api/voice/brief and /api/tts (chat audio), /api/auth/* (sessions), /api/conversations/* (own history), /api/verify-doc (user confirmation, not government authentication), /api/db-status (connectivity).

PostgreSQL stores accounts, sessions, conversations, private profile documents and contact consent. Unsplash supplies example avatars. Neither is an AI model. Model accuracy does not apply to these services.

## Profile documents and long-document interpretation

Profile editing supports name, Indian mobile number, optional email, village, district, state, language and optional farm details. Private saved documents retain the original and extracted text under the authenticated owner. Document selection is checked again on the server. Relevant original passages may be passed to configured providers for personal guidance; a document is never evidence of current eligibility or authenticated ownership. Deleting a profile document does not erase information previously shared in a saved chat.

Long summaries receive passages distributed across the document plus its section outline; focused follow-ups retrieve the original text again. The offline path labels its output as extractive, not an LLM interpretation. Coverage limits and unreadable pages remain visible. A booklet published in 2015 cannot establish 2026 scheme rules.

The farmer directory shows real registered members only to signed-in users in the same saved state/district and only after explicit contact sharing. District matching is not a measured distance. Demo cards have no callable phone numbers.
