CREATE DATABASE farmers_conekt;
USE farmers_conekt;

CREATE TABLE districts (
    district_id INT AUTO_INCREMENT PRIMARY KEY,
    district_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) UNIQUE,
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('farmer','buyer','transporter','admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE farmers (
    farmer_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    district_id INT,
    rating DECIMAL(2,1),
    bio TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (district_id) REFERENCES districts(district_id) ON DELETE SET NULL
);

CREATE TABLE buyers (
    buyer_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    district_id INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (district_id) REFERENCES districts(district_id) ON DELETE SET NULL
);

CREATE TABLE transporters (
    transporter_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    plate_number VARCHAR(20) UNIQUE,
    capacity_kg INT NOT NULL,
    availability_status ENUM('available','busy','offline') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id INT NOT NULL,
    district_id INT NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    product_category VARCHAR(50),
    harvest_date DATE,
    expiration_date DATE,
    status ENUM('available','sold','expired') DEFAULT 'available',
    price_per_unit DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20),
    quantity_available INT DEFAULT 0,
    description TEXT,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES farmers(farmer_id) ON DELETE CASCADE,
    FOREIGN KEY (district_id) REFERENCES districts(district_id) ON DELETE RESTRICT
);

CREATE TABLE planting_plans (
    plan_id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id INT NOT NULL,
    product_id INT NOT NULL,
    district_id INT NOT NULL,
    planted_quantity INT NOT NULL,
    expected_harvest_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES farmers(farmer_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (district_id) REFERENCES districts(district_id) ON DELETE RESTRICT
);

CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    buyer_id INT,
    status ENUM('pending','confirmed','shipped','delivered','cancelled') DEFAULT 'pending',
    total_payment DECIMAL(10,2),
    payment_status ENUM('pending','paid','failed') DEFAULT 'pending',
    payment_reference VARCHAR(100),
    Phone_paid_with VARCHAR(20),
    payment_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyer_id) REFERENCES buyers(buyer_id) ON DELETE SET NULL
);

CREATE TABLE order_details (
    order_detail_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    order_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

CREATE TABLE deliveries (
    delivery_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    transporter_id INT,
    pickup_location VARCHAR(255),
    dropoff_location VARCHAR(255),
    delivery_fee DECIMAL(10,2),
    status ENUM('pending','in_transit','delivered','returned') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (transporter_id) REFERENCES transporters(transporter_id) ON DELETE SET NULL
);

CREATE TABLE reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id INT NOT NULL,
    buyer_id INT NOT NULL,
    comment TEXT,
    rating TINYINT CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES farmers(farmer_id) ON DELETE CASCADE,
    FOREIGN KEY (buyer_id) REFERENCES buyers(buyer_id) ON DELETE CASCADE
);

CREATE TABLE farmer_earnings (
    earning_id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id INT NOT NULL,
    order_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    earning_type ENUM('product_sale', 'bonus') DEFAULT 'product_sale',
    status ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (farmer_id) REFERENCES farmers(farmer_id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

CREATE TABLE transporter_earnings (
    earning_id INT AUTO_INCREMENT PRIMARY KEY,
    transporter_id INT NOT NULL,
    delivery_id INT NOT NULL,
    order_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'paid', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transporter_id) REFERENCES transporters(transporter_id) ON DELETE CASCADE,
    FOREIGN KEY (delivery_id) REFERENCES deliveries(delivery_id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

CREATE TABLE demand_analytics (
    analytics_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    district_id INT NOT NULL,
    year INT,
    month INT,
    total_sold INT,
    average_price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (district_id) REFERENCES districts(district_id) ON DELETE RESTRICT
);

CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id INT,
    plan_id INT,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (farmer_id) REFERENCES farmers(farmer_id),
    FOREIGN KEY (plan_id) REFERENCES planting_plans(plan_id)
);


CREATE INDEX idx_products_district_id ON products(district_id);
CREATE INDEX idx_products_name ON products(product_name);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_details_product ON order_details(product_id);
CREATE INDEX idx_demand_district_id ON demand_analytics(district_id);
CREATE INDEX idx_products_district_name ON products(district_id, product_name);
CREATE INDEX idx_planting_plans_farmer ON planting_plans(farmer_id);
CREATE INDEX idx_planting_plans_product ON planting_plans(product_id);
