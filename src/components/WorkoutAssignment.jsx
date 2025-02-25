import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { format, isFuture, isValid, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import {
    X, CheckCircle, XCircle, Calendar, FileText, AlertCircle
} from 'lucide-react';

const WorkoutAssignment = ({ userId, username, onClose }) => {
    const { getAuthenticatedApi } = useAuth();
    const api = getAuthenticatedApi();

    const [loading, setLoading] = useState(true);
    const [assignments, setAssignments] = useState([]);
    const [availableWorkouts, setAvailableWorkouts] = useState([]);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Stato per la selezione di una nuova scheda
    const [selectedWorkoutId, setSelectedWorkoutId] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        fetchData();
    }, [userId]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Carica le assegnazioni attuali dell'utente
            const assignmentsResponse = await api.get(`/user_assignments.php?user_id=${userId}`);

            // Carica tutte le schede disponibili
            const workoutsResponse = await api.get('/schede.php');

            setAssignments(assignmentsResponse.data);
            setAvailableWorkouts(workoutsResponse.data);
        } catch (err) {
            console.error('Errore nel caricamento dati:', err);
            setError('Errore nel caricamento dei dati. Riprova più tardi.');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignWorkout = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!selectedWorkoutId) {
            setError('Seleziona una scheda da assegnare');
            return;
        }

        // Validazione data opzionale
        if (expiryDate) {
            const parsedDate = parseISO(expiryDate);
            if (!isValid(parsedDate)) {
                setError('Data di scadenza non valida');
                return;
            }

            if (!isFuture(parsedDate)) {
                setError('La data di scadenza deve essere futura');
                return;
            }
        }

        try {
            setLoading(true);

            await api.post('/user_assignments.php', {
                user_id: userId,
                scheda_id: selectedWorkoutId,
                expiry_date: expiryDate || null,
                notes: notes.trim(),
                active: 1
            });

            // Aggiorna la lista delle assegnazioni
            await fetchData();

            // Reset form
            setSelectedWorkoutId('');
            setExpiryDate('');
            setNotes('');

            setSuccess('Scheda assegnata con successo');
        } catch (err) {
            console.error('Errore nell\'assegnazione:', err);
            setError(err.response?.data?.error || 'Errore durante l\'assegnazione della scheda');
        } finally {
            setLoading(false);
        }
    };

    const toggleAssignmentStatus = async (assignmentId, currentStatus) => {
        try {
            setLoading(true);

            await api.put(`/user_assignments.php?id=${assignmentId}`, {
                active: currentStatus ? 0 : 1
            });

            // Aggiorna la lista delle assegnazioni
            await fetchData();

            setSuccess(`Scheda ${currentStatus ? 'disattivata' : 'attivata'} con successo`);
        } catch (err) {
            console.error('Errore nella modifica dello stato:', err);
            setError(err.response?.data?.error || 'Errore durante la modifica dello stato');
        } finally {
            setLoading(false);
        }
    };

    const deleteAssignment = async (assignmentId) => {
        if (!window.confirm('Sei sicuro di voler rimuovere questa assegnazione?')) {
            return;
        }

        try {
            setLoading(true);

            await api.delete(`/user_assignments.php?id=${assignmentId}`);

            // Aggiorna la lista delle assegnazioni
            await fetchData();

            setSuccess('Assegnazione rimossa con successo');
        } catch (err) {
            console.error('Errore nella rimozione:', err);
            setError(err.response?.data?.error || 'Errore durante la rimozione dell\'assegnazione');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Nessuna scadenza';

        try {
            const date = parseISO(dateString);
            return format(date, 'd MMMM yyyy', { locale: it });
        } catch (e) {
            return 'Data non valida';
        }
    };

    // Filtra le schede già assegnate per non mostrarle nella selezione
    const getAvailableWorkouts = () => {
        const assignedIds = assignments.map(a => a.scheda_id);
        return availableWorkouts.filter(workout => !assignedIds.includes(workout.id));
    };

    if (loading && assignments.length === 0) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Gestione Schede per {username}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 flex-shrink-0" />
                        <p>{success}</p>
                    </div>
                )}

                <div className="mb-8">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Assegna una Nuova Scheda
                    </h3>

                    <form onSubmit={handleAssignWorkout} className="space-y-4">
                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 mb-1" htmlFor="workout">
                                Seleziona Scheda
                            </label>
                            <select
                                id="workout"
                                value={selectedWorkoutId}
                                onChange={(e) => setSelectedWorkoutId(e.target.value)}
                                className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">-- Seleziona una scheda --</option>
                                {getAvailableWorkouts().map(workout => (
                                    <option key={workout.id} value={workout.id}>
                                        {workout.nome}
                                    </option>
                                ))}
                            </select>
                            {getAvailableWorkouts().length === 0 && (
                                <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                                    Tutte le schede sono già state assegnate a questo utente
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 mb-1" htmlFor="expiryDate">
                                Data di Scadenza (opzionale)
                            </label>
                            <input
                                type="date"
                                id="expiryDate"
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 mb-1" htmlFor="notes">
                                Note (opzionale)
                            </label>
                            <textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                                rows="2"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !selectedWorkoutId}
                            className={`w-full py-2 px-4 rounded font-medium text-white transition-colors ${loading || !selectedWorkoutId
                                    ? 'bg-blue-400 dark:bg-blue-600 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600'
                                }`}
                        >
                            {loading ? 'Assegnazione in corso...' : 'Assegna Scheda'}
                        </button>
                    </form>
                </div>

                <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Schede Assegnate
                    </h3>

                    {assignments.length === 0 ? (
                        <div className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                            <p className="text-gray-500 dark:text-gray-400">
                                Nessuna scheda assegnata a questo utente
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {assignments.map(assignment => (
                                <div
                                    key={assignment.id}
                                    className={`p-4 rounded-lg border ${assignment.active ?
                                            'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' :
                                            'bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-75'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center">
                                                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                                                    {assignment.scheda_nome}
                                                </h4>
                                                <span className={`ml-3 px-2 py-1 text-xs rounded-full ${assignment.active ?
                                                        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                    }`}>
                                                    {assignment.active ? 'Attiva' : 'Disattivata'}
                                                </span>
                                            </div>

                                            <div className="mt-2 space-y-1">
                                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                    <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                                                    <span>Assegnata il: {formatDate(assignment.assigned_date)}</span>
                                                </div>

                                                {assignment.expiry_date && (
                                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                        <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                                                        <span>Scadenza: {formatDate(assignment.expiry_date)}</span>
                                                    </div>
                                                )}

                                                {assignment.notes && (
                                                    <div className="flex items-start text-sm text-gray-500 dark:text-gray-400">
                                                        <FileText className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                                                        <span>{assignment.notes}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => toggleAssignmentStatus(assignment.id, assignment.active)}
                                                className={`p-1 rounded-full ${assignment.active ?
                                                        'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30' :
                                                        'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30'
                                                    }`}
                                                title={assignment.active ? 'Disattiva scheda' : 'Attiva scheda'}
                                            >
                                                {assignment.active ?
                                                    <XCircle className="h-5 w-5" /> :
                                                    <CheckCircle className="h-5 w-5" />
                                                }
                                            </button>
                                            <button
                                                onClick={() => deleteAssignment(assignment.id)}
                                                className="p-1 rounded-full text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                                                title="Rimuovi assegnazione"
                                            >
                                                <X className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkoutAssignment;

// Pulsante per aprire il modal di assegnazione schede
export const AssignWorkoutButton = ({ userId, username, onAssign }) => {
    return (
        <button
            onClick={() => onAssign(userId, username)}
            className="px-2 py-1 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors flex items-center space-x-1"
            title="Gestisci schede assegnate"
        >
            <FileText className="h-3.5 w-3.5" />
            <span>Schede</span>
        </button>
    );
};