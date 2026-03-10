from flask import Blueprint, request, jsonify
from database.db import get_db_connection

product_routes = Blueprint("product_routes", __name__)

@product_routes.route("/", methods=["GET"])
def get_products():

    district_id = request.args.get("district_id")

    connection = get_db_connection()
    cursor = connection.cursor()

    query = """
    SELECT 
        product_id,
        product_name,
        price_per_unit,
        quantity_available,
        created_at
    FROM products
    WHERE district_id = %s
    AND status = 'available'
    ORDER BY created_at DESC
    """

    cursor.execute(query, (district_id,))
    products = cursor.fetchall()

    connection.close()

    return jsonify(products)