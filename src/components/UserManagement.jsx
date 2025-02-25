import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
    UserPlus, Edit, Trash2, User, Mail, Key, UserCog
} from 'lucide-react';
import { formatDate } from '../lib/utils';
import { useMemo } from 'react';
import WorkoutAssignment, { AssignWorkoutButton } from './WorkoutAssignment';

const UserManagement = () => {
    const { getAuthenticatedApi } = useAuth();
    const api = useMemo(() => getAuthenticatedApi(), [getAuthenticatedApi]);

    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // Stato per la gestione delle schede
    const [showAssignWorkout, setShowAssignWorkout] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Stato del form
    const initialFormState = {
        username: '',
        password: '',
        email: '',
        name: '',
        role_id: '',
        active: true
    };
    const [formData, setFormData] = useState(initialFormState);
    const [formErrors, setFormErrors] = useState({});

    // Carica i dati utenti e ruoli
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const usersResponse = await api.get('/users.php');

                // Convertire active in numero per evitare problemi
                const usersData = usersResponse.data.map(user => ({
                    ...user,
                    active: Number(user.active) // Converte "0"/"1" in 0/1
                }));

                setUsers(usersData);

                const rolesResponse = await api.get('/user_role.php');
                setRoles(rolesResponse.data);

                setError('');
            } catch (err) {
                console.error('Error loading users:', err);
                setError('Errore nel caricamento degli utenti');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [api]); // Ora `api` non cambia a ogni render

    const validateForm = () => {
        const errors = {};

        if (!formData.username) errors.username = 'Username obbligatorio';
        if (!editingUser && !formData.password) errors.password = 'Password obbligatoria';
        if (!formData.email) errors.email = 'Email obbligatoria';
        if (!formData.role_id) errors.role_id = 'Ruolo obbligatorio';

        // Validazione email
        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Email non valida';
        }

        // Validazione password (solo per nuovi utenti o se si cambia la password)
        if (formData.password && formData.password.length < 8) {
            errors.password = 'La password deve essere di almeno 8 caratteri';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Pulisci l'errore quando l'utente modifica il campo
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            const response = await api.post('/users.php', formData);
            setUsers(prev => [...prev, response.data.user]);
            resetForm();
            setShowAddForm(false);
        } catch (err) {
            setError(err.response?.data?.error || 'Errore durante la creazione dell\'utente');
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            // Invia solo i campi modificati
            const dataToUpdate = { ...formData };
            if (!dataToUpdate.password) delete dataToUpdate.password;

            const response = await api.put(`/users.php?id=${editingUser.id}`, dataToUpdate);

            // Aggiorna la lista utenti
            setUsers(prev => prev.map(user =>
                user.id === editingUser.id ? response.data.user : user
            ));

            resetForm();
        } catch (err) {
            setError(err.response?.data?.error || 'Errore durante l\'aggiornamento dell\'utente');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Sei sicuro di voler eliminare questo utente?')) return;

        try {
            await api.delete(`/users.php?id=${userId}`);
            setUsers(prev => prev.filter(user => user.id !== userId));
        } catch (err) {
            setError(err.response?.data?.error || 'Errore durante l\'eliminazione dell\'utente');
        }
    };

    const startEdit = (user) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            password: '', // Non mostrare la password attuale
            email: user.email,
            name: user.name || '',
            role_id: user.role_id,
            active: user.active === 1
        });
        setShowAddForm(true);
    };

    const resetForm = () => {
        setFormData(initialFormState);
        setEditingUser(null);
        setFormErrors({});
    };

    const cancelForm = () => {
        resetForm();
        setShowAddForm(false);
    };

    // Gestione delle assegnazioni di schede
    const handleAssignWorkout = (userId, username) => {
        setSelectedUser({ id: userId, username });
        setShowAssignWorkout(true);
    };

    const handleCloseAssignWorkout = () => {
        setShowAssignWorkout(false);
        setSelectedUser(null);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Gestione Utenti
                </h2>

                {!showAddForm && (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded hover:bg-green-700 dark:hover:bg-green-600 transition-colors flex items-center gap-2"
                    >
                        <UserPlus className="w-5 h-5" />
                        <span>Nuovo Utente</span>
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
                    {error}
                </div>
            )}

            {showAddForm && (
                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-8 border border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                        {editingUser ? 'Modifica Utente' : 'Nuovo Utente'}
                    </h3>

                    <form onSubmit={editingUser ? handleUpdateUser : handleAddUser} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-1" htmlFor="username">
                                    Username*
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        id="username"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        readOnly={!!editingUser} // Username non modificabile in edit
                                        className={`w-full pl-10 p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${!!editingUser ? 'bg-gray-100 dark:bg-gray-600' : ''
                                            } ${formErrors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                            } focus:ring-2 focus:ring-blue-500`}
                                    />
                                </div>
                                {formErrors.username && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.username}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-1" htmlFor="email">
                                    Email*
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className={`w-full pl-10 p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${formErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                            } focus:ring-2 focus:ring-blue-500`}
                                    />
                                </div>
                                {formErrors.email && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.email}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-1" htmlFor="password">
                                    {editingUser ? 'Password (lascia vuoto per non modificare)' : 'Password*'}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Key className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className={`w-full pl-10 p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${formErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                            } focus:ring-2 focus:ring-blue-500`}
                                    />
                                </div>
                                {formErrors.password && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.password}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-1" htmlFor="name">
                                    Nome Completo
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 dark:text-gray-300 mb-1" htmlFor="role_id">
                                    Ruolo*
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <UserCog className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <select
                                        id="role_id"
                                        name="role_id"
                                        value={formData.role_id}
                                        onChange={handleInputChange}
                                        className={`w-full pl-10 p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${formErrors.role_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                            } focus:ring-2 focus:ring-blue-500`}
                                    >
                                        <option value="">Seleziona ruolo</option>
                                        {roles.map(role => (
                                            <option key={role.id} value={role.id}>
                                                {role.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {formErrors.role_id && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.role_id}</p>
                                )}
                            </div>

                            <div className="flex items-center mt-4">
                                <input
                                    type="checkbox"
                                    id="active"
                                    name="active"
                                    checked={formData.active}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="active" className="ml-2 block text-gray-700 dark:text-gray-300">
                                    Utente attivo
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={cancelForm}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Annulla
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                {editingUser ? 'Aggiorna' : 'Crea Utente'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-800 transition-colors">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Utente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ruolo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stato</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ultimo accesso</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Creato il</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                    Nessun utente trovato
                                </td>
                            </tr>
                        ) : (
                            users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {user.username}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-col">
                                                    <span>{user.email}</span>
                                                    {user.name && <span>{user.name}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role_name === 'admin'
                                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                            }`}>
                                            {user.role_name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.active === 1
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                            }`}>
                                            {user.active === 1 ? 'Attivo' : 'Disattivato'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        {user.last_login ? formatDate(user.last_login) : 'Mai'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        {formatDate(user.created_at)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center space-x-3">
                                            <button
                                                onClick={() => startEdit(user)}
                                                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors"
                                                aria-label="Modifica utente"
                                            >
                                                <Edit className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors"
                                                aria-label="Elimina utente"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>

                                            {/* Pulsante per gestire le schede dell'utente */}
                                            {user.role_name !== 'admin' && (
                                                <AssignWorkoutButton
                                                    userId={user.id}
                                                    username={user.username}
                                                    onAssign={handleAssignWorkout}
                                                />
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal per gestire le assegnazioni delle schede */}
            {showAssignWorkout && selectedUser && (
                <WorkoutAssignment
                    userId={selectedUser.id}
                    username={selectedUser.username}
                    onClose={handleCloseAssignWorkout}
                />
            )}
        </div>
    );
};

export default UserManagement;