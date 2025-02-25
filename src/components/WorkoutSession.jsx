import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import ExerciseProgress from './ExerciseProgress';
import WorkoutHistory from './WorkoutHistory';
import { Clock, CheckCircle, ChevronLeft } from 'lucide-react';
import { formatDate } from '../lib/utils';

const WorkoutSession = () => {
    // Auth context for API calls
    const { getAuthenticatedApi, loading: authLoading } = useAuth();
    const api = getAuthenticatedApi();

    // Refs to prevent unnecessary re-renders
    const apiRef = useRef(api);
    const timerRef = useRef(null);
    const completedExercisesRef = useRef(new Set());
    const exercisesWithTimerRef = useRef(new Set());

    // State management
    const [selectedWorkout, setSelectedWorkout] = useState(null);
    const [workouts, setWorkouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exerciseHistory, setExerciseHistory] = useState({});
    const [currentAllenamento, setCurrentAllenamento] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [serieCompletate, setSerieCompletate] = useState({});
    const [error, setError] = useState(null);
    const [sessionStartTime, setSessionStartTime] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isInitialized, setIsInitialized] = useState(false);
    const [lastTimerCompletedAt, setLastTimerCompletedAt] = useState(0);

    // Aggiorna il riferimento API quando cambia
    useEffect(() => {
        apiRef.current = api;
    }, [api]);
    // Helper per ottenere il nome del tipo di set
    const getSetTypeName = useCallback((type) => {
        switch (type) {
            case 'superset': return 'Superset';
            case 'dropset': return 'Drop Set';
            case 'circuit': return 'Circuito';
            default: return 'Normale';
        }
    }, []);

    // Start timer for elapsed time
    const startElapsedTimeTimer = useCallback(() => {
        // Clear any existing timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        
        // Set up new timer that updates every minute
        timerRef.current = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 60000); // Update every minute
    }, []);

    // Un esercizio è completato se tutte le serie sono state fatte
    const isExerciseCompleted = useCallback((exerciseId) => {
        return (serieCompletate[exerciseId]?.length || 0) >= 
               selectedWorkout?.esercizi.find(e => e.id === exerciseId)?.serie;
    }, [serieCompletate, selectedWorkout]);

    // Funzione per determinare il tempo di recupero in base al tipo di set
    const getRecoveryTime = useCallback((exercise) => {
        if (!exercise) return 90; // Default
        
        // Verifica se c'è un esercizio successivo collegato (parte di un superset)
        const index = selectedWorkout?.esercizi.findIndex(e => e.id === exercise.id);
        if (index >= 0 && index < selectedWorkout?.esercizi.length - 1) {
            const nextExercise = selectedWorkout?.esercizi[index + 1];
            // Se il prossimo esercizio è collegato a questo (superset), non mostrare recupero
            if (nextExercise && (nextExercise.linked_to_previous === 1 || nextExercise.linked_to_previous === true)) {
                return 0;
            }
        }
        
        // Recuperi personalizzati in base al tipo di set
        switch (exercise.set_type) {
            case 'dropset':
                // Recupero più breve per i dropset
                return Math.min(30, exercise.tempo_recupero || 90);
            case 'circuit':
                // Determina se è l'ultimo esercizio del circuito
                const isLastInCircuit = index >= 0 && 
                    (index === selectedWorkout?.esercizi.length - 1 || 
                    selectedWorkout?.esercizi[index + 1].set_type !== 'circuit');
                
                return isLastInCircuit ? (exercise.tempo_recupero || 90) : 15;
            default:
                return exercise.tempo_recupero || 90;
        }
    }, [selectedWorkout]);

    // Un esercizio è visibile se:
    // 1. Non è completato, OPPURE
    // 2. È completato ma ha un timer in corso, OPPURE 
    // 3. È completato da poco (entro 2 secondi)
    // 4. È un superset e l'esercizio collegato non è completato
    const shouldShowExercise = useCallback((exercise) => {
        const exerciseId = exercise.id;
        
        // Se non è completato, mostralo sempre
        if (!isExerciseCompleted(exerciseId)) {
            return true;
        }
        
        // Se ha un timer in corso, mostralo
        if (exercisesWithTimerRef.current.has(exerciseId)) {
            return true;
        }
        
        // Se è stato appena completato (entro 2 secondi), mostralo
        const now = Date.now();
        if (completedExercisesRef.current.has(exerciseId) && 
            now - lastTimerCompletedAt < 2000) {
            return true;
        }
        
        // Controlli specifici per i tipi di set
        // Per i superset, mostra finché il successivo non è completato
        if (exercise.set_type === 'superset') {
            // Trova l'indice di questo esercizio nella lista
            const index = selectedWorkout?.esercizi.findIndex(e => e.id === exerciseId);
            if (index >= 0 && index < selectedWorkout?.esercizi.length - 1) {
                const nextExercise = selectedWorkout?.esercizi[index + 1];
                // Se il prossimo esercizio è collegato e non è completato, mostra questo
                if (nextExercise && 
                    (nextExercise.linked_to_previous === 1 || nextExercise.linked_to_previous === true) && 
                    !isExerciseCompleted(nextExercise.id)) {
                    return true;
                }
            }
        }
        
        // Altrimenti non mostrarlo
        return false;
    }, [isExerciseCompleted, lastTimerCompletedAt, selectedWorkout]);
    // Load exercise history for a specific exercise
    const loadExerciseHistory = useCallback(async (exercise) => {
        if (!exercise?.esercizio_id) return;
            
        try {
            const response = await apiRef.current.get(`/serie_completate.php?esercizio_id=${exercise.esercizio_id}`);
            
            if (response.data) {
                setExerciseHistory(prev => ({
                    ...prev,
                    [exercise.id]: response.data
                }));
            }
        } catch (err) {
            // Ignora errori di autenticazione durante il caricamento
            if (err.response && err.response.status === 401 && authLoading) {
                return;
            }
            console.error('Error loading exercise history:', err);
        }
    }, [authLoading]);

    // Load completed sets for the current workout
    const loadSerieCompletate = useCallback(async (allenamentoId) => {
        try {
            const response = await apiRef.current.get(`/serie_completate.php?allenamento_id=${allenamentoId}`);
            // Organize series by exercise
            const serieByExercise = {};
            
            response.data.forEach(serie => {
                const exerciseId = parseInt(serie.scheda_esercizio_id);
                if (!serieByExercise[exerciseId]) {
                    serieByExercise[exerciseId] = [];
                }
                serieByExercise[exerciseId].push(serie);
            });
            
            setSerieCompletate(serieByExercise);
            
            // Aggiorna il set di esercizi completati
            Object.keys(serieByExercise).forEach(exerciseId => {
                const exId = parseInt(exerciseId);
                const exercise = selectedWorkout?.esercizi.find(e => e.id === exId);
                if (exercise && serieByExercise[exerciseId].length >= exercise.serie) {
                    completedExercisesRef.current.add(exId);
                }
            });
        } catch (err) {
            // Ignora errori di autenticazione durante il caricamento
            if (err.response && err.response.status === 401 && authLoading) {
                return;
            }
            console.error('Error loading completed sets:', err);
        }
    }, [selectedWorkout, authLoading]);

    // Check for incomplete workouts to resume
    const checkIncompleteWorkout = useCallback(async () => {
        try {
            const response = await apiRef.current.get('/allenamenti.php');
            const incompleteWorkout = response.data.find(a => a.durata_totale === null);
            
            if (incompleteWorkout && incompleteWorkout.scheda_id) {
                // Load workout details
                const schedaResponse = await apiRef.current.get(`/schede.php?id=${incompleteWorkout.scheda_id}`);
                if (schedaResponse.data) {
                    const startTime = new Date(incompleteWorkout.data_allenamento);
                    setSelectedWorkout(schedaResponse.data);
                    setCurrentAllenamento(incompleteWorkout);
                    setSessionStartTime(startTime);
                    setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 60000));
                    
                    // Load completed sets
                    await loadSerieCompletate(incompleteWorkout.id);
                    
                    // Load history for each exercise
                    const historyPromises = schedaResponse.data.esercizi?.map(esercizio => 
                        loadExerciseHistory(esercizio)
                    ) || [];
                    
                    await Promise.all(historyPromises);
                }
            }
        } catch (err) {
            // Ignora errori di autenticazione durante il caricamento
            if (err.response && err.response.status === 401) {
                console.log('Autenticazione in corso, ignorato errore 401');
                return; // Non mostrare errori quando l'autenticazione è in corso
            }
            
            console.error('Error checking for incomplete workouts:', err);
            // Mostra l'errore solo se non è un problema di autenticazione
            setError('Errore durante il controllo degli allenamenti precedenti');
        }
    }, [loadSerieCompletate, loadExerciseHistory]);

    useEffect(() => {
        // Quando l'autenticazione è completata, resetta eventuali errori 401
        if (!authLoading && error && error === 'Errore durante il controllo degli allenamenti precedenti') {
            setError(null);
        }
    }, [authLoading, error]);

    // Cleanup incomplete workout
    const cleanupWorkout = useCallback(async () => {
        if (!currentAllenamento?.id) return;

        try {
            // Check if there are any completed sets
            const serieResponse = await apiRef.current.get(`/serie_completate.php?allenamento_id=${currentAllenamento.id}`);
            if (!serieResponse.data || serieResponse.data.length === 0) {
                // Delete empty workout
                await apiRef.current.delete(`/allenamenti.php?id=${currentAllenamento.id}`);
            }
        } catch (err) {
            // Ignora errori di autenticazione
            if (err.response && err.response.status === 401) {
                return;
            }
            console.error('Error cleaning up workout:', err);
        }
    }, [currentAllenamento]);
    // Load workouts data
    const loadWorkoutsData = useCallback(async () => {
        try {
            setLoading(true);
            
            // Load available workouts
            const userAssignmentsResponse = await apiRef.current.get('/user_assignments.php');
            if (Array.isArray(userAssignmentsResponse.data)) {
                // Filter active assignments
                const activeAssignments = userAssignmentsResponse.data.filter(a => a.active == 1);
                
                if (activeAssignments.length > 0) {
                    // Get workout details for each assigned workout
                    const workoutsPromises = activeAssignments.map(assignment => 
                        apiRef.current.get(`/schede.php?id=${assignment.scheda_id}`)
                            .then(workoutResponse => ({
                                ...workoutResponse.data,
                                assigned_date: assignment.assigned_date,
                                expiry_date: assignment.expiry_date
                            }))
                            .catch(err => {
                                console.error(`Error loading workout ${assignment.scheda_id}:`, err);
                                return null;
                            })
                    );
                    
                    const workoutsData = (await Promise.all(workoutsPromises)).filter(Boolean);
                    setWorkouts(workoutsData);
                } else {
                    setWorkouts([]);
                }
            }
        } catch (err) {
            // Ignora errori di autenticazione durante il caricamento
            if (err.response && err.response.status === 401 && authLoading) {
                return;
            }
            console.error('Error loading workouts:', err);
            setError('Errore durante il caricamento delle schede');
        } finally {
            setLoading(false);
        }
    }, [authLoading]);

    // Select a workout and start a new session
    const handleWorkoutSelect = useCallback(async (workoutId) => {
        if (!workoutId) return;

        try {
            // First clean up any current workout if needed
            await cleanupWorkout();

            const response = await apiRef.current.get(`/schede.php?id=${workoutId}`);
            if (!response.data) {
                setError('Impossibile caricare i dettagli della scheda');
                return;
            }

            // Resetta i riferimenti
            completedExercisesRef.current = new Set();
            exercisesWithTimerRef.current = new Set();

            setSelectedWorkout(response.data);
            setError(null);

            // Create a new workout session
            const allenamentoResponse = await apiRef.current.post('/allenamenti.php', {
                scheda_id: workoutId,
                data_allenamento: new Date().toISOString()
            });

            if (allenamentoResponse.data) {
                const startTime = new Date();
                setCurrentAllenamento(allenamentoResponse.data);
                setSerieCompletate({});
                setSessionStartTime(startTime);
                setElapsedTime(0);
                
                // Start timer
                startElapsedTimeTimer();
            }
        } catch (err) {
            console.error('Error selecting workout:', err);
            setError('Errore durante l\'avvio dell\'allenamento');
        }
    }, [cleanupWorkout, startElapsedTimeTimer]);

    // Handle completing a set
    const handleSerieComplete = useCallback(async (exerciseId, serieData) => {
        if (!currentAllenamento || !exerciseId || !serieData) return;

        try {
            // Update local state first for immediate feedback
            setSerieCompletate(prevState => {
                const updatedSeries = [...(prevState[exerciseId] || []), serieData];
                const newState = { ...prevState, [exerciseId]: updatedSeries };
                
                // Controlla se l'esercizio è stato appena completato
                const exercise = selectedWorkout?.esercizi.find(e => e.id === exerciseId);
                if (exercise && updatedSeries.length >= exercise.serie) {
                    completedExercisesRef.current.add(exerciseId);
                }
                
                // Segna che questo esercizio ha un timer in corso
                exercisesWithTimerRef.current.add(exerciseId);
                
                return newState;
            });

            // Save to server
            const response = await apiRef.current.post('/serie_completate.php', {
                allenamento_id: currentAllenamento.id,
                ...serieData
            });

            if (response.data?.id) {
                // Update exercise history
                await loadExerciseHistory({ id: exerciseId, esercizio_id: serieData.esercizio_id });
            }
        } catch (err) {
            console.error('Error saving completed set:', err);
            
            // Rollback state in case of error
            setSerieCompletate(prev => {
                const series = [...(prev[exerciseId] || [])];
                series.pop();
            
                // Rimuovi dal set degli esercizi completati se necessario
                if (completedExercisesRef.current.has(exerciseId)) {
                    const exercise = selectedWorkout?.esercizi.find(e => e.id === exerciseId);
                    if (exercise && (series.length || 0) < exercise.serie) {
                        completedExercisesRef.current.delete(exerciseId);
                    }
                }
            
                return { ...prev, [exerciseId]: series };
            });
            
            // Rimuovi dal set degli esercizi con timer
            exercisesWithTimerRef.current.delete(exerciseId);
        }
    }, [currentAllenamento, loadExerciseHistory, selectedWorkout]);

    // Gestisce il completamento del timer per un esercizio
    const handleExerciseTimerComplete = useCallback((exerciseId) => {
        // Rimuovi questo esercizio dall'elenco di quelli con timer attivo
        exercisesWithTimerRef.current.delete(exerciseId);
        
        // Imposta il timestamp dell'ultimo timer completato
        setLastTimerCompletedAt(Date.now());
        
        // Forza un aggiornamento per riflettere il cambiamento
        setSerieCompletate(prevState => ({...prevState}));
    }, []);
    // Complete workout and save duration
    const handleWorkoutComplete = useCallback(async () => {
        if (!currentAllenamento) return;

        try {
            // Stop timer
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }

            await apiRef.current.put(`/allenamenti.php?id=${currentAllenamento.id}`, {
                durata_totale: elapsedTime
            });
            
            // Reset all state
            setSelectedWorkout(null);
            setCurrentAllenamento(null);
            setSerieCompletate({});
            setSessionStartTime(null);
            setElapsedTime(0);
            setShowHistory(false);
            completedExercisesRef.current = new Set();
            exercisesWithTimerRef.current = new Set();
        } catch (err) {
            console.error('Error completing workout:', err);
            setError('Errore durante il completamento dell\'allenamento');
        }
    }, [currentAllenamento, elapsedTime]);

    // Change workout
    const handleChangeWorkout = useCallback(async () => {
        // Stop timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        await cleanupWorkout();
        
        // Reset all state
        setSelectedWorkout(null);
        setCurrentAllenamento(null);
        setSerieCompletate({});
        setSessionStartTime(null);
        setElapsedTime(0);
        setShowHistory(false);
        completedExercisesRef.current = new Set();
        exercisesWithTimerRef.current = new Set();
    }, [cleanupWorkout]);

    // Toggle workout history view
    const handleToggleHistory = (show) => {
        setShowHistory(show);
    };

    // Initialize component only once
    useEffect(() => {
        if (isInitialized || authLoading) return;
        
        const init = async () => {
            try {
                // Keep API reference updated
                apiRef.current = api;
                
                // Check for incomplete workouts first
                if (!authLoading) {
                    await checkIncompleteWorkout();
                }
                
                // If no active workout was found, load available workouts
                if (!currentAllenamento && !authLoading) {
                    await loadWorkoutsData();
                }
                
                // Start timer if we have an active session
                if (sessionStartTime) {
                    startElapsedTimeTimer();
                }
                
                setIsInitialized(true);
            } catch (err) {
                // Ignora errori di autenticazione durante il caricamento
                if (err.response && err.response.status === 401 && authLoading) {
                    return;
                }
                
                console.error('Error initializing workout session:', err);
                setError('Errore durante l\'inizializzazione');
                setLoading(false);
            }
        };

        // Delay initialization until authentication is complete
        if (!authLoading) {
            init();
        }
        
        // Cleanup on unmount
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            
            // Attempt to clean up any incomplete workouts
            if (currentAllenamento?.id) {
                cleanupWorkout();
            }
        };
    }, [
        isInitialized, 
        authLoading, 
        api, 
        checkIncompleteWorkout, 
        loadWorkoutsData, 
        sessionStartTime, 
        startElapsedTimeTimer, 
        cleanupWorkout, 
        currentAllenamento
    ]);
    if (loading && !isInitialized) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
        );
    }

    if (showHistory) {
        return <WorkoutHistory onBack={() => handleToggleHistory(false)} />;
    }

    return (
        <div className="max-w-2xl mx-auto p-4">
            {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
                    {error}
                </div>
            )}

            {!selectedWorkout ? (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Seleziona Scheda
                        </h2>
                        <button
                            onClick={() => handleToggleHistory(true)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                            Visualizza Storico
                        </button>
                    </div>

                    {workouts.length === 0 ? (
                        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-amber-800 dark:text-amber-300">
                            <p className="mb-2 font-medium">Nessuna scheda assegnata</p>
                            <p className="text-sm">Non hai schede attive al momento. Contatta l'amministratore per ricevere una scheda di allenamento.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {workouts.map(workout => (
                                <button
                                    key={workout.id}
                                    onClick={() => handleWorkoutSelect(workout.id)}
                                    className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md dark:shadow-gray-900 transition-all text-left border border-gray-200 dark:border-gray-700"
                                >
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {workout.nome}
                                    </h3>
                                    {workout.descrizione && (
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                            {workout.descrizione}
                                        </p>
                                    )}
                                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                        <span className="text-gray-500 dark:text-gray-400">
                                            Assegnata: {formatDate(workout.assigned_date)}
                                        </span>
                                        {workout.expiry_date && (
                                            <span className="text-gray-500 dark:text-gray-400">
                                                • Scadenza: {formatDate(workout.expiry_date)}
                                            </span>
                                        )}
                                        <span className="text-gray-500 dark:text-gray-400">
                                            • {workout.esercizi?.length || 0} esercizi
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {selectedWorkout.nome}
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {sessionStartTime ? 
                                    `Iniziato il ${sessionStartTime.toLocaleString()}` :
                                    'Inizio allenamento...'}
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <button
                                onClick={handleChangeWorkout}
                                className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                <span>Cambia</span>
                            </button>
                            <button
                                onClick={handleWorkoutComplete}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 flex items-center gap-1"
                            >
                                <CheckCircle className="h-4 w-4" />
                                <span>Termina</span>
                            </button>
                        </div>
                    </div>

                    {/* Timer indicator */}
                    {sessionStartTime && (
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center gap-2">
                            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <div className="text-blue-800 dark:text-blue-300 text-sm">
                                Tempo trascorso: {(() => {
                                    const hours = Math.floor(elapsedTime / 60);
                                    const minutes = elapsedTime % 60;
                                    return hours > 0 
                                        ? `${hours}h ${minutes}m` 
                                        : `${minutes}m`;
                                })()}
                            </div>
                        </div>
                    )}

                    {/* Progress panel */}
                    <div className="space-y-4">
                        {selectedWorkout.esercizi
                            ?.filter(exercise => shouldShowExercise(exercise))
                            .map((exercise, index) => {
                                // Determina se questo esercizio è collegato al precedente
                                const isLinkedToPrevious = exercise.linked_to_previous === 1 || exercise.linked_to_previous === true;

                                return (
                                    <div key={exercise.id} className="relative">
                                        {/* Indicatore visivo di collegamento per esercizi linked_to_previous */}
                                        {isLinkedToPrevious && (
                                            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 h-4 border-l-2 border-dashed border-blue-500"></div>
                                        )}
                                        
                                        <ExerciseProgress
                                            key={exercise.id}
                                            exercise={exercise}
                                            exerciseHistory={exerciseHistory[exercise.id]}
                                            serieCompletate={serieCompletate[exercise.id] || []}
                                            onSerieComplete={(serieData) =>
                                                handleSerieComplete(exercise.id, serieData)
                                            }
                                            onTimerComplete={() => handleExerciseTimerComplete(exercise.id)}
                                            getRecoveryTime={() => getRecoveryTime(exercise)}
                                            setTypeName={getSetTypeName(exercise.set_type)}
                                            isLinkedToPrevious={isLinkedToPrevious}
                                        />
                                    </div>
                                );
                            })}
                    </div>

                    {/* Summary of completed exercises */}
                    {Object.keys(serieCompletate).length > 0 && (
                        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                                Esercizi completati
                            </h3>
                            <div className="space-y-2">
                                {selectedWorkout.esercizi
                                    ?.filter(exercise => {
                                        const completedSeries = serieCompletate[exercise.id] || [];
                                        return completedSeries.length >= exercise.serie;
                                    })
                                    .filter(exercise => !shouldShowExercise(exercise))
                                    .map(exercise => (
                                        <div key={exercise.id} className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {exercise.nome}
                                                </p>
                                                {exercise.set_type !== 'normal' && (
                                                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                                                        {getSetTypeName(exercise.set_type)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {exercise.serie} serie completate
                                                </p>
                                                <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default WorkoutSession;