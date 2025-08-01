
import React from 'react';
import { LogOut, Settings, User, UserPlus, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useNavigate } from 'react-router-dom';

export function UserMenu() {
  const { signOut, user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleSwitchAccount = () => {
    // Just navigate to auth without signing out completely
    navigate('/auth');
  };

  const handleProfile = () => {
    // Navigate to profile page or open profile modal
    console.log('Profile clicked');
    // You can implement a profile modal or page here
  };

  const handleSettings = () => {
    console.log('Settings clicked');
    // You can implement a settings modal or page here
  };

  const getDisplayName = () => {
    if (profile?.full_name) return profile.full_name;
    if (profile?.username) return profile.username;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getInitials = () => {
    const name = getDisplayName();
    if (name === 'User') return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getUserIdentifier = () => {
    if (profile?.username) return `@${profile.username}`;
    if (user?.email) return user.email;
    return '';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-sm font-semibold">
            {getInitials()}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-black/80 backdrop-blur-lg border-white/10 w-64">
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-white">
            {getDisplayName()}
          </p>
          <p className="text-xs text-white/60">
            {getUserIdentifier()}
          </p>
        </div>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem 
          onClick={handleProfile}
          className="text-white hover:bg-white/10 cursor-pointer"
        >
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleProfile}
          className="text-white hover:bg-white/10 cursor-pointer"
        >
          <Camera className="mr-2 h-4 w-4" />
          <span>Change Profile Picture</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleSettings}
          className="text-white hover:bg-white/10 cursor-pointer"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem 
          onClick={handleSwitchAccount}
          className="text-blue-400 hover:bg-blue-900/20 cursor-pointer"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          <span>Switch Account</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleSignOut}
          className="text-red-400 hover:bg-red-900/20 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
