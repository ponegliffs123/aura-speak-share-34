
import React, { useState } from 'react';
import { Camera, Image, FileText, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MediaPickerProps {
  onClose: () => void;
  onMediaSelect: (media: any) => void;
}

const MediaPicker: React.FC<MediaPickerProps> = ({ onClose, onMediaSelect }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const compressImage = (file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new globalThis.Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleMediaType = async (type: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    
    switch (type) {
      case 'camera':
        input.accept = 'image/*';
        input.capture = 'environment';
        break;
      case 'gallery':
        input.accept = 'image/*,video/*';
        break;
      case 'document':
        input.accept = '.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx';
        break;
    }
    
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files[0]) {
        const file = files[0];
        setIsProcessing(true);
        
        try {
          let fileUrl: string;
          
          // Compress images for better performance
          if (file.type.startsWith('image/') && type === 'camera') {
            console.log('Compressing camera image...');
            fileUrl = await compressImage(file, 1920, 0.8);
          } else {
            // For other files, read normally
            fileUrl = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.readAsDataURL(file);
            });
          }

          onMediaSelect({
            type,
            file,
            name: file.name,
            size: file.size,
            url: fileUrl
          });
        } catch (error) {
          console.error('Error processing file:', error);
        } finally {
          setIsProcessing(false);
        }
      }
    };
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
    
    if (!isProcessing) {
      onClose();
    }
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
            disabled={isProcessing}
            className="flex flex-col items-center space-y-2 p-4 h-auto bg-white/5 hover:bg-white/10 text-white rounded-xl disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="h-8 w-8 animate-spin" /> : <Camera className="h-8 w-8" />}
            <span className="text-sm">
              {isProcessing ? 'Processing...' : 'Camera'}
            </span>
          </Button>

          <Button
            onClick={() => handleMediaType('gallery')}
            variant="ghost"
            disabled={isProcessing}
            className="flex flex-col items-center space-y-2 p-4 h-auto bg-white/5 hover:bg-white/10 text-white rounded-xl disabled:opacity-50"
          >
            <Image className="h-8 w-8" />
            <span className="text-sm">Gallery</span>
          </Button>

          <Button
            onClick={() => handleMediaType('document')}
            variant="ghost"
            disabled={isProcessing}
            className="flex flex-col items-center space-y-2 p-4 h-auto bg-white/5 hover:bg-white/10 text-white rounded-xl disabled:opacity-50"
          >
            <FileText className="h-8 w-8" />
            <span className="text-sm">Document</span>
          </Button>
        </div>

        {isProcessing && (
          <div className="mt-4 text-center">
            <p className="text-sm text-white/70">
              Processing your image, please wait...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaPicker;
