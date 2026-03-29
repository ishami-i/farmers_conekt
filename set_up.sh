#!/bin/bash

set -e

echo "=== Farmer Conekt Setup Script ==="


# Configurable variables
DB_NAME="farmers_conekt"
DB_USER="my_user"
DB_PASS="my_password"
MYSQL_SERVICE="mysql"

# Check MySQL installation
if ! command -v mysql &> /dev/null; then
    echo "✗ MySQL is not installed. Please install it first."
    exit 1
fi

echo "✓ MySQL is installed."

# Detect OS
OS_TYPE="$(uname -s)"

echo "Detected OS: $OS_TYPE"

# Start MySQL depending on OS
start_mysql_linux() {
    if command -v systemctl &> /dev/null; then
        if systemctl is-active --quiet "$MYSQL_SERVICE"; then
            echo "✓ MySQL is already running."
        else
            echo "Starting MySQL with systemctl..."
            sudo systemctl start "$MYSQL_SERVICE"
        fi
    elif command -v service &> /dev/null; then
        echo "Starting MySQL with service..."
        sudo service "$MYSQL_SERVICE" start
    else
        echo "✗ No supported service manager found."
        exit 1
    fi
}

start_mysql_macos() {
    if command -v brew &> /dev/null; then
        echo "Using Homebrew to manage MySQL..."
        brew services start mysql || brew services start mysql@8.0
    else
        echo "Attempting launchctl..."
        launchctl load -w /Library/LaunchDaemons/com.oracle.oss.mysql.mysqld.plist 2>/dev/null || true
    fi
}

if [[ "$OS_TYPE" == "Linux" ]]; then
    start_mysql_linux
elif [[ "$OS_TYPE" == "Darwin" ]]; then
    start_mysql_macos
else
    echo "✗ Unsupported OS: $OS_TYPE"
    exit 1
fi

sleep 3

# Setup Database
echo "Setting up database..."

# Run schema (ignore errors if already exists)
mysql -u root < backend/database/schema.sql 2>/dev/null || echo "Schema already applied or skipped."

# Create user and grant privileges
mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

echo "✓ Database and user configured."

# Test DB connection
echo "Testing database connection..."
mysql -u "$DB_USER" -p"$DB_PASS" -e "USE $DB_NAME; SELECT 1;" >/dev/null 2>&1 && \
echo "✓ Database connection successful" || \
echo "✗ Database connection failed"

# Setup Python environment
echo "Setting up Python environment..."

if [ ! -d "backend/env" ]; then
    python3 -m venv backend/env
fi

source backend/env/bin/activate

pip install --upgrade pip
pip install -r requirements.txt

# Start Backend
cd backend || exit

export FLASK_APP=app.py
export FLASK_ENV=development

echo "Starting Flask backend..."
flask run --host=0.0.0.0 --port=5000
