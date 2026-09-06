import os
import json
import csv

def verify_dataset():
    errors = []
    
    # 1. Check file existence
    paths = [
        os.path.join("dataset", "README.md"),
        os.path.join("dataset", "metadata.json"),
        os.path.join("dataset", "schemes", "government_schemes.json"),
        os.path.join("dataset", "schemes", "government_schemes.csv"),
        os.path.join("dataset", "citizen_profiles", "citizen_profiles.json"),
        os.path.join("dataset", "citizen_profiles", "citizen_profiles.csv"),
        os.path.join("dataset", "conversational_nlp", "intent_entity_queries.json"),
        os.path.join("dataset", "conversational_nlp", "intent_entity_queries.csv"),
    ]
    
    print("=== File Existence Check ===")
    for p in paths:
        if os.path.exists(p):
            print(f"[OK] Found: {p}")
        else:
            errors.append(f"Missing file: {p}")
            print(f"[FAIL] Missing: {p}")
            
    if errors:
        return False
        
    # 2. Validate Schemes
    print("\n=== Schemes Dataset Validation ===")
    with open(os.path.join("dataset", "schemes", "government_schemes.json"), "r", encoding="utf-8") as f:
        schemes_json = json.load(f)
    print(f"Loaded {len(schemes_json)} schemes from JSON.")
    if len(schemes_json) < 15:
        errors.append(f"Expected at least 15 schemes, got {len(schemes_json)}")
        
    # Check headers in CSV
    with open(os.path.join("dataset", "schemes", "government_schemes.csv"), "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        headers = next(reader)
        print(f"CSV Headers: {headers}")
        rows = list(reader)
        print(f"Loaded {len(rows)} schemes from CSV.")
        if len(rows) != len(schemes_json):
            errors.append(f"Mismatch: JSON has {len(schemes_json)} schemes, CSV has {len(rows)} schemes.")

    # 3. Validate Citizen Profiles
    print("\n=== Citizen Profiles Validation ===")
    with open(os.path.join("dataset", "citizen_profiles", "citizen_profiles.json"), "r", encoding="utf-8") as f:
        profiles_json = json.load(f)
    print(f"Loaded {len(profiles_json)} citizen profiles from JSON.")
    if len(profiles_json) != 10000:
        errors.append(f"Expected 10000 citizen profiles, got {len(profiles_json)}")
        
    # Simple check for eligibility logic sanity
    # Age <= 10 and Female must be eligible for SCH_004 (Sukanya Samriddhi Yojana)
    for p in profiles_json:
        age = p["age"]
        gender = p["gender"]
        elig = p["eligible_schemes"].split(";")
        
        # Check SCH_004
        if age <= 10 and gender == "Female":
            if "SCH_004" not in elig:
                errors.append(f"Citizen {p['citizen_id']} (Age {age}, Female) should be eligible for SCH_004 but is not.")
        else:
            if "SCH_004" in elig:
                errors.append(f"Citizen {p['citizen_id']} (Age {age}, {gender}) should NOT be eligible for SCH_004 but is.")

    with open(os.path.join("dataset", "citizen_profiles", "citizen_profiles.csv"), "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        csv_profiles = list(reader)
        print(f"Loaded {len(csv_profiles)} profiles from CSV.")
        if len(csv_profiles) != 10000:
            errors.append(f"Expected 10000 citizen profiles in CSV, got {len(csv_profiles)}")

    # 4. Validate NLP Queries
    print("\n=== Conversational NLP Queries Validation ===")
    with open(os.path.join("dataset", "conversational_nlp", "intent_entity_queries.json"), "r", encoding="utf-8") as f:
        queries_json = json.load(f)
    print(f"Loaded {len(queries_json)} queries from JSON.")
    if len(queries_json) != 6000:
        errors.append(f"Expected 6000 queries, got {len(queries_json)}")
        
    # Check language balance
    lang_counts = {}
    for q in queries_json:
        lang = q["language"]
        lang_counts[lang] = lang_counts.get(lang, 0) + 1
        
    print(f"Language distributions: {lang_counts}")
    for lang, count in lang_counts.items():
        if count != 1000:
            errors.append(f"Expected 1000 queries for {lang}, got {count}")

    with open(os.path.join("dataset", "conversational_nlp", "intent_entity_queries.csv"), "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        csv_queries = list(reader)
        print(f"Loaded {len(csv_queries)} queries from CSV.")
        if len(csv_queries) != 6000:
            errors.append(f"Expected 6000 queries in CSV, got {len(csv_queries)}")

    print("\n=== Validation Summary ===")
    if errors:
        print(f"[FAIL] Dataset validation failed with {len(errors)} errors:")
        for err in errors:
            print(f"  - {err}")
        return False
    else:
        print("[SUCCESS] All dataset files and logical constraints passed validation checks!")
        return True

if __name__ == "__main__":
    verify_dataset()
