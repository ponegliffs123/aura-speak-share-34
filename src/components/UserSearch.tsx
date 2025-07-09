
import React, { useState, useEffect } from 'react';
import { Search, X, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useChats } from '@/hooks/useChats';

interface User {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

interface UserSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (chatId: string) => void;
}

const UserSearch: React.FC<UserSearchProps> = ({ isOpen, onClose, onChatCreated }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const { user: currentUser } = useAuth();
  const { createOrGetDMChat } = useChats();

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .neq('id', currentUser?.id) // Exclude current user
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  const handleCreateChat = async (userId: string) => {
    const chatId = await createOrGetDMChat(userId);
    if (chatId) {
      onChatCreated(chatId);
      onClose();
    }
  };

  const getDisplayName = (user: User) => {
    return user.full_name || user.username || 'Unknown User';
  };

  const getInitials = (user: User) => {
    const name = getDisplayName(user);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-black/90 backdrop-blur-lg border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Start New Conversation</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
            <Input
              placeholder="Search users by name or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-purple-400"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 text-white/60 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center py-4 text-white/60">Searching...</div>
            ) : users.length === 0 && searchQuery ? (
              <div className="text-center py-4 text-white/60">No users found</div>
            ) : users.length === 0 ? (
              <div className="text-center py-4 text-white/60">Start typing to search for users</div>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-sm font-semibold text-white">
                    {getInitials(user)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{getDisplayName(user)}</h3>
                    {user.username && (
                      <p className="text-sm text-white/60">@{user.username}</p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleCreateChat(user.id)}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserSearch;
