import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserRole } from '../types';
import { localDb, LocalUser } from '../data/localDb';

interface AuthContextType {
  user: LocalUser | null;
  userRole: UserRole | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any, data: any }>;
  signOut: () => Promise<void>;
  setUserRole: (userId: number, role: UserRole) => Promise<{ error: any }>;
  isAdmin: () => boolean;
  isManager: () => boolean;
  isReader: () => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
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

export const LocalAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    setIsLoading(true);
    console.log('Initializing local authentication...');
    
    try {
      // Vyčištění starých sessions
      await localDb.cleanExpiredSessions();
      
      // Kontrola uložené session
      const savedToken = localStorage.getItem('auth_token');
      if (savedToken) {
        const validatedUser = await localDb.validateSession(savedToken);
        if (validatedUser) {
          setUser(validatedUser);
          setUserRole(validatedUser.role);
          console.log('User restored from session:', validatedUser.email);
        } else {
          localStorage.removeItem('auth_token');
        }
      }

      // Vytvoření výchozího admin účtu pokud neexistuje
      await createDefaultAdmin();
      
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultAdmin = async () => {
    try {
      const users = await localDb.getAllUsers();
      if (users.length === 0) {
        console.log('Creating default admin user...');
        await localDb.createUser('admin@kulich.cz', 'admin123', 'admin');
        console.log('Default admin created: admin@kulich.cz / admin123');
      }
    } catch (error) {
      console.error('Error creating default admin:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Signing in user:', email);
      
      const authenticatedUser = await localDb.authenticateUser(email, password);
      if (!authenticatedUser) {
        return { error: { message: 'Neplatné přihlašovací údaje' } };
      }

      const token = await localDb.createSession(authenticatedUser.id!);
      localStorage.setItem('auth_token', token);
      
      setUser(authenticatedUser);
      setUserRole(authenticatedUser.role);
      
      console.log('User signed in successfully:', authenticatedUser.email);
      return { error: null };
      
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { error: { message: error.message || 'Chyba při přihlašování' } };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      console.log('Signing up user:', email);
      
      const newUser = await localDb.createUser(email, password, 'reader');
      const token = await localDb.createSession(newUser.id!);
      localStorage.setItem('auth_token', token);
      
      setUser(newUser);
      setUserRole(newUser.role);
      
      console.log('User signed up successfully:', newUser.email);
      return { error: null, data: { user: newUser } };
      
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { error: { message: error.message || 'Chyba při registraci' }, data: null };
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out user...');
      
      const token = localStorage.getItem('auth_token');
      if (token) {
        await localDb.destroySession(token);
        localStorage.removeItem('auth_token');
      }
      
      setUser(null);
      setUserRole(null);
      
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const updateUserRole = async (userId: number, role: UserRole) => {
    try {
      console.log('Updating user role:', { userId, role });
      
      await localDb.updateUserRole(userId, role);
      
      // Pokud měníme roli současného uživatele, aktualizujeme stav
      if (user && user.id === userId) {
        setUser({ ...user, role });
        setUserRole(role);
      }
      
      return { error: null };
      
    } catch (error: any) {
      console.error('Error updating user role:', error);
      return { error: { message: error.message || 'Chyba při změně role' } };
    }
  };

  const isAdmin = () => userRole === 'admin';
  const isManager = () => userRole === 'admin' || userRole === 'manager';
  const isReader = () => !!userRole;

  return (
    <AuthContext.Provider
      value={{
        user,
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