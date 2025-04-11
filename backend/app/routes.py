import os
from dotenv import load_dotenv
from flask import Blueprint, jsonify, request
from app import socketio
from app.agent import HomeLoanLangChainAgent # Use the new LangChain agent
from app.reinforcement import ReinforcementLoop

# Load environment variables
load_dotenv()

# Create blueprint
main = Blueprint('main', __name__)

# Initialize agent and reinforcement loop
agent = HomeLoanLangChainAgent() # Use the new LangChain agent
reinforcement_loop = ReinforcementLoop()

@main.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok"})

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print("Client connected")
    socketio.emit('response', {'data': 'Connected to the Home Loan Assistant'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print("Client disconnected")

@socketio.on('chat_message')
def handle_message(data):
    """Handle incoming chat messages"""
    user_message = data.get('message', '')
    print(f"Received message: {user_message}")
    
    # Get response from agent
    response, agent_thinking = agent.get_response(user_message)
    
    # Record interaction in reinforcement loop
    interaction_id = reinforcement_loop.record_interaction(user_message, response)
    
    # Send response back to client
    socketio.emit('response', {
        'message': response,
        'thinking': agent_thinking,
        'interaction_id': interaction_id
    })
    
    # Send initial visualization data
    viz_data = reinforcement_loop.get_visualization_data()
    socketio.emit('visualization_update', viz_data)

@socketio.on('feedback')
def handle_feedback(data):
    """Handle feedback on agent responses"""
    interaction_id = data.get('interaction_id')
    rating = data.get('rating')
    text_feedback = data.get('text', '') # Get text feedback, default to empty string
    
    print(f"Received feedback for interaction {interaction_id}: {rating}/5, Text: '{text_feedback}'")
    
    # Update reinforcement loop with feedback (including text)
    reinforcement_loop.record_feedback(interaction_id, rating, text_feedback)
    
    # Get updated visualization data
    viz_data = reinforcement_loop.get_visualization_data()
    
    # Send updated visualization data to client
    socketio.emit('visualization_update', viz_data)

@main.route('/api/visualization', methods=['GET'])
def get_visualization():
    """Get visualization data for the reinforcement learning process"""
    viz_data = reinforcement_loop.get_visualization_data()
    return jsonify(viz_data)

@main.route('/api/train_agent', methods=['POST'])
def train_agent():
    """
    Trigger PPO training for the agent using collected feedback.
    Returns before/after performance metrics.
    """
    print("Entered /api/train_agent endpoint")
    try:
        from app.ppo_train import train_ppo_agent
        # Capture metrics before training
        before_metrics = reinforcement_loop.get_visualization_data().get('performance', {})
        print("Starting PPO training...")
        model_path = train_ppo_agent(reinforcement_loop)
        print("PPO training finished, preparing response...")
        after_metrics = reinforcement_loop.get_visualization_data().get('performance', {})
        
        response_data = {
            "status": "training complete" if model_path else "no data",
            "model_path": model_path,
            "before_metrics": before_metrics,
            "after_metrics": after_metrics
        }
        
        # Emit visualization update AFTER training to refresh frontend data (including version)
        print("Emitting visualization update after training...")
        viz_data = reinforcement_loop.get_visualization_data()
        socketio.emit('visualization_update', viz_data)
        
        print("Returning JSON response from /api/train_agent")
        return jsonify(response_data) # Return the JSON response correctly

    except Exception as e:
        import traceback
        print("Error in /api/train_agent:", str(e))
        print(traceback.format_exc())
        return jsonify({
            "status": "error",
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 500
