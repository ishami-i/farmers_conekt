from flask import Blueprint, request, jsonify
from database.db import get_db_connection

farmer_routes = Blueprint("farmer_routes", __name__)

# farmer profile creation

@farmer_routes.route("/create-profile", methods=["POST"])
def create_farmer_profile():

    data = request.json

    connection = get_db_connection()
    cursor = connection.cursor()

    query = """
    INSERT INTO farmers (user_id, rating, bio)
    VALUES (%s, 0, %s)
    """

    cursor.execute(query, (
        data["user_id"],
        data["bio"]
    ))

    connection.commit()
    connection.close()

    return jsonify({"message": "Farmer profile created"})

# getting farmer profile

@farmer_routes.route("/profile/<int:user_id>",methods=["GET"])
def get_farmer_profile(user_id):

    connection = get_db_connection()
    cursor = connection.cursor()
     query = """
    SELECT f.*, u.full_name, u.phone_number
    FROM farmers f
    JOIN users u ON f.user_id = u.user_id
    WHERE f.user_id = %s
    """

    cursor.execute(query, (user_id,))
    farmer = cursor.fetchone()

    connection.close()

    return jsonify(farmer)

# API to upload product

@farmer_routes.route("/upload", methods=["POST"])
def upload_product():

    data = request.json

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
        data["farmer_id"],
        data["district_id"],
        data["product_name"],
        data["category"],
        data["harvest_date"],
        data["expiration_date"],
        data["price"],
        data["unit"],
        data["quantity"],
        data["description"],
        data["image_url"]
    ))

    connection.commit()
    connection.close()

    return jsonify({"message": "Product uploaded successfully"})

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

# farmer dsahboard stats

@farmer_routes.route("/dashboard/<int:farmer_id>", methods=["GET"])
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