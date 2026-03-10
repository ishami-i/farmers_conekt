from flask import Flask
from flask_cors import CORS
import os
from flask import send_from_directory
from routes.buyer_routes import buyer_routes
from routes.farmer_routes import farmer_routes
from routes.product_routes import product_routes

app = Flask(__name__)

CORS(app)

UPLOAD_FOLDER = "uploads/crop_images"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

@app.route("/uploads/products/<filename>")
def serve_product_image(filename):
    return send_from_directory("uploads/products", filename)

app.register_blueprint(product_routes, url_prefix="/api/products")
app.register_blueprint(farmer_routes, url_prefix="/api/farmers")
app.register_blueprint(buyer_routes, url_prefix="/api/buyers")

if __name__ == "__main__":
    app.run(debug=True)
