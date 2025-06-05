import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Shield, Users } from 'lucide-react';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAdmin, userDetails, setUserRole } = useAuth();

  // Přesměrovat, pokud není uživatel admin
  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data as User[]);
    } catch (e: any) {
      console.error('Error fetching users:', e);
      setError(e.message || 'Došlo k chybě při načítání uživatelů');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      // Nelze změnit vlastní roli
      if (userId === userDetails?.id) {
        alert('Nemůžete změnit vlastní roli');
        return;
      }

      const { error } = await setUserRole(userId, newRole);
      if (error) throw error;

      // Aktualizovat seznam uživatelů
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
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
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          {error}
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
                    {new Date(user.createdAt || '').toLocaleDateString('cs-CZ')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {user.id !== userDetails?.id ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRoleChange(user.id, 'admin')}
                        disabled={user.role === 'admin'}
                        className={`px-2 py-1 rounded text-xs font-medium ${user.role === 'admin' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                      >
                        Admin
                      </button>
                      <button
                        onClick={() => handleRoleChange(user.id, 'manager')}
                        disabled={user.role === 'manager'}
                        className={`px-2 py-1 rounded text-xs font-medium ${user.role === 'manager' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
                      >
                        Správce
                      </button>
                      <button
                        onClick={() => handleRoleChange(user.id, 'reader')}
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
    </div>
  );
};

export default UsersPage;
