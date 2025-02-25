import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';

const WorkoutHistory = ({ onBack }) => {
    const { getAuthenticatedApi } = useAuth();
    const api = getAuthenticatedApi();

    const [allenamenti, setAllenamenti] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [serieCompletate, setSerieCompletate] = useState({});

    useEffect(() => {
        fetchAllenamenti();
    }, []);

    const fetchAllenamenti = async () => {
        try {
            setLoading(true);
            // Il backend ora restituisce solo gli allenamenti dell'utente corrente
            // grazie all'autenticazione e filtraggio implementato
            const response = await api.get('/allenamenti.php');
            
            // Filtriamo solo gli allenamenti completati (con durata_totale valorizzata)
            const completedWorkouts = response.data.filter(workout => 
                workout.durata_totale !== null
            );
            
            setAllenamenti(completedWorkouts);
            setError(null);
        } catch (err) {
            console.error('Errore nel caricamento allenamenti:', err);
            setError('Impossibile caricare lo storico degli allenamenti');
        } finally {
            setLoading(false);
        }
    };

    const fetchSerieAllenamento = async (allenamentoId) => {
        try {
            // Il backend ora restituisce solo le serie dell'utente corrente
            // grazie all'autenticazione e filtraggio implementato
            const response = await api.get(`/serie_completate.php?allenamento_id=${allenamentoId}`);
            setSerieCompletate(prev => ({
                ...prev,
                [allenamentoId]: response.data
            }));
        } catch (error) {
            console.error('Errore nel caricamento serie:', error);
            setError('Impossibile caricare i dettagli dell\'allenamento');
        }
    };

    const toggleExpand = async (id) => {
        setExpandedId(expandedId === id ? null : id);
        if (!serieCompletate[id] && id !== null) {
            await fetchSerieAllenamento(id);
        }
    };

    const groupSerieByEsercizio = (serie) => {
        if (!serie || !Array.isArray(serie)) return {};
        
        const grouped = {};
        serie.forEach(serie => {
            if (!grouped[serie.esercizio_nome]) {
                grouped[serie.esercizio_nome] = [];
            }
            grouped[serie.esercizio_nome].push(serie);
        });
        return grouped;
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            return format(date, "EEEE d MMMM yyyy 'alle' HH:mm", { locale: it });
        } catch (e) {
            return dateString;
        }
    };

    const formatDuration = (minutes) => {
        if (!minutes) return '0m';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins}m`;
        return `${hours}h ${mins}m`;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto p-4">
                <button
                    onClick={onBack}
                    className="mb-6 px-4 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Torna all'allenamento</span>
                </button>
                
                <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4">
            <button
                onClick={onBack}
                className="mb-6 px-4 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
            >
                <ArrowLeft className="h-4 w-4" />
                <span>Torna all'allenamento</span>
            </button>
            
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                Storico Allenamenti
            </h2>

            {allenamenti.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow p-6 text-center">
                    <p className="text-gray-600 dark:text-gray-300">Non hai ancora completato alcun allenamento.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {allenamenti.map(allenamento => (
                        <div key={allenamento.id} 
                            className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
                            <div 
                                onClick={() => toggleExpand(allenamento.id)}
                                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {allenamento.scheda_nome}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            {formatDateTime(allenamento.data_allenamento)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {allenamento.durata_totale && (
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                Durata: {formatDuration(allenamento.durata_totale)}
                                            </span>
                                        )}
                                        {expandedId === allenamento.id ? 
                                            <ChevronUp className="h-5 w-5" /> : 
                                            <ChevronDown className="h-5 w-5" />
                                        }
                                    </div>
                                </div>
                            </div>

                            {expandedId === allenamento.id && (
                                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                                    {!serieCompletate[allenamento.id] ? (
                                        <div className="flex justify-center py-4">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400"></div>
                                        </div>
                                    ) : serieCompletate[allenamento.id].length === 0 ? (
                                        <p className="text-center text-gray-500 dark:text-gray-400">
                                            Nessun dettaglio disponibile per questo allenamento.
                                        </p>
                                    ) : (
                                        Object.entries(groupSerieByEsercizio(serieCompletate[allenamento.id])).map(([esercizioNome, serie]) => (
                                            <div key={esercizioNome} className="mb-6">
                                                <h4 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">
                                                    {esercizioNome}
                                                </h4>
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                        <thead className="bg-gray-50 dark:bg-gray-900">
                                                            <tr>
                                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                                    Serie
                                                                </th>
                                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                                    Peso (kg)
                                                                </th>
                                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                                    Ripetizioni
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                            {serie.map((s, idx) => (
                                                                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                                        {idx + 1}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                                        {s.peso}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                                        {s.ripetizioni}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WorkoutHistory;