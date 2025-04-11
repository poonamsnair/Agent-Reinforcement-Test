import React, { useState } from 'react'; // Import useState

interface ChatMessageProps {
  message: {
    type: 'user' | 'assistant' | 'system';
    content: string;
    thinking?: string; // Thinking process is optional
  };
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { type, content, thinking } = message;
  const [showThinking, setShowThinking] = useState(false); // State for visibility

  // Determine styling based on message type
  const getMessageStyle = () => {
    switch (type) {
      case 'user':
        return 'bg-primary-100 text-gray-800 ml-auto';
      case 'assistant':
        return 'bg-secondary-100 text-gray-800 mr-auto';
      case 'system':
        return 'bg-gray-200 text-gray-600 mx-auto text-center text-xs italic'; // Centered system messages
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Determine avatar based on message type
  const getAvatar = () => {
    switch (type) {
      case 'user':
        return (
          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white flex-shrink-0">
            U
          </div>
        );
      case 'assistant':
        return (
          <div className="w-8 h-8 rounded-full bg-secondary-500 flex items-center justify-center text-white flex-shrink-0">
            A
          </div>
        );
      case 'system':
         // No avatar for system messages
        return null;
      default:
        return null;
    }
  };
  
  // System messages span full width
  if (type === 'system') {
    return (
       <div className={`flex justify-center mb-4`}>
         <div className={`rounded-lg px-4 py-1 ${getMessageStyle()}`}>
           {content}
         </div>
       </div>
    );
  }

  return (
    <div className={`flex ${type === 'user' ? 'justify-end' : 'justify-start'} mb-4 items-end`}>
      {/* Avatar for Assistant */}
      {type === 'assistant' && (
        <div className="mr-2"> 
          {getAvatar()}
        </div>
      )}
      
      {/* Message Bubble and Thinking Toggle */}
      <div className={`flex flex-col ${type === 'user' ? 'items-end' : 'items-start'} max-w-[75%]`}>
        <div className={`rounded-lg px-4 py-2 ${getMessageStyle()}`}>
          {content}
        </div>
        
        {/* Show thinking process toggle for assistant messages if thinking data exists */}
        {type === 'assistant' && thinking && (
          <div className="mt-1">
            <button 
              className="text-xs text-gray-500 hover:text-primary-600 focus:outline-none"
              onClick={() => setShowThinking(!showThinking)} // Toggle state on click
            >
              {showThinking ? 'Hide thinking process' : 'Show thinking process'}
            </button>
            {/* Conditionally render thinking process */}
            {showThinking && (
              <pre className="mt-1 p-2 bg-gray-100 border border-gray-200 rounded text-xs whitespace-pre-wrap text-left w-full">
                {thinking}
              </pre>
            )}
          </div>
        )}
      </div>
      
      {/* Avatar for User */}
      {type === 'user' && (
        <div className="ml-2">
          {getAvatar()}
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
