from flask import Flask
from flask_cors import CORS
import os
from flask import send_from_directory
from routes.product_routes import product_routes
from routes.auth_routes import auth_routes
from routes.order_routes import order_routes
from routes.analytics_routes import analytics_routes

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
app.register_blueprint(auth_routes, url_prefix="/api/auth")
app.register_blueprint(order_routes, url_prefix="/api/orders")
app.register_blueprint(analytics_routes, url_prefix="/api/analytics")

if __name__ == "__main__":
    app.run(debug=True)