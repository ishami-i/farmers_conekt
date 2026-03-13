from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os
from flask import send_from_directory
from routes.buyer_routes import buyer_routes
from routes.farmer_routes import farmer_routes
from routes.auth_routes import auth_routes
from config import JWT_SECRET_KEY

app = Flask(__name__)

CORS(app)

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

if __name__ == "__main__":
    app.run(debug=True)
