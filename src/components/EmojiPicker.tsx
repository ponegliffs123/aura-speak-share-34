
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
  'Gestures': ['👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '🤲', '🤝', '🙏'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  'Objects': ['🎉', '🎊', '🎁', '🎈', '🎂', '🎄', '🎃', '🎆', '🎇', '✨', '🎯', '🎪', '🎨', '🎭', '🎪', '🎵', '🎶', '🎤', '🎧', '📱', '💻', '⌚', '📷', '🎮']
};

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('Smileys');

  return (
    <div className="absolute bottom-16 left-0 right-0 bg-black/90 backdrop-blur-lg border border-white/10 rounded-t-xl p-4 max-h-64 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex space-x-2">
          {Object.keys(EMOJI_CATEGORIES).map((category) => (
            <Button
              key={category}
              variant="ghost"
              size="sm"
              onClick={() => setActiveCategory(category)}
              className={`text-xs ${
                activeCategory === category
                  ? 'text-purple-400 bg-purple-400/20'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              {category}
            </Button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white/60 hover:text-white h-6 w-6"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto">
        {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map((emoji, index) => (
          <Button
            key={index}
            variant="ghost"
            className="h-8 w-8 p-0 text-lg hover:bg-white/10"
            onClick={() => {
              onEmojiSelect(emoji);
              onClose();
            }}
          >
            {emoji}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;
