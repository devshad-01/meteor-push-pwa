import { create } from 'zustand';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

interface User {
  _id: string;
  username?: string;
  emails?: Array<{ address: string; verified: boolean }>;
  profile?: any;
  createdAt: Date;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isLoggingIn: boolean;
  loginAttempts: number;
  lastLoginAttempt: number | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setLoggingIn: (loggingIn: boolean) => void;
  incrementLoginAttempts: () => void;
  resetLoginAttempts: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isLoggingIn: false,
  loginAttempts: 0,
  lastLoginAttempt: null,

  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  setLoggingIn: (isLoggingIn) => set({ isLoggingIn }),
  
  incrementLoginAttempts: () => set((state) => ({
    loginAttempts: state.loginAttempts + 1,
    lastLoginAttempt: Date.now()
  })),
  
  resetLoginAttempts: () => set({
    loginAttempts: 0,
    lastLoginAttempt: null
  }),
  
  logout: () => {
    Meteor.logout(() => {
      set({ user: null, loginAttempts: 0, lastLoginAttempt: null });
    });
  }
}));

// Initialize reactive tracker for Meteor user state
Meteor.startup(() => {
  Tracker.autorun(() => {
    const user = Meteor.user() as User | null;
    const isLoggingIn = Meteor.loggingIn();
    
    // Debug logging for iOS issues
    console.log('AuthStore - Meteor state change:', {
      hasUser: !!user,
      isLoggingIn,
      userAgent: navigator.userAgent.includes('iPhone') ? 'iOS' : 'Other'
    });
    
    useAuthStore.getState().setUser(user);
    useAuthStore.getState().setLoggingIn(isLoggingIn);
  });
});
