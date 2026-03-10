from flask import Blueprint, request, jsonify
from database.db import get_db_connection
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

# getting farmers product

@farmer_routes.route("/products/<int:farmer_id>", methods=["GET"])
def get_farmer_products(farmer_id):

    connection = get_db_connection()
    cursor = connection.cursor()

    query = """
    SELECT
        product_id,
        product_name,
        product_category,
        price_per_unit,
        unit,
        quantity_available,
        harvest_date,
        expiration_date
    FROM products
    WHERE farmer_id = %s
    """

    cursor.execute(query, (farmer_id,))
    rows = cursor.fetchall()

    products = []

    for r in rows:
        products.append({
            "id": r[0],
            "name": r[1],
            "category": r[2],
            "price": r[3],
            "unit": r[4],
            "qty": r[5],
            "harvest": str(r[6]),
            "expiry": str(r[7])
        })

    connection.close()

    return jsonify(products)

# allowing farmer to delete their product

@farmer_routes.route("/product/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):

    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute("DELETE FROM products WHERE product_id=%s", (product_id,))
    connection.commit()
    connection.close()

    return jsonify({"message": "Product deleted"})

# allowing farmer to update product

@farmer_routes.route("/product/<int:product_id>", methods=["PUT"])
def update_product(product_id):

    data = request.json

    connection = get_db_connection()
    cursor = connection.cursor()

    query = """
    UPDATE products
    SET product_name=%s,
        product_category=%s,
        price_per_unit=%s,
        unit=%s,
        quantity_available=%s,
        harvest_date=%s,
        expiration_date=%s,
        description=%s
    WHERE product_id=%s
    """

    cursor.execute(query, (
        data["name"],
        data["category"],
        data["price"],
        data["unit"],
        data["qty"],
        data["harvest"],
        data["expiry"],
        data["desc"],
        product_id
    ))

    connection.commit()
    connection.close()

    return jsonify({"message": "Product updated"})