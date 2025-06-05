import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Trophy, Users, UserCircle, BarChart, Home, Table2, Calendar, UserCog } from 'lucide-react';
import { useDatabase } from '../context/InfluxDatabaseContext';
import { useAuth } from '../context/LocalAuthContext';
import UserMenu from './UserMenu';

const Layout: React.FC = () => {
  const location = useLocation();
  const { isLoaded } = useDatabase();
  const { isAdmin, isManager } = useAuth();

  // Základní navigace dostupná všem přihlášeným uživatelům
  let navigation = [
    { name: 'Přehled', href: '/', icon: Home },
    { name: 'Tabulka', href: '/standings', icon: Table2 },
    { name: 'Statistiky hráčů', href: '/player-stats', icon: BarChart }
  ];

  // Přidání položek navigace pro správce a adminy
  if (isManager()) {
    navigation = [
      ...navigation,
      { name: 'Týmy', href: '/teams', icon: Users },
      { name: 'Hráči', href: '/players', icon: UserCircle },
      { name: 'Zápasy', href: '/matches', icon: Trophy },
      { name: 'Rozpis', href: '/schedule', icon: Calendar },
    ];
  }

  // Přidání položek navigace pouze pro adminy
  if (isAdmin()) {
    navigation = [
      ...navigation,
      { name: 'Správa uživatelů', href: '/users', icon: UserCog },
    ];
  }

  // Seřazení navigace
  navigation.sort((a, b) => {
    // Přehled vždy na začátek
    if (a.href === '/') return -1;
    if (b.href === '/') return 1;
    return 0;
  });

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-blue-800 text-white">
          <div className="p-4">
            <h1 className="text-2xl font-bold">KuLiCh</h1>
          </div>
          <nav className="mt-5">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center px-4 py-3 text-sm font-medium transition duration-150 ease-in-out
                  ${isActive(item.href) 
                    ? 'bg-blue-900 text-white' 
                    : 'text-blue-100 hover:bg-blue-700'
                  }
                `}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white shadow">
            <div className="px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">
                {navigation.find(nav => isActive(nav.href))?.name || 'KuLiCh'}
              </h2>
              <UserMenu />
            </div>
          </header>

          {/* Main content area */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
            {!isLoaded ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Načítání databáze...</p>
                </div>
              </div>
            ) : (
              <Outlet />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;