import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import UserWorkouts from './UserWorkouts';
import RecentWorkouts from './RecentWorkouts';
import { CalendarDays, BarChart2, User, Award } from 'lucide-react';

const UserDashboard = () => {
    const { currentUser, getAuthenticatedApi } = useAuth();
    const api = useMemo(() => getAuthenticatedApi(), [getAuthenticatedApi]);
    
    const [stats, setStats] = useState({
        totalWorkouts: 0,
        totalSets: 0,
        loading: true,
        error: null
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Ottieni tutti gli allenamenti
                const workoutsResponse = await api.get('/allenamenti.php');
                const completedWorkouts = workoutsResponse.data.filter(w => w.durata_totale !== null);
                
                // Ottieni tutte le serie completate
                let totalSets = 0;
                for (const workout of completedWorkouts) {
                    const setsResponse = await api.get(`/serie_completate.php?allenamento_id=${workout.id}`);
                    totalSets += setsResponse.data.length;
                }

                setStats({
                    totalWorkouts: completedWorkouts.length,
                    totalSets: totalSets,
                    loading: false,
                    error: null
                });
            } catch (err) {
                console.error('Error fetching stats:', err);
                setStats(prev => ({
                    ...prev,
                    loading: false,
                    error: 'Errore nel caricamento delle statistiche'
                }));
            }
        };

        fetchStats();
    }, [api]);

    return (
        <div className="max-w-7xl mx-auto p-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Dashboard
            </h1>

            <div className="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
                {/* Statistiche */}
                <div className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="p-3 mr-4 bg-blue-100 dark:bg-blue-900 rounded-full">
                        <CalendarDays className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                            Allenamenti
                        </p>
                        <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                            {stats.loading ? (
                                <span className="inline-block w-6 h-6 animate-pulse bg-gray-200 dark:bg-gray-700 rounded"></span>
                            ) : stats.totalWorkouts}
                        </p>
                    </div>
                </div>

                <div className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="p-3 mr-4 bg-green-100 dark:bg-green-900 rounded-full">
                        <BarChart2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                            Serie completate
                        </p>
                        <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                            {stats.loading ? (
                                <span className="inline-block w-6 h-6 animate-pulse bg-gray-200 dark:bg-gray-700 rounded"></span>
                            ) : stats.totalSets}
                        </p>
                    </div>
                </div>

                <div className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="p-3 mr-4 bg-purple-100 dark:bg-purple-900 rounded-full">
                        <Award className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                            Obiettivi
                        </p>
                        <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                            In arrivo
                        </p>
                    </div>
                </div>

                <div className="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="p-3 mr-4 bg-amber-100 dark:bg-amber-900 rounded-full">
                        <User className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                            Profilo
                        </p>
                        <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                            {currentUser?.username}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Schede assegnate */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                        Le tue schede
                    </h2>
                    <UserWorkouts />
                </div>

                {/* Ultimi allenamenti */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                        Ultimi allenamenti
                    </h2>
                    <RecentWorkouts limit={3} />
                </div>
            </div>

            <div className="mt-10 p-6 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-800">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    Inizia ad allenarti
                </h3>
                <p className="text-blue-600 dark:text-blue-300 mb-4">
                    Vai alla sezione 'Allenamento' per iniziare la tua sessione con una delle schede assegnate.
                </p>

                <a 
                    href="/gym-2.0/" 
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                    Inizia allenamento
                </a>
            </div>
        </div>
    );
};

export default UserDashboard;