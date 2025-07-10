
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ChatList from '@/components/ChatList';
import ChatWindow from '@/components/ChatWindow';
import ContactList from '@/components/ContactList';
import CallInterface from '@/components/CallInterface';
import IncomingCallNotification from '@/components/IncomingCallNotification';
import { UserMenu } from '@/components/UserMenu';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { useIncomingCall } from '@/hooks/useIncomingCall';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { incomingCall, acceptCall, declineCall } = useIncomingCall();
  const [activeTab, setActiveTab] = useState<'chats' | 'contacts'>('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [callData, setCallData] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showChatWindow, setShowChatWindow] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Handle responsive design
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset chat window on mobile when needed
  useEffect(() => {
    if (isMobile && selectedChatId) {
      setShowChatWindow(true);
    } else if (!isMobile) {
      setShowChatWindow(false);
    }
  }, [isMobile, selectedChatId]);

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    if (isMobile) {
      setShowChatWindow(true);
    }
  };

  const handleBackToChats = () => {
    if (isMobile) {
      setShowChatWindow(false);
    }
    setSelectedChatId(null);
  };

  const handleStartCall = (contact: any, type: 'voice' | 'video') => {
    setCallData({ 
      contact: { 
        ...contact, 
        callType: type 
      },
      chatId: contact.chatId || selectedChatId || 'temp-call-id'
    });
    setIsInCall(true);
  };

  const handleEndCall = () => {
    setIsInCall(false);
    setCallData(null);
  };

  const handleAcceptIncomingCall = () => {
    const callInfo = acceptCall();
    if (callInfo) {
      setCallData({
        contact: {
          ...callInfo.callerInfo,
          callType: callInfo.offer.callType,
        },
        chatId: callInfo.chatId,
      });
      setIsInCall(true);
    }
  };

  const handleDeclineIncomingCall = () => {
    declineCall();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (isInCall) {
    return (
      <CallInterface
        contact={callData.contact}
        chatId={callData.chatId}
        onEndCall={handleEndCall}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Incoming Call Notification */}
      {incomingCall && (
        <IncomingCallNotification
          caller={incomingCall.callerInfo}
          callType={incomingCall.offer.callType}
          onAccept={handleAcceptIncomingCall}
          onDecline={handleDeclineIncomingCall}
        />
      )}
      {/* Mobile Layout */}
      {isMobile ? (
        <div className="h-screen flex flex-col">
          {!showChatWindow ? (
            <>
              {/* Mobile Header */}
              <div className="bg-black/20 backdrop-blur-lg border-b border-white/10 px-4 py-3">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-2xl font-bold text-white">Aura</h1>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                      <Settings className="h-5 w-5" />
                    </Button>
                    <ThemeToggle />
                    <UserMenu />
                  </div>
                </div>

                {/* Mobile Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-purple-400"
                  />
                </div>

                {/* Mobile Tabs */}
                <div className="flex mt-4 bg-white/10 rounded-lg p-1">
                  <Button
                    variant={activeTab === 'chats' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('chats')}
                    className={`flex-1 ${activeTab === 'chats' ? 'bg-purple-600 text-white' : 'text-white/70'}`}
                  >
                    Chats
                  </Button>
                  <Button
                    variant={activeTab === 'contacts' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('contacts')}
                    className={`flex-1 ${activeTab === 'contacts' ? 'bg-purple-600 text-white' : 'text-white/70'}`}
                  >
                    Contacts
                  </Button>
                </div>
              </div>

              {/* Mobile Content */}
              <div className="flex-1 overflow-hidden">
                {activeTab === 'chats' ? (
                  <ChatList
                    onSelectChat={handleSelectChat}
                    searchQuery={searchQuery}
                    selectedChatId={selectedChatId}
                  />
                ) : (
                  <ContactList
                    onStartCall={handleStartCall}
                    searchQuery={searchQuery}
                  />
                )}
              </div>
            </>
          ) : selectedChatId ? (
            <ChatWindow
              chatId={selectedChatId}
              onBack={handleBackToChats}
              onStartCall={handleStartCall}
            />
          ) : null}
        </div>
      ) : (
        /* Desktop Layout */
        <div className="h-screen flex">
          {/* Desktop Sidebar */}
          <div className="w-80 bg-black/20 backdrop-blur-lg border-r border-white/10 flex flex-col">
            {/* Desktop Header */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-white">Aura</h1>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                    <Settings className="h-5 w-5" />
                  </Button>
                  <ThemeToggle />
                  <UserMenu />
                </div>
              </div>

              {/* Desktop Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-purple-400"
                />
              </div>

              {/* Desktop Tabs */}
              <div className="flex bg-white/10 rounded-lg p-1">
                <Button
                  variant={activeTab === 'chats' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('chats')}
                  className={`flex-1 ${activeTab === 'chats' ? 'bg-purple-600 text-white' : 'text-white/70'}`}
                >
                  Chats
                </Button>
                <Button
                  variant={activeTab === 'contacts' ? 'default' : 'ghost'}
                  onClick={() => setActiveTab('contacts')}
                  className={`flex-1 ${activeTab === 'contacts' ? 'bg-purple-600 text-white' : 'text-white/70'}`}
                >
                  Contacts
                </Button>
              </div>
            </div>

            {/* Desktop Sidebar Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'chats' ? (
                <ChatList
                  onSelectChat={handleSelectChat}
                  searchQuery={searchQuery}
                  selectedChatId={selectedChatId}
                />
              ) : (
                <ContactList
                  onStartCall={handleStartCall}
                  searchQuery={searchQuery}
                />
              )}
            </div>
          </div>

          {/* Desktop Main Content */}
          <div className="flex-1">
            {selectedChatId ? (
              <ChatWindow
                chatId={selectedChatId}
                onBack={handleBackToChats}
                onStartCall={handleStartCall}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
                    A
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Welcome to Aura</h2>
                  <p className="text-white/60">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
