// Authentication Context using Meteor Accounts
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { useTracker } from 'meteor/react-meteor-data';

interface User {
  _id: string;
  emails?: { address: string; verified: boolean }[];
  profile?: {
    name?: string;
    isOnline?: boolean;
    lastSeen?: Date;
    notificationSubscription?: any;
  };
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use Meteor's reactive user data
  const user = useTracker(() => {
    const meteorUser = Meteor.user();
    if (meteorUser) {
      return {
        _id: meteorUser._id,
        emails: meteorUser.emails,
        profile: meteorUser.profile
      };
    }
    return null;
  }, []);

  // Subscribe to user data
  useTracker(() => {
    const handle = Meteor.subscribe('userData');
    return () => handle.stop();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise<void>((resolve, reject) => {
        Meteor.loginWithPassword(email, password, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      // Update user online status
      if (Meteor.userId()) {
        await Meteor.callAsync('users.updateOnlineStatus', true);
      }
    } catch (err: any) {
      setError(err.reason || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    setError(null);
    
    console.log('Registration attempt:', { email, name });
    
    try {
      await new Promise<void>((resolve, reject) => {
        Accounts.createUser({
          email,
          password,
          profile: { name }
        }, (error) => {
          console.log('Registration callback:', { error });
          if (error) {
            reject(error);
          } else {
            console.log('Registration successful, user ID:', Meteor.userId());
            resolve();
          }
        });
      });

      console.log('About to update online status, user ID:', Meteor.userId());
      
      // Update user online status
      if (Meteor.userId()) {
        console.log('Calling users.updateOnlineStatus');
        await Meteor.callAsync('users.updateOnlineStatus', true);
      }
      
      console.log('Registration completed successfully');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.reason || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Update user offline status before logout
    if (Meteor.userId()) {
      Meteor.callAsync('users.updateOnlineStatus', false);
    }
    
    Meteor.logout((error) => {
      if (error) {
        console.error('Logout error:', error);
      }
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      loading,
      error
    }}>
      {children}
    </AuthContext.Provider>
  );
};
