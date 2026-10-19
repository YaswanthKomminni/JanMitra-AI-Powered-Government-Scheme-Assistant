-- ====================================================================
-- JanMitra (JanMithra) AI Government Scheme Assistant Database Setup
-- Compatible with MySQL 8.0+ and MySQL Workbench
-- Connection Name: JanMithra
-- ====================================================================

-- 1. Create and Select Database
CREATE DATABASE IF NOT EXISTS JanMithra
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE JanMithra;

-- 2. Non-destructive setup
-- This script never drops tables or deletes data. It is safe to re-run.
-- After running it, ALWAYS apply the migrations in database/migrations/
-- (or run `npm run db:setup` from frontend/, which does both).
-- The old version of this script dropped every table and seeded demo
-- farmer logins with the plaintext password "1234"; both were removed.

-- ====================================================================
-- 3. Users Table (Farmers / Rural Citizens for Login & Signup)
-- ====================================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(100) NULL,
    password_hash VARCHAR(255) NULL, -- bcrypt hash only, never plaintext
    role VARCHAR(20) DEFAULT 'farmer',
    state VARCHAR(60) DEFAULT 'Telangana',
    district VARCHAR(60) DEFAULT 'Rangareddy',
    village VARCHAR(100) DEFAULT 'Kothur Gramam',
    land_size_acres DECIMAL(5,2) DEFAULT 3.50,
    soil_type VARCHAR(50) DEFAULT 'black_soil',
    irrigation_type VARCHAR(50) DEFAULT 'drip',
    primary_crops VARCHAR(255) DEFAULT 'Cotton, Chilli, Red Gram',
    annual_income_slab VARCHAR(50) DEFAULT 'Below ₹2.5 Lakhs',
    preferred_language VARCHAR(10) DEFAULT 'en',
    verified_docs_count INT DEFAULT 1,
    avatar_url VARCHAR(500) DEFAULT 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone),
    INDEX idx_state (state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 4. Government Schemes Table (Knowledge Base)
-- ====================================================================
CREATE TABLE IF NOT EXISTS schemes (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    match_score INT DEFAULT 90,
    subsidy_amount VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    benefits TEXT NOT NULL,
    eligibility_summary TEXT NOT NULL,
    documents_required JSON NOT NULL,
    department VARCHAR(255) NOT NULL,
    tag_color VARCHAR(100) DEFAULT 'bg-emerald-100 text-emerald-800 border-emerald-300',
    application_mode VARCHAR(20) DEFAULT 'both',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 5. Document Verifications Table (AI Vision OCR Extracted Data)
-- ====================================================================
CREATE TABLE IF NOT EXISTS document_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    doc_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    confidence_score DECIMAL(4,2) DEFAULT 0.95,
    extracted_data JSON NOT NULL,
    preview_url VARCHAR(500) NULL,
    status VARCHAR(30) DEFAULT 'verified',
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 6. Peer Success Stories Table (PostGIS / Geospatial Network)
-- ====================================================================
CREATE TABLE IF NOT EXISTS peer_success_stories (
    id VARCHAR(50) PRIMARY KEY,
    farmer_name VARCHAR(100) NOT NULL,
    distance_km DECIMAL(5,2) NOT NULL,
    village VARCHAR(100) NOT NULL,
    land_type VARCHAR(100) NOT NULL,
    crops_grown VARCHAR(100) NOT NULL,
    scheme_id VARCHAR(50) NOT NULL,
    scheme_name VARCHAR(255) NOT NULL,
    outcome_summary TEXT NOT NULL,
    yield_increase_pct INT DEFAULT 0,
    subsidy_received VARCHAR(100) NOT NULL,
    implementation_date VARCHAR(50) NOT NULL,
    contact_allowed BOOLEAN DEFAULT TRUE,
    contact_phone VARCHAR(20) NOT NULL,
    avatar_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_distance (distance_km)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 7. Chat Logs Table (Conversational History & Multilingual Queries)
-- ====================================================================
CREATE TABLE IF NOT EXISTS chat_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    sender ENUM('user', 'ai') NOT NULL,
    message_text TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_chat (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================================
-- 8. Users
-- No demo accounts are seeded. Farmers create their own accounts through
-- the Sign Up form; passwords are stored only as bcrypt hashes.
-- ====================================================================

-- ====================================================================
-- 9. Seed Schemes Knowledge Base
-- ====================================================================
INSERT IGNORE INTO schemes (id, code, name, category, category_name, match_score, subsidy_amount, description, benefits, eligibility_summary, documents_required, department, tag_color, application_mode) VALUES
('SCH_KUSUM', 'PM-KUSUM-B', 'PM-KUSUM Solar Water Pump Subsidy', 'solar', 'Solar & Energy', 98, '60% Subsidy (Up to ₹1,42,000)', 
 'Install 3HP to 7.5HP standalone solar agricultural pumps with 60% government subsidy, eliminating diesel and high grid electricity bills.',
 'Zero power bill for irrigation, 25-year solar panel life warranty, 30% state subsidy + 30% central subsidy.',
 'Landowners with borewell or open well, dryland/black soil eligible, priority for small & marginal farmers.',
 '["Pahani / Patta Land Deed", "Aadhaar Card", "Bank Passbook", "Borewell / Water Source Certificate"]',
 'Ministry of New and Renewable Energy', 'bg-amber-100 text-amber-800 border-amber-300', 'online'),

('SCH_KISAN', 'PM-KISAN', 'PM-KISAN Samman Nidhi Yojana', 'subsidy', 'Direct Financial Support', 95, '₹6,000 / Year in 3 Installments',
 'Flagship central government initiative providing assured annual financial assistance of ₹6,000 in three equal installments directly to bank accounts via DBT.',
 'Direct bank transfer (₹2,000 every 4 months) to support input purchases like seeds, manure, and fertilizers before sowing season.',
 'All cultivable landholding farmer families with land records updated in State revenue portals.',
 '["Aadhaar Card linked with Mobile", "Updated Land Record (Khata/Pahani)", "Bank Account with e-KYC verified"]',
 'Ministry of Agriculture & Farmers Welfare', 'bg-emerald-100 text-emerald-800 border-emerald-300', 'both'),

('SCH_FASAL', 'PMFBY', 'Pradhan Mantri Fasal Bima Yojana (PMFBY)', 'insurance', 'Crop Insurance', 92, 'Full Crop Loss Cover (Only 1.5% Premium)',
 'Comprehensive financial support against unexpected crop loss due to non-preventable natural risks (drought, flood, unseasonal hail, pests).',
 'Farmers pay only 2% premium for Kharif crops, 1.5% for Rabi food/oilseeds; government absorbs remaining 80-90% premium cost.',
 'All farmers growing notified crops in notified areas (both loanee and non-loanee farmers).',
 '["Land Ownership Deed / Sowing Certificate", "Aadhaar Card", "Bank Passbook Copy", "Crop Sowing Declaration"]',
 'Ministry of Agriculture & Farmers Welfare', 'bg-blue-100 text-blue-800 border-blue-300', 'both'),

('SCH_SOIL', 'SHC-2024', 'National Soil Health Card Scheme', 'soil', 'Soil Testing & Fertilizer', 89, '100% Free Soil Test & Micronutrient Kit',
 'Government-sponsored scientific laboratory analysis of your field\'s soil profile covering 12 critical macro and micronutrients.',
 'Stop over-fertilizing! Get custom fertilizer dosage guidance per crop to save up to ₹4,000/acre on DAP/Urea and boost yield.',
 'Available to any farmer owning or leasing cultivable land.',
 '["Land Record / Survey Number", "Farmer Mobile Number", "Soil Sample (Collected by Village Officer)"]',
 'Department of Agriculture & Cooperation', 'bg-stone-100 text-stone-800 border-stone-300', 'offline'),

('SCH_KCC', 'KCC-LOAN', 'Kisan Credit Card (KCC) Low-Interest Credit', 'credit', 'Credit & Loans', 86, 'Up to ₹3 Lakh Loan at 4% Interest',
 'Simplified bank credit facility offering timely credit for cultivation expenses, crop maintenance, and post-harvest storage at heavily subsidized interest rates.',
 'Effective interest rate of only 4% per annum upon prompt repayment (3% Prompt Repayment Incentive by Central Govt).',
 'Individual/joint borrowers who are owner cultivators, tenant farmers, or sharecroppers.',
 '["Duly filled Application Form", "Identity & Address Proof (Aadhaar/Voter ID)", "Land Records certified by Revenue Official"]',
 'Reserve Bank of India & NABARD', 'bg-purple-100 text-purple-800 border-purple-300', 'both');

-- ====================================================================
-- 10. Seed Nearby Peer Farmers (PostGIS / Geospatial Network)
-- ====================================================================
INSERT IGNORE INTO peer_success_stories (id, farmer_name, distance_km, village, land_type, crops_grown, scheme_id, scheme_name, outcome_summary, yield_increase_pct, subsidy_received, implementation_date, contact_allowed, contact_phone, avatar_url) VALUES
('peer_01', 'Rameshwar Reddy', 3.80, 'Kothur, Mandal Rangareddy', '3.0 Acres • Black Soil', 'Cotton & Red Gram', 'SCH_KUSUM', 'PM-KUSUM 5HP Solar Pump',
 'Replaced 6HP diesel pump with 5HP solar. Saved ₹4,600 per month on fuel. Cotton yield rose by 32% with reliable daytime irrigation.', 32, '₹1,32,000 (60% Subsidy)', 'March 2024', TRUE, '+91 98480 34120', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'),

('peer_02', 'Anjaiah Kuruma', 6.40, 'Nandigama, Rangareddy', '2.8 Acres • Red Sandy Loam', 'Chilli & Groundnut', 'SCH_FASAL', 'PMFBY Crop Insurance Claim',
 'Severe hailstorm damaged unharvested chilli crops in October. Received ₹42,500 direct compensation in bank account within 35 days.', 0, '₹42,500 Claim Paid', 'November 2023', TRUE, '+91 94401 89761', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'),

('peer_03', 'Laxmi Bai', 11.20, 'Shadnagar Rural', '4.2 Acres • Mixed Loam', 'Paddy & Vegetables', 'SCH_SOIL', 'Soil Health Card Fertilizer Optimization',
 'Soil test showed high potassium but zinc & nitrogen deficiency. Applied targeted bio-fertilizer, reduced urea cost by ₹5,200, yield up by 22%.', 22, 'Free Testing + ₹3,000 Kit', 'January 2024', TRUE, '+91 99890 12389', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80');

-- ====================================================================
-- 11. DISPLAY ALL TABLES & DETAILED RECORDS IN WORKBENCH RESULT GRIDS
-- ====================================================================

-- 1. Display list of all tables in JanMithra
SHOW TABLES;

-- 2. Display Users (Registered Farmers; password hashes are never selected)
SELECT 
    id AS user_id, 
    name AS farmer_name, 
    phone AS mobile_number, 
    email, 
    state, 
    district, 
    village, 
    land_size_acres, 
    soil_type, 
    irrigation_type, 
    primary_crops, 
    annual_income_slab, 
    preferred_language, 
    verified_docs_count, 
    created_at 
FROM users;

-- 3. Display Government Schemes Knowledge Base
SELECT 
    id AS scheme_id, 
    code, 
    name AS scheme_name, 
    category_name, 
    match_score, 
    subsidy_amount, 
    department, 
    application_mode 
FROM schemes;

-- 4. Display Nearby Peer Farmers (PostGIS Radius Network)
SELECT 
    id AS peer_id, 
    farmer_name, 
    distance_km, 
    village, 
    land_type, 
    crops_grown, 
    scheme_name, 
    subsidy_received, 
    yield_increase_pct, 
    contact_phone 
FROM peer_success_stories;

-- 5. Display Document Verification Logs (OCR Scans)
SELECT 
    id AS doc_id, 
    user_id, 
    doc_type, 
    title, 
    confidence_score, 
    status, 
    verified_at 
FROM document_verifications;

-- 6. Summary Counts
SELECT 
    (SELECT COUNT(*) FROM users) AS total_registered_farmers,
    (SELECT COUNT(*) FROM schemes) AS total_schemes_available,
    (SELECT COUNT(*) FROM peer_success_stories) AS total_nearby_peers,
    (SELECT COUNT(*) FROM document_verifications) AS total_verified_documents;
