
import React, { useState } from 'react';
import { Phone, MessageSquare, Users, Settings, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserMenu } from '@/components/UserMenu';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import ContactList from './ContactList';
import CallInterface from './CallInterface';
import MediaGallery from './MediaGallery';

const AppLayout = () => {
  const [activeTab, setActiveTab] = useState('chats');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [callContact, setCallContact] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(true);

  const handleStartCall = (contact: any, type: 'voice' | 'video') => {
    setCallContact({ ...contact, callType: type });
    setIsInCall(true);
  };

  const handleEndCall = () => {
    setIsInCall(false);
    setCallContact(null);
  };

  if (isInCall && callContact) {
    return (
      <CallInterface
        contact={callContact}
        chatId={activeChatId || 'temp-call-id'}
        onEndCall={handleEndCall}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-white transition-colors duration-300">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-lg border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Aura
          </h1>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearchBar(!showSearchBar)}
              className="text-white hover:bg-white/10"
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (activeTab === 'chats') {
                  // Trigger new conversation
                  (document.querySelector('[data-new-conversation]') as HTMLButtonElement)?.click();
                } else if (activeTab === 'contacts') {
                  // Trigger add contact
                  (document.querySelector('[data-add-contact]') as HTMLButtonElement)?.click();
                }
              }}
              className="text-white hover:bg-white/10"
            >
              <Plus className="h-5 w-5" />
            </Button>
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      {showSearchBar && (
        <div className="px-4 py-3 max-w-md mx-auto">
          <Input
            placeholder="Search chats, contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-purple-400"
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 max-w-md mx-auto">
        {activeTab === 'chats' && !activeChatId && (
          <ChatList
            onSelectChat={setActiveChatId}
            searchQuery={searchQuery}
          />
        )}
        
        {activeTab === 'chats' && activeChatId && (
          <ChatWindow
            chatId={activeChatId}
            onBack={() => setActiveChatId(null)}
            onStartCall={handleStartCall}
          />
        )}
        
        {activeTab === 'contacts' && (
          <ContactList
            onStartCall={handleStartCall}
            searchQuery={searchQuery}
          />
        )}
        
        {activeTab === 'calls' && (
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-4">Recent Calls</h2>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">J{i}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">John Doe {i}</p>
                    <p className="text-sm text-white/60">Yesterday, 2:30 PM</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleStartCall({ name: `John Doe ${i}`, id: i }, 'voice')}
                    className="text-green-400 hover:bg-green-400/20"
                  >
                    <Phone className="h-5 w-5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'media' && (
          <MediaGallery />
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bg-black/20 backdrop-blur-lg border-t border-white/10 px-4 py-2 max-w-md mx-auto">
        <div className="flex justify-around">
          <Button
            variant="ghost"
            onClick={() => setActiveTab('chats')}
            className={`flex flex-col items-center space-y-1 ${
              activeTab === 'chats' ? 'text-purple-400' : 'text-white/60'
            }`}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-xs">Chats</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab('contacts')}
            className={`flex flex-col items-center space-y-1 ${
              activeTab === 'contacts' ? 'text-purple-400' : 'text-white/60'
            }`}
          >
            <Users className="h-5 w-5" />
            <span className="text-xs">Contacts</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab('calls')}
            className={`flex flex-col items-center space-y-1 ${
              activeTab === 'calls' ? 'text-purple-400' : 'text-white/60'
            }`}
          >
            <Phone className="h-5 w-5" />
            <span className="text-xs">Calls</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => setActiveTab('media')}
            className={`flex flex-col items-center space-y-1 ${
              activeTab === 'media' ? 'text-purple-400' : 'text-white/60'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span className="text-xs">Media</span>
          </Button>
        </div>
      </div>

      {/* Footer Credit */}
      <div className="text-center py-2 text-xs text-white/40">
        Made by Ponegliffss
      </div>
    </div>
  );
};

export default AppLayout;
