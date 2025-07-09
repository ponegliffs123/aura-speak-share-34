
import React, { useState } from 'react';
import { Play, Download, Share, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MediaGallery: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('photos');

  const mediaItems = {
    photos: [
      { id: '1', type: 'image', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop', date: '2024-01-15' },
      { id: '2', type: 'image', url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&h=300&fit=crop', date: '2024-01-14' },
      { id: '3', type: 'image', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop', date: '2024-01-13' },
      { id: '4', type: 'image', url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&h=300&fit=crop', date: '2024-01-12' },
    ],
    videos: [
      { id: '1', type: 'video', url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop', date: '2024-01-15', duration: '2:30' },
      { id: '2', type: 'video', url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&h=300&fit=crop', date: '2024-01-14', duration: '1:45' },
    ],
    documents: [
      { id: '1', type: 'document', name: 'Project Report.pdf', size: '2.5 MB', date: '2024-01-15' },
      { id: '2', type: 'document', name: 'Meeting Notes.docx', size: '1.2 MB', date: '2024-01-14' },
      { id: '3', type: 'document', name: 'Budget.xlsx', size: '0.8 MB', date: '2024-01-13' },
    ]
  };

  const renderPhotos = () => (
    <div className="grid grid-cols-3 gap-2">
      {mediaItems.photos.map((photo) => (
        <div key={photo.id} className="relative group">
          <img
            src={photo.url}
            alt="Photo"
            className="w-full h-24 object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderVideos = () => (
    <div className="grid grid-cols-2 gap-3">
      {mediaItems.videos.map((video) => (
        <div key={video.id} className="relative group">
          <div className="relative">
            <img
              src={video.url}
              alt="Video"
              className="w-full h-32 object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-lg">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
              >
                <Play className="h-6 w-6" />
              </Button>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
              {video.duration}
            </div>
          </div>
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-3">
      {mediaItems.documents.map((doc) => (
        <div key={doc.id} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Download className="h-5 w-5 text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-white">{doc.name}</p>
            <p className="text-sm text-white/60">{doc.size} • {doc.date}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <Share className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-red-400 hover:bg-red-400/20"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-4 pb-20">
      <h2 className="text-xl font-semibold mb-4 text-white">Media Gallery</h2>
      
      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-white/10 p-1 rounded-lg">
        <Button
          variant="ghost"
          onClick={() => setSelectedTab('photos')}
          className={`flex-1 ${selectedTab === 'photos' ? 'bg-white/20 text-white' : 'text-white/70'}`}
        >
          Photos
        </Button>
        <Button
          variant="ghost"
          onClick={() => setSelectedTab('videos')}
          className={`flex-1 ${selectedTab === 'videos' ? 'bg-white/20 text-white' : 'text-white/70'}`}
        >
          Videos
        </Button>
        <Button
          variant="ghost"
          onClick={() => setSelectedTab('documents')}
          className={`flex-1 ${selectedTab === 'documents' ? 'bg-white/20 text-white' : 'text-white/70'}`}
        >
          Documents
        </Button>
      </div>

      {/* Content */}
      <div>
        {selectedTab === 'photos' && renderPhotos()}
        {selectedTab === 'videos' && renderVideos()}
        {selectedTab === 'documents' && renderDocuments()}
      </div>
    </div>
  );
};

export default MediaGallery;
