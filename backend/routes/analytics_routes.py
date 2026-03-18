from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from database.db import get_db_connection

analytics_routes = Blueprint("analytics_routes", __name__)

@analytics_routes.route("/dashboard", methods=["GET"])
@jwt_required()
def dashboard():
    connection = get_db_connection()
    cursor = connection.cursor()
    
    # Total users
    cursor.execute("SELECT COUNT(*) as total_users FROM users")
    total_users = cursor.fetchone()['total_users']
    
    # Total orders
    cursor.execute("SELECT COUNT(*) as total_orders FROM orders")
    total_orders = cursor.fetchone()['total_orders']
    
    # Total products available
    cursor.execute("SELECT COUNT(*) as available_products FROM products WHERE status = 'available'")
    available_products = cursor.fetchone()['available_products']
    
    # Recent orders (last 7 days)
    cursor.execute("SELECT COUNT(*) as recent_orders FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)")
    recent_orders = cursor.fetchone()['recent_orders']
    
    connection.close()
    
    return jsonify({
        "total_users": total_users,
        "total_orders": total_orders,
        "available_products": available_products,
        "recent_orders": recent_orders
    })

@analytics_routes.route("/sales-report", methods=["GET"])
@jwt_required()
def sales_report():
    connection = get_db_connection()
    cursor = connection.cursor()
    
    cursor.execute("""
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as orders_count,
            SUM(total_payment) as total_revenue
        FROM orders 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
    """)
    
    sales_data = cursor.fetchall()
    connection.close()
    
    return jsonify(sales_data)

def get_forecast_data(cursor):
    # Stub forecast data: (product_id, district_id) -> predicted_demand
    # In production, integrate ML model or external API
    forecasts = {
        (1, 1): 1000,  # Example: product 1 in district 1
        (2, 1): 500,
        # Add more based on historical data/ML
    }
    return forecasts

