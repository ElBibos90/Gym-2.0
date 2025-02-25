import React, { useState, useEffect } from 'react';
import { X, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../AuthContext';

const PermissionsManager = ({ user, onClose, onSuccess }) => {
    const { getAuthenticatedApi } = useAuth();
    const api = getAuthenticatedApi();

    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        role_id: user.role_id,
        active: user.active
    });

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await api.get('/user_role.php');
                setRoles(response.data);
            } catch (err) {
                setError('Errore nel caricamento dei ruoli');
                console.error('Error fetching roles:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchRoles();
    }, [api]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (saving) return;

        try {
            setSaving(true);
            setError(null);

            await api.put(`/users.php?id=${user.id}`, formData);

            onSuccess?.();
            onClose();
            // Ricarica la pagina per vedere i cambiamenti
            window.location.reload();
        } catch (err) {
            console.error('Error updating permissions:', err);
            setError(err.response?.data?.error || 'Errore durante il salvataggio');
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                    <Loader2 className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Shield className="h-6 w-6 mr-2" />
                        Gestisci Permessi
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
                    <div>
                        <label className="block text-gray-700 dark:text-gray-300 mb-2">
                            Ruolo Utente
                        </label>
                        <select
                            value={formData.role_id}
                            onChange={(e) => setFormData(prev => ({ ...prev, role_id: e.target.value }))}
                            className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                        >
                            {roles.map(role => (
                                <option key={role.id} value={role.id}>
                                    {role.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={formData.active}
                                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-gray-700 dark:text-gray-300">
                                Utente attivo
                            </span>
                        </label>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Gli utenti inattivi non possono accedere al sistema
                        </p>
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 dark:disabled:bg-blue-800 flex items-center"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                    Salvataggio...
                                </>
                            ) : (
                                'Salva Modifiche'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PermissionsManager;