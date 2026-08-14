-- Seed data for medicines table
-- Run this after creating the schema:
--   psql "$DATABASE_URL" -f database/schema.sql
--   psql "$DATABASE_URL" -f database/seeds/medicines_seed.sql

-- Add manufacturing_date column if it does not already exist (safe to run on existing databases)
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(150);
ALTER TABLE medicines ADD COLUMN IF NOT EXISTS manufacturing_date DATE NULL DEFAULT NULL;

INSERT INTO medicines
  (name, description, price, stock, requires_prescription, image_url, manufacturer, category, expiry_date, manufacturing_date, dosage_instructions, side_effects, sort_order)
VALUES
  -- Medicines
  ('Paracetamol 500mg', 'Relieves pain and lowers your body temperature', 25.00, 120, false, 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=500&h=400&fit=crop', 'Abbott', 'Medicines', '2026-06-15', '2024-06-15', NULL, NULL, 1),
  ('Antibiotic Amoxicillin', 'Treats bacterial infections', 150.00, 60, true, 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&h=400&fit=crop', 'GSK', 'Medicines', '2026-08-10', '2024-08-10', NULL, NULL, 2),
  ('Ibuprofen 400mg', 'Pain relief and anti-inflammatory', 45.00, 85, false, 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=500&h=400&fit=crop', 'Abbott', 'Medicines', '2026-12-31', '2024-03-20', NULL, NULL, 0),
  ('Azithromycin 500mg', 'Antibiotic for respiratory infections', 200.00, 40, true, 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&h=400&fit=crop', 'Pfizer', 'Medicines', '2026-09-05', '2024-09-05', NULL, NULL, 0),
  ('Cetirizine 10mg', 'Antihistamine for allergies', 35.00, 140, false, 'https://images.unsplash.com/photo-1628771065518-0d82f111818c?w=500&h=400&fit=crop', 'UCB', 'Medicines', '2026-10-12', '2024-04-12', NULL, NULL, 0),
  ('Omeprazole 20mg', 'Treats acid reflux and heartburn', 120.00, 70, false, 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=500&h=400&fit=crop', 'AstraZeneca', 'Medicines', '2027-07-01', '2024-07-01', NULL, NULL, 0),
  ('Aspirin 100mg', 'Pain reliever and blood thinner', 30.00, 200, false, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&h=400&fit=crop', 'Bayer', 'Medicines', '2026-11-01', '2024-11-01', NULL, NULL, 0),
  ('Metformin 500mg', 'Diabetes medication', 180.00, 80, true, 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&h=400&fit=crop', 'Merck', 'Medicines', '2026-10-15', '2024-10-15', NULL, NULL, 0),
  ('Amlodipine 5mg', 'Blood pressure medication', 200.00, 75, true, 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c16?w=500&h=400&fit=crop', 'Pfizer', 'Medicines', '2027-01-10', '2025-01-10', NULL, NULL, 0),
  ('Atorvastatin 20mg', 'Cholesterol medication', 350.00, 65, true, 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=500&h=400&fit=crop', 'Pfizer', 'Medicines', '2026-12-01', '2024-12-01', NULL, NULL, 0),
  -- Medical Devices
  ('Digital Thermometer', 'Accurate body temperature reading', 450.00, 35, false, 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&h=400&fit=crop', 'Omron', 'Medical Devices', '2029-05-01', '2024-05-01', NULL, NULL, 0),
  ('Blood Pressure Monitor', 'Home blood pressure monitoring', 2500.00, 25, false, 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=500&h=400&fit=crop', 'Omron', 'Medical Devices', '2029-03-15', '2024-03-15', NULL, NULL, 0),
  ('Oximeter', 'Oxygen saturation monitor', 1200.00, 45, false, 'https://images.unsplash.com/photo-1615461066841-6116ecaabb04?w=500&h=400&fit=crop', 'Omron', 'Medical Devices', '2029-06-20', '2024-06-20', NULL, NULL, 0),
  ('Stethoscope', 'Medical stethoscope', 1500.00, 25, false, 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&h=400&fit=crop', 'Littmann', 'Medical Devices', '2028-11-01', '2023-11-01', NULL, NULL, 0),
  ('Glucometer', 'Blood glucose monitor', 1800.00, 40, false, 'https://images.unsplash.com/photo-1505751172876-fa1923c5c527?w=500&h=400&fit=crop', 'Accu-Chek', 'Medical Devices', '2029-02-28', '2024-02-28', NULL, NULL, 0),
  -- Baby Care
  ('Baby Formula Milk', 'Nutritious baby formula', 800.00, 60, false, 'https://images.unsplash.com/photo-1594833202978-59424c3a2741?w=500&h=400&fit=crop', 'Nestlé', 'Baby Care', '2026-10-01', '2025-10-01', NULL, NULL, 0),
  ('Baby Shampoo', 'Gentle baby shampoo', 250.00, 70, false, 'https://images.unsplash.com/photo-1612115539594-7b2dfc3944d1?w=500&h=400&fit=crop', 'Johnson & Johnson', 'Baby Care', '2027-06-15', '2025-06-15', NULL, NULL, 0),
  ('Diapers (Pack of 30)', 'Disposable diapers', 1200.00, 90, false, 'https://images.unsplash.com/photo-1560130958-695393046de2?w=500&h=400&fit=crop', 'Pampers', 'Baby Care', '2028-08-01', '2025-08-01', NULL, NULL, 0),
  ('Baby Wipes', 'Gentle baby wipes', 350.00, 90, false, 'https://images.unsplash.com/photo-1596461404969-9ae70bd51dc0?w=500&h=400&fit=crop', 'Huggies', 'Baby Care', '2027-09-10', '2025-09-10', NULL, NULL, 0),
  -- Personal Care
  ('Hand Sanitizer', 'Alcohol-based hand sanitizer', 150.00, 160, false, 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=500&h=400&fit=crop', 'Dettol', 'Personal Care', '2027-01-15', '2025-01-15', NULL, NULL, 0),
  ('Face Mask (Pack of 50)', 'Surgical face masks', 300.00, 110, false, 'https://images.unsplash.com/photo-1586942593568-29361efcd571?w=500&h=400&fit=crop', '3M', 'Personal Care', '2028-03-01', '2025-03-01', NULL, NULL, 0),
  ('Soap (Pack of 4)', 'Antibacterial soap', 200.00, 150, false, 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=500&h=400&fit=crop', 'Dettol', 'Personal Care', '2027-04-20', '2025-04-20', NULL, NULL, 0),
  ('Toothpaste', 'Fluoride toothpaste', 150.00, 180, false, 'https://images.unsplash.com/photo-1559594881-30f7aa3b3088?w=500&h=400&fit=crop', 'Colgate', 'Personal Care', '2027-07-10', '2025-07-10', NULL, NULL, 0),
  -- Vitamins & Supplements
  ('Vitamin D3', 'Vitamin D supplement', 250.00, 100, false, 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c16?w=500&h=400&fit=crop', 'Nature''s Bounty', 'Vitamins & Supplements', '2026-11-15', '2024-11-15', NULL, NULL, 0),
  ('Multivitamin', 'Complete multivitamin supplement', 400.00, 90, false, 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=500&h=400&fit=crop', 'Centrum', 'Vitamins & Supplements', '2026-09-20', '2024-09-20', NULL, NULL, 0),
  ('Calcium Supplement', 'Bone health supplement', 300.00, 95, false, 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=500&h=400&fit=crop', 'Nature''s Bounty', 'Vitamins & Supplements', '2026-12-05', '2024-12-05', NULL, NULL, 0),
  ('Omega-3', 'Fish oil supplement', 500.00, 85, false, 'https://images.unsplash.com/photo-1467453678174-768ec283a940?w=500&h=400&fit=crop', 'Nordic Naturals', 'Vitamins & Supplements', '2026-08-01', '2025-02-01', NULL, NULL, 0),
  ('Iron Supplement', 'Iron tablets for anemia', 280.00, 105, false, 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=500&h=400&fit=crop', 'Sangobion', 'Vitamins & Supplements', '2026-10-01', '2024-10-01', NULL, NULL, 0),
  -- First Aid
  ('First Aid Kit', 'Complete first aid supplies', 600.00, 55, false, 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&h=400&fit=crop', 'Nexcare', 'First Aid', '2029-08-15', '2024-08-15', NULL, NULL, 0),
  ('Bandages (Pack of 10)', 'Medical bandages', 100.00, 180, false, 'https://images.unsplash.com/photo-1583947581924-860bda48512b?w=500&h=400&fit=crop', 'Nexcare', 'First Aid', '2030-01-20', '2025-01-20', NULL, NULL, 0),
  ('Antiseptic Solution', 'Wound cleaning solution', 120.00, 110, false, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&h=400&fit=crop', 'Pyodine', 'First Aid', '2027-05-10', '2025-05-10', NULL, NULL, 0),
  ('Gauze Pads', 'Sterile gauze pads', 80.00, 140, false, 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=500&h=400&fit=crop', 'Nexcare', 'First Aid', '2030-03-15', '2025-03-15', NULL, NULL, 0);
