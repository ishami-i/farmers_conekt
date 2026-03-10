import pymysql

def get_db_connection():
    connection = pymysql.connect(
        host="localhost",
        user="root",
        password="yourpassword",
        database="agri_marketplace",
        cursorclass=pymysql.cursors.DictCursor
    )

    return connection