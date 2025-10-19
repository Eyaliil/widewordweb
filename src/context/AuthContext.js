import React, { createContext, useContext, useState, useEffect } from 'react';
import { userService } from '../services/userService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Login with name
  const loginWithName = async (name) => {
    if (!name || name.trim().length === 0) {
      return { success: false, error: 'Please enter a name' };
    }

    setLoading(true);
    try {
      const result = await userService.loginWithName(name.trim());
      
      if (result.success) {
        setCurrentUser(result.user);
        setIsLoggedIn(true);
        console.log(`✅ Logged in as: ${result.user.name}`);
        return { success: true, user: result.user };
      } else {
        console.error('❌ Login failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    // Clear user data (online status logic removed)
    setCurrentUser(null);
    setIsLoggedIn(false);
    console.log('👋 User logged out');
  };

  // Update user profile
  const updateUserProfile = async (profileData) => {
    if (!currentUser?.id) {
      return { success: false, error: 'No user logged in' };
    }

    try {
      const result = await userService.updateProfile(currentUser.id, profileData);
      
      if (result.success) {
        // Refresh user data
        const updatedProfile = await userService.getUserProfile(currentUser.id);
        if (updatedProfile) {
          setCurrentUser(updatedProfile);
        }
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Profile update error:', error);
      return { success: false, error: 'Profile update failed. Please try again.' };
    }
  };

  // Mock user object for compatibility
  const user = currentUser ? {
    id: currentUser.id,
    email: `${currentUser.name.toLowerCase().replace(' ', '.')}@example.com`,
    user_metadata: {
      name: currentUser.name
    }
  } : null;

  const session = user ? {
    user: user,
    access_token: 'mock-token',
    refresh_token: 'mock-refresh-token'
  } : null;

  const value = { 
    session, 
    user, 
    loading, 
    currentUser, 
    setCurrentUser,
    isLoggedIn,
    loginWithName,
    logout,
    updateUserProfile,
    isUsingFakeUsers: false,
    isUsingDatabaseUsers: true
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
