import React, { useEffect, useState } from 'react';
import { UserRole } from '../types';
import { useAuth } from '../context/LocalAuthContext';
import { localDb, LocalUser } from '../data/localDb';
import { Navigate } from 'react-router-dom';
import { Shield, Users, Plus, X } from 'lucide-react';

const LocalUsersPage: React.FC = () => {
  const [users, setUsers] = useState<LocalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('reader');
  const { isAdmin, user: currentUser, setUserRole } = useAuth();

  // Přesměrovat, pokud není uživatel admin
  if (!isAdmin()) {
    return <Navigate to="/\" replace />;
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const allUsers = await localDb.getAllUsers();
      setUsers(allUsers);
      
    } catch (e: any) {
      console.error('Error fetching users:', e);
      setError(e.message || 'Došlo k chybě při načítání uživatelů');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await localDb.createUser(newUserEmail, newUserPassword, newUserRole);
      await fetchUsers();
      setIsAddingUser(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('reader');
    } catch (error: any) {
      setError(error.message || 'Chyba při vytváření uživatele');
    }
  };

  const handleRoleChange = async (userId: number, newRole: UserRole) => {
    try {
      // Nelze změnit vlastní roli
      if (userId === currentUser?.id) {
        alert('Nemůžete změnit vlastní roli');
        return;
      }

      const { error } = await setUserRole(userId, newRole);
      if (error) throw new Error(error.message);

      // Aktualizovat seznam uživatelů
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
      
      console.log('User role updated successfully');
      
    } catch (e: any) {
      console.error('Error changing user role:', e);
      alert(`Chyba při změně role: ${e.message || 'Neznámá chyba'}`);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </span>
        );
      case 'manager':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Users className="h-3 w-3 mr-1" />
            Správce
          </span>
        );
      case 'reader':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Čtenář
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Správa uživatelů</h1>
        <button
          onClick={() => setIsAddingUser(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Přidat uživatele
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          {error}
        </div>
      )}

      {isAddingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center border-b px-6 py-4">
              <h3 className="text-lg font-medium text-gray-900">
                Přidat nového uživatele
              </h3>
              <button 
                onClick={() => setIsAddingUser(false)}
                className="rounded-md text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Heslo
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <select
                    id="role"
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="reader">Čtenář</option>
                    <option value="manager">Správce</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Přidat uživatele
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Datum vytvoření
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Akce
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {user.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getRoleBadge(user.role)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('cs-CZ')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {user.id !== currentUser?.id ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRoleChange(user.id!, 'admin')}
                        disabled={user.role === 'admin'}
                        className={`px-2 py-1 rounded text-xs font-medium ${user.role === 'admin' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                      >
                        Admin
                      </button>
                      <button
                        onClick={() => handleRoleChange(user.id!, 'manager')}
                        disabled={user.role === 'manager'}
                        className={`px-2 py-1 rounded text-xs font-medium ${user.role === 'manager' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
                      >
                        Správce
                      </button>
                      <button
                        onClick={() => handleRoleChange(user.id!, 'reader')}
                        disabled={user.role === 'reader'}
                        className={`px-2 py-1 rounded text-xs font-medium ${user.role === 'reader' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                      >
                        Čtenář
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500 italic">
                      (Váš účet)
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Informace o rolích:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li><strong>Admin:</strong> Má plný přístup ke všem funkcím včetně správy uživatelů</li>
          <li><strong>Správce:</strong> Může editovat týmy, hráče, zápasy a výsledky</li>
          <li><strong>Čtenář:</strong> Má přístup pouze ke čtení dat</li>
        </ul>
      </div>
    </div>
  );
};

export default LocalUsersPage;