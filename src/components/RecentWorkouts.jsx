import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { Calendar, Clock } from 'lucide-react';
import { formatDuration } from '../lib/utils';

const RecentWorkouts = ({ limit = 3 }) => {
    const { getAuthenticatedApi } = useAuth();
    const api = useMemo(() => getAuthenticatedApi(), [getAuthenticatedApi]);
    
    const [workouts, setWorkouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        let mounted = true;
        
        const fetchRecentWorkouts = async () => {
            try {
                setLoading(true);
                const response = await api.get('/allenamenti.php');
                
                if (!mounted) return;
                
                // Filtra solo quelli completati (con durata_totale)
                const completedWorkouts = response.data
                    .filter(workout => workout.durata_totale !== null)
                    .sort((a, b) => new Date(b.data_allenamento) - new Date(a.data_allenamento))
                    .slice(0, limit);
                
                setWorkouts(completedWorkouts);
                setError(null);
            } catch (err) {
                if (!mounted) return;
                console.error('Errore caricamento allenamenti recenti:', err);
                setError('Impossibile caricare gli allenamenti recenti');
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };
        
        fetchRecentWorkouts();
        
        return () => {
            mounted = false;
        };
    }, [api, limit]); // Dipendenze corrette
    
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('it-IT', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            });
        } catch (e) {
            return dateString;
        }
    };
    
    if (loading) {
        return (
            <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                {error}
            </div>
        );
    }
    
    if (workouts.length === 0) {
        return (
            <div className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <p className="text-gray-500 dark:text-gray-400">
                    Non hai ancora completato alcun allenamento
                </p>
            </div>
        );
    }
    
    return (
        <div className="space-y-3">
            {workouts.map(workout => (
                <div 
                    key={workout.id}
                    className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                    <h4 className="font-medium text-gray-900 dark:text-white">
                        {workout.scheda_nome}
                    </h4>
                    
                    <div className="mt-2 space-y-1">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <Calendar className="h-4 w-4 mr-1.5 flex-shrink-0" />
                            <span>{formatDate(workout.data_allenamento)}</span>
                        </div>
                        
                        {workout.durata_totale && (
                            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <Clock className="h-4 w-4 mr-1.5 flex-shrink-0" />
                                <span>Durata: {formatDuration(workout.durata_totale)}</span>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RecentWorkouts;