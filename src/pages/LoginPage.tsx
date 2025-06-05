import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import AuthUI from '../components/AuthUI';
import { useAuth } from '../context/LocalAuthContext';

const LoginPage: React.FC = () => {
  const { isReader, isLoading } = useAuth();
  const navigate = useNavigate();

  // Pokud je uživatel přihlášen, přesměruj na Dashboard
  if (isReader() && !isLoading) {
    return <Navigate to="/" replace />;
  }

  const handleLoginSuccess = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-blue-800 mb-2">
          KuLiCh
        </h1>
        <h2 className="text-center text-xl text-gray-600 mb-8">
          Kuželkářská Liga Chrástu
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <AuthUI redirectAfterLogin={handleLoginSuccess} />
      </div>
    </div>
  );
};

export default LoginPage;
