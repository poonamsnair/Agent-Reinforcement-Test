# Home Loan Assistant with Reinforcement Learning

A React application with a Flask backend that showcases a LangChain agent for home loan assistance with an automated reinforcement learning loop.

## Features

- **Chat Interface**: Talk to the home loan assistant agent
- **Reinforcement Learning**: The agent learns from user feedback
- **Visualization Panel**: See the reinforcement learning process in action
- **OpenRouter Integration**: Uses OpenRouter API for access to powerful language models
- **Real-time Communication**: WebSocket-based communication between frontend and backend

## Prerequisites

- Python 3.8+
- Node.js 16+
- npm or pnpm

## Installation

1. Clone the repository
2. Run the setup script:

```bash
chmod +x setup.sh
./setup.sh
```

The setup script will:
- Create a Python virtual environment
- Install backend dependencies
- Set up environment variables
- Install frontend dependencies
- Build the frontend

## Manual Setup

### Backend Setup

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
cd backend
pip install -r requirements.txt

# Set environment variables
echo "OPENROUTER_API_KEY=your_openrouter_api_key" > .env
```

### Frontend Setup

```bash
cd frontend/frontend
npm install
```

## Running the Application

### Start the Backend

```bash
cd backend
source ../venv/bin/activate  # On Windows: ..\venv\Scripts\activate
python run.py
```

The backend will start on http://localhost:5000

### Start the Frontend

```bash
cd frontend/frontend
npm start
```

The frontend will start on http://localhost:3000

## Using the Application

1. Open your browser and navigate to http://localhost:3000
2. Start chatting with the home loan assistant
3. Ask questions about mortgages, loan eligibility, or interest rates
4. Provide feedback on the agent's responses using the rating buttons
5. Watch the visualization panel to see how the agent learns from your feedback

## Architecture

### Backend

- **Flask**: Web framework
- **Flask-SocketIO**: WebSocket support
- **LangChain**: Framework for building LLM applications
- **OpenRouter**: API access to various language models

### Frontend

- **React**: UI framework
- **Tailwind CSS**: Styling
- **Socket.IO**: Real-time communication
- **Recharts**: Data visualization

## API Endpoints

- `GET /api/health`: Health check endpoint
- `GET /api/visualization`: Get visualization data

## WebSocket Events

### Client to Server

- `chat_message`: Send a message to the agent
- `feedback`: Send feedback on an agent response

### Server to Client

- `response`: Receive a response from the agent
- `visualization_update`: Receive updated visualization data

## Reinforcement Learning

The application implements a reinforcement learning loop where:

1. The agent responds to user queries
2. The user provides feedback (1-5 rating)
3. The feedback is used to update the agent's behavior
4. The learning process is visualized in real-time

## License

MIT
