import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/LocalAuthContext';

// Komponenta pro ochranu tras, které vyžadují přihlášení
export const AuthGuard: React.FC = () => {
  const { isReader, isLoading } = useAuth();

  // Zobrazit indikátor načítání, když se ověřuje přihlášení
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  // Přesměrovat na přihlášení, pokud uživatel není přihlášen
  if (!isReader()) {
    return <Navigate to="/login" replace />;
  }

  // Uživatel je přihlášen, zobrazit chráněný obsah
  return <Outlet />;
};

// Komponenta pro ochranu tras, které vyžadují roli admin nebo manager
export const ManagerGuard: React.FC = () => {
  const { isManager, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  if (!isManager()) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

// Komponenta pro ochranu tras, které vyžadují roli admin
export const AdminGuard: React.FC = () => {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  if (!isAdmin()) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
