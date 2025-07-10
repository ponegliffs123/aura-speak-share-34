import React from 'react';
import { Check, CheckCheck, Eye } from 'lucide-react';

interface MessageStatusIndicatorProps {
  status: 'sending' | 'delivered' | 'read';
  isOwnMessage: boolean;
}

const MessageStatusIndicator: React.FC<MessageStatusIndicatorProps> = ({ 
  status, 
  isOwnMessage 
}) => {
  if (!isOwnMessage) return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return (
          <div className="w-3 h-3 border border-white/30 border-t-white/70 rounded-full animate-spin" />
        );
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-white/60" />;
      case 'read':
        return <Eye className="h-3 w-3 text-blue-400" />;
      default:
        return <Check className="h-3 w-3 text-white/40" />;
    }
  };

  return (
    <div className="flex items-center mt-1">
      {getStatusIcon()}
    </div>
  );
};

export default MessageStatusIndicator;