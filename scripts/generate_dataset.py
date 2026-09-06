import os
import json
import csv
import random
import pandas as pd
import ast

# Create directory structure
os.makedirs(os.path.join("dataset", "schemes"), exist_ok=True)
os.makedirs(os.path.join("dataset", "citizen_profiles"), exist_ok=True)
os.makedirs(os.path.join("dataset", "conversational_nlp"), exist_ok=True)

# 1. Government Schemes Data Definition
schemes = [
    {
        "scheme_id": "SCH_001",
        "scheme_name": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
        "ministry": "Ministry of Agriculture and Farmers Welfare",
        "category": "Agriculture",
        "description": "An initiative by the government of India that provides up to INR 6,000 per year in three equal installments to all landholding farmer families.",
        "eligibility_min_age": 18,
        "eligibility_max_age": 120,
        "eligibility_gender": "All",
        "eligibility_max_income": 300000,
        "eligibility_occupation": "Farmer",
        "eligibility_caste": "All",
        "eligibility_disabled": "All",
        "benefits": "Financial benefit of INR 6,000 per year, transferred directly into the bank accounts of farmers.",
        "documents_required": "Aadhaar Card, Land Holding Documents, Bank Account Details, Mobile Number",
        "application_mode": "Both"
    },
    {
        "scheme_id": "SCH_002",
        "scheme_name": "Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY)",
        "ministry": "Ministry of Health and Family Welfare",
        "category": "Health",
        "description": "The largest health assurance scheme in the world which aims to provide free health cover of up to INR 5 Lakh per family per year for secondary and tertiary care hospitalization.",
        "eligibility_min_age": 0,
        "eligibility_max_age": 120,
        "eligibility_gender": "All",
        "eligibility_max_income": 250000,
        "eligibility_occupation": "Farmer, Daily Wage Worker, Unemployed, Street Vendor",
        "eligibility_caste": "All",
        "eligibility_disabled": "All",
        "benefits": "Cashless cover of up to INR 5,000,000 per family per year for medical treatment at empaneled hospitals.",
        "documents_required": "Aadhaar Card, Ration Card (PDS), Income Certificate, Identity Proof",
        "application_mode": "Both"
    },
    {
        "scheme_id": "SCH_003",
        "scheme_name": "Pradhan Mantri Ujjwala Yojana (PMUY)",
        "ministry": "Ministry of Petroleum and Natural Gas",
        "category": "Energy & LPG",
        "description": "A scheme aimed at providing clean cooking fuel like LPG to women from below poverty line (BPL) households, replacing unhealthy conventional cooking fuels.",
        "eligibility_min_age": 18,
        "eligibility_max_age": 120,
        "eligibility_gender": "Female",
        "eligibility_max_income": 200000,
        "eligibility_occupation": "All",
        "eligibility_caste": "All",
        "eligibility_disabled": "All",
        "benefits": "Financial support of INR 1,600 for each LPG connection, free first cylinder and hot plate.",
        "documents_required": "Aadhaar Card, BPL Ration Card, Bank Passbook, Passport Size Photograph",
        "application_mode": "Both"
    },
    {
        "scheme_id": "SCH_004",
        "scheme_name": "Sukanya Samriddhi Yojana (SSY)",
        "ministry": "Ministry of Women and Child Development",
        "category": "Financial Inclusion & Education",
        "description": "A small deposit scheme for a girl child launched as a part of the 'Beti Bachao Beti Padhao' campaign, offering high interest rates and tax exemptions.",
        "eligibility_min_age": 0,
        "eligibility_max_age": 10,
        "eligibility_gender": "Female",
        "eligibility_max_income": 9999999, # No limit
        "eligibility_occupation": "All",
        "eligibility_caste": "All",
        "eligibility_disabled": "All",
        "benefits": "High interest rate savings account, tax savings under Section 80C, and maturity payout for higher education or marriage.",
        "documents_required": "Birth Certificate of girl child, Aadhaar Card of parent/guardian, Address Proof, PAN Card of parent",
        "application_mode": "Offline"
    },
    {
        "scheme_id": "SCH_005",
        "scheme_name": "Pradhan Mantri Jan Dhan Yojana (PM-JDY)",
        "ministry": "Ministry of Finance",
        "category": "Financial Inclusion",
        "description": "National Mission for Financial Inclusion to ensure access to financial services, namely, basic savings & deposit accounts, remittance, credit, insurance, pension in an affordable manner.",
        "eligibility_min_age": 10,
        "eligibility_max_age": 120,
        "eligibility_gender": "All",
        "eligibility_max_income": 150000,
        "eligibility_occupation": "All",
        "eligibility_caste": "All",
        "eligibility_disabled": "All",
        "benefits": "Zero-balance savings account, RuPay Debit Card with built-in INR 2 Lakh accident insurance cover, and overdraft facility up to INR 10,000.",
        "documents_required": "Aadhaar Card, Voter ID, or PAN Card, Passport size photograph",
        "application_mode": "Offline"
    },
    {
        "scheme_id": "SCH_006",
        "scheme_name": "Prime Minister's Employment Generation Programme (PMEGP)",
        "ministry": "Ministry of Micro, Small and Medium Enterprises",
        "category": "Employment & Business",
        "description": "A credit-linked subsidy scheme for seting up micro-enterprises in non-farm sectors, helping generate employment opportunities in rural and urban areas.",
        "eligibility_min_age": 18,
        "eligibility_max_age": 45,
        "eligibility_gender": "All",
        "eligibility_max_income": 400000,
        "eligibility_occupation": "Unemployed, Farmer",
        "eligibility_caste": "All",
        "eligibility_disabled": "All",
        "benefits": "Subsidy ranging from 15% to 35% on bank loans for project costs up to INR 25 Lakhs (manufacturing) or INR 10 Lakhs (service sector).",
        "documents_required": "Aadhaar Card, Detailed Project Report (DPR), Educational Qualification Certificate, Caste Certificate (if claiming subsidy)",
        "application_mode": "Online"
    },
    {
        "scheme_id": "SCH_007",
        "scheme_name": "Post Matric Scholarship Scheme for SC Students",
        "ministry": "Ministry of Social Justice and Empowerment",
        "category": "Education",
        "description": "A centrally sponsored scheme that provides financial assistance to Scheduled Caste students studying at post-matriculation or post-secondary stages to enable them to complete their education.",
        "eligibility_min_age": 15,
        "eligibility_max_age": 25,
        "eligibility_gender": "All",
        "eligibility_max_income": 250000,
        "eligibility_occupation": "Student",
        "eligibility_caste": "SC",
        "eligibility_disabled": "All",
        "benefits": "Full tuition fee reimbursement and academic maintenance allowance paid directly to students' bank accounts.",
        "documents_required": "Caste Certificate, Income Certificate, Educational Marksheets, Aadhaar Card, Bank Account Details",
        "application_mode": "Online"
    },
    {
        "scheme_id": "SCH_008",
        "scheme_name": "Pradhan Mantri Street Vendor’s AtmaNirbhar Nidhi (PM SVANidhi)",
        "ministry": "Ministry of Housing and Urban Affairs",
        "category": "Employment & Business",
        "description": "A special micro-credit facility scheme for providing affordable working capital loans to street vendors to resume their livelihoods post COVID-19 lockdown.",
        "eligibility_min_age": 18,
        "eligibility_max_age": 120,
        "eligibility_gender": "All",
        "eligibility_max_income": 300000,
        "eligibility_occupation": "Street Vendor",
        "eligibility_caste": "All",
        "eligibility_disabled": "All",
        "benefits": "Collateral-free working capital loan of up to INR 10,000 for the first tranche, with interest subsidy of 7% per annum.",
        "documents_required": "Aadhaar Card, Voter Card, Certificate of Vending/Vendor ID Card, Bank Account Details",
        "application_mode": "Online"
    },
    {
        "scheme_id": "SCH_009",
        "scheme_name": "Indira Gandhi National Old Age Pension Scheme (IGNOAPS)",
        "ministry": "Ministry of Rural Development",
        "category": "Social Security & Pension",
        "description": "A non-contributory old age pension scheme that provides a monthly pension to senior citizens belonging to below poverty line (BPL) households.",
        "eligibility_min_age": 60,
        "eligibility_max_age": 120,
        "eligibility_gender": "All",
        "eligibility_max_income": 100000,
        "eligibility_occupation": "Unemployed, Daily Wage Worker",
        "eligibility_caste": "All",
        "eligibility_disabled": "All",
        "benefits": "Monthly pension of INR 200 for ages 60-79, and INR 500 for ages 80 and above.",
        "documents_required": "Age Proof Certificate, BPL Ration Card, Aadhaar Card, Bank Passbook",
        "application_mode": "Offline"
    },
    {
        "scheme_id": "SCH_010",
        "scheme_name": "Indira Gandhi National Disability Pension Scheme (IGNDPS)",
        "ministry": "Ministry of Rural Development",
        "category": "Social Security & Pension",
        "description": "Under this scheme, pension is provided to individuals aged between 18 and 79 years having severe or multiple disabilities (80% and above) belonging to BPL families.",
        "eligibility_min_age": 18,
        "eligibility_max_age": 79,
        "eligibility_gender": "All",
        "eligibility_max_income": 100000,
        "eligibility_occupation": "All",
        "eligibility_caste": "All",
        "eligibility_disabled": "True",
        "benefits": "Monthly pension support of INR 300 to help meet basic needs.",
        "documents_required": "Disability Certificate (minimum 80% disability), Age Proof, BPL Ration Card, Aadhaar Card, Bank Details",
        "application_mode": "Offline"
    },
    {
        "scheme_id": "SCH_011",
        "scheme_name": "Beti Bachao Beti Padhao (BBBP) Support",
        "ministry": "Ministry of Women and Child Development",
        "category": "Education & Social Welfare",
        "description": "A campaign and support system targeting gender-biased sex selective elimination, survival, protection, and education of the girl child.",
        "eligibility_min_age": 0,
        "eligibility_max_age": 18,
        "eligibility_gender": "Female",
        "eligibility_max_income": 9999999,
        "eligibility_occupation": "All",
        "eligibility_caste": "All",
        "eligibility_disabled": "All",
        "benefits": "Facilitation of girl education, non-monetary incentives, and local awareness campaigns including direct scholarship linkages.",
        "documents_required": "Aadhaar Card, Birth Certificate of Girl Child, Residence Proof",
        "application_mode": "Offline"
    },
    {
        "scheme_id": "SCH_012",
        "scheme_name": "Stand-Up India Scheme",
        "ministry": "Ministry of Finance",
        "category": "Employment & Business",
        "description": "A scheme designed to promote entrepreneurship at the grassroots level, specifically focusing on economic empowerment and job creation among women and SC/ST entrepreneurs.",
        "eligibility_min_age": 18,
        "eligibility_max_age": 120,
        "eligibility_gender": "Female", # (Evaluated as: Female or SC/ST caste)
        "eligibility_max_income": 9999999,
        "eligibility_occupation": "Unemployed, Farmer, Street Vendor, Daily Wage Worker",
        "eligibility_caste": "SC, ST",
        "eligibility_disabled": "All",
        "benefits": "Bank loan facility between INR 10 Lakhs and 1 Crore for setting up a greenfield enterprise in manufacturing, services, or trading sector.",
        "documents_required": "Aadhaar Card, Caste Certificate (if SC/ST), Income Certificate, Project Proposal, Bank Statement",
        "application_mode": "Online"
    },
    {
        "scheme_id": "SCH_013",
        "scheme_name": "Pradhan Mantri Awas Yojana - Gramin (PMAY-G)",
        "ministry": "Ministry of Rural Development",
        "category": "Housing",
        "description": "A social welfare program to provide clean, permanent housing with basic amenities to rural homeless or BPL households.",
        "eligibility_min_age": 18,
        "eligibility_max_age": 120,
        "eligibility_gender": "All",
        "eligibility_max_income": 180000,
        "eligibility_occupation": "Farmer, Daily Wage Worker, Unemployed",
        "eligibility_caste": "All",
        "eligibility_disabled": "All",
        "benefits": "Financial assistance of INR 1.2 Lakh (plains) or INR 1.3 Lakh (hilly areas) for constructing a housing unit.",
        "documents_required": "Aadhaar Card, Swachh Bharat Mission (SBM) ID, Bank Details, Income Certificate, Land ownership details",
        "application_mode": "Both"
    },
    {
        "scheme_id": "SCH_014",
        "scheme_name": "Pradhan Mantri Mudra Yojana (PMMY)",
        "ministry": "Ministry of Finance",
        "category": "Employment & Business",
        "description": "Provides micro-loans up to INR 10 Lakhs to non-corporate, non-farm small/micro enterprises to encourage self-employment.",
        "eligibility_min_age": 18,
        "eligibility_max_age": 120,
        "eligibility_gender": "All",
        "eligibility_max_income": 9999999,
        "eligibility_occupation": "Farmer, Daily Wage Worker, Street Vendor, Unemployed",
        "eligibility_caste": "All",
        "eligibility_disabled": "All",
        "benefits": "Loans categorised as Shishu (up to INR 50k), Kishor (50k to 5L), and Tarun (5L to 10L) with low-interest rates.",
        "documents_required": "Aadhaar Card, Business registration proof, Identity/Address proof of promoters, 6-months bank statement",
        "application_mode": "Online"
    },
    {
        "scheme_id": "SCH_015",
        "scheme_name": "Atal Pension Yojana (APY)",
        "ministry": "Ministry of Finance",
        "category": "Social Security & Pension",
        "description": "A pension scheme targeted at unorganised sector workers, offering guaranteed pension benefits based on voluntary monthly contributions.",
        "eligibility_min_age": 18,
        "eligibility_max_age": 40,
        "eligibility_gender": "All",
        "eligibility_max_income": 9999999,
        "eligibility_occupation": "Farmer, Student, Unemployed, Street Vendor, Daily Wage Worker, Private Sector Employee", # excludes Govt Employee
        "eligibility_caste": "All",
        "eligibility_disabled": "All",
        "benefits": "Co-contribution by government, and guaranteed minimum monthly pension of INR 1,000 to INR 5,000 post age 60.",
        "documents_required": "Aadhaar Card, Savings Bank Account, Mobile Number",
        "application_mode": "Offline"
    }
]

def load_external_schemes(existing_schemes):
    external_csv_path = r"C:\Users\KOMMINNIYASWANTH\.gemini\antigravity\brain\554fbc67-6de4-48af-8a53-9ff28ad23733\scratch\Schemes.csv"
    if not os.path.exists(external_csv_path):
        print(f"Warning: External CSV not found at {external_csv_path}. Skipping expansion.")
        return existing_schemes

    df = pd.read_csv(external_csv_path)
    
    # Track existing scheme names (lowercase) to avoid duplicates
    existing_names = {s["scheme_name"].strip().lower() for s in existing_schemes}
    
    next_id = len(existing_schemes) + 1
    new_schemes_list = list(existing_schemes)
    
    for _, row in df.iterrows():
        name = str(row["name"]).strip()
        if not name or name.lower() in existing_names:
            continue
            
        # Map values
        scheme_id = f"SCH_{next_id:03d}"
        
        # Ministry fallback
        ministry = str(row["ministry"]).strip()
        department = str(row["department"]).strip()
        state = str(row["state"]).strip()
        
        if not ministry or ministry == "nan":
            if department and department != "nan":
                if state and state != "nan" and state != "Central":
                    ministry = f"{department}, {state}"
                else:
                    ministry = department
            else:
                ministry = "Government of India" if state == "Central" else f"State Government of {state}"

        # Category
        category = str(row["category"]).strip()
        if not category or category == "nan":
            category = "General Welfare"
            
        # Description
        description = str(row["description"]).strip()
        if not description or description == "nan":
            description = f"Welfare scheme: {name}"

        # Age
        age_min = row["eligibility_age_min"]
        if pd.isna(age_min):
            age_min = 0
        else:
            age_min = int(age_min)
            
        age_max = row["eligibility_age_max"]
        if pd.isna(age_max):
            age_max = 120
        else:
            age_max = int(age_max)

        # Gender
        gender = str(row["eligibility_gender"]).strip().lower()
        if gender == "female":
            eligibility_gender = "Female"
        elif gender == "male":
            eligibility_gender = "Male"
        else:
            eligibility_gender = "All"

        # Max Income
        income_max = row["eligibility_income_max"]
        if pd.isna(income_max):
            eligibility_max_income = 9999999
        else:
            eligibility_max_income = int(income_max)

        # Occupation rule-based mapping
        name_lower = name.lower()
        desc_lower = description.lower()
        elig_text = str(row["eligibility_text"]).lower() if not pd.isna(row["eligibility_text"]) else ""
        
        occ_list = []
        if "farmer" in name_lower or "farmer" in desc_lower or "kisan" in name_lower or "agriculture" in name_lower:
            occ_list.append("Farmer")
        if "student" in name_lower or "student" in desc_lower or "scholarship" in name_lower or "fellowship" in name_lower:
            occ_list.append("Student")
        if "vendor" in name_lower or "vendor" in desc_lower or "hawker" in name_lower:
            occ_list.append("Street Vendor")
        if "laborer" in name_lower or "laborer" in desc_lower or "labourer" in name_lower or "daily wage" in desc_lower or "worker" in name_lower or "artisan" in name_lower or "weaver" in name_lower:
            occ_list.append("Daily Wage Worker")
        if "unemployed" in name_lower or "unemployed" in desc_lower or "job seeker" in desc_lower:
            occ_list.append("Unemployed")
            
        if not occ_list:
            eligibility_occupation = "All"
        else:
            eligibility_occupation = ", ".join(occ_list)

        # Caste mapping
        caste_raw = str(row["eligibility_caste"]).strip()
        caste_val = "All"
        if caste_raw and caste_raw != "nan" and caste_raw != "[]":
            try:
                # Parse caste list
                caste_list = json.loads(caste_raw)
                if isinstance(caste_list, list) and len(caste_list) > 0:
                    caste_val = ", ".join(caste_list)
            except Exception:
                try:
                    caste_list = ast.literal_eval(caste_raw)
                    if isinstance(caste_list, list) and len(caste_list) > 0:
                        caste_val = ", ".join(caste_list)
                except Exception:
                    pass
        eligibility_caste = caste_val

        # Disabled
        is_disabled = row["eligibility_disability"]
        if is_disabled is True or str(is_disabled).lower() == "true":
            eligibility_disabled = "True"
        else:
            eligibility_disabled = "All"

        # Benefits
        benefits = str(row["benefits"]).strip()
        if not benefits or benefits == "nan":
            benefits = "Welfare benefits as per scheme guidelines."

        # Documents required
        docs = str(row["documents_required"]).strip()
        if not docs or docs == "nan":
            docs = "Aadhaar Card, Identity Proof, Address Proof"

        # Application Mode
        app_proc = str(row["application_process"]).lower()
        if "online" in app_proc:
            app_mode = "Online"
        elif "offline" in app_proc:
            app_mode = "Offline"
        else:
            app_mode = "Both"

        new_scheme = {
            "scheme_id": scheme_id,
            "scheme_name": name,
            "ministry": ministry,
            "category": category,
            "description": description,
            "eligibility_min_age": age_min,
            "eligibility_max_age": age_max,
            "eligibility_gender": eligibility_gender,
            "eligibility_max_income": eligibility_max_income,
            "eligibility_occupation": eligibility_occupation,
            "eligibility_caste": eligibility_caste,
            "eligibility_disabled": eligibility_disabled,
            "benefits": benefits,
            "documents_required": docs,
            "application_mode": app_mode
        }
        
        new_schemes_list.append(new_scheme)
        existing_names.add(name.lower())
        next_id += 1
        
    return new_schemes_list

schemes = load_external_schemes(schemes)

# Write Schemes Data
with open(os.path.join("dataset", "schemes", "government_schemes.json"), "w", encoding="utf-8") as f:
    json.dump(schemes, f, indent=4)

with open(os.path.join("dataset", "schemes", "government_schemes.csv"), "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=schemes[0].keys())
    writer.writeheader()
    writer.writerows(schemes)


# 2. Programmatic Eligibility Evaluation
def check_eligibility(profile, scheme_id, scheme_dict=None):
    age = profile["age"]
    gender = profile["gender"]
    occupation = profile["occupation"]
    income = profile["annual_income"]
    caste = profile["caste"]
    disabled = profile["disabled"]
    area = profile["area_type"]
    state = profile["state"]

    if scheme_id == "SCH_001":  # PM-KISAN
        return age >= 18 and occupation == "Farmer" and income <= 300000
    elif scheme_id == "SCH_002":  # Ayushman Bharat PM-JAY
        return income <= 250000 and occupation in ["Farmer", "Daily Wage Worker", "Unemployed", "Street Vendor"]
    elif scheme_id == "SCH_003":  # PM-UY (Ujjwala Yojana)
        return age >= 18 and gender == "Female" and income <= 200000
    elif scheme_id == "SCH_004":  # Sukanya Samriddhi Yojana
        return age <= 10 and gender == "Female"
    elif scheme_id == "SCH_005":  # PM-JDY (Jan Dhan Yojana)
        return age >= 10 and income <= 150000
    elif scheme_id == "SCH_006":  # PMEGP
        return 18 <= age <= 45 and occupation in ["Unemployed", "Farmer"] and income <= 400000
    elif scheme_id == "SCH_007":  # Post Matric SC Scholarship
        return 15 <= age <= 25 and occupation == "Student" and caste == "SC" and income <= 250000
    elif scheme_id == "SCH_008":  # PM SVANidhi
        return age >= 18 and occupation == "Street Vendor" and income <= 300000
    elif scheme_id == "SCH_009":  # IGNOAPS (Old Age)
        return age >= 60 and occupation in ["Unemployed", "Daily Wage Worker"] and income <= 100000
    elif scheme_id == "SCH_010":  # IGNDPS (Disability)
        return age >= 18 and age <= 79 and disabled and income <= 100000
    elif scheme_id == "SCH_011":  # Beti Bachao Beti Padhao
        return age <= 18 and gender == "Female"
    elif scheme_id == "SCH_012":  # Stand-Up India
        # For females OR SC/ST caste, and non-government occupation
        is_target_group = (gender == "Female") or (caste in ["SC", "ST"])
        return age >= 18 and is_target_group and occupation in ["Unemployed", "Farmer", "Street Vendor", "Daily Wage Worker"]
    elif scheme_id == "SCH_013":  # PMAY-G
        return age >= 18 and occupation in ["Farmer", "Daily Wage Worker", "Unemployed"] and income <= 180000 and area == "Rural"
    elif scheme_id == "SCH_014":  # PM Mudra Yojana
        return age >= 18 and occupation in ["Farmer", "Daily Wage Worker", "Street Vendor", "Unemployed"]
    elif scheme_id == "SCH_015":  # Atal Pension Yojana
        return 18 <= age <= 40 and occupation != "Government Employee"

    # Generic evaluation for newly added schemes
    if scheme_dict is not None:
        # State check (state-specific schemes)
        s_state = scheme_dict.get("state", "Central")
        if s_state and s_state != "Central" and s_state != "All" and str(s_state).lower() != "nan":
            if state != s_state:
                return False

        # Age check
        if age < scheme_dict.get("eligibility_min_age", 0) or age > scheme_dict.get("eligibility_max_age", 120):
            return False
            
        # Gender check
        s_gender = scheme_dict.get("eligibility_gender", "All")
        if s_gender != "All" and gender != s_gender:
            return False
            
        # Income check
        if income > scheme_dict.get("eligibility_max_income", 9999999):
            return False
            
        # Occupation check
        s_occ = scheme_dict.get("eligibility_occupation", "All")
        if s_occ != "All":
            allowed_occs = [o.strip() for o in s_occ.split(",")]
            if occupation not in allowed_occs:
                return False
                
        # Caste check
        s_caste = scheme_dict.get("eligibility_caste", "All")
        if s_caste != "All":
            allowed_castes = [c.strip() for c in s_caste.split(",")]
            if caste not in allowed_castes:
                return False
                
        # Disability check
        s_disabled = scheme_dict.get("eligibility_disabled", "All")
        if s_disabled == "True" and not disabled:
            return False
            
        return True

    return False


# 3. Generate Citizen Profiles (10000 records)
random.seed(42)  # For reproducibility

occupations = ["Farmer", "Student", "Unemployed", "Street Vendor", "Daily Wage Worker", "Government Employee", "Private Sector Employee", "Fisherman", "Artisan", "Weaver"]
genders = ["Male", "Female", "Other"]
castes = ["General", "OBC", "SC", "ST"]
states = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
    "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
]
areas = ["Rural", "Urban"]

profiles = []
for i in range(1, 10001):
    citizen_id = f"CIT_{i:04d}"
    
    # We want realistic correlations, e.g., age vs occupation
    age = random.randint(5, 85)
    if age < 15:
        occupation = "Student"
    elif age < 23:
        occupation = random.choices(["Student", "Unemployed", "Daily Wage Worker"], weights=[0.7, 0.2, 0.1])[0]
    elif age > 65:
        occupation = random.choices(["Unemployed", "Farmer"], weights=[0.8, 0.2])[0]
    else:
        # 10 occupations: Farmer, Student, Unemployed, Street Vendor, Daily Wage Worker, Govt, Private, Fisherman, Artisan, Weaver
        occupation = random.choices(occupations, weights=[0.20, 0.05, 0.15, 0.10, 0.15, 0.05, 0.15, 0.05, 0.05, 0.05])[0]

    # Income distributions depending on occupation
    if occupation == "Student":
        income = random.randint(0, 50000)
    elif occupation == "Government Employee":
        income = random.randint(350000, 1200000)
    elif occupation == "Private Sector Employee":
        income = random.choices(
            [random.randint(150000, 300000), random.randint(300001, 800000), random.randint(800001, 1800000)],
            weights=[0.5, 0.4, 0.1]
        )[0]
    elif occupation in ["Farmer", "Fisherman", "Artisan", "Weaver"]:
        income = random.choices(
            [random.randint(20000, 100000), random.randint(100001, 250000), random.randint(250001, 500000)],
            weights=[0.6, 0.3, 0.1]
        )[0]
    else: # Unemployed, Street Vendor, Daily Wage Worker
        income = random.choices(
            [random.randint(15000, 75000), random.randint(75001, 180000), random.randint(180001, 250000)],
            weights=[0.6, 0.3, 0.1]
        )[0]

    gender = random.choices(genders, weights=[0.49, 0.49, 0.02])[0]
    caste = random.choices(castes, weights=[0.35, 0.4, 0.15, 0.1])[0]
    disabled = random.choices([True, False], weights=[0.03, 0.97])[0]
    state = random.choice(states)
    
    # Farmers, Daily Wage workers, Fishermen, Artisans, Weavers are more likely in rural areas
    if occupation in ["Farmer", "Daily Wage Worker", "Fisherman", "Artisan", "Weaver"]:
        area_type = random.choices(areas, weights=[0.85, 0.15])[0]
    elif occupation in ["Street Vendor", "Private Sector Employee", "Government Employee"]:
        area_type = random.choices(areas, weights=[0.2, 0.8])[0]
    else:
        area_type = random.choice(areas)

    profile = {
        "citizen_id": citizen_id,
        "age": age,
        "gender": gender,
        "occupation": occupation,
        "annual_income": income,
        "caste": caste,
        "disabled": disabled,
        "state": state,
        "area_type": area_type
    }

    # Programmatic Ground-truth computation
    eligible_list = []
    for s in schemes:
        if check_eligibility(profile, s["scheme_id"], s):
            eligible_list.append(s["scheme_id"])
    
    profile["eligible_schemes"] = ";".join(eligible_list)
    profiles.append(profile)

# Write Citizen Profiles Data
try:
    with open(os.path.join("dataset", "citizen_profiles", "citizen_profiles.json"), "w", encoding="utf-8") as f:
        json.dump(profiles, f, indent=4)
    with open(os.path.join("dataset", "citizen_profiles", "citizen_profiles.csv"), "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=profiles[0].keys())
        writer.writeheader()
        writer.writerows(profiles)
except PermissionError:
    print("Warning: citizen_profiles files are locked (probably open in Excel). Skipping profile write, but continuing query generation.")


# 4. Generate NLP Conversational Queries (1200+ instances in 6 languages)
languages = ["English", "Hindi", "Telugu", "Tamil", "Kannada", "Bengali"]

# Mappings of scheme short names for natural queries by language
scheme_aliases_by_lang = {
    "English": {
        "SCH_001": ["PM Kisan", "Kisan Samman Nidhi"],
        "SCH_002": ["Ayushman Bharat", "PM-JAY"],
        "SCH_003": ["Ujjwala Yojana", "free gas scheme"],
        "SCH_004": ["Sukanya Samriddhi", "girl child savings"],
        "SCH_005": ["Jan Dhan", "PMJDY account"],
        "SCH_006": ["PMEGP loan", "business loan scheme"],
        "SCH_007": ["SC Scholarship", "post matric scholarship"],
        "SCH_008": ["PM SVANidhi", "street vendor loan"],
        "SCH_009": ["Old Age Pension", "vridha pension"],
        "SCH_010": ["Disability Pension", "viklang pension"],
        "SCH_011": ["Beti Bachao", "girl child protection"],
        "SCH_012": ["Stand Up India", "women entrepreneur loan"],
        "SCH_013": ["PMAY Gramin", "rural housing scheme"],
        "SCH_014": ["Mudra Loan", "PMMY loan"],
        "SCH_015": ["Atal Pension", "APY scheme"]
    },
    "Hindi": {
        "SCH_001": ["पीएम किसान", "किसान सम्मान निधि"],
        "SCH_002": ["आयुष्मान भारत", "पीएम-जय"],
        "SCH_003": ["उज्ज्वला योजना", "फ्री गैस योजना"],
        "SCH_004": ["सुकन्या समृद्धि", "कन्या बचत योजना"],
        "SCH_005": ["जन धन खाता", "पीएमजेडीवाई खाता"],
        "SCH_006": ["पीएमईजीपी ऋण", "व्यवसाय ऋण योजना"],
        "SCH_007": ["एससी छात्रवृत्ति", "पोस्ट मैट्रिक छात्रवृत्ति"],
        "SCH_008": ["पीएम स्वनिधि", "रेहड़ी-पटरी विक्रेता ऋण"],
        "SCH_009": ["वृद्धावस्था पेंशन", "वृद्धा पेंशन"],
        "SCH_010": ["विकलांग पेंशन", "दिव्यांग पेंशन"],
        "SCH_011": ["बेटी बचाओ बेटी पढ़ाओ", "बालिका सुरक्षा"],
        "SCH_012": ["स्टैंड अप इंडिया", "महिला उद्यमी ऋण"],
        "SCH_013": ["पीएम आवास ग्रामीण", "ग्रामीण आवास योजना"],
        "SCH_014": ["मुद्रा ऋण", "पीएमएमवाई ऋण"],
        "SCH_015": ["अटल पेंशन योजना", "एपीवाई योजना"]
    },
    "Telugu": {
        "SCH_001": ["పిఎం కిసాన్", "కిసాన్ సమ్మాన్ నిధి"],
        "SCH_002": ["ఆయుష్మాన్ భారత్", "పిఎం-జేవై"],
        "SCH_003": ["ఉజ్వల యోజన", "ఉచిత గ్యాస్ పథకం"],
        "SCH_004": ["సుకన్య సమృద్ధి", "బాలికల పొదుపు పథకం"],
        "SCH_005": ["జన్ ధన్ ఖాతా", "పిఎంజెడివై పథకం"],
        "SCH_006": ["పిఎమ్‌ఇజిపి లోన్", "వ్యాపార రుణ పథకం"],
        "SCH_007": ["ఎస్సీ స్కాలర్‌షిప్", "పోస్ట్ మెట్రిక్ స్కాలర్‌షిప్"],
        "SCH_008": ["పిఎం స్వనిధి", "వీధి వ్యాపారుల రుణం"],
        "SCH_009": ["వృద్ధాప్య పెన్షన్", "వృద్ధుల పింఛను"],
        "SCH_010": ["వికలాంగుల పెన్షన్", "దివ్యాంగుల పింఛను"],
        "SCH_011": ["బేటీ బచావో", "బాలికా రక్షణ పథకం"],
        "SCH_012": ["స్టాండ్ అప్ ఇండియా", "మహిళా వ్యాపార రుణం"],
        "SCH_013": ["పిఎం ఆవాస్ గ్రామీణ", "గ్రామీణ గృహ నిర్మాణ పథకం"],
        "SCH_014": ["ముద్రా లోన్", "పిఎమ్‌ఎమ్‌వై రుణం"],
        "SCH_015": ["అటల్ పెన్షన్ యోజన", "ఏపీవై పథకం"]
    },
    "Tamil": {
        "SCH_001": ["பிஎம் கிசான்", "கிசான் சம்மான் நிதி"],
        "SCH_002": ["ஆயுஷ்மான் பாரத்", "பிஎம்-ஜேஏஒய்"],
        "SCH_003": ["உஜ்வாலா யோஜனா", "இலவச எரிவாயு திட்டம்"],
        "SCH_004": ["சுகன்யா சம்ரித்தி", "பெண் குழந்தை சேமிப்பு"],
        "SCH_005": ["ஜன்தன் கணக்கு", "பிஎம்ஜேடிஒய் திட்டம்"],
        "SCH_006": ["பி.எம்.இ.ஜி.பி கடன்", "தொழில் கடன் திட்டம்"],
        "SCH_007": ["எஸ்.சி உதவித்தொகை", "எஸ்.சி கல்வி உதவித்தொகை"],
        "SCH_008": ["பிஎம் ஸ்வநிதி", "தெரு வியாபாரிகள் கடன்"],
        "SCH_009": ["முதியோர் ஓய்வூதியம்", "முதியோர் பென்ஷன்"],
        "SCH_010": ["மாற்றுத்திறனாளி ஓய்வூதியம்", "ஊனமுற்றோர் பென்ஷன்"],
        "SCH_011": ["பெட்டி பச்சாவ்", "பெண் குழந்தைகள் பாதுகாப்பு"],
        "SCH_012": ["ஸ்டாண்ட் அப் இந்தியா", "பெண் தொழில்முனைவோர் கடன்"],
        "SCH_013": ["பிஎம் அவாஸ் கிராமின்", "கிராமப்புற வீட்டுவசதி திட்டம்"],
        "SCH_014": ["முத்ரா கடன்", "பிஎம்எம்ஒய் கடன்"],
        "SCH_015": ["அடல் பென்ஷன் திட்டம்", "ஏபிஒய் திட்டம்"]
    },
    "Kannada": {
        "SCH_001": ["ಪಿಎಂ ಕಿಸಾನ್", "ಕಿಸಾನ್ ಸಮ್ಮಾನ್ ನಿಧಿ"],
        "SCH_002": ["ಆಯುಷ್ಮಾನ್ ಭಾರತ್", "ಪಿಎಂ-ಜೆಎವೈ"],
        "SCH_003": ["ಉಜ್ವಲ ಯೋಜನೆ", "ಉಚಿತ ಗ್ಯಾಸ್ ಯೋಜನೆ"],
        "SCH_004": ["ಸುಕನ್ಯಾ ಸಮೃದ್ಧಿ", "ಹೆಣ್ಣು ಮಗುವಿನ ಉಳಿತಾಯ"],
        "SCH_005": ["ಜನ ಧನ್ ಖಾತೆ", "ಪಿಎಂಜೆಡಿವೈ ಯೋಜನೆ"],
        "SCH_006": ["ಪಿಎಂಇಜಿಪಿ ಸಾಲ", "ಉದ್ಯೋಗ ಸಾಲ ಯೋಜನೆ"],
        "SCH_007": ["ಎಸ್‌ಸಿ ಸ್ಕಾಲರ್‌ಶಿಪ್", "ಮೆಟ್ರಿಕ್ ನಂತರದ ವಿದ್ಯಾರ್ಥಿವೇತನ"],
        "SCH_008": ["ಪಿಎಂ ಸ್ವನಿಧಿ", "ಬೀದಿ ಬದಿ ವ್ಯಾಪಾರಿ ಸಾಲ"],
        "SCH_009": ["ವೃದ್ಧಾಪ್ಯ ವೇತನ", "ವೃದ್ಧಾಪ್ಯ ಪಿಂಚಣಿ"],
        "SCH_010": ["ವಿಕಲಚೇತನರ ವೇತನ", "ಅಂಗವಿಕಲರ ಪಿಂಚಣಿ"],
        "SCH_011": ["ಬೇಟಿ ಬಚಾವೋ", "ಹೆಣ್ಣು ಮಗುವಿನ ರಕ್ಷಣೆ"],
        "SCH_012": ["ಸ್ಟ್ಯಾಂಡ್ ಅಪ್ ಇಂಡಿಯಾ", "ಮಹಿಳಾ ಉದ್ಯಮಿ ಸಾಲ"],
        "SCH_013": ["ಪಿಎಂ ಆವಾಸ್ ಗ್ರಾಮೀಣ", "ಗ್ರಾಮೀಣ ವಸತಿ ಯೋಜನೆ"],
        "SCH_014": ["ಮುದ್ರಾ ಸಾಲ", "ಪಿಎಂಎಂವೈ ಸಾಲ"],
        "SCH_015": ["ಅಟಲ್ ಪಿಂಚಣಿ ಯೋಜನೆ", "ಎಪಿವಿ ಯೋಜನೆ"]
    },
    "Bengali": {
        "SCH_001": ["পিএম কিষাণ", "কিষাণ সম্মান নিধি"],
        "SCH_002": ["আয়ুষ্মান ভারত", "পিএম-জেএওয়াই"],
        "SCH_003": ["উজ্জ্বলা যোজনা", "বিনামূল্যে গ্যাস প্রকল্প"],
        "SCH_004": ["সুকন্যা সমৃদ্ধি", "কন্যা শিশু সঞ্চয় প্রকল্প"],
        "SCH_005": ["জন ধন অ্যাকাউন্ট", "পিএমজেডিওয়াই প্রকল্প"],
        "SCH_006": ["পিএমইজিপি ঋণ", "ব্যবসা ঋণ প্রকল্প"],
        "SCH_007": ["এসসি স্কলারশিপ", "পোস্ট ম্যাট্রিক স্কলারশিপ"],
        "SCH_008": ["পিএম স্বনিধি", "হকারদের ঋণ প্রকল্প"],
        "SCH_009": ["বার্ধক্য ভাতা", "বার্ধক্য পেনশন"],
        "SCH_010": ["প্রতিবন্ধী ভাতা", "প্রতিবন্ধী পেনশন"],
        "SCH_011": ["বেটি বাঁচাও", "কন্যা শিশু সুরক্ষা"],
        "SCH_012": ["স্ট্যান্ড আপ ইন্ডিয়া", "মহিলা উদ্যোক্তা ঋণ"],
        "SCH_013": ["পিএম আবাস গ্রামীণ", "গ্রামীণ আবাসন প্রকল্প"],
        "SCH_014": ["মুদ্রা ঋণ", "পিএমএমওয়াই ঋণ"],
        "SCH_015": ["অটল পেনশন যোজনা", "এপিওয়াই প্রকল্প"]
    }
}

# Dynamically add aliases for new schemes
for lang in languages:
    for s in schemes:
        s_id = s["scheme_id"]
        if s_id not in scheme_aliases_by_lang[lang]:
            scheme_aliases_by_lang[lang][s_id] = [s["scheme_name"]]


# Scheme Category aliases in local languages by language
category_aliases_by_lang = {
    "English": {
        "Agriculture": ["agriculture", "farming"],
        "Health": ["health", "medical care", "hospitalization benefits"],
        "Education": ["education", "post matric scholarship", "academic assistance"],
        "Financial Inclusion": ["financial inclusion", "banking services", "savings account"],
        "Social Security & Pension": ["social security", "old age pension", "disability pension"]
    },
    "Hindi": {
        "Agriculture": ["कृषि", "खेती"],
        "Health": ["स्वास्थ्य", "चिकित्सा सहायता", "अस्पताल लाभ"],
        "Education": ["शिक्षा", "छात्रवृत्ति", "पढ़ाई के लिए मदद"],
        "Financial Inclusion": ["वित्तीय समावेशन", "बैंकिंग सेवाएं", "बचत खाता"],
        "Social Security & Pension": ["सामाजिक सुरक्षा", "वृद्धावस्था पेंशन", "विकलांग पेंशन"]
    },
    "Telugu": {
        "Agriculture": ["వ్యవసాయం", "పంట సాగు"],
        "Health": ["ఆరోగ్యం", "వైద్య సహాయం", "ఆసుపత్రి ఖర్చులు"],
        "Education": ["చదువు", "స్కాలర్‌షిప్", "విద్యా సహాయం"],
        "Financial Inclusion": ["ఆర్థిక సేవల విస్తరణ", "బ్యాంకింగ్ సేవలు", "పొదుపు ఖాతా"],
        "Social Security & Pension": ["సామాజిక భద్రత", "వృద్ధాప్య పింఛను", "వికలాంగుల పింఛను"]
    },
    "Tamil": {
        "Agriculture": ["விவசாயம்", "பயிரிடுதல்"],
        "Health": ["சுகாதாரம்", "மருத்துவ உதவி", "மருத்துவமனை சலுகைகள்"],
        "Education": ["கல்வி", "உதவித்தொகை", "கல்வி உதவி"],
        "Financial Inclusion": ["நிதிச் சேர்க்கை", "வங்கி சேவைகள்", "சேமிப்புக் கணக்கு"],
        "Social Security & Pension": ["சமூக பாதுகாப்பு", "முதியோர் ஓய்வூதியம்", "மாற்றுத்திறனாளி ஓய்வூதியம்"]
    },
    "Kannada": {
        "Agriculture": ["ಕೃಷಿ", "ಬೇಸಾಯ"],
        "Health": ["ಆರೋಗ್ಯ", "ವೈದ್ಯಕೀಯ ನೆರವು", "ಆಸ್ಪತ್ರೆ ಸೌಲಭ್ಯಗಳು"],
        "Education": ["ಶಿಕ್ಷಣ", "ವಿದ್ಯಾರ್ಥಿವೇತನ", "ಶೈಕ್ಷಣಿಕ ನೆರವು"],
        "Financial Inclusion": ["ಹಣಕಾಸು ಸೇರ್ಪಡೆ", "ಬ್ಯಾಂಕಿಂಗ್ ಸೇವೆಗಳು", "ಉಳಿತಾಯ ಖಾತೆ"],
        "Social Security & Pension": ["ಸಾಮಾಜಿಕ ಭದ್ರತೆ", "ವೃದ್ಧಾಪ್ಯ ಪಿಂಚಣಿ", "ಅಂಗವಿಕಲರ ಪಿಂಚಣಿ"]
    },
    "Bengali": {
        "Agriculture": ["কৃষি", "চাষবাস"],
        "Health": ["স্বাস্থ্য", "চিকিৎসা পরিষেবা", "হাসপাতালের সুযোগ-সুবিধা"],
        "Education": ["শিক্ষা", "স্কলারশিপ", "শিক্ষাগত সহায়তা"],
        "Financial Inclusion": ["আর্থিক অন্তর্ভুক্তি", "ব্যাংকিং পরিষেবা", "সঞ্চয়ী অ্যাকাউন্ট"],
        "Social Security & Pension": ["সামাজিক নিরাপত্তা", "বার্ধক্য ভাতা", "প্রতিবন্ধী ভাতা"]
    }
}

# Intent templates per language
templates = {
    "English": {
        "check_eligibility": [
            "Am I eligible for {scheme}?",
            "Can a {age} year old {occupation} get benefits from {scheme}?",
            "I am a {gender} from {state} with income {income}, do I qualify for {scheme}?",
            "Does a disabled person qualify for {scheme}?",
            "Eligibility criteria for {scheme}?",
            "Who is eligible to apply for {scheme}?",
            "Can I apply for {scheme} if my age is {age}?",
            "Is {scheme} open for a {occupation} like me?",
            "I earn {income} annually. Can I get {scheme}?",
            "What are the qualifications required for {scheme}?",
            "I'm {gender}, {age} years old and living in {state}. Am I eligible for {scheme}?",
            "Is there any age limit to apply for {scheme}?",
            "Does {scheme} have any income criteria?",
            "Can a {occupation} from {state} get benefits under {scheme}?",
            "Will I qualify for {scheme} if I make {income} per year?"
        ],
        "scheme_inquiry": [
            "Tell me about {scheme}.",
            "What is the {scheme}?",
            "Information on {scheme} scheme.",
            "Can you explain the details of {scheme}?",
            "What are the benefits of {scheme}?",
            "What does the government offer under {scheme}?",
            "Can you give me a summary of {scheme}?",
            "What is the goal of {scheme}?",
            "How does {scheme} help citizens?",
            "Give me the details of {scheme}.",
            "Who launched the {scheme} and what is it about?",
            "What support do we get from {scheme}?",
            "I want to know more about {scheme}.",
            "Can you explain the benefits list for {scheme}?",
            "What kind of assistance is provided in {scheme}?"
        ],
        "how_to_apply": [
            "How can I apply for {scheme}?",
            "What is the application process of {scheme}?",
            "Where to submit forms for {scheme}?",
            "Is there an online portal for {scheme}?",
            "How do I register for {scheme} in {state}?",
            "Step by step guide to apply for {scheme}.",
            "Can I apply online for {scheme}?",
            "Where is the application form for {scheme} available?",
            "Who should I contact to apply for {scheme}?",
            "Is the registration online or offline for {scheme}?",
            "How to register for {scheme}?",
            "What are the steps to sign up for {scheme}?",
            "Where is the office to submit application for {scheme}?",
            "Can we apply for {scheme} via mobile?",
            "Process to register for {scheme}."
        ],
        "document_requirements": [
            "What documents are needed for {scheme}?",
            "Do I need an Aadhaar card for {scheme}?",
            "List of files to upload for {scheme}.",
            "What documents are required to apply for {scheme}?",
            "Do I need income certificate for {scheme}?",
            "What all certificates do I need for {scheme}?",
            "List the paperwork needed for {scheme}.",
            "Do we require caste certificate for {scheme}?",
            "Documents list for {scheme} application.",
            "Which proofs are mandatory for {scheme}?",
            "Do I need to submit bank details for {scheme}?",
            "What proofs should I upload for {scheme}?",
            "List of mandatory documents for {scheme}.",
            "What certificates are required for {scheme}?",
            "Do I need address proof for {scheme}?"
        ],
        "list_schemes_by_category": [
            "Show me schemes for {category}.",
            "Are there any government schemes for {category}?",
            "Find financial support for {category}.",
            "List of welfare schemes under {category}.",
            "What schemes help in {category}?",
            "I want schemes related to {category}.",
            "Give me a list of schemes for {category}.",
            "Show government initiatives for {category}.",
            "Is there any program helping in {category}?",
            "Welfare programs for {category}.",
            "List all schemes under the category {category}.",
            "Find schemes that cover {category}.",
            "What are the active schemes for {category}?",
            "Search for government support in {category}.",
            "Give me schemes under the {category} sector."
        ],
        "greet": [
            "Hello JanMitra!",
            "Hi, help me find a government scheme.",
            "Good morning.",
            "Namaste",
            "Hey",
            "Hello there!",
            "Can you help me?",
            "Good afternoon.",
            "Hi JanMitra",
            "Yo"
        ]
    },
    "Hindi": {
        "check_eligibility": [
            "क्या मैं {scheme} के लिए पात्र हूँ?",
            "क्या {age} साल का {occupation} {scheme} का लाभ ले सकता है?",
            "मैं {state} से एक {gender} हूँ और मेरी आय {income} है, क्या मैं {scheme} के लिए योग्य हूँ?",
            "क्या विकलांग व्यक्ति {scheme} के लिए आवेदन कर सकता है?",
            "क्या {scheme} के लिए कोई योग्यता नियम हैं?",
            "कौन-कौन {scheme} के लिए आवेदन कर सकता है?",
            "क्या {age} वर्ष की आयु में {scheme} के लिए आवेदन संभव है?",
            "क्या {scheme} मुझ जैसे {occupation} के लिए उपलब्ध है?",
            "मेरी सालाना आय {income} है, क्या मुझे {scheme} मिल सकता है?",
            "क्या {scheme} के लिए कोई आय सीमा है?",
            "क्या {state} का कोई {occupation} {scheme} का लाभ उठा सकता है?",
            "अगर मेरी वार्षिक आय {income} है तो क्या मैं योग्य हूँ?",
            "क्या {scheme} के लिए कोई आयु सीमा है?",
            "क्या {gender} उम्मीदवार {scheme} के लिए पात्र हैं?",
            "क्या {state} के निवासियों के लिए {scheme} उपलब्ध है?"
        ],
        "scheme_inquiry": [
            "मुझे {scheme} के बारे में बताएं।",
            "{scheme} क्या है?",
            "{scheme} योजना की जानकारी चाहिए।",
            "क्या आप {scheme} का विवरण समझा सकते हैं?",
            "{scheme} से क्या फायदा होता है?",
            "सरकार {scheme} के तहत क्या प्रदान करती है?",
            "क्या आप मुझे {scheme} का संक्षिप्त विवरण दे सकते हैं?",
            "{scheme} का मुख्य उद्देश्य क्या है?",
            "{scheme} नागरिकों की कैसे मदद करता है?",
            "मुझे {scheme} के बारे में पूरी जानकारी दीजिए।",
            "{scheme} किसने शुरू किया और यह किस बारे में है?",
            "{scheme} से हमें क्या सहायता मिलती है?",
            "मैं {scheme} के बारे में और जानना चाहता हूँ।",
            "क्या आप {scheme} के लाभों की सूची बता सकते हैं?",
            "{scheme} में किस प्रकार की वित्तीय मदद मिलती है?"
        ],
        "how_to_apply": [
            "{scheme} के लिए कैसे आवेदन करें?",
            "{scheme} की आवेदन प्रक्रिया क्या है?",
            "{scheme} के फॉर्म कहां जमा करने हैं?",
            "क्या {scheme} के लिए कोई ऑनलाइन पोर्टल है?",
            "मैं {state} में {scheme} के लिए पंजीकरण कैसे करूँ?",
            "{scheme} में आवेदन करने के चरण क्या हैं?",
            "क्या मैं {scheme} के लिए ऑनलाइन फॉर्म भर सकता हूँ?",
            "{scheme} का आवेदन पत्र कहां मिलेगा?",
            "{scheme} के लिए किससे संपर्क करना चाहिए?",
            "क्या {scheme} का रजिस्ट्रेशन ऑनलाइन होता है या ऑफलाइन?",
            "{scheme} के लिए पंजीकरण कैसे करें?",
            "{scheme} में शामिल होने की प्रक्रिया क्या है?",
            "{scheme} का फॉर्म जमा करने का कार्यालय कहां है?",
            "क्या मोबाइल से {scheme} के लिए आवेदन किया जा सकता है?",
            "{scheme} की पंजीकरण प्रक्रिया समझाएं।"
        ],
        "document_requirements": [
            "{scheme} के लिए कौन से दस्तावेजों की आवश्यकता है?",
            "क्या {scheme} के लिए आधार कार्ड जरूरी है?",
            "{scheme} के लिए अपलोड की जाने वाली फाइलों की सूची।",
            "{scheme} आवेदन के लिए क्या कागजात चाहिए?",
            "क्या {scheme} के लिए आय प्रमाण पत्र की आवश्यकता है?",
            "{scheme} के लिए मुझे कौन-से प्रमाण पत्र चाहिए?",
            "{scheme} के लिए आवश्यक कागजातों की सूची दें।",
            "क्या {scheme} के लिए जाति प्रमाण पत्र की जरूरत है?",
            "आवेदन के लिए दस्तावेजों की सूची क्या है?",
            "{scheme} के लिए कौन-कौन से आईडी प्रूफ चाहिए?",
            "क्या बैंक विवरण जमा करना अनिवार्य है?",
            "{scheme} के लिए क्या-क्या दस्तावेज अपलोड करने होंगे?",
            "अनिवार्य दस्तावेजों की सूची बताएं।",
            "क्या पते का प्रमाण पत्र जरूरी है?",
            "{scheme} के लिए जरूरी कागजात क्या हैं?"
        ],
        "list_schemes_by_category": [
            "मुझे {category} के लिए योजनाएं दिखाएं।",
            "क्या {category} के लिए कोई सरकारी योजना है?",
            "{category} में सरकारी मदद कैसे पाएं?",
            "{category} के अंतर्गत कल्याणकारी योजनाओं की सूची।",
            "{category} से संबंधित कौन सी योजनाएं हैं?",
            "मुझे {category} से जुड़ी सरकारी योजनाएं चाहिए।",
            "{category} के लिए सभी सरकारी स्कीमों की लिस्ट दें।",
            "क्या {category} के विकास के लिए कोई योजना है?",
            "{category} क्षेत्र में सरकार की क्या पहल है?",
            "{category} कल्याण कार्यक्रम कौन-से हैं?",
            "{category} वर्ग में चल रही योजनाओं की सूची दिखाएं।",
            "{category} के लिए कौन-सी वित्तीय योजनाएं सक्रिय हैं?",
            "सरकार द्वारा {category} के लिए क्या सहायता दी जा रही है?",
            "{category} से संबंधित योजनाओं की खोज करें।",
            "मुझे {category} सेक्टर की योजनाएं बताएं।"
        ],
        "greet": [
            "नमस्ते जनमित्र!",
            "हैलो, मुझे सरकारी योजना ढूंढने में मदद करें।",
            "शुभ प्रभात।",
            "प्रणाम",
            "राम राम",
            "हैलो!",
            "क्या आप मेरी मदद कर सकते हैं?",
            "नमस्कार",
            "नमस्ते",
            "जय श्री राम"
        ]
    },
    "Telugu": {
        "check_eligibility": [
            "నేను {scheme} పథకానికి అర్హుడినా?",
            "{age} సంవత్సరాల వయస్సు ఉన్న {occupation} {scheme} పొందవచ్చా?",
            "నేను {state} నుండి {gender}, నా వార్షిక ఆదాయం {income}. నేను {scheme} కి అర్హుడినా?",
            "వికలాంగులు {scheme} కి దరఖాస్తు చేసుకోవచ్చా?",
            "{scheme} పథకానికి కావలసిన అర్హతలు ఏమిటి?",
            "ఎవరెవరు {scheme} కోసం దరఖాస్తు చేసుకోవచ్చు?",
            "{age} సంవత్సరాల వయసులో {scheme} కి అప్లై చేయవచ్చా?",
            "నాలాంటి {occupation} కి {scheme} వర్తిస్తుందా?",
            "నా వార్షిక ఆదాయం {income}, నాకు {scheme} వస్తుందా?",
            "{scheme} పథకానికి ఆదాయ పరిమితి ఉందా?",
            "{state} కి చెందిన {occupation} కి {scheme} లభిస్తుందా?",
            "నా వార్షిక ఆదాయం {income} ఉంటే అర్హుడినా?",
            "{scheme} పథకానికి వయస్సు పరిమితి ఉందా?",
            "{gender} అభ్యర్థులు {scheme} కి అర్హులేనా?",
            "{state} నివాసితులకు {scheme} అందుబాటులో ఉందా?"
        ],
        "scheme_inquiry": [
            "నాకు {scheme} గురించి చెప్పండి.",
            "{scheme} అంటే ఏమిటి?",
            "{scheme} పథకం వివరాలు కావాలి.",
            "మీరు {scheme} గురించి కొంచెం వివరిస్తారా?",
            "{scheme} వల్ల ఉపయోగాలు ఏమిటి?",
            "{scheme} కింద ప్రభుత్వం ఏమి అందిస్తుంది?",
            "{scheme} గురించి సంక్షిప్త సమాచారం ఇవ్వగలరా?",
            "{scheme} యొక్క ముఖ్య ఉద్దేశ్యం ఏమిటి?",
            "{scheme} పౌరులకు ఎలా సహాయపడుతుంది?",
            "{scheme} గురించి పూర్తి వివరాలు చెప్పండి.",
            "{scheme} ని ఎవరు ప్రారంభించారు, దీని విశిష్టత ఏంటి?",
            "{scheme} ద్వారా లభించే ప్రయోజనాలు ఏమిటి?",
            "నేను {scheme} గురించి మరింత తెలుసుకోవాలనుకుంటున్నాను.",
            "{scheme} లాభాల జాబితాను వివరించగలరా?",
            "{scheme} కింద ఎలాంటి ఆర్థిక సహాయం లభిస్తుంది?"
        ],
        "how_to_apply": [
            "{scheme} కి ఎలా దరఖాస్తు చేయాలి?",
            "{scheme} అప్లికేషన్ ప్రాసెస్ ఏంటి?",
            "{scheme} దరఖాస్తు ఫారమ్ ఎక్కడ ఇవ్వాలి?",
            "{scheme} కి ఆన్‌లైన్ పోర్టల్ ఉందా?",
            "{state} లో {scheme} కి రిజిస్టర్ చేసుకోవడం ఎలా?",
            "{scheme} పథకానికి అప్లై చేయడానికి గల దశలు ఏమిటి?",
            "నేను {scheme} కి ఆన్‌లైన్‌లో అప్లై చేసుకోవచ్చా?",
            "{scheme} అప్లికేషన్ ఫారమ్ ఎక్కడ లభిస్తుంది?",
            "{scheme} కొరకు ఎవరిని సంప్రదించాలి?",
            "{scheme} రిజిస్ట్రేషన్ ఆన్‌లైన్‌లో ఉంటుందా లేక ఆఫ్‌లైన్‌లోనా?",
            "{scheme} కి ఎలా నమోదు చేసుకోవాలి?",
            "{scheme} లో చేరే విధానం ఏమిటి?",
            "{scheme} ఫారమ్ సమర్పించడానికి కార్యాలయం ఎక్కడ ఉంది?",
            "మొబైల్ ద్వారా {scheme} కి అప్లై చేయవచ్చా?",
            "{scheme} రిజిస్ట్రేషన్ ప్రాసెస్ వివరించండి."
        ],
        "document_requirements": [
            "{scheme} పథకానికి ఏయే పత్రాలు కావాలి?",
            "{scheme} కి ఆధార్ కార్డు తప్పనిసరా?",
            "{scheme} దరఖాస్తుకు కావలసిన డాక్యుమెంట్ల లిస్ట్.",
            "{scheme} అప్లై చేయడానికి ఏ సర్టిఫికెట్లు కావాలి?",
            "{scheme} కోసం ఇన్కమ్ సర్టిఫికెట్ అవసరమా?",
            "{scheme} పథకానికి ఏయే రుజువులు సమర్పించాలి?",
            "కావలసిన పత్రాల పూర్తి వివరాలు ఇవ్వండి.",
            "{scheme} పథకానికి కుల ధృవీకరణ పత్రం అవసరమా?",
            "దరఖాస్తుకు అవసరమైన డాక్యుమెంట్ల జాబితా ఏంటి?",
            "ఏయే గుర్తింపు కార్డులు సమర్పించాలి?",
            "బ్యాంకు ఖాతా వివరాలు ఇవ్వడం తప్పనిసరా?",
            "{scheme} దరఖాస్తుకు ఏమేమి అప్‌లోడ్ చేయాలి?",
            "ఖచ్చితంగా కావాల్సిన డాక్యుమెంట్లు ఏమిటి?",
            "చిరునామా ధృవీకరణ పత్రం అవసరమా?",
            "{scheme} కి అవసరమైన ముఖ్యమైన పేపర్లు ఏమిటి?"
        ],
        "list_schemes_by_category": [
            "{category} కి సంబంధించిన పథకాలు చూపించండి.",
            "ప్రభుత్వం {category} కోసం ఏవైనా పథకాలు ప్రవేశపెట్టిందా?",
            "{category} లో సహాయపడే ప్రభుత్వ పథకాలు ఏమిటి?",
            "{category} విభాగంలోని సంక్షేమ పథకాల జాబితా.",
            "{category} కి ఎలాంటి సహాయం లభిస్తుంది?",
            "నాకు {category} కి సంబంధించిన పథకాలు కావాలి.",
            "{category} కి సంబంధించిన అన్ని పథకాల లిస్ట్ ఇవ్వండి.",
            "{category} అభివృద్ధి కోసం ఏవైనా పథకాలు ఉన్నాయా?",
            "{category} రంగంలో ప్రభుత్వం తీసుకున్న చర్యలు ఏమిటి?",
            "{category} సంక్షేమ కార్యక్రమాలు ఏమిటి?",
            "{category} విభాగంలో నడుస్తున్న పథకాల జాబితా చూపండి.",
            "{category} కి ఎలాంటి ఆర్థిక పథకాలు అందుబాటులో ఉన్నాయి?",
            "ప్రభుత్వం {category} కి ఎలాంటి సహాయం అందిస్తోంది?",
            "{category} కి సంబంధించిన పథకాలను వెతకండి.",
            "{category} రంగానికి సంబంధించిన పథకాల గురించి చెప్పండి."
        ],
        "greet": [
            "నమస్కారం జన్మిత్ర!",
            "హలో, నాకు ప్రభుత్వ పథకం కనుగొనడంలో సహాయపడండి.",
            "శుభోదయం.",
            "హాయ్",
            "నమస్తే",
            "నమస్కారం!",
            "నాకు సహాయం చేయగలరా?",
            "హలో జన్మిత్ర",
            "బాగున్నారా",
            "హాయ్ జన్మిత్ర"
        ]
    },
    "Tamil": {
        "check_eligibility": [
            "நான் {scheme} திட்டத்திற்கு தகுதியானவரா?",
            "{age} வயதுடைய {occupation} {scheme} திட்டத்தின் பலன்களைப் பெற முடியுமா?",
            "நான் {state} ஐ சேர்ந்த {gender}, என் வருமானம் {income}, நான் {scheme} க்கு தகுதியானவரா?",
            "மாற்றுத்திறனாளிகள் {scheme} க்கு தகுதி உடையவர்களா?",
            "{scheme} திட்டத்திற்கான தகுதி வரம்புகள் என்ன?",
            "யாரெல்லாம் {scheme} திட்டத்திற்கு விண்ணப்பிக்க முடியும்?",
            "{age} வயதில் {scheme} திட்டத்திற்கு விண்ணப்பிக்கலாமா?",
            "என்னை போன்ற {occupation} நபருக்கு {scheme} பொருந்துமா?",
            "என் வருமானம் ஆண்டுக்கு {income}, எனக்கு {scheme} கிடைக்குமா?",
            "{scheme} திட்டத்திற்கு வருமான வரம்பு ஏதேனும் உள்ளதா?",
            "{state} மாநிலத்தைச் சேர்ந்த {occupation} நபருக்கு {scheme} கிடைக்குமா?",
            "எனது ஆண்டு வருமானம் {income} ஆக இருந்தால் நான் தகுதியானவரா?",
            "{scheme} திட்டத்திற்கு வயது வரம்பு உள்ளதா?",
            "{gender} விண்ணப்பதாரர்கள் {scheme} திட்டத்திற்கு தகுதியானவர்களா?",
            "{state} குடியிருப்பாளர்களுக்கு {scheme} திட்டம் உள்ளதா?"
        ],
        "scheme_inquiry": [
            "{scheme} பற்றி எனக்குச் சொல்லுங்கள்.",
            "{scheme} என்றால் என்ன?",
            "{scheme} திட்டம் பற்றிய தகவல் வேண்டும்.",
            "{scheme} திட்டத்தின் விவரங்களை விளக்க முடியுமா?",
            "{scheme} திட்டத்தின் பயன்கள் என்ன?",
            "அரசு {scheme} திட்டத்தின் கீழ் என்ன வழங்குகிறது?",
            "{scheme} திட்டத்தைப் பற்றிய சுருக்கமான தகவலைத் தர முடியுமா?",
            "{scheme} திட்டத்தின் முக்கிய நோக்கம் என்ன?",
            "{scheme} குடிமக்களுக்கு எவ்வாறு உதவுகிறது?",
            "{scheme} பற்றிய முழு விவரங்களையும் எனக்குத் தரவும்.",
            "{scheme} திட்டத்தை யார் தொடங்கினார்கள், அதன் சிறப்பம்சம் என்ன?",
            "{scheme} திட்டத்தின் மூலம் கிடைக்கும் சலுகைகள் என்ன?",
            "நான் {scheme} பற்றி மேலும் அறிய விரும்புகிறேன்.",
            "{scheme} திட்டத்தின் பலன்களின் பட்டியலை விளக்க முடியுமா?",
            "{scheme} திட்டத்தின் கீழ் என்ன வகையான உதவி வழங்கப்படுகிறது?"
        ],
        "how_to_apply": [
            "{scheme} திட்டத்திற்கு எவ்வாறு விண்ணப்பிப்பது?",
            "{scheme} திட்டத்தின் விண்ணப்ப செயல்முறை என்ன?",
            "{scheme} விண்ணப்ப படிவங்களை எங்கு சமர்ப்பிக்க வேண்டும்?",
            "{scheme} திட்டத்திற்கு ஆன்லைன் போர்டல் உள்ளதா?",
            "{state} இல் {scheme} திட்டத்திற்கு எப்படி பதிவு செய்வது?",
            "{scheme} திட்டத்திற்கு விண்ணப்பிப்பதற்கான வழிமுறைகள் என்னென்ன?",
            "நான் {scheme} திட்டத்திற்கு ஆன்லைனில் விண்ணப்பிக்கலாமா?",
            "{scheme} திட்டத்தின் விண்ணப்பப் படிவம் எங்கு கிடைக்கும்?",
            "{scheme} திட்டத்திற்கு யாரைத் தொடர்பு கொள்ள வேண்டும்?",
            "{scheme} திட்டத்தின் பதிவு ஆன்லைனிலா அல்லது ஆஃப்லைனிலா?",
            "{scheme} திட்டத்திற்கு எவ்வாறு பதிவு செய்வது?",
            "{scheme} திட்டத்தில் சேரும் முறை என்ன?",
            "{scheme} விண்ணப்பத்தை சமர்ப்பிக்க அலுவலகம் எங்கு உள்ளது?",
            "கைபேசி மூலம் {scheme} திட்டத்திற்கு விண்ணப்பிக்க முடியுமா?",
            "{scheme} திட்டத்தின் பதிவு செயல்முறையை விளக்குங்கள்."
        ],
        "document_requirements": [
            "{scheme} திட்டத்திற்கு என்னென்ன ஆவணங்கள் தேவை?",
            "{scheme} திட்டத்திற்கு ஆதார் அட்டை தேவையா?",
            "{scheme} திட்டத்திற்கு பதிவேற்ற வேண்டிய கோப்புகளின் பட்டியல்.",
            "{scheme} திட்டத்திற்கு விண்ணப்பிக்க என்ன சான்றிதழ்கள் வேண்டும்?",
            "{scheme} திட்டத்திற்கு வருமான சான்றிதழ் தேவையா?",
            "{scheme} திட்டத்திற்கு என்னென்ன சான்றுகளை சமர்ப்பிக்க வேண்டும்?",
            "தேவையான ஆவணங்களின் முழுமையான பட்டியலைத் தரவும்.",
            "{scheme} திட்டத்திற்கு சாதிச் சான்றிதழ் தேவையா?",
            "விண்ணப்பத்திற்குத் தேவையான ஆவணங்களின் பட்டியல் என்ன?",
            "என்னென்ன அடையாள அட்டைகளை சமர்ப்பிக்க வேண்டும்?",
            "வங்கி கணக்கு விவரங்களை வழங்குவது கட்டாயமா?",
            "{scheme} விண்ணப்பத்திற்கு எதையெல்லாம் பதிவேற்ற வேண்டும்?",
            "கண்டிப்பாகத் தேவையான ஆவணங்கள் யாவை?",
            "முகவரிச் சான்று தேவையா?",
            "{scheme} திட்டத்திற்குத் தேவையான முக்கியமான ஆவணங்கள் என்ன?"
        ],
        "list_schemes_by_category": [
            "{category} திட்டங்களை எனக்குக் காட்டுங்கள்.",
            "{category} மேம்பாட்டிற்காக அரசு திட்டங்கள் ஏதேனும் உள்ளதா?",
            "{category} பிரிவில் அரசு வழங்கும் உதவிகள் என்ன?",
            "{category} பிரிவின் கீழ் உள்ள நலத்திட்டங்களின் பட்டியல்.",
            "{category} சார்ந்த திட்டங்கள் என்னென்ன?",
            "எனக்கு {category} சார்ந்த திட்டங்கள் தேவை.",
            "{category} தொடர்பான அனைத்து திட்டங்களின் பட்டியலைத் தரவும்.",
            "{category} வளர்ச்சிக்கான திட்டங்கள் ஏதேனும் உள்ளதா?",
            "{category} துறையில் அரசு எடுத்துள்ள நடவடிக்கைகள் என்ன?",
            "{category} நலத்திட்டங்கள் யாவை?",
            "{category} பிரிவில் செயல்படும் திட்டங்களின் பட்டியலைக் காட்டுங்கள்.",
            "{category} பிரிவிற்கு என்னென்ன நிதி உதவி திட்டங்கள் உள்ளன?",
            "அரசு {category} பிரிவிற்கு என்ன உதவி வழங்குகிறது?",
            "{category} தொடர்பான திட்டங்களைத் தேடுங்கள்.",
            "{category} துறை சார்ந்த திட்டங்களைப் பற்றிச் சொல்லுங்கள்."
        ],
        "greet": [
            "வணக்கம் ஜன்மித்ரா!",
            "ஹலோ, அரசு திட்டங்களை கண்டறிய எனக்கு உதவுங்கள்.",
            "காலை வணக்கம்.",
            "வணக்கம்",
            "ஹாய்",
            "வணக்கம்!",
            "எனக்கு உதவ முடியுமா?",
            "ஹலோ ஜன்மித்ரா",
            "நலமா",
            "ஹாய் ஜன்மித்ரா"
        ]
    },
    "Kannada": {
        "check_eligibility": [
            "ನಾನು {scheme} ಯೋಜನೆಗೆ అర్హనే?",
            "{age} ವರ್ಷದ {occupation} {scheme} ಯೋಜನೆಯ ಲಾಭ ಪಡೆಯಬಹುದೇ?",
            "ನಾನು {state} ನಿಂದ ಬಂದ {gender}, ನನ್ನ ಆದಾಯ {income}, ನನಗೆ {scheme} ಸಿಗುತ್ತದೆಯೇ?",
            "ವಿಕಲಚೇತನರು {scheme} ಯೋಜನೆಗೆ ಅರ್ಹರೇ?",
            "{scheme} ಯೋಜನೆಯ ಅರ್ಹತಾ ನಿಯಮಗಳು ಯಾವುವು?",
            "ಯಾರೆಲ್ಲಾ {scheme} ಯೋಜನೆಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದು?",
            "{age} ವರ್ಷ ವಯಸ್ಸಿನಲ್ಲಿ {scheme} ಯೋಜನೆಗೆ ಅಪ್ಲೈ ಮಾಡಬಹುದೇ?",
            "ನನ್ನಂತಹ {occupation} ಗೆ {scheme} ಅನ್ವಯಿಸುತ್ತದೆಯೇ?",
            "ನನ್ನ ವಾರ್ಷಿಕ ಆದಾಯ {income}, ನನಗೆ {scheme} ಸಿಗುತ್ತದೆಯೇ?",
            "{scheme} ಯೋಜನೆಗೆ ಆದಾಯ ಮಿತಿ ಇದೆಯೇ?",
            "{state} ನ {occupation} ಗೆ {scheme} ಸಿಗುತ್ತದೆಯೇ?",
            "ನನ್ನ ವಾರ್ಷಿಕ ಆದಾಯ {income} ಇದ್ದರೆ ನಾನು ಅರ್ಹನೇ?",
            "{scheme} ಯೋಜನೆಗೆ ವಯಸ್ಸಿನ ಮಿತಿ ಇದೆಯೇ?",
            "{gender} ಅಭ್ಯರ್ಥಿಗಳು {scheme} ಯೋಜನೆಗೆ ಅರ್ಹರೇ?",
            "{state} ನಿವಾಸಿಗಳಿಗೆ {scheme} ಲಭ್ಯವಿದೆಯೇ?"
        ],
        "scheme_inquiry": [
            "{scheme} ಯೋಜನೆಯ ಬಗ್ಗೆ ತಿಳಿಸಿ.",
            "{scheme} ಎಂದರೇನು?",
            "{scheme} ಯೋಜನೆಯ ಮಾಹಿತಿ ಬೇಕು.",
            "{scheme} ಯೋಜನೆಯ ವಿವರಗಳನ್ನು ವಿವರಿಸಬಹುದೇ?",
            "{scheme} ಯೋಜನೆಯಿಂದ ಏನು ಲಾಭ?",
            "ಸರ್ಕಾರವು {scheme} ಯೋಜನೆಯಡಿ ಏನು ನೀಡುತ್ತದೆ?",
            "{scheme} ಯೋಜನೆಯ ಬಗ್ಗೆ ಸಂಕ್ಷಿಪ್ತ ಮಾಹಿತಿ ನೀಡಬಲ್ಲಿರಾ?",
            "{scheme} ಯೋಜನೆಯ ಮುಖ್ಯ ಉದ್ದೇಶವೇನು?",
            "{scheme} ನಾಗರಿಕರಿಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ?",
            "{scheme} ಯೋಜನೆಯ ಸಂಪೂರ್ಣ ವಿವರಗಳನ್ನು ನೀಡಿ.",
            "{scheme} ಯಾರು ಪ್ರಾರಂಭಿಸಿದರು ಮತ್ತು ಇದರ ವಿಶೇಷತೆ ಏನು?",
            "{scheme} ಯೋಜನೆಯ ಮೂಲಕ ಸಿಗುವ ಸೌಲಭ್ಯಗಳು ಯಾವುವು?",
            "ನಾನು {scheme} ಯೋಜನೆಯ ಬಗ್ಗೆ ಹೆಚ್ಚಿನ ಮಾಹಿತಿ ಪಡೆಯಲು ಬಯಸುತ್ತೇನೆ.",
            "{scheme} ಲಾಭಗಳ ಪಟ್ಟಿಯನ್ನು ವಿವರಿಸಬಹುದೇ?",
            "{scheme} ಅಡಿಯಲ್ಲಿ ಎಂತಹ ಆರ್ಥಿಕ ನೆರವು ಸಿಗುತ್ತದೆ?"
        ],
        "how_to_apply": [
            "{scheme} ಯೋಜನೆಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸುವುದು ಹೇಗೆ?",
            "{scheme} ಯೋಜನೆಯ ಅರ್ಜಿ ಪ್ರಕ್ರಿಯೆ ಏನು?",
            "{scheme} ಅರ್ಜಿಯನ್ನು ಎಲ್ಲಿ ಸಲ್ಲಿಸಬೇಕು?",
            "{scheme} ಯೋಜನೆಗೆ ಆನ್‌ಲೈನ್ ಲಿಂಕ್ ಇದೆಯೇ?",
            "{state} ನಲ್ಲಿ {scheme} ಗೆ ನೋಂದಾಯಿಸುವುದು ಹೇಗೆ?",
            "{scheme} ಯೋಜನೆಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಇರುವ ಹಂತಗಳೇನು?",
            "ನಾನು {scheme} ಯೋಜನೆಗೆ ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಅಪ್ಲೈ ಮಾಡಬಹುದೇ?",
            "{scheme} ಅರ್ಜಿ ನಮೂನೆ ಎಲ್ಲಿ ದೊರೆಯುತ್ತದೆ?",
            "{scheme} ಯೋಜನೆಗಾಗಿ ಯಾರನ್ನು ಸಂಪರ್ಕಿಸಬೇಕು?",
            "{scheme} ನೋಂದಣಿ ಆನ್‌ಲೈನ್‌ನಲ್ಲಿರುತ್ತದೆಯೇ ಅಥವಾ ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿರುತ್ತದೆಯೇ?",
            "{scheme} ಗೆ ನೋಂದಾಯಿಸುವುದು ಹೇಗೆ?",
            "{scheme} ಯೋಜನೆಗೆ ಸೇರುವ ವಿಧಾನವೇನು?",
            "{scheme} ಫಾರ್ಮ್ ಸಲ್ಲಿಸಲು ಕಚೇರಿ ಎಲ್ಲಿದೆ?",
            "ಮೊಬೈಲ್ ಮೂಲಕ {scheme} ಗೆ ಅಪ್ಲೈ ಮಾಡಬಹುದೇ?",
            "{scheme} ನೋಂದಣಿ ಪ್ರಕ್ರಿಯೆಯನ್ನು ವಿವರಿಸಿ."
        ],
        "document_requirements": [
            "{scheme} ಯೋಜನೆಗೆ ಯಾವ ದಾಖಲೆಗಳು ಬೇಕು?",
            "{scheme} ಗೆ ಆಧಾರ್ ಕಾರ್ಡ್ ಬೇಕೇ?",
            "{scheme} ಗೆ ಅಪ್‌ಲೋಡ್ ಮಾಡಬೇಕಾದ ಫೈಲ್‌ಗಳ ಪಟ್ಟಿ.",
            "{scheme} ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಏನೆಲ್ಲಾ ದಾಖಲೆಗಳು ಇರಬೇಕು?",
            "{scheme} ಯೋಜನೆಗೆ ಆದಾಯ ಪ್ರಮಾಣ ಪತ್ರ ಬೇಕೇ?",
            "{scheme} ಯೋಜನೆಗೆ ಯಾವ ಪುರಾವೆಗಳನ್ನು ಸಲ್ಲಿಸಬೇಕು?",
            "ಬೇಕಾಗುವ ದಾಖಲೆಗಳ ಸಂಪೂರ್ಣ ವಿವರ ನೀಡಿ.",
            "{scheme} ಯೋಜನೆಗೆ ಜಾತಿ ಪ್ರಮಾಣ ಪತ್ರ ಅಗತ್ಯವೇ?",
            "ಅರ್ಜಿಗೆ ಅಗತ್ಯವಿರುವ ದಾಖಲೆಗಳ ಪಟ್ಟಿ ಏನು?",
            "ಯಾವ ಗುರುತಿನ ಚೀಟಿಗಳನ್ನು ಸಲ್ಲಿಸಬೇಕು?",
            "ಬ್ಯಾಂಕ್ ಖಾತೆ ವಿವರಗಳನ್ನು ನೀಡುವುದು ಕಡ್ಡಾಯವೇ?",
            "{scheme} ಅರ್ಜಿಗೆ ಏನೇನನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಬೇಕು?",
            "ಖಂಡಿತವಾಗಿಯೂ ಬೇಕಾಗುವ ದಾಖಲೆಗಳು ಯಾವುವು?",
            "ವಿಳಾಸದ ಪುರಾವೆ ಬೇಕೇ?",
            "{scheme} ಯೋಜನೆಗೆ ಬೇಕಾಗುವ ಪ್ರಮುಖ ದಾಖಲೆಗಳು ಯಾವುವು?"
        ],
        "list_schemes_by_category": [
            "{category} ಯೋಜನೆಗಳನ್ನು ನನಗೆ ತೋರಿಸಿ.",
            "{category} ಗೆ ಸಂಬಂಧಿಸಿದಂತೆ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಇವೆಯೇ?",
            "{category} ಕ್ಷೇತ್ರದಲ್ಲಿ ಸರ್ಕಾರರಿಂದ ಯಾವ ಸಹಾಯ ಸಿಗುತ್ತದೆ?",
            "{category} ಅಡಿಯಲ್ಲಿ ಬರುವ ಯೋಜನೆಗಳ ಪಟ್ಟಿ.",
            "{category} ಇಲಾಖೆಯ ಯೋಜನೆಗಳು ಯಾವುವು?",
            "ನನಗೆ {category} ಗೆ ಸಂಬಂಧಿಸಿದ ಯೋಜನೆಗಳು ಬೇಕು.",
            "{category} ಗೆ ಸಂಬಂಧಿಸಿದ ಎಲ್ಲಾ ಯೋಜನೆಗಳ ಪಟ್ಟಿ ನೀಡಿ.",
            "{category} ಅಭಿವೃದ್ಧಿಗಾಗಿ ಯಾವುದಾದರೂ ಯೋಜನೆ ಇದೆಯೇ?",
            "{category} ಕ್ಷೇತ್ರದಲ್ಲಿ ಸರ್ಕಾರ ಕೈಗೊಂಡ ಕ್ರಮಗಳೇನು?",
            "{category} ಕಲ್ಯಾಣ ಕಾರ್ಯಕ್ರಮಗಳು ಯಾವುವು?",
            "{category} ವಿಭಾಗದಲ್ಲಿ ನಡೆಯುತ್ತಿರುವ ಯೋಜನೆಗಳ ಪಟ್ಟಿ ತೋರಿಸಿ.",
            "{category} ಗೆ ಎಂತಹ ಆರ್ಥಿಕ ಯೋಜನೆಗಳು ಲಭ್ಯವಿವೆ?",
            "ಸರ್ಕಾರವು {category} ಗೆ ಎಂತಹ ನೆರವು ನೀಡುತ್ತಿದೆ?",
            "{category} ಗೆ ಸಂಬಂಧಿಸಿದ ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಿ.",
            "{category} ವಿಭಾಗದ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ತಿಳಿಸಿ."
        ],
        "greet": [
            "ನಮಸ್ಕಾರ ಜನಮಿತ್ರ!",
            "ಹಲೋ, ಸರ್ಕಾರಿ ಯೋಜನೆ ಹುಡುಕಲು ಸಹಾಯ ಮಾಡಿ.",
            "ಶುಭೋದಯ.",
            "ನಮಸ್ತೆ",
            "ಹಾಯ್",
            "ನಮಸ್ಕಾರ!",
            "ನನಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲಿರಾ?",
            "ಹಲೋ ಜನಮಿತ್ರ",
            "ಹೇಗಿದ್ದೀರಾ",
            "ಹಾಯ್ ಜನಮಿತ್ರ"
        ]
    },
    "Bengali": {
        "check_eligibility": [
            "আমি কি {scheme} এর জন্য যোগ্য?",
            "কোন {age} বছরের {occupation} কি {scheme} এর সুবিধা পেতে পারে?",
            "আমি {state} এর একজন {gender}, আমার আয় {income}, আমি কি {scheme} এর যোগ্য?",
            "প্রতিবন্ধী ব্যক্তিরা কি {scheme} আবেদন করতে পারেন?",
            "{scheme} এর যোগ্যতার নিয়মাবলী কি?",
            "কারা কারা {scheme} এর জন্য আবেদন করতে পারবেন?",
            "{age} বছর বয়সে কি {scheme} এর জন্য আবেদন করা যায়?",
            "আমার মতো একজন {occupation} কি {scheme} এর সুবিধা পাবে?",
            "আমার বার্ষিক আয় {income}, আমি কি {scheme} পাব?",
            "{scheme} এর জন্য কি কোনো আয়ের সীমা আছে?",
            "কি {state} এর কোনো {occupation} {scheme} এর সুবিধা পেতে পারেন?",
            "আমার বার্ষিক আয় যদি {income} হয়, তবে কি আমি যোগ্য?",
            "{scheme} এর জন্য কি কোনো বয়সের সীমা আছে?",
            "কি {gender} প্রার্থীরা {scheme} এর জন্য যোগ্য?",
            "কি {state} এর বাসিন্দাদের জন্য {scheme} উপলব্ধ?"
        ],
        "scheme_inquiry": [
            "আমাকে {scheme} সম্পর্কে বলুন।",
            "{scheme} কি?",
            "{scheme} প্রকল্পের বিবরণ প্রয়োজন।",
            "আপনি কি {scheme} এর খুঁটিনাটি বোঝাতে পারেন?",
            "{scheme} এর মাধ্যমে কি কি সুবিধা পাওয়া যায়?",
            "সরকার {scheme} এর অধীনে কি প্রদান করে?",
            "আপনি কি আমাকে {scheme} এর সংক্ষিপ্ত বিবরণ দিতে পারেন?",
            "{scheme} এর মূল উদ্দেশ্য কি?",
            "{scheme} নাগরিকদের কিভাবে সাহায্য করে?",
            "আমাকে {scheme} সম্পর্কে সম্পূর্ণ তথ্য দিন।",
            "কে {scheme} চালু করেছেন এবং এটি কি সম্পর্কিত?",
            "{scheme} থেকে আমরা কি কি সুবিধা পাই?",
            "আমি {scheme} সম্পর্কে আরও জানতে চাই।",
            "আপনি কি {scheme} এর সুবিধার তালিকাটি ব্যাখ্যা করতে পারেন?",
            "{scheme} এর অধীনে কি ধরণের আর্থিক সহায়তা দেওয়া হয়?"
        ],
        "how_to_apply": [
            "{scheme} এর জন্য কিভাবে আবেদন করব?",
            "{scheme} আবেদন করার পদ্ধতি কি?",
            "{scheme} ফর্ম কোথায় জমা দিতে হবে?",
            "কিভাবে {scheme} এর অনলাইন पोर्टल ব্যবহার করব?",
            "আমি {state} এ {scheme} এর জন্য কিভাবে নাম নথিভুক্ত করব?",
            "{scheme} এ আবেদন করার ধাপগুলি কি কি?",
            "আমি কি {scheme} এর জন্য অনলাইনে ফর্ম ফিলাপ করতে পারি?",
            "{scheme} এর আবেদনপত্র কোথায় পাব?",
            "{scheme} এর জন্য কার সাথে যোগাযোগ করতে হবে?",
            "{scheme} এর রেজিস্ট্রেশন অনলাইনে হয় নাকি অফলাইনে?",
            "{scheme} এর জন্য কিভাবে নাম নথিভুক্ত করব?",
            "{scheme} প্রকল্পে যোগদানের নিয়ম কি?",
            "{scheme} এর ফর্ম জমা দেওয়ার অফিসটি কোথায়?",
            "মোবাইল দিয়ে কি {scheme} এর আবেদন করা সম্ভব?",
            "{scheme} এর রেজিস্ট্রেশন প্রসেসটি বুঝিয়ে বলুন।"
        ],
        "document_requirements": [
            "{scheme} এর জন্য কি কি নথি লাগবে?",
            "{scheme} এর জন্য কি আধার कार्ड বাধ্যতামূলক?",
            "{scheme} এর জন্য প্রয়োজনীয় দলিলের তালিকা।",
            "{scheme} আবেদন করতে কি কি সার্টিফিকেট লাগবে?",
            "আমার কি {scheme} এর জন্য আয়ের সার্টিফিকেট লাগবে?",
            "{scheme} এর জন্য আমাকে কোন কোন প্রমাণপত্র জমা দিতে হবে?",
            "প্রয়োজনীয় নথিপত্রের সম্পূর্ণ বিবরণ দিন।",
            "{scheme} এর জন্য কি জাতিগত শংসাপত্র প্রয়োজন?",
            "আবেদনের জন্য প্রয়োজনীয় নথির তালিকা কি?",
            "কি কি পরিচয়পত্র জমা দিতে হবে?",
            "ব্যাংক অ্যাকাউন্টের বিবরণ দেওয়া কি বাধ্যতামূলক?",
            "{scheme} আবেদনের জন্য কি কি আপলোড করতে হবে?",
            "অবশ্যই প্রয়োজনীয় কাগজপত্রগুলি কি কি?",
            "ঠিকানার প্রমাণপত্র কি প্রয়োজন?",
            "{scheme} এর জন্য প্রয়োজনীয় গুরুত্বপূর্ণ কাগজপত্রগুলি কি কি?"
        ],
        "list_schemes_by_category": [
            "আমাকে {category} এর প্রকল্পগুলি দেখান।",
            "{category} এর জন্য কোনো সরকারি যোজনা আছে কি?",
            "{category} এর অধীনে সরকারি সাহায্য পাওয়ার উপায় কি?",
            "{category} এর অন্তর্গত সমস্ত কল্যাণমূলক প্রকল্পের তালিকা।",
            "{category} সম্পর্কিত কি কি স্কিম রয়েছে?",
            "আমার {category} সম্পর্কিত যোজনাগুলি প্রয়োজন।",
            "{category} সম্পর্কিত সমস্ত প্রকল্পের তালিকা দিন।",
            "{category} এর উন্নয়নের জন্য কি কোনো যোজনা আছে?",
            "{category} ক্ষেত্রে সরকারের কি উদ্যোগ রয়েছে?",
            "{category} কল্যাণমূলক কর্মসূচিগুলি কি কি?",
            "{category} বিভাগে কি কি যোজনা চলছে তা দেখান।",
            "{category} এর জন্য কি কি আর্থিক সাহায্য উপলব্ধ আছে?",
            "সরকার {category} এর জন্য কি সাহায্য দিচ্ছে?",
            "{category} সম্পর্কিত যোজনাগুলি খুঁজুন।",
            "{category} বিভাগের যোজনাগুলি সম্পর্কে বলুন।"
        ],
        "greet": [
            "নমস্কার জনমিত্র!",
            "হ্যালো, আমাকে একটি সরকারি প্রকল্প খুঁজতে সাহায্য করুন।",
            "সুপ্রভাত।",
            "নমস্কার",
            "হাই",
            "নমস্কার!",
            "আমাকে সাহায্য করতে পারেন?",
            "হ্যালো জনমিত্র",
            "কেমন আছেন",
            "হাই জনমিত্র"
        ]
    }
}

# Generate 1,200 unique queries (200 per language)
queries = []
query_counter = 1

occupations_map = {
    "English": ["farmer", "student", "unemployed youth", "street vendor", "daily wage worker"],
    "Hindi": ["किसान", "छात्र", "बेरोजगार", "सड़क विक्रेता", "मजदूर"],
    "Telugu": ["రైతు", "విద్యార్థి", "నిరుద్యోగి", "వీధి వ్యాపారి", "రోజువారీ కూలీ"],
    "Tamil": ["விவசாயி", "மாணவர்", "வேலையில்லாதவர்", "தெரு வியாபாரி", "தினக்கூலி"],
    "Kannada": ["ರೈತ", "ವಿದ್ಯಾರ್ಥಿ", "ನಿರುದ್ಯೋಗಿ", "ಬೀದಿ ಬದಿ ವ್ಯಾಪಾರಿ", "ದಿನಗೂಲಿ ನೌಕರ"],
    "Bengali": ["কৃষক", "ছাত্র", "বেকার", "হকার", "দিনমজুর"]
}

genders_map = {
    "English": ["male", "female", "woman"],
    "Hindi": ["पुरुष", "महिला", "स्त्री"],
    "Telugu": ["పురుషుడు", "మహిళ", "స్త్రీ"],
    "Tamil": ["ஆண்", "பெண்", "பெண்மணி"],
    "Kannada": ["ಪುರುಷ", "ಮಹಿಳೆ", "ಸ್ತ್ರೀ"],
    "Bengali": ["पुरुष", "মহিলা", "স্ত্রী"]
}

states_map = {
    "English": ["Andhra Pradesh", "Telangana", "Tamil Nadu", "Uttar Pradesh", "West Bengal"],
    "Hindi": ["आंध्र प्रदेश", "तेलंगाना", "तमिलनाडु", "उत्तर प्रदेश", "पश्चिम बंगाल"],
    "Telugu": ["ఆంధ్రప్రదేశ్", "తెలంగాణ", "తమిళనాడు", "ఉత్తరప్రదేశ్", "పశ్చిమ బెంగాల్"],
    "Tamil": ["ஆந்திரப் பிரதேசம்", "தெலுங்கானா", "தமிழ்நாடு", "உத்தரப் பிரதேசம்", "மேற்கு வங்காளம்"],
    "Kannada": ["ಆಂಧ್ರ ಪ್ರದೇಶ", "ತೆಲಂಗಾಣ", "ತಮಿಳುನಾಡು", "ಉತ್ತರ ಪ್ರದೇಶ", "ಪಶ್ಚಿಮ ಬಂಗಾಳ"],
    "Bengali": ["অন্ধ্রপ্রদেশ", "তেলেঙ্গানা", "তামিলনাড়ু", "উত্তরপ্রদেশ", "পশ্চিমবঙ্গ"]
}

# Generate about 1000 queries for each language
for lang in languages:
    lang_templates = templates[lang]
    intents_list = list(lang_templates.keys())
    
    # Generate 1000 records for the current language
    for _ in range(1000):
        intent = random.choice(intents_list)
        template = random.choice(lang_templates[intent])
        
        # Select random metadata to fill placeholders
        scheme_obj = random.choice(schemes)
        scheme_id = scheme_obj["scheme_id"]
        scheme_alias = random.choice(scheme_aliases_by_lang[lang][scheme_id])
        
        # Get language specific mappings
        occ = random.choice(occupations_map[lang])
        gend = random.choice(genders_map[lang])
        st = random.choice(states_map[lang])
        inc = random.choices(["50,000", "1,20000", "2,50,000", "4,00,000"], weights=[0.4, 0.4, 0.15, 0.05])[0]
        age = random.choices([random.randint(18, 25), random.randint(26, 50), random.randint(60, 80)], weights=[0.3, 0.5, 0.2])[0]
        
        # For category search
        cat_id = random.choice(list(category_aliases_by_lang[lang].keys()))
        cat_alias = random.choice(category_aliases_by_lang[lang][cat_id])
        
        # Build Entities dictionary
        entities = {}
        
        # Fill placeholders in template
        query_text = template
        if "{scheme}" in query_text:
            query_text = query_text.replace("{scheme}", scheme_alias)
            entities["scheme_name"] = scheme_obj["scheme_name"]
            entities["scheme_id"] = scheme_id
        if "{age}" in query_text:
            query_text = query_text.replace("{age}", str(age))
            entities["age"] = age
        if "{occupation}" in query_text:
            query_text = query_text.replace("{occupation}", occ)
            entities["occupation"] = occ
        if "{gender}" in query_text:
            query_text = query_text.replace("{gender}", gend)
            entities["gender"] = gend
        if "{state}" in query_text:
            query_text = query_text.replace("{state}", st)
            entities["state"] = st
        if "{income}" in query_text:
            query_text = query_text.replace("{income}", f"Rs {inc}")
            entities["income"] = inc
        if "{category}" in query_text:
            query_text = query_text.replace("{category}", cat_alias)
            entities["scheme_category"] = cat_id

        query_record = {
            "query_id": f"QRY_{query_counter:04d}",
            "query_text": query_text,
            "language": lang,
            "intent": intent,
            "entities": json.dumps(entities, ensure_ascii=False)
        }
        
        queries.append(query_record)
        query_counter += 1

# Write NLP Queries Data
with open(os.path.join("dataset", "conversational_nlp", "intent_entity_queries.json"), "w", encoding="utf-8") as f:
    json.dump(queries, f, indent=4, ensure_ascii=False)

with open(os.path.join("dataset", "conversational_nlp", "intent_entity_queries.csv"), "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=queries[0].keys())
    writer.writeheader()
    writer.writerows(queries)

print("Dataset generation process successfully completed!")
print(f"Total Schemes: {len(schemes)}")
print(f"Total Citizen Profiles: {len(profiles)}")
print(f"Total Conversational Queries: {len(queries)}")
