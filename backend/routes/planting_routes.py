from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.db import get_db_connection
from middleware.role_required import role_required
from routes.analytics_routes import get_forecast_data

planting_routes = Blueprint("planting_routes", __name__)


def get_farmer_id_from_user(cursor, user_id):
    cursor.execute("SELECT farmer_id FROM farmers WHERE user_id = %s", (user_id,))
    row = cursor.fetchone()
    return row["farmer_id"] if row else None


@planting_routes.route("/create", methods=["POST"])
@jwt_required()
@role_required("farmer")
def create_planting_plan():

    user_id = get_jwt_identity()
    data = request.json

    required = ["product_id", "district_id", "expected_quantity", "expected_harvest_date"]
    for field in required:
        if not data or field not in data or data[field] in (None, ""):
            return jsonify({"error": f"Missing field: {field}"}), 400

    connection = get_db_connection()
    cursor = connection.cursor()

    farmer_id = get_farmer_id_from_user(cursor, user_id)
    if not farmer_id:
        connection.close()
        return jsonify({"error": "Farmer profile not found"}), 404

    cursor.execute("""
        INSERT INTO planting_plans
        (farmer_id, product_id, district_id, planted_quantity, expected_harvest_date)
        VALUES (%s, %s, %s, %s, %s)
    """, (
        farmer_id,
        data["product_id"],
        data["district_id"],
        data["expected_quantity"],
        data["expected_harvest_date"]
    ))

    connection.commit()
    connection.close()

    return jsonify({"message": "Planting plan submitted"}), 201


@planting_routes.route("/farmer/<int:farmer_id>", methods=["GET"])
@jwt_required()
def get_farmer_planting_plans(farmer_id):

    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            pp.plan_id,
            pp.planted_quantity,
            p.product_name,
            pp.district_id,
            pp.expected_harvest_date
        FROM planting_plans pp
        LEFT JOIN products p ON pp.product_id = p.product_id
        WHERE pp.farmer_id = %s
        ORDER BY pp.expected_harvest_date DESC
    """, (farmer_id,))

    data = cursor.fetchall()
    connection.close()

    return jsonify(data)


@planting_routes.route("/planned-supply", methods=["GET"])
def get_planned_supply():

    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT
            product_id,
            district_id,
            SUM(planted_quantity) AS total_planned
        FROM planting_plans
        WHERE expected_harvest_date BETWEEN
              CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 MONTH)
        GROUP BY product_id, district_id
    """)

    data = cursor.fetchall()
    connection.close()

    return jsonify(data)


@planting_routes.route("/farmer-adjustments", methods=["GET"])
def farmer_adjustments():

    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT plan_id, farmer_id, product_id, district_id, planted_quantity
        FROM planting_plans
    """)

    plans = cursor.fetchall()
    forecast_data = get_forecast_data(cursor)

    grouped = {}
    for p in plans:
        key = (p["product_id"], p["district_id"])
        grouped.setdefault(key, []).append(p)

    results = []

    for key, farmers in grouped.items():
        product_id, district_id = key

        total_supply = sum(f["planted_quantity"] for f in farmers)
        predicted_demand = forecast_data.get(key, 0)

        if predicted_demand == 0:
            continue

        difference = total_supply - predicted_demand

        for f in farmers:
            share = f["planted_quantity"] / total_supply
            adjustment = round(share * abs(difference), 2)

            if difference > 0:
                action = "reduce"
                new_quantity = f["planted_quantity"] - adjustment
            else:
                action = "increase"
                new_quantity = f["planted_quantity"] + adjustment

            message = (
                f"For product {product_id} in your district, "
                f"please {action} your planned production by {adjustment} units. "
                f"Recommended quantity: {round(new_quantity, 2)} units."
            )

            cursor.execute("""
                SELECT notification_id FROM notifications
                WHERE plan_id = %s AND DATE(created_at) = CURDATE()
            """, (f["plan_id"],))

            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO notifications (farmer_id, plan_id, message)
                    VALUES (%s, %s, %s)
                """, (f["farmer_id"], f["plan_id"], message))

            results.append({
                "farmer_id": f["farmer_id"],
                "plan_id": f["plan_id"],
                "product_id": product_id,
                "district_id": district_id,
                "current_quantity": f["planted_quantity"],
                "predicted_demand": predicted_demand,
                "total_supply": total_supply,
                "action": action,
                "adjustment": adjustment,
                "recommended_quantity": round(new_quantity, 2)
            })

    connection.commit()
    connection.close()

    return jsonify(results)


# In planting_routes.py — replace the notifications route with this:

@planting_routes.route("/notifications", methods=["GET"])
@jwt_required()
@role_required("farmer")
def get_notifications():

    user_id = get_jwt_identity()
    connection = get_db_connection()
    cursor = connection.cursor()

    farmer_id = get_farmer_id_from_user(cursor, user_id)
    if not farmer_id:
        connection.close()
        return jsonify([])

    # Auto-trigger adjustment calculation so notifications are always fresh
    # Only runs if it's a new month (no notification created this month yet)
    cursor.execute("""
        SELECT notification_id FROM notifications
        WHERE farmer_id = %s
        AND MONTH(created_at) = MONTH(CURDATE())
        AND YEAR(created_at) = YEAR(CURDATE())
        LIMIT 1
    """, (farmer_id,))

    already_notified_this_month = cursor.fetchone()

    if not already_notified_this_month:
        # Trigger the adjustment engine for all farmers
        _run_adjustments(cursor)
        connection.commit()

    cursor.execute("""
        SELECT notification_id, message, is_read, created_at
        FROM notifications
        WHERE farmer_id = %s
        ORDER BY created_at DESC
        LIMIT 20
    """, (farmer_id,))

    data = cursor.fetchall()
    connection.close()

    return jsonify(data)


@planting_routes.route("/mark-read/<int:notification_id>", methods=["PUT"])
@jwt_required()
def mark_notification_read(notification_id):

    user_id = get_jwt_identity()
    connection = get_db_connection()
    cursor = connection.cursor()

    farmer_id = get_farmer_id_from_user(cursor, user_id)
    if not farmer_id:
        connection.close()
        return jsonify({"error": "Farmer not found"}), 404

    cursor.execute("""
        UPDATE notifications SET is_read = TRUE
        WHERE notification_id = %s AND farmer_id = %s
    """, (notification_id, farmer_id))

    connection.commit()
    connection.close()

    return jsonify({"message": "Marked as read"})


def _run_adjustments(cursor):
    """
    Internal helper — runs the proportional allocation algorithm
    and inserts notifications. Called automatically when a farmer
    checks their notifications for the first time in a new month.
    """
    cursor.execute("""
        SELECT plan_id, farmer_id, product_id, district_id, planted_quantity
        FROM planting_plans
        WHERE MONTH(expected_harvest_date) = MONTH(DATE_ADD(CURDATE(), INTERVAL 1 MONTH))
    """)
    plans = cursor.fetchall()

    if not plans:
        return

    forecast_data = get_forecast_data(cursor)

    grouped = {}
    for p in plans:
        key = (p["product_id"], p["district_id"])
        grouped.setdefault(key, []).append(p)

    for key, farmers in grouped.items():
        product_id, district_id = key

        total_supply = sum(f["planted_quantity"] for f in farmers)
        predicted_demand = forecast_data.get(key, 0)

        if predicted_demand == 0:
            continue

        difference = total_supply - predicted_demand

        for f in farmers:
            # Skip if already notified this month
            cursor.execute("""
                SELECT notification_id FROM notifications
                WHERE plan_id = %s
                AND MONTH(created_at) = MONTH(CURDATE())
                AND YEAR(created_at) = YEAR(CURDATE())
            """, (f["plan_id"],))

            if cursor.fetchone():
                continue

            share = f["planted_quantity"] / total_supply
            adjustment = round(share * abs(difference), 2)

            if difference > 0:
                action = "reduce"
                new_quantity = f["planted_quantity"] - adjustment
                direction = "lower than"
            else:
                action = "increase"
                new_quantity = f["planted_quantity"] + adjustment
                direction = "higher than"

            # Get product name for a friendlier message
            cursor.execute(
                "SELECT product_name FROM products WHERE product_id = %s",
                (product_id,)
            )
            product_row = cursor.fetchone()
            product_name = product_row["product_name"] if product_row else f"Product #{product_id}"

            message = (
                f"Demand forecast for {product_name} next month is "
                f"{direction} current planned supply. "
                f"Please {action} your planned quantity by {adjustment} kg. "
                f"Recommended quantity: {round(new_quantity, 2)} kg "
                f"(your current plan: {f['planted_quantity']} kg)."
            )

            cursor.execute("""
                INSERT INTO notifications (farmer_id, plan_id, message)
                VALUES (%s, %s, %s)
            """, (f["farmer_id"], f["plan_id"], message))