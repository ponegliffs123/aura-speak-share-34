
import React from 'react';
import { Phone, Video, MessageSquare, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ContactListProps {
  onStartCall: (contact: any, type: 'voice' | 'video') => void;
  searchQuery: string;
}

const ContactList: React.FC<ContactListProps> = ({ onStartCall, searchQuery }) => {
  const contacts = [
    {
      id: '1',
      name: 'Sarah Johnson',
      phone: '+1 (555) 123-4567',
      avatar: 'SJ',
      online: true,
      status: 'Available'
    },
    {
      id: '2',
      name: 'Mike Chen',
      phone: '+1 (555) 987-6543',
      avatar: 'MC',
      online: false,
      status: 'Last seen 2 hours ago'
    },
    {
      id: '3',
      name: 'Emma Wilson',
      phone: '+1 (555) 456-7890',
      avatar: 'EW',
      online: true,
      status: 'In a meeting'
    },
    {
      id: '4',
      name: 'David Brown',
      phone: '+1 (555) 321-0987',
      avatar: 'DB',
      online: false,
      status: 'Last seen yesterday'
    },
    {
      id: '5',
      name: 'Lisa Garcia',
      phone: '+1 (555) 654-3210',
      avatar: 'LG',
      online: true,
      status: 'Available'
    }
  ];

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery)
  );

  return (
    <div className="px-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Contacts</h2>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10"
        >
          <UserPlus className="h-5 w-5" />
        </Button>
      </div>

      <div className="space-y-3">
        {filteredContacts.map((contact) => (
          <div
            key={contact.id}
            className="flex items-center space-x-3 p-4 bg-white/5 hover:bg-white/10 transition-all duration-200 rounded-xl"
          >
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-sm font-semibold">
                {contact.avatar}
              </div>
              {contact.online && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-white">{contact.name}</h3>
              <p className="text-sm text-white/60">{contact.phone}</p>
              <p className="text-xs text-white/50">{contact.status}</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
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
    </div>
  );
};

export default ContactList;
