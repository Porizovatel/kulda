import React, { useState } from 'react';
import { useAuth } from '../context/LocalAuthContext';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';

interface AuthUIProps {
  redirectAfterLogin?: () => void;
}

const AuthUI: React.FC<AuthUIProps> = ({ redirectAfterLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { error, data } = await signUp(email, password);
        if (error) {
          setError(error.message || 'Registrace se nezdařila');
        } else {
          setMessage('Registrace byla úspěšná! Zkontrolujte svůj email pro dokončení.');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message || 'Přihlášení se nezdařilo');
        } else if (redirectAfterLogin) {
          redirectAfterLogin();
        }
      }
    } catch (e: any) {
      setError(e.message || 'Došlo k neznámé chybě');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
        {isSignUp ? 'Registrace nového účtu' : 'Přihlášení do aplikace'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="vase@email.cz"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Heslo
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="********"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Zpracovávám...
            </span>
          ) : isSignUp ? (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Registrovat se
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4 mr-2" />
              Přihlásit se
            </>
          )}
        </button>
      </form>

      <div className="mt-4 text-center text-sm">
        <button 
          onClick={() => setIsSignUp(!isSignUp)} 
          className="text-blue-600 hover:text-blue-800 focus:outline-none focus:underline"
        >
          {isSignUp ? 'Máte již účet? Přihlaste se' : 'Nemáte účet? Zaregistrujte se'}
        </button>
      </div>
    </div>
  );
};

export default AuthUI;
