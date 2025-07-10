import React from 'react';

interface TypingIndicatorProps {
  isVisible: boolean;
  userNames: string[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isVisible, userNames }) => {
  if (!isVisible || userNames.length === 0) return null;

  const getTypingText = () => {
    if (userNames.length === 1) {
      return `${userNames[0]} is typing...`;
    } else if (userNames.length === 2) {
      return `${userNames[0]} and ${userNames[1]} are typing...`;
    } else {
      return `${userNames[0]} and ${userNames.length - 1} others are typing...`;
    }
  };

  return (
    <div className="flex items-center space-x-3 p-4 animate-fade-in">
      <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center">
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
      <div className="flex-1">
        <p className="text-sm text-white/70 italic">
          {getTypingText()}
        </p>
      </div>
    </div>
  );
};

export default TypingIndicator;