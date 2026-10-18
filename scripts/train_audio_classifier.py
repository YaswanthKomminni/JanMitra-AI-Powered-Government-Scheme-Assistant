import os
import sys
import glob
import math
import random

if sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

import miniaudio
import numpy as np
from scipy import signal
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
import joblib

# Target languages supported by JanMithra
TARGET_LANGUAGES = ["Telugu", "Tamil", "Hindi", "Kannada", "Bengali"]

def extract_audio_features(file_path: str, max_duration_sec: float = 5.0) -> np.ndarray:
    """
    Decodes an MP3 audio file and extracts a comprehensive 28-dimensional acoustic
    feature vector capturing phonetic timbre, spectral formants, and rhythm dynamics.
    """
    decoded = miniaudio.decode_file(file_path)
    sample_rate = decoded.sample_rate
    channels = decoded.nchannels
    raw_samples = np.array(decoded.samples, dtype=np.float32)

    # Convert to mono if stereo
    if channels > 1:
        raw_samples = raw_samples.reshape(-1, channels).mean(axis=1)

    # Normalize amplitude to [-1.0, 1.0]
    max_val = np.max(np.abs(raw_samples))
    if max_val > 0:
        samples = raw_samples / max_val
    else:
        samples = raw_samples

    # Truncate to max_duration
    max_samples = int(max_duration_sec * sample_rate)
    if len(samples) > max_samples:
        samples = samples[:max_samples]

    # 1. Zero Crossing Rate (ZCR)
    zcr = np.mean(np.abs(np.diff(np.sign(samples)))) / 2.0

    # 2. RMS Energy & Energy Variance
    rms = np.sqrt(np.mean(samples ** 2))
    energy_var = np.var(samples ** 2)

    # 3. FFT Magnitude Spectrum
    n_fft = 2048
    if len(samples) < n_fft:
        samples = np.pad(samples, (0, n_fft - len(samples)))
    
    # Apply Hanning window
    windowed = samples[:n_fft] * np.hanning(n_fft)
    fft_vals = np.abs(np.fft.rfft(windowed))
    freqs = np.fft.rfftfreq(n_fft, d=1.0 / sample_rate)

    # 4. Spectral Centroid
    sum_fft = np.sum(fft_vals) + 1e-10
    spectral_centroid = np.sum(freqs * fft_vals) / sum_fft

    # 5. Spectral Spread (Bandwidth)
    spectral_spread = np.sqrt(np.sum(((freqs - spectral_centroid) ** 2) * fft_vals) / sum_fft)

    # 6. Spectral Rolloff (85% energy point)
    cum_energy = np.cumsum(fft_vals)
    rolloff_idx = np.searchsorted(cum_energy, 0.85 * cum_energy[-1])
    spectral_rolloff = freqs[min(rolloff_idx, len(freqs) - 1)]

    # 7. Spectral Flatness (Wiener entropy)
    geometric_mean = np.exp(np.mean(np.log(fft_vals + 1e-10)))
    arithmetic_mean = np.mean(fft_vals) + 1e-10
    spectral_flatness = geometric_mean / arithmetic_mean

    # 8. Log Sub-band Energies (16 Speech Frequency Bands between 100 Hz and 8000 Hz)
    band_limits = np.geomspace(100, min(8000, sample_rate // 2), 17)
    band_energies = []
    for i in range(16):
        idx = np.where((freqs >= band_limits[i]) & (freqs < band_limits[i + 1]))[0]
        if len(idx) > 0:
            band_energy = np.sum(fft_vals[idx] ** 2)
        else:
            band_energy = 0.0
        band_energies.append(np.log1p(band_energy))

    # 9. Dominant Formant Peaks (Top 4 formant resonance peaks)
    peak_indices = np.argsort(fft_vals)[-4:]
    top_formants = np.sort(freqs[peak_indices])
    if len(top_formants) < 4:
        top_formants = np.pad(top_formants, (0, 4 - len(top_formants)))

    # Concatenate all acoustic features
    features = np.hstack([
        [zcr, rms, energy_var, spectral_centroid, spectral_spread, spectral_rolloff, spectral_flatness],
        band_energies,
        top_formants
    ])

    return features

def train_audio_model():
    dataset_base = os.path.join("dataset", "audio", "Indian_Languages_Audio_Dataset")
    if not os.path.exists(dataset_base):
        # Fallback to main project path
        dataset_base = r"C:\Users\KOMMINNIYASWANTH\Downloads\NLP-project\dataset\audio\Indian_Languages_Audio_Dataset"

    print("==================================================================")
    print("🌾 JanMithra Multilingual Spoken Voice & Audio Model Training 🌾")
    print("==================================================================")
    print(f"[INFO] Dataset path: {dataset_base}")
    print(f"[INFO] Target languages: {TARGET_LANGUAGES}")

    X_list = []
    y_list = []
    sample_counts = {}

    samples_per_lang = 120 # Balanced subset for optimal model convergence & speed

    for lang_idx, lang_name in enumerate(TARGET_LANGUAGES):
        lang_dir = os.path.join(dataset_base, lang_name)
        if not os.path.exists(lang_dir):
            print(f"[WARNING] Directory not found for: {lang_name}")
            continue

        mp3_files = sorted(glob.glob(os.path.join(lang_dir, "*.mp3")))
        if not mp3_files:
            print(f"[WARNING] No MP3 files in: {lang_dir}")
            continue

        selected_files = mp3_files[:samples_per_lang]
        print(f"-> Processing {len(selected_files)} audio samples for '{lang_name}'...")

        processed = 0
        for fpath in selected_files:
            try:
                feat = extract_audio_features(fpath)
                X_list.append(feat)
                y_list.append(lang_name)
                processed += 1
            except Exception as e:
                pass
        sample_counts[lang_name] = processed

    X = np.array(X_list)
    y = np.array(y_list)

    print(f"\n[INFO] Total Feature Matrix: {X.shape[0]} samples x {X.shape[1]} features")
    for lang, count in sample_counts.items():
        print(f"  • {lang}: {count} audio clips")

    # Train / Test Split (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    print(f"\n[INFO] Training set size: {X_train.shape[0]}, Test set size: {X_test.shape[0]}")

    # Feature Scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Train Random Forest Ensemble with Gini impurity & formants
    print("\n[INFO] Training Random Forest Spoken Language Classifier...")
    clf = RandomForestClassifier(
        n_estimators=150,
        max_depth=16,
        min_samples_split=3,
        random_state=42,
        n_jobs=-1
    )
    clf.fit(X_train_scaled, y_train)

    # Evaluation
    y_pred = clf.predict(X_test_scaled)
    acc = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, target_names=TARGET_LANGUAGES)

    print("\n" + "=" * 60)
    print(f"🏆 Audio Language Model Test Accuracy: {acc * 100:.2f}%")
    print("=" * 60)
    print("Classification Report:\n", report)

    # Save artifacts
    output_dir = os.path.join("dataset", "audio")
    os.makedirs(output_dir, exist_ok=True)
    
    model_path = os.path.join(output_dir, "spoken_language_audio_classifier.joblib")
    scaler_path = os.path.join(output_dir, "audio_scaler.joblib")
    
    joblib.dump(clf, model_path)
    joblib.dump(scaler, scaler_path)

    print(f"[SUCCESS] Model saved to: {model_path}")
    print(f"[SUCCESS] Scaler saved to: {scaler_path}")

    # Generate Training Summary Markdown Report
    report_md = f"""# JanMithra Audio Language Classifier Training Report

**Date:** {os.popen('date /t').read().strip() if os.name == 'nt' else '2026-10-18'}
**Dataset Source:** `dataset/audio/Indian_Languages_Audio_Dataset`
**Total Audio Samples Evaluated:** {len(X)}
**Languages Classified:** {', '.join(TARGET_LANGUAGES)}

## 📊 Performance Metrics

- **Overall Accuracy:** {acc * 100:.2f}%
- **Acoustic Features Extracted:** 28 (ZCR, Spectral Centroid, Bandwidth, Rolloff, Wiener Flatness, 16 Log Frequency Bands, 4 Dominant Formants)
- **Classifier:** Random Forest Ensemble (150 Estimators, max_depth=16)

## 📋 Classification Report
```
{report}
```

## 🎯 Inference Usage
```python
import joblib
from scripts.train_audio_classifier import extract_audio_features

clf = joblib.load("dataset/audio/spoken_language_audio_classifier.joblib")
scaler = joblib.load("dataset/audio/audio_scaler.joblib")

features = extract_audio_features("path/to/voice_sample.mp3")
predicted_language = clf.predict(scaler.transform([features]))[0]
print(f"Identified Language: {{predicted_language}}")
```
"""
    report_file = os.path.join(output_dir, "AUDIO_TRAINING_REPORT.md")
    with open(report_file, "w", encoding="utf-8") as f:
        f.write(report_md)
    print(f"[SUCCESS] Training summary report generated: {report_file}")

if __name__ == "__main__":
    train_audio_model()
