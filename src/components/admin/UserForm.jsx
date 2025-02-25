import React, { useState, useEffect } from 'react';
import { X, User, Mail, Key, UserCog, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../AuthContext';

const UserForm = ({ user = null, onClose, onSuccess }) => {
    const { getAuthenticatedApi } = useAuth();
    const api = getAuthenticatedApi();

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        name: '',
        role_id: '',
        active: true
    });

    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        fetchRoles();
        if (user) {
            setFormData({
                username: user.username,
                email: user.email,
                password: '', // Non mostriamo la password attuale
                name: user.name || '',
                role_id: user.role_id,
                active: user.active
            });
        }
    }, [user]);

    const fetchRoles = async () => {
        try {
            const response = await api.get('/user_role.php');
            setRoles(response.data);
        } catch (err) {
            console.error('Error fetching roles:', err);
            setError('Errore nel caricamento dei ruoli');
        }
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.username.trim()) errors.username = 'Username obbligatorio';
        if (!user && !formData.password) errors.password = 'Password obbligatoria';
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        setError(null);

        try {
            if (user) {
                // Update existing user
                const response = await api.put(`/users.php?id=${user.id}`, formData);
                if (response.data) {
                    onSuccess(response.data.user);
                }
            } else {
                // Create new user
                const response = await api.post('/users.php', formData);
                if (response.data) {
                    onSuccess(response.data.user);
                }
            }

            onClose();
        } catch (err) {
            console.error('Error saving user:', err);
            setError(err.response?.data?.error || 'Errore durante il salvataggio');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {user ? 'Modifica Utente' : 'Nuovo Utente'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="username">
                                Username*
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="text"
                                    id="username"
                                    value={formData.username}
                                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                                    className={`w-full pl-10 p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${formErrors.username ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                        } focus:ring-2 focus:ring-blue-500`}
                                    placeholder="johndoe"
                                    disabled={!!user} // Username non modificabile in edit
                                />
                            </div>
                            {formErrors.email && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.email}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="password">
                                {user ? 'Nuova Password' : 'Password*'}
                            </label>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="password"
                                    id="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                    className={`w-full pl-10 p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${formErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                        } focus:ring-2 focus:ring-blue-500`}
                                    placeholder={user ? 'Lascia vuoto per non modificare' : '••••••••'}
                                />
                            </div>
                            {formErrors.password && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.password}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="name">
                                Nome Completo
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="text"
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full pl-10 p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="role">
                                Ruolo*
                            </label>
                            <div className="relative">
                                <UserCog className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <select
                                    id="role"
                                    value={formData.role_id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, role_id: e.target.value }))}
                                    className={`w-full pl-10 p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${formErrors.role_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
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

                        <div className="md:col-span-2">
                            <label className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    checked={formData.active}
                                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-gray-700 dark:text-gray-300">Utente attivo</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-4 mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 dark:disabled:bg-blue-800 flex items-center"
                        >
                            {loading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
                            {user ? 'Aggiorna Utente' : 'Crea Utente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserForm;