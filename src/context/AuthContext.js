import React, { createContext, useContext, useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { fakeUsers } from '../data/fakeUsers';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [databaseUsers, setDatabaseUsers] = useState([]);

  // Load database users on component mount
  useEffect(() => {
    loadDatabaseUsers();
  }, []);

  const loadDatabaseUsers = async () => {
    try {
      setLoading(true);
      console.log('🔗 Attempting to connect to Supabase database...');
      
      const users = await userService.getAllUsers();
      setDatabaseUsers(users);
      
      // Set first user as default if no current user
      if (users.length > 0 && !currentUser) {
        setCurrentUser(users[0]);
        console.log(`👤 Set active user: ${users[0].name}`);
      }
      
      console.log('✅ Database connection successful! Using real database users.');
    } catch (error) {
      console.error('❌ Failed to connect to database:', error);
      console.log('🔄 Falling back to fake users. Please check your Supabase configuration.');
      console.log('📋 Setup guide: See SUPABASE_SETUP.md for instructions');
      
      // Fallback to fake users if database fails (for development)
      setDatabaseUsers(fakeUsers);
      if (!currentUser && fakeUsers.length > 0) {
        setCurrentUser(fakeUsers[0]);
        console.log(`👤 Set active user (fake): ${fakeUsers[0].name}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Mock user object that matches Supabase auth user structure
  // Always provide a user object to skip authentication
  const user = currentUser ? {
    id: currentUser.id,
    email: currentUser.email || `${currentUser.name.toLowerCase().replace(' ', '.')}@example.com`,
    user_metadata: {
      name: currentUser.name
    }
  } : {
    id: 'temp-user',
    email: 'temp@example.com',
    user_metadata: {
      name: 'Temp User'
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
    databaseUsers,
    loadDatabaseUsers,
    isUsingFakeUsers: databaseUsers === fakeUsers
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
