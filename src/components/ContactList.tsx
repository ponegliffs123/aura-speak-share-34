
import React, { useState, useEffect } from 'react';
import { Phone, Video, MessageSquare, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useChats } from '@/hooks/useChats';
import UserSearch from './UserSearch';

interface Contact {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  online?: boolean;
  status?: string;
}

interface ContactListProps {
  onStartCall: (contact: any, type: 'voice' | 'video') => void;
  searchQuery: string;
}

const ContactList: React.FC<ContactListProps> = ({ onStartCall, searchQuery }) => {
  const { user } = useAuth();
  const { createOrGetDMChat } = useChats();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserSearch, setShowUserSearch] = useState(false);

  const fetchContacts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .neq('id', user.id)
        .limit(20);

      if (error) throw error;
      
      // Add mock online status for display purposes
      const contactsWithStatus = (data || []).map(contact => ({
        ...contact,
        online: Math.random() > 0.5, // Random online status for demo
        status: Math.random() > 0.5 ? 'Available' : 'Last seen recently'
      }));
      
      setContacts(contactsWithStatus);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [user]);

  const filteredContacts = contacts.filter(contact => {
    const name = contact.full_name || contact.username || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getDisplayName = (contact: Contact) => {
    return contact.full_name || contact.username || 'Unknown User';
  };

  const getInitials = (contact: Contact) => {
    const name = getDisplayName(contact);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleStartChat = async (contact: Contact) => {
    const chatId = await createOrGetDMChat(contact.id);
    if (chatId) {
      // You can add navigation to the chat here if needed
      console.log('Chat created/found:', chatId);
    }
  };

  const handleChatCreated = (chatId: string) => {
    setShowUserSearch(false);
    // Navigate to the chat if needed
    console.log('New chat created:', chatId);
  };

  if (loading) {
    return (
      <div className="px-4 pb-20 flex items-center justify-center h-32">
        <div className="text-white/60">Loading contacts...</div>
      </div>
    );
  }

  return (
    <>
      <div className="px-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Contacts</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowUserSearch(true)}
            className="text-white hover:bg-white/10"
          >
            <UserPlus className="h-5 w-5" />
          </Button>
        </div>

        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <UserPlus className="h-12 w-12 text-white/30 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No contacts yet</h3>
            <p className="text-white/60 text-center mb-4">
              Click the + button above to add contacts and start conversations.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center space-x-3 p-4 bg-white/5 hover:bg-white/10 transition-all duration-200 rounded-xl"
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-sm font-semibold">
                    {getInitials(contact)}
                  </div>
                  {contact.online && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{getDisplayName(contact)}</h3>
                  {contact.username && (
                    <p className="text-sm text-white/60">@{contact.username}</p>
                  )}
                  <p className="text-xs text-white/50">{contact.status}</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleStartChat(contact)}
                    className="text-white hover:bg-white/10"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onStartCall(contact, 'voice')}
                    className="text-green-400 hover:bg-green-400/20"
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onStartCall(contact, 'video')}
                    className="text-blue-400 hover:bg-blue-400/20"
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <UserSearch
        isOpen={showUserSearch}
        onClose={() => setShowUserSearch(false)}
        onChatCreated={handleChatCreated}
      />
    </>
  );
};

export default ContactList;
