from flask import Flask
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

CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5000"])

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

if __name__ == "__main__":
    app.run(debug=True)
