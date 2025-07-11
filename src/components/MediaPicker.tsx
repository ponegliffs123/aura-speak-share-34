
import React from 'react';
import { Camera, Image, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MediaPickerProps {
  onClose: () => void;
  onMediaSelect: (media: any) => void;
}

const MediaPicker: React.FC<MediaPickerProps> = ({ onClose, onMediaSelect }) => {
  const handleMediaType = (type: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    
    switch (type) {
      case 'camera':
        input.accept = 'image/*,video/*';
        input.capture = 'environment';
        break;
      case 'gallery':
        input.accept = 'image/*,video/*';
        break;
      case 'document':
        input.accept = '.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx';
        break;
    }
    
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files[0]) {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          onMediaSelect({
            type,
            file,
            name: file.name,
            size: file.size,
            url: e.target?.result
          });
        };
        reader.readAsDataURL(file);
      }
    };
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
      <div className="bg-white/10 backdrop-blur-lg w-full p-6 rounded-t-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Share Media</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Button
            onClick={() => handleMediaType('camera')}
            variant="ghost"
            className="flex flex-col items-center space-y-2 p-4 h-auto bg-white/5 hover:bg-white/10 text-white rounded-xl"
          >
            <Camera className="h-8 w-8" />
            <span className="text-sm">Camera</span>
          </Button>

          <Button
            onClick={() => handleMediaType('gallery')}
            variant="ghost"
            className="flex flex-col items-center space-y-2 p-4 h-auto bg-white/5 hover:bg-white/10 text-white rounded-xl"
          >
            <Image className="h-8 w-8" />
            <span className="text-sm">Gallery</span>
          </Button>

          <Button
            onClick={() => handleMediaType('document')}
            variant="ghost"
            className="flex flex-col items-center space-y-2 p-4 h-auto bg-white/5 hover:bg-white/10 text-white rounded-xl"
          >
            <FileText className="h-8 w-8" />
            <span className="text-sm">Document</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MediaPicker;
