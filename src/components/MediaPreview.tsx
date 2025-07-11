import React, { useState } from 'react';
import { X, Send, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface MediaPreviewProps {
  media: {
    type: string;
    file: File;
    name: string;
    size: number;
    url: string;
  } | null;
  onSend: (media: any, caption: string) => void;
  onCancel: () => void;
  onRetake: () => void;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({ media, onSend, onCancel, onRetake }) => {
  const [caption, setCaption] = useState('');

  if (!media) return null;

  const handleSend = () => {
    onSend(media, caption);
  };

  const renderPreview = () => {
    if (!media.file) return null;

    const fileType = media.file.type;

    if (fileType.startsWith('image/')) {
      return (
        <div className="flex-1 flex items-center justify-center bg-black/90 rounded-lg">
          <img
            src={media.url}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      );
    }

    if (fileType.startsWith('video/')) {
      return (
        <div className="flex-1 flex items-center justify-center bg-black/90 rounded-lg">
          <video
            src={media.url}
            controls
            className="max-w-full max-h-full object-contain rounded-lg"
            preload="metadata"
          />
        </div>
      );
    }

    if (fileType.startsWith('audio/')) {
      return (
        <div className="flex-1 flex items-center justify-center bg-black/90 rounded-lg">
          <div className="text-center space-y-4">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
              <div className="text-3xl">🎵</div>
            </div>
            <h3 className="text-lg font-semibold text-white">{media.name}</h3>
            <audio
              src={media.url}
              controls
              className="w-full max-w-sm"
              preload="metadata"
            />
          </div>
        </div>
      );
    }

    // For documents and other files
    return (
      <div className="flex-1 flex items-center justify-center bg-black/90 rounded-lg">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mx-auto">
            <div className="text-3xl">📄</div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{media.name}</h3>
            <p className="text-white/60">{(media.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex flex-col">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-lg border-b border-white/10 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="font-semibold text-white">Media Preview</h2>
              <p className="text-sm text-white/60">{media.name}</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onRetake}
            className="text-white hover:bg-white/20"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 p-4 min-h-0">
        {renderPreview()}
      </div>

      {/* Caption and Send */}
      <div className="bg-black/80 backdrop-blur-lg border-t border-white/10 p-4 flex-shrink-0">
        <div className="space-y-3">
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption..."
            className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-purple-400 resize-none"
            rows={2}
          />
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/60">
              {media.file.type.startsWith('image/') && '📷 Photo'}
              {media.file.type.startsWith('video/') && '🎥 Video'}
              {media.file.type.startsWith('audio/') && '🎵 Audio'}
              {!media.file.type.startsWith('image/') && 
               !media.file.type.startsWith('video/') && 
               !media.file.type.startsWith('audio/') && '📄 Document'}
            </div>
            
            <Button
              onClick={handleSend}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6"
            >
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaPreview;