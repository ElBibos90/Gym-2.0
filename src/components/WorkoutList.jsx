import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { FileText, Calendar, Edit, Trash2, ChevronDown } from 'lucide-react';
import EditWorkoutForm from './EditWorkoutForm';

const WorkoutList = ({ workouts = [], onSelectWorkout, onWorkoutUpdated }) => {
    const { getAuthenticatedApi } = useAuth();
    const api = getAuthenticatedApi();

    const [error, setError] = useState(null);
    const [expandedScheda, setExpandedScheda] = useState(null);
    const [schedaInModifica, setSchedaInModifica] = useState(null);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const toggleScheda = (schedaId) => {
        setExpandedScheda(expandedScheda === schedaId ? null : schedaId);
    };

    const handleEdit = (e, scheda) => {
        e.stopPropagation();
        setSchedaInModifica(scheda);
    };

    const handleDelete = async (schedaId, e) => {
        e.stopPropagation();
        if (!window.confirm('Sei sicuro di voler eliminare questa scheda?')) return;

        try {
            await api.delete(`/schede.php?id=${schedaId}`);
            if (onWorkoutUpdated) {
                await onWorkoutUpdated(); // Aggiorna la lista dopo l'eliminazione
            }
        } catch (err) {
            console.error('Errore nella eliminazione:', err);
            setError('Errore durante l\'eliminazione della scheda');
        }
    };

    const handleCloseEdit = async () => {
        setSchedaInModifica(null);
        if (onWorkoutUpdated) {
            await onWorkoutUpdated(); // Aggiorna la lista dopo la modifica
        }
    };

    if (schedaInModifica) {
        return (
            <EditWorkoutForm
                scheda={schedaInModifica}
                onClose={handleCloseEdit}
                onWorkoutUpdated={onWorkoutUpdated}
            />
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-900/50 text-red-200 rounded-lg">
                {error}
            </div>
        );
    }

    if (!workouts?.length) {
        return (
            <div className="text-center p-6 bg-gray-800 rounded-lg">
                <p className="text-gray-400">Nessuna scheda presente</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {workouts.map((scheda) => (
                <div key={scheda.id} className="bg-gray-700 rounded-lg overflow-hidden">
                    <div 
                        className="p-4 cursor-pointer hover:bg-gray-600 transition-colors"
                        onClick={() => toggleScheda(scheda.id)}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-medium text-white">
                                    {scheda.nome}
                                </h3>
                                <p className="text-sm text-gray-400 mt-1">
                                    Creata il: {formatDate(scheda.data_creazione)}
                                </p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={(e) => handleDelete(scheda.id, e)}
                                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                                    title="Elimina scheda"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                                <ChevronDown
                                    className={`h-5 w-5 text-gray-400 transition-transform ${expandedScheda === scheda.id ? 'rotate-180' : ''
                                        }`}
                                />
                            </div>
                        </div>
                    </div>

                    {expandedScheda === scheda.id && (
                        <div className="border-t border-gray-600 p-4">
                            {scheda.descrizione && (
                                <p className="text-gray-300 mb-4">{scheda.descrizione}</p>
                            )}

                            <div className="space-y-2">
                                {scheda.esercizi?.map((esercizio, idx) => (
                                    <div key={idx} className="bg-gray-600 p-3 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="text-white font-medium">
                                                    {esercizio.nome}
                                                </h4>
                                                <p className="text-sm text-gray-400">
                                                    {esercizio.gruppo_muscolare}
                                                </p>
                                            </div>
                                            <div className="text-sm text-gray-300">
                                                <span>{esercizio.serie} serie × {esercizio.ripetizioni} rep</span>
                                                {esercizio.peso > 0 && (
                                                    <span className="ml-2">@ {esercizio.peso}kg</span>
                                                )}
                                            </div>
                                        </div>
                                        {esercizio.note && (
                                            <p className="text-sm text-gray-400 mt-2 italic">
                                                "{esercizio.note}"
                                            </p>
                                        )}
                                    </div>
                                ))}

                                {(!scheda.esercizi || scheda.esercizi.length === 0) && (
                                    <p className="text-center text-gray-400 p-4">
                                        Nessun esercizio in questa scheda
                                    </p>
                                )}
                            </div>

                            <div className="mt-4">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onSelectWorkout) onSelectWorkout(scheda);
                                    }}
                                    className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                    Modifica Esercizi
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default WorkoutList;