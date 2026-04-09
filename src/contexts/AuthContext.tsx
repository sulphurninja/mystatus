'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  activationKey: string;
  starRating?: number;
  balance: number;
  isActive: boolean;
  referralCode: string;
  referredBy?: string;
  profileImage?: string;
  withdrawalLimit?: number;
  totalWithdrawn?: number;
  keyTier?: {
    name: string;
    withdrawalLimit: number;
  };
  franchiseKeysCount?: number;
  activeFranchisePlans?: number;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (activationKey: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUserProfile: () => Promise<void>;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  referralCode: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for saved auth on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('userToken');
    const savedUser = localStorage.getItem('user');

    console.log('🔍 Checking saved auth...', { hasToken: !!savedToken, hasUser: !!savedUser });

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
        console.log('✅ Restored user from localStorage:', parsedUser.name);
      } catch (error) {
        console.error('❌ Error loading saved auth:', error);
        localStorage.removeItem('userToken');
        localStorage.removeItem('user');
      }
    } else {
      console.log('ℹ️ No saved auth found');
    }
    setIsLoading(false);
  }, []);

  const login = async (activationKey: string) => {
    try {
      const response = await fetch('/api/auth/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activationKey: activationKey.toUpperCase() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const result = await response.json();
      console.log('🔐 Login response:', result);
      
      // API returns { success, data: { user, token } }
      if (!result.success || !result.data) {
        throw new Error('Invalid response from server');
      }
      
      const { user, token } = result.data;
      
      if (!token || !user) {
        throw new Error('Invalid response from server');
      }
      
      // Map API response to expected User interface
      const userData: User = {
        _id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        activationKey: user.activationKey,
        starRating: user.starRating,
        balance: user.walletBalance || 0,
        isActive: user.isActive || true,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        profileImage: user.profileImage,
        withdrawalLimit: user.withdrawalLimit,
        totalWithdrawn: user.totalWithdrawn,
        keyTier: user.keyTier,
        franchiseKeysCount: user.franchiseKeysCount,
        activeFranchisePlans: user.activeFranchisePlans,
        createdAt: user.createdAt
      };
      
      setToken(token);
      setUser(userData);
      localStorage.setItem('userToken', token);
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('💾 User saved to localStorage and state:', userData.name);
    } catch (error) {
      console.error('❌ Login error:', error);
      throw error;
    }
  };

  const register = async (registerData: RegisterData) => {
    try {
      const response = await fetch('/api/auth/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const result = await response.json();
      console.log('📝 Register response:', result);
      
      // API returns { success, data: { user, token } }
      if (!result.success || !result.data) {
        throw new Error('Invalid response from server');
      }
      
      const { user, token } = result.data;
      
      if (!token || !user) {
        throw new Error('Invalid response from server');
      }
      
      // Map API response to expected User interface
      const userData: User = {
        _id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        activationKey: user.activationKey,
        starRating: user.starRating,
        balance: user.walletBalance || 0,
        isActive: user.isActive || true,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        profileImage: user.profileImage,
        withdrawalLimit: user.withdrawalLimit,
        totalWithdrawn: user.totalWithdrawn,
        keyTier: user.keyTier,
        franchiseKeysCount: user.franchiseKeysCount,
        activeFranchisePlans: user.activeFranchisePlans,
        createdAt: user.createdAt
      };
      
      setToken(token);
      setUser(userData);
      localStorage.setItem('userToken', token);
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('💾 User registered and saved:', userData.name);
    } catch (error) {
      console.error('❌ Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('userToken');
    localStorage.removeItem('user');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const refreshUserProfile = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const user = result.data;
          // Map API response to expected User interface
          const userData: Partial<User> = {
            _id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            activationKey: user.activationKey,
            starRating: user.starRating,
            balance: user.walletBalance || 0,
            isActive: user.isActive,
            referralCode: user.referralCode,
            profileImage: user.profileImage,
            franchiseKeysCount: user.franchiseKeysCount,
            activeFranchisePlans: user.activeFranchisePlans
          };
          updateUser(userData);
        }
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
