import React, { useState, useEffect } from 'react';
import { Search, Filter, AlertCircle } from 'lucide-react';
import UserCard from './UserCard';
import { useAuth } from '../AuthContext';

const UserList = ({ onEditUser, onCreateWorkout }) => {
    const { getAuthenticatedApi } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        role: 'all',
        status: 'all'
    });

    useEffect(() => {
        let isMounted = true;
        const api = getAuthenticatedApi();

        const fetchUsers = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await api.get('/users.php');

                if (!response.data || !isMounted) return;

                // Fetch workouts for each user
                const usersWithWorkouts = await Promise.all(
                    response.data.map(async user => {
                        try {
                            const workoutsResponse = await api.get(`/user_assignments.php?user_id=${user.id}`);
                            return {
                                ...user,
                                workouts: workoutsResponse.data || []
                            };
                        } catch (err) {
                            console.error(`Error fetching workouts for user ${user.id}:`, err);
                            return {
                                ...user,
                                workouts: []
                            };
                        }
                    })
                );

                if (isMounted) {
                    setUsers(usersWithWorkouts);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) {
                    console.error('Error fetching users:', err);
                    setError('Errore nel caricamento degli utenti');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchUsers();

        return () => {
            isMounted = false;
        };
    }, [getAuthenticatedApi]); // Dipendenza solo da getAuthenticatedApi

    const handleDeleteUser = async (user) => {
        if (!window.confirm(`Sei sicuro di voler eliminare l'utente ${user.username}?`)) {
            return;
        }

        try {
            const api = getAuthenticatedApi();
            await api.delete(`/users.php?id=${user.id}`);
            setUsers(prev => prev.filter(u => u.id !== user.id));
        } catch (err) {
            console.error('Error deleting user:', err);
            setError('Errore durante l\'eliminazione dell\'utente');
        }
    };

    // Filtra gli utenti
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = filters.role === 'all' || user.role_name === filters.role;
        const matchesStatus = filters.status === 'all' ||
            (filters.status === 'active' ? user.active : !user.active);

        return matchesSearch && matchesRole && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {error}
            </div>
        );
    }

    return (
        <div>
            {/* Search and Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Cerca utenti..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={filters.role}
                            onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                            className="px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Tutti i ruoli</option>
                            <option value="admin">Admin</option>
                            <option value="user">User</option>
                        </select>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            className="px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Tutti gli stati</option>
                            <option value="active">Attivi</option>
                            <option value="inactive">Inattivi</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Users Grid */}
            <div className="grid gap-4">
                {filteredUsers.length === 0 ? (
                    <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400">
                            Nessun utente trovato
                        </p>
                    </div>
                ) : (
                    filteredUsers.map(user => (
                        <UserCard
                            key={user.id}
                            user={user}
                            onEdit={() => onEditUser(user)}
                            onDelete={handleDeleteUser}
                            onManageWorkouts={onCreateWorkout}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default UserList;