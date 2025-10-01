import React, { createContext, useContext, useState } from 'react';
import { fakeUsers } from '../data/fakeUsers';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(fakeUsers[0]); // Default to first fake user
  const [loading, setLoading] = useState(false);

  // Mock user object that matches Supabase auth user structure
  const user = {
    id: currentUser.id,
    email: `${currentUser.name.toLowerCase().replace(' ', '.')}@example.com`,
    user_metadata: {
      name: currentUser.name
    }
  };

  const session = {
    user: user,
    access_token: 'mock-token',
    refresh_token: 'mock-refresh-token'
  };

  const value = { 
    session, 
    user, 
    loading, 
    currentUser, 
    setCurrentUser,
    fakeUsers 
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
