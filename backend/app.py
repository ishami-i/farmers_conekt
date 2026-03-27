from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os
from flask import send_from_directory
from routes.buyer_routes import buyer_routes
from routes.farmer_routes import farmer_routes
from routes.auth_routes import auth_routes
from routes.transporter_routes import transporter_routes
from routes.analytics_routes import analytics_routes
from routes.planting_routes import planting_routes
from config import JWT_SECRET_KEY
from routes.payment_routes import payment_routes

app = Flask(__name__)

# Configure CORS with more explicit settings to handle preflight requests
CORS(app, 
     origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5000", 
              "http://localhost:8000", "http://127.0.0.1:8000", "http://127.0.0.1:5000"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"],
     supports_credentials=True,
     max_age=3600)

# JWT configuration
app.config["JWT_SECRET_KEY"] = JWT_SECRET_KEY
jwt = JWTManager(app)

UPLOAD_FOLDER = "uploads/crop_images"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

@app.route("/uploads/crop_images/<filename>")
def serve_product_image(filename):
    return send_from_directory("uploads/crop_images", filename)

app.register_blueprint(auth_routes, url_prefix="/api/auth")
app.register_blueprint(farmer_routes, url_prefix="/api/farmers")
app.register_blueprint(buyer_routes, url_prefix="/api/buyers")
app.register_blueprint(transporter_routes, url_prefix="/api/transporters")
app.register_blueprint(analytics_routes, url_prefix="/api/analytics")
app.register_blueprint(planting_routes, url_prefix="/api/planting")
app.register_blueprint(payment_routes, url_prefix="/api/payments")

# Public endpoints for client-side data
@app.route("/api/data/districts", methods=["GET"])
def get_districts():
    """Serve districts list for frontend district filter"""
    try:
        import json
        # Look for data/district.json relative to backend directory
        file_path = os.path.join(os.path.dirname(__file__), "..", "data", "district.json")
        with open(file_path, "r") as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e), "districts": []}), 500

if __name__ == "__main__":
    app.run(debug=True)
