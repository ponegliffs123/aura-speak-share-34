
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  theme_preference: 'light' | 'dark' | 'system';
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        // Ensure theme_preference is properly typed
        const profileData: Profile = {
          ...data,
          theme_preference: (data.theme_preference as 'light' | 'dark' | 'system') || 'system'
        };
        setProfile(profileData);
      } else {
        // If no profile exists, create one with basic info
        const newProfile = {
          id: user.id,
          username: user.email?.split('@')[0] || null,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          avatar_url: null,
          phone_number: null,
          theme_preference: 'system' as const
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert(newProfile);

        if (!insertError) {
          setProfile(newProfile);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>, customMessage?: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      // Generate specific message based on what was updated
      let description = customMessage || "Your profile has been updated successfully.";
      
      if (!customMessage) {
        if (updates.avatar_url !== undefined) {
          description = "Profile picture has been updated successfully.";
        } else if (updates.theme_preference !== undefined) {
          description = `Theme changed to ${updates.theme_preference} mode.`;
        } else if (updates.full_name !== undefined) {
          description = "Your name has been updated successfully.";
        } else if (updates.username !== undefined) {
          description = "Your username has been updated successfully.";
        }
      }
      
      toast({
        title: "Profile updated",
        description,
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return { profile, loading, updateProfile, refetch: fetchProfile };
};
