import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/LocalAuthContext';
import { Link } from 'react-router-dom';
import { LogOut, User, UserCog, Shield } from 'lucide-react';

const UserMenu: React.FC = () => {
  const { user, userRole, signOut, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  if (!user) return null;

  const getRoleBadge = () => {
    switch (userRole) {
      case 'admin':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </span>
        );
      case 'manager':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <UserCog className="h-3 w-3 mr-1" />
            Správce
          </span>
        );
      case 'reader':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Čtenář
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition duration-150 ease-in-out"
      >
        <User className="h-5 w-5 text-gray-600" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="px-4 py-2 border-b border-gray-100">
            <div className="text-sm font-medium text-gray-900 truncate">
              {user.email}
            </div>
            <div className="mt-1">
              {getRoleBadge()}
            </div>
          </div>
          
          {isAdmin() && (
            <Link
              to="/users"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
              onClick={() => setIsOpen(false)}
            >
              Správa uživatelů
            </Link>
          )}
          
          <button
            onClick={handleSignOut}
            className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Odhlásit se
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
