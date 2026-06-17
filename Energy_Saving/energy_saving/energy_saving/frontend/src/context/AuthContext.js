import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          await validateToken(parsedUser.token);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadStoredUser();
  }, []);

  const validateToken = async (token) => {
    if (!token) {
      logout();
      return;
    }
    try {
      await axios.get(`${API_URL}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.log('Token validation failed, logging out:', error.message);
      logout();
    }
  };

  const register = async (userData) => {
    try {
      if (!userData.username || !userData.email || !userData.password) {
        throw new Error('Please provide username, email, and password');
      }
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  };

  const login = async ({ username, password }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { username, password });
      if (response.data.token) {
        const userInfo = {
          id: response.data.id,
          username: response.data.username,
          email: response.data.email,
          token: response.data.token,
        };
        setUser(userInfo);
        await AsyncStorage.setItem('user', JSON.stringify(userInfo));
        return userInfo;
      }
      throw new Error('Login successful but no token received');
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };
// Forgot Password
const forgotPassword = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
    return response.data; // Usually something like { message: 'Reset link sent' }
  } catch (error) {
    throw error.response?.data || { message: 'Error sending reset link' };
  }
};

// Reset Password
const resetPassword = async (token, newPassword) => {
  try {
    const response = await axios.post(`${API_URL}/auth/reset-password/${token}`, {
      newPassword,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Reset failed' };
  }
};

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
