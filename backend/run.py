import os
from dotenv import load_dotenv
from app import create_app, socketio

# Load environment variables from .env file in the current directory (backend/)
# By default, load_dotenv looks for .env in the current working directory or parent directories.
# Since we run `python run.py` from within the `backend` directory, it should find `backend/.env`.
load_dotenv() 

# Check if the key was loaded successfully
api_key = os.environ.get('OPENROUTER_API_KEY')
if not api_key:
    print("ERROR: OPENROUTER_API_KEY not found in environment variables. Make sure it's set in backend/.env")
    # Optionally, exit or raise an error here if the key is critical
    # import sys
    # sys.exit("API key is missing.")

# Create Flask app
app = create_app()

if __name__ == '__main__':
    # Run the app with Socket.IO
    print("Starting Home Loan Assistant server...")
    print(f"OpenRouter API Key: {os.environ.get('OPENROUTER_API_KEY')[:10]}...")
    socketio.run(app, host='0.0.0.0', port=5001, debug=True)
