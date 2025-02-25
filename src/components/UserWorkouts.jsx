import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { FileText, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import { it } from 'date-fns/locale';

const UserWorkouts = () => {
    const { getAuthenticatedApi } = useAuth();
    const api = getAuthenticatedApi();

    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);

    // Memoized fetch function to avoid recreation on every render
    const fetchAssignedWorkouts = useCallback(async () => {
        // Skip if we've updated recently (debounce)
        const now = new Date();
        if (lastUpdate && (now - lastUpdate) < 10000) { // 10 seconds debounce
            return;
        }

        try {
            setLoading(true);
            const response = await api.get('/user_assignments.php');
            
            if (Array.isArray(response.data)) {
                setAssignments(response.data);
                setLastUpdate(now);
                setError(null);
            } else {
                console.error('Risposta API non valida:', response.data);
                setAssignments([]);
                setError('Formato risposta non valido');
            }
        } catch (err) {
            console.error('Errore nel caricamento delle schede assegnate:', err);
            setError('Si è verificato un errore nel caricamento delle schede. Riprova più tardi.');
        } finally {
            setLoading(false);
        }
    }, [api, lastUpdate]);

    // Run the fetch only once on mount
    useEffect(() => {
        fetchAssignedWorkouts();
    }, [fetchAssignedWorkouts]);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            const date = parseISO(dateString);
            return format(date, 'd MMMM yyyy', { locale: it });
        } catch (e) {
            return 'Data non valida';
        }
    };

    if (loading && assignments.length === 0) {
        return (
            <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
            </div>
        );
    }

    if (assignments.length === 0) {
        return (
            <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                <p className="text-gray-500 dark:text-gray-400">
                    Non hai schede assegnate. Contatta l'amministratore per ricevere una scheda di allenamento.
                </p>
            </div>
        );
    }

    const activeAssignments = assignments.filter(a => a.active === 1);
    const inactiveAssignments = assignments.filter(a => a.active !== 1);

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Le tue schede attive
                </h3>

                {activeAssignments.length === 0 ? (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-300 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <p>Non hai schede attive al momento. Contatta l'amministratore.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {activeAssignments.map(assignment => {
                            const isExpired = assignment.expiry_date && isPast(parseISO(assignment.expiry_date));

                            return (
                                <div
                                    key={assignment.id}
                                    className={`p-4 rounded-lg border ${isExpired
                                            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white">
                                                {assignment.scheda_nome}
                                            </h4>

                                            {isExpired && (
                                                <span className="inline-flex items-center px-2 py-1 mt-1 text-xs rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                                                    Scaduta
                                                </span>
                                            )}
                                        </div>
                                        <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0" />
                                    </div>

                                    <div className="mt-3 space-y-1 text-sm">
                                        <div className="flex items-center text-gray-500 dark:text-gray-400">
                                            <Calendar className="h-4 w-4 mr-1.5 flex-shrink-0" />
                                            <span>Assegnata il: {formatDate(assignment.assigned_date)}</span>
                                        </div>

                                        {assignment.expiry_date && (
                                            <div className="flex items-center text-gray-500 dark:text-gray-400">
                                                <Calendar className="h-4 w-4 mr-1.5 flex-shrink-0" />
                                                <span>Scadenza: {formatDate(assignment.expiry_date)}</span>
                                            </div>
                                        )}

                                        {assignment.notes && (
                                            <p className="text-gray-600 dark:text-gray-300 mt-2 italic">
                                                "{assignment.notes}"
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {inactiveAssignments.length > 0 && (
                <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Schede non attive
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {inactiveAssignments.map(assignment => (
                            <div
                                key={assignment.id}
                                className="p-4 rounded-lg border bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-75"
                            >
                                <div className="flex items-start justify-between">
                                    <h4 className="font-semibold text-gray-700 dark:text-gray-300">
                                        {assignment.scheda_nome}
                                    </h4>
                                    <XCircle className="h-5 w-5 text-red-400 dark:text-red-500 flex-shrink-0" />
                                </div>

                                <div className="mt-3 space-y-1 text-sm">
                                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                                        <Calendar className="h-4 w-4 mr-1.5 flex-shrink-0" />
                                        <span>Assegnata il: {formatDate(assignment.assigned_date)}</span>
                                    </div>

                                    {assignment.notes && (
                                        <p className="text-gray-500 dark:text-gray-400 mt-2 italic">
                                            "{assignment.notes}"
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserWorkouts;