import React, { useState } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
}

const TOOL_OPTIONS = [
  { value: '', label: 'General Chat', template: '' },
  { value: 'mortgage_calculator', label: 'Mortgage Calculator', template: 'principal=300000, rate=6.5, term=30' },
  { value: 'loan_eligibility', label: 'Eligibility Checker', template: 'income=75000, credit_score=720, dti=35' },
  { value: 'interest_rate_info', label: 'Interest Rate Info', template: 'current rates' }
];

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');
  const [selectedTool, setSelectedTool] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disabled) {
      let msg = message;
      if (selectedTool) {
        // Format: /tool tool_name params
        msg = `/tool ${selectedTool} ${message}`;
      }
      if (msg.trim()) {
        onSendMessage(msg);
        setMessage('');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <select
        value={selectedTool}
        onChange={e => {
          const tool = TOOL_OPTIONS.find(opt => opt.value === e.target.value);
          setSelectedTool(e.target.value);
          setMessage(tool ? tool.template : '');
        }}
        disabled={disabled}
        className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {TOOL_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={disabled ? "Connecting to server..." : selectedTool ? "Enter tool parameters..." : "Ask about home loans..."}
        disabled={disabled}
        className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      <button
        type="submit"
        disabled={disabled || !message.trim()}
        className="bg-primary-600 text-white p-3 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-400"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </form>
  );
};

export default ChatInput;
