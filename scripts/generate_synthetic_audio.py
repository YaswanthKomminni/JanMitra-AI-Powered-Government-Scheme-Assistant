import os
import wave
import math
import struct
import random

def generate_wav(filepath, base_freq, mod_freq, duration=5.0, sample_rate=16000):
    num_samples = int(duration * sample_rate)
    
    frames = []
    for i in range(num_samples):
        t = float(i) / sample_rate
        freq_mod = base_freq + 60 * math.sin(2 * math.pi * mod_freq * t)
        val = math.sin(2 * math.pi * freq_mod * t)
        val += 0.4 * math.sin(2 * math.pi * (freq_mod * 2) * t)
        val += 0.2 * math.sin(2 * math.pi * (freq_mod * 3) * t)
        
        envelope = 0.5 * (1.0 + math.sin(2 * math.pi * 1.5 * t)) * (0.8 + 0.2 * math.sin(2 * math.pi * 0.2 * t))
        val *= envelope
        val += 0.05 * random.uniform(-1.0, 1.0)
        val = max(-1.0, min(1.0, val))
        
        int_val = int(val * 32767)
        frames.append(int_val)
        
    packed_data = struct.pack(f"<{num_samples}h", *frames)
    
    with wave.open(filepath, "w") as wav_file:
        wav_file.setparams((1, 2, sample_rate, num_samples, "NONE", "not compressed"))
        wav_file.writeframes(packed_data)

def generate_dataset():
    languages = {
        "bengali": (200, 4),
        "gujarati": (250, 6),
        "hindi": (300, 5),
        "kannada": (350, 7),
        "malayalam": (400, 3),
        "marathi": (450, 8),
        "punjabi": (500, 9),
        "tamil": (550, 2),
        "telugu": (600, 10),
        "urdu": (650, 11)
    }
    
    target_dir = os.path.join("dataset", "audio_dataset")
    os.makedirs(target_dir, exist_ok=True)
    
    print("=== Generating Synthetic Audio Training Dataset ===")
    print(f"Target directory: {target_dir}")
    print("Generating 20 files per language (5 seconds, 16kHz WAV)...")
    
    total_files = 0
    for lang, (base_freq, mod_freq) in languages.items():
        lang_dir = os.path.join(target_dir, lang)
        os.makedirs(lang_dir, exist_ok=True)
        print(f"Generating audio files for: {lang} (frequency: {base_freq}Hz, mod: {mod_freq}Hz)...")
        
        for i in range(1, 21):
            filename = f"{lang}_{i:04d}.wav"
            filepath = os.path.join(lang_dir, filename)
            
            # Add minor variations to make files unique
            unique_base = base_freq + random.uniform(-10, 10)
            unique_mod = mod_freq + random.uniform(-0.5, 0.5)
            
            generate_wav(filepath, unique_base, unique_mod)
            total_files += 1
            
    print("\n[SUCCESS] Audio training dataset successfully generated!")
    print(f"Total audio files generated: {total_files}")
    print(f"Folder structure matches hmsolanki/indian-languages-audio-dataset.")

if __name__ == "__main__":
    # Ensure reproducibility
    random.seed(42)
    generate_dataset()
