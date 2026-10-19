-- ====================================================================
-- JanMitra (PostgreSQL) migration 002: reference data
-- Seeds the scheme knowledge base and the demo peer stories.
-- Repeatable: existing rows are left untouched (ON CONFLICT DO NOTHING).
-- No user accounts are created and no passwords are seeded.
-- ====================================================================

INSERT INTO schemes (id, code, name, category, category_name, match_score, subsidy_amount, description, benefits, eligibility_summary, documents_required, department, tag_color, application_mode) VALUES
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
 'Government-sponsored scientific laboratory analysis of your field''s soil profile covering 12 critical macro and micronutrients.',
 'Stop over-fertilizing! Get custom fertilizer dosage guidance per crop to save up to ₹4,000/acre on DAP/Urea and boost yield.',
 'Available to any farmer owning or leasing cultivable land.',
 '["Land Record / Survey Number", "Farmer Mobile Number", "Soil Sample (Collected by Village Officer)"]',
 'Department of Agriculture & Cooperation', 'bg-stone-100 text-stone-800 border-stone-300', 'offline'),

('SCH_KCC', 'KCC-LOAN', 'Kisan Credit Card (KCC) Low-Interest Credit', 'credit', 'Credit & Loans', 86, 'Up to ₹3 Lakh Loan at 4% Interest',
 'Simplified bank credit facility offering timely credit for cultivation expenses, crop maintenance, and post-harvest storage at heavily subsidized interest rates.',
 'Effective interest rate of only 4% per annum upon prompt repayment (3% Prompt Repayment Incentive by Central Govt).',
 'Individual/joint borrowers who are owner cultivators, tenant farmers, or sharecroppers.',
 '["Duly filled Application Form", "Identity & Address Proof (Aadhaar/Voter ID)", "Land Records certified by Revenue Official"]',
 'Reserve Bank of India & NABARD', 'bg-purple-100 text-purple-800 border-purple-300', 'both')
ON CONFLICT (id) DO NOTHING;

INSERT INTO peer_success_stories (id, farmer_name, distance_km, village, land_type, crops_grown, scheme_id, scheme_name, outcome_summary, yield_increase_pct, subsidy_received, implementation_date, contact_allowed, contact_phone, avatar_url) VALUES
('peer_01', 'Rameshwar Reddy', 3.80, 'Kothur, Mandal Rangareddy', '3.0 Acres • Black Soil', 'Cotton & Red Gram', 'SCH_KUSUM', 'PM-KUSUM 5HP Solar Pump',
 'Replaced 6HP diesel pump with 5HP solar. Saved ₹4,600 per month on fuel. Cotton yield rose by 32% with reliable daytime irrigation.', 32, '₹1,32,000 (60% Subsidy)', 'March 2024', TRUE, '+91 98480 34120', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'),

('peer_02', 'Anjaiah Kuruma', 6.40, 'Nandigama, Rangareddy', '2.8 Acres • Red Sandy Loam', 'Chilli & Groundnut', 'SCH_FASAL', 'PMFBY Crop Insurance Claim',
 'Severe hailstorm damaged unharvested chilli crops in October. Received ₹42,500 direct compensation in bank account within 35 days.', 0, '₹42,500 Claim Paid', 'November 2023', TRUE, '+91 94401 89761', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'),

('peer_03', 'Laxmi Bai', 11.20, 'Shadnagar Rural', '4.2 Acres • Mixed Loam', 'Paddy & Vegetables', 'SCH_SOIL', 'Soil Health Card Fertilizer Optimization',
 'Soil test showed high potassium but zinc & nitrogen deficiency. Applied targeted bio-fertilizer, reduced urea cost by ₹5,200, yield up by 22%.', 22, 'Free Testing + ₹3,000 Kit', 'January 2024', TRUE, '+91 99890 12389', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO NOTHING;
