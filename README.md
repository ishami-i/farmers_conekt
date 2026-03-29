# Farmer Conekt
## 1. Platform Overview

Farmer Conekt is a digital platform designed to streamline agricultural trade by minimizing intermediaries and connecting all stakeholders within a single, integrated system. The platform brings together farmers, buyers, and transporters to enable efficient, transparent, and reliable transactions.

## 2. Problem & Context
- Agriculture employs over 65% of Rwanda’s population and contributes ~25% to GDP.  
- Farmers face limited access to reliable markets and buyers.  
- Post-harvest losses for perishable goods range between 20–40%.  
- Middlemen dominate pricing, reducing farmers’ profits.  
- Seasonal overproduction leads to price drops and food wastage.  
- Lack of coordination and transparency causes inefficiencies in the supply chain. 
## 3. Solution
- Farmers create accounts and list their products on the platform.  
- Customers browse available products and place orders online.  
- Payments are securely processed through Flutterwave.  
- Farmers receive order notifications and prepare goods for delivery or pickup.  
- Transporters handle delivery logistics between farmers and customers.  
- Farmers are provided with planting plans to help reduce surplus and improve production planning. 
## 4. Key Features
- User accounts for farmers, buyers, and transporters with dashboards  
- Product listing, browsing, ordering, and order tracking system  
- Secure online payments via Flutterwave with automated notifications  
- Logistics coordination for delivery and pickup through transporters  
- Smart tools, including planting plans and surplus prediction, to improve production and reduce waste  
## 5. Technology stacks
- Frontend: HTML, CSS, JavaScript (or React for dynamic UI)  
- Backend: Python with Flask
- Database: MySQL
- Authentication: Password-based Authentication 
- Payments: Flutterwave API  
- Deployment: Ubuntu servers 
- Version Control: Git & GitHub  
## 6. Repository Structure and Installation
```farmers_conekt/
├── README.md
├── requirements.txt
├── set_up.sh
├── .gitignore
│
├── backend/
│   ├── app.py                  # Flask/FastAPI main entrypoint
│   ├── config.py               # App configuration
│   ├── __init__.py             # (optional) make backend a package
│   │
│   ├── database/
│   │   ├── db.py               # DB connection helpers
│   │   ├── schema.sql          # Schema definition
│   │   └── seed_data.sql       # Seed data
│   │
│   ├── routes/                 # All API route blueprints/routers
│   │   ├── __init__.py
│   │   ├── analytics_routes.py
│   │   ├── auth_routes.py
│   │   ├── buyer_routes.py
│   │   ├── farmer_routes.py
│   │   ├── payment_routes.py
│   │   ├── planting_routes.py
│   │   └── transporter_routes.py
│   │
│   ├── middleware/             # Cross‑cutting concerns
│   │   ├── __init__.py
│   │   └── role_required.py
│   │
│   ├── uploads/
│   │   └── crop_images/        # User-uploaded images
│   │
│   ├── tests/                  # (recommended) backend tests
│   └── env/                    # Local venv (usually gitignored)
│
├── frontend/
│   ├── index.html              # (recommended) main entry, can point to pages/home.html
│   ├── farmer.html             # Legacy/landing pages (optionally move to pages/)
│   ├── transporter.html        # "
│   │
│   ├── pages/
│   │   ├── home.html
│   │   ├── login.html
│   │   ├── admin-dashboard.html
│   │   ├── transporter.html    # Page version
│   │   └── 404.html
│   │
│   ├── scripts/
│   │   ├── 404-handler.js
│   │   ├── buyer.js
│   │   ├── filters.js
│   │   ├── login.js
│   │   ├── product.js
│   │   ├── session.js
│   │   └── transporter.js
│   │
│   ├── styles/
│   │   ├── main.css
│   │   ├── buyer.css
│   │   └── login.css
│   │
│   └── assets/                 # (recommended) static assets
│       ├── images/
│       └── icons/
│
├── data/
│   ├── district.json
│   └── locations.json
│
├── architectural_diagrams/
│   └── class_diagram.jpg
```
installation, goes by cloning the repository
and 
```
git clone https://github.com/ishami-i/farmers_conekt
bash ./set_up.sh
```
## 7. User Experience
- Farmers can easily create accounts, upload products, and manage orders through a simple dashboard.  
- Buyers can browse products, search, place orders, and make payments seamlessly.  
- Transporters receive delivery requests and manage logistics efficiently.  
- The platform provides a clean, intuitive, and responsive interface for both mobile and web users.
## 9. Data & Security
- User authentication and authorization to ensure only registered users access the platform  
- Role-based access control for farmers, buyers, and transporters  
- Secure payment processing through Flutterwave with encrypted transactions  
- Protection of sensitive user data using encryption and secure storage practices  
- Validation and sanitization of user inputs to prevent common vulnerabilities (e.g., SQL injection, XSS)  
- Use of secure communication protocols (HTTPS) for all data exchanges  
## 11. Team & Acknowledgment
