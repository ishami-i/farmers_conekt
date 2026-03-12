from flask import Blueprint, request, jsonify, current_app
from database.db import get_db_connection
import uuid
import os

product_routes = Blueprint("product_routes", __name__)

# API to upload product

@product_routes.route("/upload", methods=["POST"])
def upload_product():

    data = request.form.to_dict()
    farmer_id = data.get("farmer_id")
    district_id = data.get("district_id")
    product_name = data.get("product_name")
    category = data.get("category")
    harvest_date = data.get("harvest_date")
    expiration_date = data.get("expiration_date")
    price = data.get("price")
    unit = data.get("unit")
    quantity = data.get("quantity")
    description = data.get("description")

    # Validate required fields
    required = ['farmer_id', 'district_id', 'product_name', 'category', 'price', 'unit', 'quantity']
    missing = [field for field in required if not data.get(field)]
    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    image = request.files.get("image")
    image_path = None

    if image:
        filename = str(uuid.uuid4()) + "_" + image.filename
        filepath = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
        image.save(filepath)

        image_path = f"/uploads/crop_images/{filename}"

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Validate farmer_id exists
        cursor.execute("SELECT COUNT(*) as count FROM farmers WHERE farmer_id = %s", (farmer_id,))
        farmer_count = cursor.fetchone()['count']
        if farmer_count == 0:
            connection.close()
            return jsonify({"error": "Invalid farmer_id: Farmer not found"}), 400

        # Validate district_id exists
        cursor.execute("SELECT COUNT(*) as count FROM districts WHERE district_id = %s", (district_id,))
        district_count = cursor.fetchone()['count']
        if district_count == 0:
            connection.close()
            return jsonify({"error": "Invalid district_id: District not found"}), 400

        query = """
        INSERT INTO products
        (farmer_id, district_id, product_name, product_category,
         harvest_date, expiration_date, status, price_per_unit,
         unit, quantity_available, description, image_url, created_at)
        VALUES (%s,%s,%s,%s,%s,%s,'available',%s,%s,%s,%s,%s,NOW())
        """

        cursor.execute(query, (
            farmer_id,
            district_id,
            product_name,
            category,
            harvest_date,
            expiration_date,
            float(price) if price else 0,
            unit,
            int(quantity) if quantity else 0,
            description,
            image_path
        ))

        connection.commit()
        product_id = cursor.lastrowid
        connection.close()

        return jsonify({
            "message": "Product uploaded successfully",
            "product_id": product_id
        })

    except Exception as e:
        if 'connection' in locals():
            connection.rollback()
            connection.close()
        return jsonify({"error": f"Failed to upload product: {str(e)}"}), 500

    return jsonify({
        "message": "Product uploaded successfully",
        "product_id": product_id
    })

# allowing farmer to view their product

@product_routes.route("/farmer/<int:farmer_id>", methods=["GET"])
def get_farmer_products(farmer_id):

    connection = get_db_connection()
    cursor = connection.cursor()

    query = """
    SELECT *
    FROM products
    WHERE farmer_id = %s
    ORDER BY created_at DESC
    """

    cursor.execute(query, (farmer_id,))
    products = cursor.fetchall()

    connection.close()

    return jsonify(products)

# allowing farmer to update product

@product_routes.route("/update/<int:product_id>", methods=["PUT"])
def update_product(product_id):

    data = request.json

    connection = get_db_connection()
    cursor = connection.cursor()

    query = """
    UPDATE products
    SET price_per_unit=%s,
        quantity_available=%s,
        description=%s
    WHERE product_id=%s
    """

    cursor.execute(query, (
        data["price"],
        data["quantity"],
        data["description"],
        product_id
    ))

    connection.commit()
    connection.close()

    return jsonify({"message": "Product updated"})

# allowing farmer to delete their product

@product_routes.route("/delete/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):

    connection = get_db_connection()
    cursor = connection.cursor()

    query = "DELETE FROM products WHERE product_id=%s"

    cursor.execute(query, (product_id,))

    connection.commit()
    connection.close()

    return jsonify({"message": "Product deleted"})

