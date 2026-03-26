import requests
from flask import current_app

def initiate_payment(payment):
    url = "https://api.flutterwave.com/v3/charges?type=mobile_money_rwanda"

    payload = {
        "amount": payment.amount,
        "currency": "RWF",
        "email": payment.email,
        "tx_ref": payment.tx_ref,
        "order_id": payment.order_id,
        "phone_number": payment.phone,
        "fullname": "Customer"
    }

    headers = {
        "Authorization": f"Bearer {current_app.config.get('FLW_SECRET_KEY')}",
        "Content-Type": "application/json"
    }

    response = requests.post(url, json=payload, headers=headers)
    return response.json()
