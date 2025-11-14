-- Seed data for medicines table
-- Run this after creating the schema:
--   mysql -u <user> -p<password> online_medical_store < database/schema.sql
--   mysql -u <user> -p<password> online_medical_store < database/seeds/medicines_seed.sql

INSERT INTO medicines
  (name, description, price, stock, requires_prescription, image_url, category, dosage_instructions, side_effects)
VALUES
  ('Paracetamol 500mg', 'Relieves pain and lowers your body temperature', 25.00, 120, 0, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', 'Medicines', NULL, NULL),
  ('Antibiotic Amoxicillin', 'Treats bacterial infections', 150.00, 60, 1, 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=400&h=400&fit=crop', 'Medicines', NULL, NULL),
  ('Ibuprofen 400mg', 'Pain relief and anti-inflammatory', 45.00, 85, 0, 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop', 'Medicines', NULL, NULL),
  ('Azithromycin 500mg', 'Antibiotic for respiratory infections', 200.00, 40, 1, 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop', 'Medicines', NULL, NULL),
  ('Cetirizine 10mg', 'Antihistamine for allergies', 35.00, 140, 0, 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c16?w=400&h=400&fit=crop', 'Medicines', NULL, NULL),
  ('Omeprazole 20mg', 'Treats acid reflux and heartburn', 120.00, 70, 0, 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=400&fit=crop', 'Medicines', NULL, NULL),
  ('Digital Thermometer', 'Accurate body temperature reading', 450.00, 35, 0, 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop', 'Medical Devices', NULL, NULL),
  ('Blood Pressure Monitor', 'Home blood pressure monitoring', 2500.00, 25, 0, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', 'Medical Devices', NULL, NULL),
  ('Oximeter', 'Oxygen saturation monitor', 1200.00, 45, 0, 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop', 'Medical Devices', NULL, NULL),
  ('Hand Sanitizer', 'Alcohol-based hand sanitizer', 150.00, 160, 0, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', 'Personal Care', NULL, NULL),
  ('Face Mask (Pack of 50)', 'Surgical face masks', 300.00, 110, 0, 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop', 'Personal Care', NULL, NULL),
  ('Baby Formula Milk', 'Nutritious baby formula', 800.00, 60, 0, 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c16?w=400&h=400&fit=crop', 'Baby Care', NULL, NULL),
  ('Vitamin D3', 'Vitamin D supplement', 250.00, 100, 0, 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=400&fit=crop', 'Vitamins & Supplements', NULL, NULL),
  ('Multivitamin', 'Complete multivitamin supplement', 400.00, 90, 0, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', 'Vitamins & Supplements', NULL, NULL),
  ('First Aid Kit', 'Complete first aid supplies', 600.00, 55, 0, 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=400&h=400&fit=crop', 'First Aid', NULL, NULL),
  ('Bandages (Pack of 10)', 'Medical bandages', 100.00, 180, 0, 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop', 'First Aid', NULL, NULL),
  ('Aspirin 100mg', 'Pain reliever and blood thinner', 30.00, 200, 0, 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop', 'Medicines', NULL, NULL),
  ('Metformin 500mg', 'Diabetes medication', 180.00, 80, 1, 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c16?w=400&h=400&fit=crop', 'Medicines', NULL, NULL),
  ('Amlodipine 5mg', 'Blood pressure medication', 200.00, 75, 1, 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=400&fit=crop', 'Medicines', NULL, NULL),
  ('Atorvastatin 20mg', 'Cholesterol medication', 350.00, 65, 1, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', 'Medicines', NULL, NULL),
  ('Baby Shampoo', 'Gentle baby shampoo', 250.00, 70, 0, 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=400&h=400&fit=crop', 'Baby Care', NULL, NULL),
  ('Diapers (Pack of 30)', 'Disposable diapers', 1200.00, 90, 0, 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop', 'Baby Care', NULL, NULL),
  ('Calcium Supplement', 'Bone health supplement', 300.00, 95, 0, 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop', 'Vitamins & Supplements', NULL, NULL),
  ('Omega-3', 'Fish oil supplement', 500.00, 85, 0, 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c16?w=400&h=400&fit=crop', 'Vitamins & Supplements', NULL, NULL),
  ('Stethoscope', 'Medical stethoscope', 1500.00, 25, 0, 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=400&fit=crop', 'Medical Devices', NULL, NULL),
  ('Glucometer', 'Blood glucose monitor', 1800.00, 40, 0, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', 'Medical Devices', NULL, NULL),
  ('Soap (Pack of 4)', 'Antibacterial soap', 200.00, 150, 0, 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=400&h=400&fit=crop', 'Personal Care', NULL, NULL),
  ('Toothpaste', 'Fluoride toothpaste', 150.00, 180, 0, 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop', 'Personal Care', NULL, NULL),
  ('Antiseptic Solution', 'Wound cleaning solution', 120.00, 110, 0, 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=400&fit=crop', 'First Aid', NULL, NULL),
  ('Gauze Pads', 'Sterile gauze pads', 80.00, 140, 0, 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c16?w=400&h=400&fit=crop', 'First Aid', NULL, NULL),
  ('Baby Wipes', 'Gentle baby wipes', 350.00, 90, 0, 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=400&fit=crop', 'Baby Care', NULL, NULL),
  ('Iron Supplement', 'Iron tablets for anemia', 280.00, 105, 0, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop', 'Vitamins & Supplements', NULL, NULL);

