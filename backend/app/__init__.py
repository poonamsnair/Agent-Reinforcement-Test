import os
from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS # Import CORS

socketio = SocketIO()

def create_app(test_config=None):
    # Create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_mapping(
        SECRET_KEY='dev',
        OPENROUTER_API_KEY=os.environ.get('OPENROUTER_API_KEY', '')
    )

    if test_config is None:
        # Load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # Load the test config if passed in
        app.config.from_mapping(test_config)

    # Ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # Register blueprints
    from app.routes import main
    app.register_blueprint(main)

    # Initialize CORS for the Flask app, allowing requests from the frontend origin
    # You might want to restrict this to 'http://localhost:5173' in production
    CORS(app, resources={r"/api/*": {"origins": "*"}}) 

    # Initialize Socket.IO (keep existing CORS setting for Socket.IO)
    socketio.init_app(app, cors_allowed_origins="*")

    return app
