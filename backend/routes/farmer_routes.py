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