from flask import Blueprint, request, jsonify, current_app
from database.db import get_db_connection
import uuid
import os

product_routes = Blueprint("product_routes", __name__)

# API to upload product

@product_routes.route("/upload", methods=["POST"])
def upload_product():

    farmer_id = request.form.get("farmer_id")
    district_id = request.form.get("district_id")
    product_name = request.form.get("product_name")
    category = request.form.get("category")
    harvest_date = request.form.get("harvest_date")
    expiration_date = request.form.get("expiration_date")
    price = request.form.get("price")
    unit = request.form.get("unit")
    quantity = request.form.get("quantity")
    description = request.form.get("description")

    image = request.files.get("image")

    image_path = None

    if image:
        filename = str(uuid.uuid4()) + "_" + image.filename
        filepath = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
        image.save(filepath)

        image_path = f"/uploads/crop_images/{filename}"

    connection = get_db_connection()
    cursor = connection.cursor()

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
        price,
        unit,
        quantity,
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

