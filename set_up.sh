#!/bin/bash

# the script running the backend and the frontend of this project
# first check for mysql is installed, if not break the script.
if ! command -v mysql &> /dev/null
then
    echo "MySQL is not installed or not found in the system. Breaking the script."
    exit 1
fi

echo "MySQL is installed. Checking if the service is running."

# Check OS and start MySQL accordingly
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "Detected macOS. Checking MySQL service..."
    
    # Try brew services first
    if command -v brew &> /dev/null && brew services list | grep -q "mysql"; then
        if ! brew services list | grep -q "mysql.*started"; then
            echo "MySQL is not running. Starting with brew..."
            brew services start mysql
            sleep 2
            echo "✓ MySQL started successfully."
        else
            echo "✓ MySQL service is already running."
        fi
    else
        # Try launchctl for .dmg installation
        if launchctl list | grep -q "mysql"; then
            echo "✓ MySQL service is already running."
        else
            echo "MySQL is not running. Starting via launchctl..."
            launchctl start com.oracle.oss.mysql.mysqld
            sleep 2
            echo "✓ MySQL started successfully."
        fi
    fi
else
    # Linux
    SERVICE_NAME="mysql"
    if command -v systemctl &> /dev/null
    then
        if systemctl is-active --quiet "$SERVICE_NAME"; then
            echo "✓ MySQL service is already running."
        else
            echo "MySQL service is not running. Attempting to start it..."
            sudo systemctl start "$SERVICE_NAME"
            if [ $? -eq 0 ]; then
                echo "✓ MySQL service started successfully."
            else
                echo "✗ Failed to start MySQL service. Exiting."
                exit 1
            fi
        fi
    else
        # Fallback for older Linux
        if service "$SERVICE_NAME" status &> /dev/null; then
            echo "✓ MySQL service is already running."
        else
            echo "Starting MySQL service..."
            sudo service "$SERVICE_NAME" start
            if [ $? -ne 0 ]; then
                echo "✗ Failed to start MySQL service. Exiting."
                exit 1
            fi
            echo "✓ MySQL service started successfully."
        fi
    fi
fi

# Wait for MySQL to be ready
echo "Waiting for MySQL to be ready..."
sleep 2

# Create the database user with all permissions, and create the database
echo "Creating database and user..."
echo "Running schema (creates database + tables)..."

# 1. Run schema.sql (creates farmers_conekt DB + tables)
mysql -u root < backend/database/schema.sql 2>/dev/null || echo "Schema may already exist, continuing..."

echo "Creating user and granting privileges..."

# 2. Create user + grant access to the SAME database
mysql -u root <<EOF
CREATE USER IF NOT EXISTS 'my_user'@'localhost' IDENTIFIED BY 'my_password';
GRANT ALL PRIVILEGES ON farmers_conekt.* TO 'my_user'@'localhost';
FLUSH PRIVILEGES;
EOF

# Test connection with the new user (optional)
echo "Testing new user connection..."
mysql -u my_user -p'my_password' farmers_conekt -e "SELECT 1;" 2>/dev/null && echo "✓ User setup successful" || echo "✗ User setup failed"

echo "Database and user setup completed."

# Creating env file for flask and installing the dependencies
echo "Setting up backend..."

# Create virtual environment only if it doesn't exist
if [ ! -d "backend/env" ]; then
    echo "Creating virtual environment..."
    python3 -m venv backend/env
fi

# Activate environment
source backend/env/bin/activate

# Install dependencies from ROOT (important)
pip install --upgrade pip
pip install -r requirements.txt

cd backend || exit

export FLASK_APP=app.py
export FLASK_ENV=development

echo "Starting Flask backend..."
flask run