#!/bin/bash

# Create a virtual environment
echo "Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
pip install -r requirements.txt

# Set up environment variables
echo "Setting up environment variables..."
if [ ! -f .env ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo "IMPORTANT: Please edit the backend/.env file and add your OpenRouter API key."
else
    echo ".env file already exists. Skipping creation."
fi

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd ../frontend/frontend
npm install --legacy-peer-deps

# Build frontend
echo "Building frontend..."
npm run build

echo "Setup complete!"
echo "IMPORTANT: If you haven't already, edit backend/.env and add your OpenRouter API key."
echo "Then, you can run the application:"
echo "To start the backend: cd backend && source ../venv/bin/activate && python run.py"
echo "To start the frontend: cd frontend/frontend && npm run dev"
