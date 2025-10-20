import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getAuthToken } from '@/lib/api';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const token = getAuthToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
