import React, { useState } from 'react';
import {
    Edit, Trash2, UserCog, Dumbbell,
    Plus, X, ChevronDown, ChevronRight
} from 'lucide-react';
import PermissionsManager from './PermissionsManager';

const UserCard = ({
    user,
    onEdit,
    onDelete,
    onManageWorkouts,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showPermissions, setShowPermissions] = useState(false);

    // Handler per la rimozione della scheda
    const handleRemoveWorkout = (e, user, workout) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (workout && workout.id) {
            const confirmDelete = window.confirm('Sei sicuro di voler eliminare questa scheda?');
            if (confirmDelete) {
                onManageWorkouts(user, 'delete', workout);
            }
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            {/* Header con info utente e pulsante espansione */}
            <div className="flex items-start justify-between">
                <div 
                    className="flex-1 flex items-start gap-2 cursor-pointer" 
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <button
                        className="mt-1.5 text-gray-500 dark:text-gray-400"
                        aria-label={isExpanded ? 'Comprimi' : 'Espandi'}
                    >
                        {isExpanded ? (
                            <ChevronDown className="h-5 w-5" />
                        ) : (
                            <ChevronRight className="h-5 w-5" />
                        )}
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {user.username}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${user.role_name === 'admin'
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                }`}>
                                {user.role_name}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${user.active
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}>
                                {user.active ? 'Attivo' : 'Disattivato'}
                            </span>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            <p>{user.email}</p>
                            {user.name && <p>{user.name}</p>}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => onEdit(user)}
                        className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                        title="Modifica utente"
                    >
                        <Edit className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => onDelete(user)}
                        className="p-2 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
                        title="Elimina utente"
                    >
                        <Trash2 className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Contenuto espandibile */}
            {isExpanded && (
                <>
                    {/* Azioni rapide */}
                    <div className="mt-4 flex gap-3">
                        <button
                            onClick={() => setShowPermissions(true)}
                            className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            <UserCog className="h-4 w-4 mr-2" />
                            Gestisci Permessi
                        </button>
                        <button
                            onClick={() => onManageWorkouts(user)}
                            className="flex items-center px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors"
                        >
                            <Dumbbell className="h-4 w-4 mr-2" />
                            Gestisci Schede
                        </button>
                    </div>

                    {/* Preview schede assegnate */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                                Schede Assegnate
                            </h4>
                            <button
                                onClick={() => onManageWorkouts(user, 'new')}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm flex items-center"
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Nuova Scheda
                            </button>
                        </div>

                        {user.workouts && user.workouts.length > 0 ? (
                            <div className="space-y-2">
                                {user.workouts.map(workout => (
                                    <div
                                        key={workout.id}
                                        className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex justify-between items-center"
                                    >
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {workout.scheda_nome || 'Scheda senza nome'}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Assegnata il: {new Date(workout.assigned_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => onManageWorkouts(user, 'edit', workout)}
                                                className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                                title="Modifica scheda"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={(e) => handleRemoveWorkout(e, user, workout)}
                                                className="p-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                                title="Rimuovi scheda"
                                                type="button"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                Nessuna scheda assegnata
                            </p>
                        )}
                    </div>
                </>
            )}

            {/* Modal Gestione Permessi */}
            {showPermissions && (
                <PermissionsManager
                    user={user}
                    onClose={() => setShowPermissions(false)}
                    onSuccess={() => setShowPermissions(false)}
                />
            )}
        </div>
    );
};

export default UserCard;