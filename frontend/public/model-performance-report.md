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
