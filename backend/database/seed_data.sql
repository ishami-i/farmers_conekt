USE farmers_conekt;

-- Seed data for Farmers Conekt App (All users password: 123456789)
-- Insert districts
INSERT INTO districts (district_name) VALUES
('Bugesera'),
('Burera'),
('Gakenke'),
('Gasabo'),
('Gatsibo'),
('Gicumbi'),
('Gisagara'),
('Huye'),
('Kamonyi'),
('Karongi'),
('Kayonza'),
('Kicukiro'),
('Kirehe'),
('Muhanga'),
('Musanze'),
('Ngoma'),
('Ngororero'),
('Nyabihu'),
('Nyagatare'),
('Nyamagabe'),
('Nyamasheke'),
('Nyanza'),
('Nyarugenge'),
('Nyaruguru'),
('Rubavu'),
('Ruhango'),
('Rulindo'),
('Rusizi'),
('Rutsiro'),
('Rwamagana');

-- Insert users (bcrypt hashed password for '123456789')
INSERT INTO users (full_name, phone_number, email, password, role, created_at) VALUES
('Jean Baptiste', '+250788123456', 'jean@example.com', '$2b$12$WVX0O/Wv5yGmKMHuIyz95eGxfRQNsvRGRfXRDUCWKjdKJbsO1uCLy', 'farmer', '2025-10-01 10:00:00'),
('Marie Claire', '+250788123457', 'marie@example.com', '$2b$12$WVX0O/Wv5yGmKMHuIyz95eGxfRQNsvRGRfXRDUCWKjdKJbsO1uCLy', 'farmer', '2025-10-02 11:00:00'),
('Pierre Nkurunziza', '+250788123458', 'pierre@example.com', '$2b$12$WVX0O/Wv5yGmKMHuIyz95eGxfRQNsvRGRfXRDUCWKjdKJbsO1uCLy', 'farmer', '2025-10-03 12:00:00'),
('Alice Mukamana', '+250788123459', 'alice@example.com', '$2b$12$WVX0O/Wv5yGmKMHuIyz95eGxfRQNsvRGRfXRDUCWKjdKJbsO1uCLy', 'farmer', '2025-10-04 13:00:00'),
('David Uwimana', '+250788123460', 'david@example.com', '$2b$12$WVX0O/Wv5yGmKMHuIyz95eGxfRQNsvRGRfXRDUCWKjdKJbsO1uCLy', 'farmer', '2025-10-05 14:00:00'),
('Buyer One', '+250788123461', 'buyer1@example.com', '$2b$12$WVX0O/Wv5yGmKMHuIyz95eGxfRQNsvRGRfXRDUCWKjdKJbsO1uCLy', 'buyer', '2025-10-06 15:00:00'),
('Buyer Two', '+250788123462', 'buyer2@example.com', '$2b$12$WVX0O/Wv5yGmKMHuIyz95eGxfRQNsvRGRfXRDUCWKjdKJbsO1uCLy', 'buyer', '2025-10-07 16:00:00'),
('Transporter One', '+250788123463', 'trans1@example.com', '$2b$12$WVX0O/Wv5yGmKMHuIyz95eGxfRQNsvRGRfXRDUCWKjdKJbsO1uCLy', 'transporter', '2025-10-08 17:00:00'),
('Transporter Two', '+250788123464', 'trans2@example.com', '$2b$12$WVX0O/Wv5yGmKMHuIyz95eGxfRQNsvRGRfXRDUCWKjdKJbsO1uCLy', 'transporter', '2025-10-09 18:00:00'),
('Admin User', '+250788123465', 'admin@example.com', '$2b$12$WVX0O/Wv5yGmKMHuIyz95eGxfRQNsvRGRfXRDUCWKjdKJbsO1uCLy', 'admin', '2025-10-10 10:00:00');

-- Insert farmers
INSERT INTO farmers (user_id, district_id, bio) VALUES
(1, 1, 'Experienced maize farmer'),
(2, 2, 'Bean specialist'),
(3, 3, 'Potato grower'),
(4, 4, 'Cassava farmer'),
(5, 5, 'Rice farmer');

-- Insert buyers
INSERT INTO buyers (user_id, district_id) VALUES
(6, 1),
(7, 2);

-- Insert transporters
INSERT INTO transporters (user_id, plate_number, capacity_kg, availability_status, created_at) VALUES
(8, 'RAB123A', 1000, 'available', '2025-10-10 19:00:00'),
(9, 'RAB456B', 1500, 'available', '2025-10-11 20:00:00');

-- Insert products
INSERT INTO products (farmer_id, district_id, product_name, product_category, harvest_date, expiration_date, status, price_per_unit, unit, quantity_available, description, image_url, created_at, updated_at) VALUES
(1, 1, 'Maize', 'Grain', '2025-12-15', '2026-06-15', 'available', 500.00, 'kg', 1000, 'High quality maize', 'image1.jpg', '2025-11-01 08:00:00', '2025-11-01 08:00:00'),
(1, 1, 'Beans', 'Legume', '2025-11-20', '2026-05-20', 'available', 800.00, 'kg', 500, 'Fresh beans', 'image2.jpg', '2025-11-02 09:00:00', '2025-11-02 09:00:00'),
(2, 2, 'Potatoes', 'Vegetable', '2026-01-10', '2026-07-10', 'available', 300.00, 'kg', 800, 'Organic potatoes', 'image3.jpg', '2025-11-03 10:00:00', '2025-11-03 10:00:00'),
(3, 3, 'Cassava', 'Root', '2025-12-05', '2026-06-05', 'available', 400.00, 'kg', 600, 'Sweet cassava', 'image4.jpg', '2025-11-04 11:00:00', '2025-11-04 11:00:00'),
(4, 4, 'Rice', 'Grain', '2026-02-20', '2026-08-20', 'available', 600.00, 'kg', 700, 'Basmati rice', 'image5.jpg', '2025-11-05 12:00:00', '2025-11-05 12:00:00'),
(5, 5, 'Tomatoes', 'Vegetable', '2025-11-25', '2026-05-25', 'available', 200.00, 'kg', 400, 'Red tomatoes', 'image6.jpg', '2025-11-06 13:00:00', '2025-11-06 13:00:00');

-- Insert planting plans (past 4 months: Nov 2025 - Mar 2026)
INSERT INTO planting_plans (farmer_id, product_id, district_id, planted_quantity, expected_harvest_date, created_at) VALUES
(1, 1, 1, 2000, '2025-12-15', '2025-11-01 08:00:00'),
(1, 2, 1, 1000, '2025-11-20', '2025-11-02 09:00:00'),
(2, 3, 2, 1500, '2026-01-10', '2025-12-01 10:00:00'),
(3, 4, 3, 1200, '2025-12-05', '2025-12-15 11:00:00'),
(4, 5, 4, 1800, '2026-02-20', '2026-01-01 12:00:00'),
(5, 6, 5, 800, '2025-11-25', '2025-11-10 13:00:00'),
(1, 1, 1, 2500, '2026-03-15', '2026-02-01 14:00:00'),
(2, 3, 2, 1300, '2026-04-10', '2026-03-01 15:00:00');

-- Insert demand analytics (past 4 months)
INSERT INTO demand_analytics (product_id, district_id, year, month, total_sold, average_price, created_at) VALUES
(1, 1, 2025, 11, 500, 480.00, '2025-12-01 00:00:00'),
(1, 1, 2025, 12, 600, 490.00, '2026-01-01 00:00:00'),
(1, 1, 2026, 1, 550, 500.00, '2026-02-01 00:00:00'),
(1, 1, 2026, 2, 700, 510.00, '2026-03-01 00:00:00'),
(1, 1, 2026, 3, 650, 505.00, '2026-04-01 00:00:00'),
(2, 1, 2025, 11, 300, 780.00, '2025-12-01 00:00:00'),
(2, 1, 2025, 12, 400, 790.00, '2026-01-01 00:00:00'),
(2, 1, 2026, 1, 350, 800.00, '2026-02-01 00:00:00'),
(2, 1, 2026, 2, 450, 810.00, '2026-03-01 00:00:00'),
(2, 1, 2026, 3, 400, 805.00, '2026-04-01 00:00:00'),
(3, 2, 2025, 11, 400, 280.00, '2025-12-01 00:00:00'),
(3, 2, 2025, 12, 500, 290.00, '2026-01-01 00:00:00'),
(3, 2, 2026, 1, 450, 300.00, '2026-02-01 00:00:00'),
(3, 2, 2026, 2, 600, 310.00, '2026-03-01 00:00:00'),
(3, 2, 2026, 3, 550, 305.00, '2026-04-01 00:00:00'),
(4, 3, 2025, 11, 350, 380.00, '2025-12-01 00:00:00'),
(4, 3, 2025, 12, 450, 390.00, '2026-01-01 00:00:00'),
(4, 3, 2026, 1, 400, 400.00, '2026-02-01 00:00:00'),
(4, 3, 2026, 2, 550, 410.00, '2026-03-01 00:00:00'),
(4, 3, 2026, 3, 500, 405.00, '2026-04-01 00:00:00'),
(5, 4, 2025, 11, 250, 580.00, '2025-12-01 00:00:00'),
(5, 4, 2025, 12, 350, 590.00, '2026-01-01 00:00:00'),
(5, 4, 2026, 1, 300, 600.00, '2026-02-01 00:00:00'),
(5, 4, 2026, 2, 400, 610.00, '2026-03-01 00:00:00'),
(5, 4, 2026, 3, 375, 605.00, '2026-04-01 00:00:00'),
(6, 5, 2025, 11, 200, 180.00, '2025-12-01 00:00:00'),
(6, 5, 2025, 12, 300, 190.00, '2026-01-01 00:00:00'),
(6, 5, 2026, 1, 250, 200.00, '2026-02-01 00:00:00'),
(6, 5, 2026, 2, 350, 210.00, '2026-03-01 00:00:00'),
(6, 5, 2026, 3, 325, 205.00, '2026-04-01 00:00:00');

-- Insert orders and order_details (example data)
INSERT INTO orders (buyer_id, status, total_payment, payment_status, payment_reference, Phone_paid_with, payment_date, created_at) VALUES
(1, 'delivered', 1550.00, 'paid', 'PAYREF001', '+250788123461', '2025-11-15 14:30:00', '2025-11-15 14:00:00'),
(1, 'shipped', 1100.00, 'paid', 'PAYREF002', '+250788123462', '2025-11-16 09:20:00', '2025-11-16 09:00:00'),
(2, 'confirmed', 800.00, 'paid', 'PAYREF003', '+250788123461', '2025-11-17 16:45:00', '2025-11-17 16:00:00');

INSERT INTO order_details (order_id, product_id, price, quantity) VALUES
(1, 1, 500.00, 2),
(1, 2, 300.00, 1),
(2, 3, 300.00, 2),
(2, 4, 500.00, 1),
(3, 5, 600.00, 1),
(3, 6, 200.00, 1);

-- Insert deliveries
INSERT INTO deliveries (order_id, transporter_id, pickup_location, dropoff_location, delivery_fee, status, created_at) VALUES
(1, 1, 'Bugesera Market', 'Gasabo Downtown', 50.00, 'delivered', '2025-11-15 14:05:00'),
(2, 2, 'Burera Farm', 'Kicukiro Center', 50.00, 'in_transit', '2025-11-16 09:05:00'),
(3, NULL, 'Gakenke Village', 'Kirehe Town', 50.00, 'pending', '2025-11-17 16:05:00');

-- Insert farmer_earnings
INSERT INTO farmer_earnings (farmer_id, order_id, amount, status, created_at) VALUES
(1, 1, 1300.00, 'paid', '2025-11-15 14:30:00'),
(2, 2, 1100.00, 'paid', '2025-11-16 09:20:00'),
(3, 3, 800.00, 'pending', '2025-11-17 16:45:00');

-- Insert transporter_earnings
INSERT INTO transporter_earnings (transporter_id, delivery_id, order_id, amount, status, created_at) VALUES
(1, 1, 1, 50.00, 'paid', '2025-11-15 14:35:00'),
(2, 2, 2, 50.00, 'pending', '2025-11-16 09:25:00');

-- Insert notifications (example)
INSERT INTO notifications (farmer_id, plan_id, message, is_read, created_at) VALUES
(1, 1, 'High demand predicted for Maize in Bugesera next month', FALSE, NOW()),
(2, 3, 'Reduce Potato planting in Burera due to oversupply forecast', FALSE, NOW()),
(3, 4, 'Good opportunity for Cassava in Gakenke district', TRUE, NOW());

