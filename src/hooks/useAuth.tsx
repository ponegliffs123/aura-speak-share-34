
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const lastAuthEventRef = useRef<string>('');
  const authEventTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isUnmounted = false;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (isUnmounted) return;
        
        const userId = session?.user?.id || 'none';
        const eventKey = `${event}-${userId}`;
        
        // Prevent rapid duplicate events within 2 seconds
        if (lastAuthEventRef.current === eventKey) {
          console.log('Duplicate auth event prevented:', event, userId);
          return;
        }
        
        console.log('Auth state change:', event, userId);
        lastAuthEventRef.current = eventKey;
        
        // Clear previous timeout
        if (authEventTimeoutRef.current) {
          clearTimeout(authEventTimeoutRef.current);
        }
        
        // Set timeout to reset duplicate prevention after 2 seconds
        authEventTimeoutRef.current = setTimeout(() => {
          if (!isUnmounted) {
            lastAuthEventRef.current = '';
            authEventTimeoutRef.current = null;
          }
        }, 2000);
        
        // Handle different auth events with more strict conditions
        if (event === 'SIGNED_IN') {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        } else if (event === 'TOKEN_REFRESHED') {
          // Only update if we actually have a valid session
          if (session && session.user) {
            setSession(session);
            setUser(session.user);
          }
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          // Only sign out if it's not due to rate limiting
          const wasRateLimit = session === null && user !== null;
          if (!wasRateLimit) {
            setSession(null);
            setUser(null);
          } else {
            console.warn('Prevented sign out due to rate limiting, retaining user session');
            return;
          }
          setLoading(false);
        } else if (event === 'INITIAL_SESSION') {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        } else {
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (isUnmounted) return;
      
      if (error) {
        console.warn('Error getting session:', error);
        // Don't sign out user for rate limiting errors
        if (!error.message?.includes('429') && !error.message?.includes('Too Many Requests')) {
          setSession(null);
          setUser(null);
        }
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    });

    return () => {
      isUnmounted = true;
      subscription.unsubscribe();
      if (authEventTimeoutRef.current) {
        clearTimeout(authEventTimeoutRef.current);
      }
    };
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: fullName,
        }
      }
    });

    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Check your email",
        description: "We sent you a confirmation link to complete your signup.",
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    }

    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      }
    });

    if (error) {
      toast({
        title: "Google sign in failed",
        description: error.message,
        variant: "destructive",
      });
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out successfully",
      description: "You have been logged out.",
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
