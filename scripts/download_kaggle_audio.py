import os
import sys
import zipfile
import subprocess

def setup_kaggle_credentials():
    kaggle_dir = os.path.expanduser("~/.kaggle")
    kaggle_json = os.path.join(kaggle_dir, "kaggle.json")
    
    if os.path.exists(kaggle_json):
        print("[INFO] Kaggle credentials found at:", kaggle_json)
        return True
        
    print("=" * 60)
    print("                  KAGGLE CREDENTIALS SETUP")
    print("=" * 60)
    print("The Indian Languages Audio Dataset is hosted on Kaggle and requires")
    print("a Kaggle account to download.")
    print("\nTo set up your API credentials:")
    print("1. Go to https://www.kaggle.com and log in.")
    print("2. Navigate to your Account profile settings.")
    print("3. Scroll down and click 'Create New API Token'.")
    print("4. This downloads a 'kaggle.json' file.")
    print("=" * 60)
    
    username = input("\nEnter your Kaggle Username: ").strip()
    api_key = input("Enter your Kaggle API Key: ").strip()
    
    if not username or not api_key:
        print("[ERROR] Username and API Key cannot be empty.")
        return False
        
    try:
        os.makedirs(kaggle_dir, exist_ok=True)
        import json
        with open(kaggle_json, "w") as f:
            json.dump({"username": username, "key": api_key}, f)
        
        # On Unix, restrict permissions, on Windows, default is fine
        if sys.platform != "win32":
            os.chmod(kaggle_json, 0o600)
            
        print("[SUCCESS] Kaggle credentials saved to:", kaggle_json)
        return True
    except Exception as e:
        print("[ERROR] Failed to save credentials:", e)
        return False

def install_kaggle_cli():
    try:
        import kaggle
        print("[INFO] Kaggle python package is already installed.")
        return True
    except ImportError:
        print("[INFO] Installing kaggle python package...")
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", "kaggle"], check=True)
            print("[SUCCESS] kaggle package installed successfully.")
            return True
        except Exception as e:
            print("[ERROR] Failed to install kaggle package:", e)
            return False

def download_and_extract():
    if not setup_kaggle_credentials():
         return
         
    if not install_kaggle_cli():
         return
         
    dataset_slug = "hmsolanki/indian-languages-audio-dataset"
    target_dir = os.path.join("dataset", "audio_dataset")
    os.makedirs(target_dir, exist_ok=True)
    
    print(f"\n[INFO] Starting download of {dataset_slug}...")
    zip_path = os.path.join(target_dir, "indian-languages-audio-dataset.zip")
    
    # Run Kaggle API download
    try:
        # Import after install
        from kaggle.api.kaggle_api_extended import KaggleApi
        api = KaggleApi()
        api.authenticate()
        
        print("[INFO] Downloading dataset (this may take a while as it is ~2GB)...")
        api.dataset_download_files(dataset_slug, path=target_dir, unzip=False, quiet=False)
        print("[SUCCESS] Download complete!")
        
        if os.path.exists(zip_path):
            print("[INFO] Extracting files...")
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(target_dir)
            print("[SUCCESS] Extraction complete! Files saved to:", target_dir)
            os.remove(zip_path) # Clean up zip file
        else:
            # Check if it was already unzipped by API
            print("[INFO] Checking destination folder...")
            
    except Exception as e:
        print("[ERROR] Failed to download or extract dataset:", e)
        print("Please check your Kaggle account status and internet connection.")

if __name__ == "__main__":
    download_and_extract()
