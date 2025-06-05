import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: SupabaseUser | null;
  userDetails: User | null;
  userRole: UserRole | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any, data: any }>;
  signOut: () => Promise<void>;
  setUserRole: (userId: string, role: UserRole) => Promise<{ error: any }>;
  isAdmin: () => boolean;
  isManager: () => boolean;
  isReader: () => boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userDetails: null,
  userRole: null,
  isLoading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null, data: null }),
  signOut: async () => {},
  setUserRole: async () => ({ error: null }),
  isAdmin: () => false,
  isManager: () => false,
  isReader: () => false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userDetails, setUserDetails] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserDetails(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Set up listener for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('Auth state changed:', _event);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserDetails(session.user.id);
        } else {
          setUserDetails(null);
          setUserRole(null);
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserDetails = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      console.log('User details fetched:', data);
      setUserDetails(data as User);
      setUserRole(data.role as UserRole);
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      return { data, error };
    } catch (error) {
      console.error('Error signing up:', error);
      return { error, data: null };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUserDetails(null);
      setUserRole(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId);

      if (error) throw error;

      // If updating current user, refresh their details
      if (userId === user?.id) {
        await fetchUserDetails(userId);
      }

      return { error: null };
    } catch (error) {
      console.error('Error updating user role:', error);
      return { error };
    }
  };

  const isAdmin = () => userRole === 'admin';
  const isManager = () => userRole === 'admin' || userRole === 'manager';
  const isReader = () => !!userRole; // Any logged-in user is at least a reader

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        userDetails,
        userRole,
        isLoading,
        signIn,
        signUp,
        signOut,
        setUserRole: updateUserRole,
        isAdmin,
        isManager,
        isReader,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
