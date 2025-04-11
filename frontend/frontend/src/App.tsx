import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Components
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import VisualizationPanel from './components/VisualizationPanel';
import FeedbackButtons from './components/FeedbackButtons';

interface Message {
  type: "user" | "system" | "assistant";
  content: string;
  thinking?: string;
}

import Docs from './components/Docs';

const App = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [connected, setConnected] = useState<boolean>(false);
  const [visualizationData, setVisualizationData] = useState<any>(null);
  const [lastInteractionId, setLastInteractionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'visualization' | 'docs'>('chat');
  const [isThinking, setIsThinking] = useState<boolean>(false); // Add thinking state
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Connect to WebSocket server
  useEffect(() => {
    // Connect to the Flask server
    socketRef.current = io('http://localhost:5001');

    // Handle connection
    socketRef.current.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
      setMessages(prev => [...prev, { 
        type: 'system', 
        content: 'Connected to Home Loan Assistant. How can I help you today?' 
      }]);
    });

    // Handle disconnection
    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
      setMessages(prev => [...prev, { 
        type: 'system', 
        content: 'Disconnected from server. Please refresh the page to reconnect.' 
      }]);
    });

    // Handle incoming messages
    socketRef.current.on('response', (data) => {
      console.log('Received response:', data);
      if (data.message) {
        setMessages(prev => [...prev, { 
          type: 'assistant', 
          content: data.message,
          thinking: data.thinking || ''
        }]);
        
        // Store the interaction ID if provided
        if (data.interaction_id) {
          setLastInteractionId(data.interaction_id);
        }
      }
      setIsThinking(false); // Stop thinking indicator when response arrives
    });

    // Handle visualization updates
    socketRef.current.on('visualization_update', (data) => {
      console.log('Received visualization update:', data);
      setVisualizationData(data);
    });

    // Cleanup on component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message to server
  const sendMessage = (message: string) => {
    if (message.trim() === '') return;
    
    // Add user message to chat
    setMessages(prev => [...prev, { type: 'user', content: message }]);
    setIsThinking(true); // Start thinking indicator
    setLastInteractionId(null); // Clear previous interaction ID for feedback
    
    // Send to server
    if (socketRef.current) {
      socketRef.current.emit('chat_message', { message });
    }
  };

  // Send feedback to server
  const sendFeedback = (rating: number, text: string) => { // Accept text feedback
    if (!lastInteractionId) return;
    
    if (socketRef.current) {
      socketRef.current.emit('feedback', { 
        interaction_id: lastInteractionId,
        rating,
        text // Send text feedback
      });
      
      // Add feedback confirmation to chat
      let feedbackMessage = `Thank you for your feedback! (Rating: ${rating}/5`;
      if (text.trim()) {
        feedbackMessage += ` - Comment: "${text.trim()}")`;
      } else {
        feedbackMessage += `)`;
      }
      setMessages(prev => [...prev, { 
        type: 'system', 
        content: feedbackMessage 
      }]);
      
      // Reset last interaction ID
      setLastInteractionId(null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Top Navigation Tabs */}
      <div className="flex bg-primary-800 text-white">
        <button
          className={`px-6 py-3 font-semibold focus:outline-none ${activeTab === 'chat' ? 'bg-primary-700' : 'bg-primary-800'} hover:bg-primary-600`}
          onClick={() => setActiveTab('chat')}
        >
          Chat
        </button>
        <button
          className={`px-6 py-3 font-semibold focus:outline-none ${activeTab === 'visualization' ? 'bg-primary-700' : 'bg-primary-800'} hover:bg-primary-600`}
          onClick={() => setActiveTab('visualization')}
        >
          Visualization
        </button>
        <button
          className={`px-6 py-3 font-semibold focus:outline-none ${activeTab === 'docs' ? 'bg-primary-700' : 'bg-primary-800'} hover:bg-primary-600`}
          onClick={() => setActiveTab('docs')}
        >
          Docs
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row h-full">
        {/* On mobile, show only the active tab */}
        <div className="flex-1 flex flex-col md:hidden">
          {activeTab === 'chat' && (
            <div className="flex flex-col w-full h-full border-r border-gray-300">
              <div className="bg-primary-700 text-white p-4">
                <h1 className="text-xl font-bold">Home Loan Assistant</h1>
                <p className="text-sm">Powered by LangChain and Reinforcement Learning</p>
              </div>
              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                  <ChatMessage 
                    key={index} 
                    message={msg} 
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
              {/* Feedback Buttons */}
              {lastInteractionId && (
                <div className="p-2 bg-gray-100 border-t border-gray-300">
                  <FeedbackButtons onFeedback={sendFeedback} />
                </div>
              )}
              {/* Input Area */}
              <div className="p-4 border-t border-gray-300">
                <ChatInput 
                  onSendMessage={sendMessage} 
                  disabled={!connected} 
                />
              </div>
            </div>
          )}
          {activeTab === 'visualization' && (
            <div className="flex flex-col w-full h-full bg-white">
              <div className="bg-secondary-700 text-white p-4">
                <h2 className="text-xl font-bold">Reinforcement Learning Visualization</h2>
                <p className="text-sm">Watch the agent learn from your feedback</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {visualizationData ? (
                  <VisualizationPanel data={visualizationData} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">
                      Interact with the assistant and provide feedback to see the learning visualization
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === 'docs' && (
            <div className="flex flex-col w-full h-full bg-white">
              <Docs />
            </div>
          )}
        </div>
        {/* On desktop, show Chat and Visualization side by side, Docs as overlay */}
        <div className="hidden md:flex flex-row w-full h-full">
          {/* Chat Panel */}
          <div className="flex flex-col w-1/2 h-full border-r border-gray-300">
            <div className="bg-primary-700 text-white p-4">
              <h1 className="text-xl font-bold">Home Loan Assistant</h1>
              <p className="text-sm">Powered by LangChain and Reinforcement Learning</p>
            </div>
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => (
                <ChatMessage 
                  key={index} 
                  message={msg} 
                />
              ))}
              {/* Show thinking indicator if agent is processing */}
              {isThinking && (
                 <ChatMessage message={{ type: 'assistant', content: 'Thinking...' }} />
              )}
              <div ref={messagesEndRef} />
            </div>
            {/* Feedback Buttons */}
            {lastInteractionId && (
              <div className="p-2 bg-gray-100 border-t border-gray-300">
                <FeedbackButtons onFeedback={sendFeedback} />
              </div>
            )}
            {/* Input Area */}
            <div className="p-4 border-t border-gray-300">
              <ChatInput 
                onSendMessage={sendMessage} 
                disabled={!connected} 
              />
            </div>
          </div>
          {/* Visualization Panel */}
          <div className="flex flex-col w-1/2 h-full bg-white">
            <div className="bg-secondary-700 text-white p-4">
              <h2 className="text-xl font-bold">Reinforcement Learning Visualization</h2>
              <p className="text-sm">Watch the agent learn from your feedback</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {visualizationData ? (
                <VisualizationPanel data={visualizationData} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">
                    Interact with the assistant and provide feedback to see the learning visualization
                  </p>
                </div>
              )}
            </div>
          </div>
          {/* Docs Overlay */}
          {activeTab === 'docs' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl h-[80vh] overflow-y-auto">
                <Docs />
                <div className="flex justify-end p-4">
                  <button
                    className="px-4 py-2 bg-primary-700 text-white rounded hover:bg-primary-800"
                    onClick={() => setActiveTab('chat')}
                  >
                    Close Docs
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
