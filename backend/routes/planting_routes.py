from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.db import get_db_connection
from middleware.role_required import role_required
from routes.analytics_routes import get_forecast_data

planting_routes = Blueprint("planting_routes", __name__)

# allowing farmer to create Planting Plan

@planting_routes.route("/create", methods=["POST"])
@jwt_required()
@role_required("farmer")
def create_planting_plan():

    farmer_id = get_jwt_identity()
    data = request.json

    connection = get_db_connection()
    cursor = connection.cursor()

    query = """
    INSERT INTO planting_plans
    (farmer_id, product_id, district_id, expected_quantity,
     planting_date, expected_harvest_date)
    VALUES (%s,%s,%s,%s,%s,%s)
    """

    cursor.execute(query, (
        farmer_id,
        data["product_id"],
        data["district_id"],
        data["expected_quantity"],
        data["planting_date"],
        data["expected_harvest_date"]
    ))

    connection.commit()
    connection.close()

    return jsonify({"message": "Planting plan submitted"})

# Planned Supply API

@planting_routes.route("/planned-supply", methods=["GET"])
def get_planned_supply():

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    query = """
    SELECT
        product_id,
        district_id,
        SUM(expected_quantity) AS total_planned
    FROM planting_plans
    WHERE expected_harvest_date BETWEEN
          CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 MONTH)
    GROUP BY product_id, district_id
    """

    cursor.execute(query)

    data = cursor.fetchall()

    connection.close()

    return jsonify(data)



# Farmer-Specific Adjustments + Notifications

@planting_routes.route("/farmer-adjustments", methods=["GET"])
def farmer_adjustments():

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    # Get all planting plans
    cursor.execute("""
        SELECT
            plan_id,
            farmer_id,
            product_id,
            district_id,
            expected_quantity
        FROM planting_plans
    """)

    plans = cursor.fetchall()

    # Get forecast data
    forecast_data = get_forecast_data(cursor)

    # Group by (product, district)
    grouped = {}

    for p in plans:
        key = (p["product_id"], p["district_id"])

        if key not in grouped:
            grouped[key] = []

        grouped[key].append(p)

    results = []

    # Apply proportional allocation
    for key, farmers in grouped.items():

        product_id, district_id = key

        total_supply = sum(f["expected_quantity"] for f in farmers)
        predicted_demand = forecast_data.get(key, 0)

        # Skip if no forecast
        if predicted_demand == 0:
            continue

        difference = total_supply - predicted_demand

        for f in farmers:

            share = f["expected_quantity"] / total_supply
            adjustment = round(share * abs(difference), 2)

            if difference > 0:
                action = "reduce"
                new_quantity = f["expected_quantity"] - adjustment
            else:
                action = "increase"
                new_quantity = f["expected_quantity"] + adjustment

            # Create notification message
            message = (
                f"For product {product_id} in your district, "
                f"please {action} your planned production by {adjustment} units. "
                f"Recommended quantity: {round(new_quantity, 2)} units."
            )

            # 5️⃣ Check if notification already exists today
            cursor.execute("""
                SELECT notification_id
                FROM notifications
    WHERE plan_id = %s
    AND DATE(created_at) = CURDATE()
""", (f["plan_id"],))

existing = cursor.fetchone()

            # Insert notification into DB
            cursor.execute("""
                INSERT INTO notifications (farmer_id, plan_id, message)
                VALUES (%s, %s, %s)
            """, (f["farmer_id"], f["plan_id"], message))

            results.append({
                "farmer_id": f["farmer_id"],
                "plan_id": f["plan_id"],
                "product_id": product_id,
                "district_id": district_id,
                "current_quantity": f["expected_quantity"],
                "predicted_demand": predicted_demand,
                "total_supply": total_supply,
                "action": action,
                "adjustment": adjustment,
                "recommended_quantity": round(new_quantity, 2)
            })

    connection.commit()
    connection.close()

    return jsonify(results)

# allowing farmer to view notifications

@planting_routes.route("/notifications", methods=["GET"])
@jwt_required()
@role_required("farmer")
def get_notifications():

    farmer_id = get_jwt_identity()

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    cursor.execute("""
        SELECT notification_id, message, is_read, created_at
        FROM notifications
        WHERE farmer_id = %s
        ORDER BY created_at DESC
    """, (farmer_id,))

    data = cursor.fetchall()

    connection.close()

    return jsonify(data)