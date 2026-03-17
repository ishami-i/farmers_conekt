from flask import Blueprint, request, jsonify, current_app
from database.db import get_db_connection
from flask_jwt_extended import jwt_required
from middleware.role_required import role_required
import uuid
import os

farmer_routes = Blueprint("farmer_routes", __name__)

# farmer profile creation

@farmer_routes.route("/create-profile", methods=["POST"])
def create_farmer_profile():

    data = request.json

    connection = get_db_connection()
    cursor = connection.cursor()

    query = """
    INSERT INTO farmers (user_id, district_id, rating, bio)
    VALUES (%s, %s, 0, %s)
    """

    cursor.execute(query, (
        data["user_id"],
        data.get("district_id"),
        data.get("bio")
    ))

    connection.commit()
    connection.close()

    return jsonify({"message": "Farmer profile created"})

# getting farmer profile

@farmer_routes.route("/profile/<int:user_id>",methods=["GET"])
@jwt_required()
@role_required("farmer")
def get_farmer_profile(user_id):

    connection = get_db_connection()
    cursor = connection.cursor()
    query = """
    SELECT f.*, u.full_name, u.phone_number, d.district_name
    FROM farmers f
    JOIN users u ON f.user_id = u.user_id
    LEFT JOIN districts d ON f.district_id = d.district_id
    WHERE f.user_id = %s
    """

    cursor.execute(query, (user_id,))
    farmer = cursor.fetchone()

    connection.close()

    return jsonify(farmer)

# update farmer profile

@farmer_routes.route("/profile/<int:user_id>", methods=["PUT"])
@jwt_required()
@role_required("farmer")
def update_farmer_profile(user_id):

    data = request.json or {}

    connection = get_db_connection()
    cursor = connection.cursor()

    # Update users table with full name and phone
    user_fields = []
    user_values = []
    if "full_name" in data:
        user_fields.append("full_name=%s")
        user_values.append(data["full_name"])
    if "phone_number" in data:
        user_fields.append("phone_number=%s")
        user_values.append(data["phone_number"])
    if user_fields:
        query = f"UPDATE users SET {', '.join(user_fields)} WHERE user_id = %s"
        cursor.execute(query, (*user_values, user_id))

    # Update farmers table with district and bio
    farmer_fields = []
    farmer_values = []
    if "district_id" in data:
        district_input = data.get("district_id")
        # If a name was submitted instead of an ID, resolve it
        if district_input and not str(district_input).isdigit():
            cursor.execute("SELECT district_id FROM districts WHERE district_name = %s", (district_input,))
            row = cursor.fetchone()
            district_input = row["district_id"] if row else None
        farmer_fields.append("district_id=%s")
        farmer_values.append(district_input)
    if "district" in data and not data.get("district_id"):
        district_input = data.get("district")
        if district_input and not str(district_input).isdigit():
            cursor.execute("SELECT district_id FROM districts WHERE district_name = %s", (district_input,))
            row = cursor.fetchone()
            district_input = row["district_id"] if row else None
        farmer_fields.append("district_id=%s")
        farmer_values.append(district_input)
    if "bio" in data:
        farmer_fields.append("bio=%s")
        farmer_values.append(data.get("bio"))
    if farmer_fields:
        query = f"UPDATE farmers SET {', '.join(farmer_fields)} WHERE user_id = %s"
        cursor.execute(query, (*farmer_values, user_id))

    connection.commit()
    connection.close()

    return jsonify({"message": "Profile updated"})

# farmer dsahboard stats

@farmer_routes.route("/dashboard/<int:farmer_id>", methods=["GET"])
@jwt_required()
@role_required("farmer")
def farmer_dashboard(farmer_id):

    connection = get_db_connection()
    cursor = connection.cursor()

    dashboard_query = """
    SELECT
        COUNT(DISTINCT p.product_id) AS total_products,
        IFNULL(SUM(od.quantity),0) AS total_sales,
        IFNULL(SUM(od.price * od.quantity),0) AS total_earnings
    FROM products p
    LEFT JOIN order_details od
        ON p.product_id = od.product_id
    WHERE p.farmer_id = %s
    """

    cursor.execute(dashboard_query, (farmer_id,))
    stats = cursor.fetchone()

    connection.close()

    return jsonify(stats)

# API to upload product

@farmer_routes.route("/upload", methods=["POST"])
@jwt_required()
@role_required("farmer")
def upload_product():

    data = request.form.to_dict()
    farmer_id = data.get("farmer_id")

    # Accept either a district_id or district name from the frontend
    district_input = data.get("district_id") or data.get("district")
    district_id = None
    if district_input:
        if str(district_input).isdigit():
            district_id = int(district_input)
        else:
            # Resolve district name to ID
            connection = get_db_connection()
            cursor = connection.cursor()
            cursor.execute("SELECT district_id FROM districts WHERE district_name = %s", (district_input,))
            row = cursor.fetchone()
            connection.close()
            district_id = row["district_id"] if row else None

    product_name = data.get("product_name")
    category = data.get("category")
    harvest_date = data.get("harvest_date")
    expiration_date = data.get("expiration_date")
    price = data.get("price")
    unit = data.get("unit")
    quantity = data.get("quantity")
    description = data.get("description")

    # Validate required fields
    missing = []
    if not farmer_id:
        missing.append('farmer_id')
    if not district_id:
        missing.append('district_id')
    if not product_name:
        missing.append('product_name')
    if not category:
        missing.append('category')
    if not price:
        missing.append('price')
    if not unit:
        missing.append('unit')
    if not quantity:
        missing.append('quantity')

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

@farmer_routes.route("/farmer/<int:farmer_id>", methods=["GET"])
@jwt_required()
@role_required("farmer")
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

@farmer_routes.route("/update/<int:product_id>", methods=["PUT"])
@jwt_required()
@role_required("farmer")
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

@farmer_routes.route("/delete/<int:product_id>", methods=["DELETE"])
@jwt_required()
@role_required("farmer")
def delete_product(product_id):

    connection = get_db_connection()
    cursor = connection.cursor()

    query = "DELETE FROM products WHERE product_id=%s"

    cursor.execute(query, (product_id,))

    connection.commit()
    connection.close()

    return jsonify({"message": "Product deleted"})