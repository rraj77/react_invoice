import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserData, getCompanyData, getAuthToken, clearAuthData } from '@/lib/api';
import type { User, Company } from '@/lib/types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = getAuthToken();
    const userData = getUserData();
    const companyData = getCompanyData();

    if (token && userData && companyData) {
      setUser(userData);
      setCompany(companyData);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const logout = () => {
    clearAuthData();
    setUser(null);
    setCompany(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  return {
    user,
    company,
    isAuthenticated,
    isLoading,
    logout,
  };
};
