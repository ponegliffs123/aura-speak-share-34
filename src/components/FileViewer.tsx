import React, { useState } from 'react';
import { X, Download, Share, ZoomIn, ZoomOut, RotateCw, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface FileViewerProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    id: string;
    type: 'image' | 'video' | 'audio' | 'document';
    url: string;
    name: string;
    size?: string;
  } | null;
}

const FileViewer: React.FC<FileViewerProps> = ({ isOpen, onClose, file }) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  if (!file) return null;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(100);
    setRotation(0);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: file.name,
          text: `Check out this ${file.type}`,
          url: file.url,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(file.url);
    }
  };

  const renderImageViewer = () => (
    <div className="relative w-full h-full flex items-center justify-center bg-black/90">
      <img
        src={file.url}
        alt={file.name}
        className="max-w-full max-h-full object-contain transition-transform duration-200"
        style={{
          transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
        }}
      />
      
      {/* Image Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 bg-black/80 backdrop-blur-sm rounded-lg p-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomOut}
          className="text-white hover:bg-white/20"
          disabled={zoom <= 25}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        
        <span className="text-white text-sm min-w-[60px] text-center">
          {zoom}%
        </span>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomIn}
          className="text-white hover:bg-white/20"
          disabled={zoom >= 300}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        
        <div className="w-px h-6 bg-white/20" />
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRotate}
          className="text-white hover:bg-white/20"
        >
          <RotateCw className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="text-white hover:bg-white/20"
        >
          Reset
        </Button>
      </div>
    </div>
  );

  const renderVideoViewer = () => (
    <div className="relative w-full h-full flex items-center justify-center bg-black/90">
      <video
        src={file.url}
        controls
        className="max-w-full max-h-full"
        autoPlay={false}
        preload="metadata"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );

  const renderAudioViewer = () => (
    <div className="w-full h-full flex items-center justify-center bg-black/90">
      <div className="text-center space-y-6">
        <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
          <div className="text-4xl">🎵</div>
        </div>
        <h3 className="text-xl font-semibold text-white">{file.name}</h3>
        <audio
          src={file.url}
          controls
          className="w-full max-w-md"
          preload="metadata"
        >
          Your browser does not support the audio tag.
        </audio>
      </div>
    </div>
  );

  const renderDocumentViewer = () => (
    <div className="w-full h-full flex items-center justify-center bg-black/90">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mx-auto">
          <div className="text-4xl">📄</div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">{file.name}</h3>
          {file.size && (
            <p className="text-white/60">{file.size}</p>
          )}
        </div>
        <div className="space-y-3">
          <Button
            onClick={handleDownload}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Document
          </Button>
          <p className="text-white/60 text-sm">
            Preview not available for this file type
          </p>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (file.type) {
      case 'image':
        return renderImageViewer();
      case 'video':
        return renderVideoViewer();
      case 'audio':
        return renderAudioViewer();
      case 'document':
        return renderDocumentViewer();
      default:
        return renderDocumentViewer();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-screen-lg w-full h-screen p-0 bg-black/95 border-none">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-black/80 backdrop-blur-sm border-b border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-white truncate max-w-md">
                {file.name}
              </h2>
              {file.size && (
                <p className="text-sm text-white/60">{file.size}</p>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                className="text-white hover:bg-white/20"
              >
                <Download className="h-5 w-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                className="text-white hover:bg-white/20"
              >
                <Share className="h-5 w-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="w-full h-full pt-20">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileViewer;