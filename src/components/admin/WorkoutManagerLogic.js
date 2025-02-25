import { useState, useCallback, useEffect } from 'react';

export const useWorkoutLogic = (api, user, mode, initialWorkout, onClose, onSuccess) => {
    const [availableExercises, setAvailableExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [workoutData, setWorkoutData] = useState({
        nome: mode === 'edit' && initialWorkout ? initialWorkout.nome : '',
        descrizione: mode === 'edit' && initialWorkout ? initialWorkout.descrizione : '',
        esercizi: []
    });

    const fetchExercises = useCallback(async () => {
        try {
            const response = await api.get('/esercizi.php');
            const exercises = response.data || [];
            console.log('Loaded exercises:', exercises); // Debug
            return exercises;
        } catch (err) {
            console.error('Error loading exercises:', err);
            throw err;
        }
    }, [api]);

    const fetchWorkoutDetails = useCallback(async (workoutId) => {
        try {
            console.log(`Fetching workout details for ID: ${workoutId}`);
            const response = await api.get(`/schede.php?id=${workoutId}`);
            
            if (response.data) {
                console.log('Workout data loaded:', response.data);
                
                // Assicuriamoci che ogni esercizio abbia un tempId univoco e le proprietà corrette
                const esercizi = (response.data.esercizi || []).map((ex, index) => {
                    // Mantieni l'ID originale dell'esercizio e aggiungi un id univoco per il frontend
                    const exerciseData = {
                        ...ex,
                        // Mantieni l'ID originale per update
                        id: ex.id,
                        // TempId solo per il frontend
                        tempId: `ex-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
                        esercizio_id: parseInt(ex.esercizio_id, 10),
                        serie: parseInt(ex.serie, 10) || 3,
                        ripetizioni: parseInt(ex.ripetizioni, 10) || 10,
                        peso: parseFloat(ex.peso) || 0,
                        tempo_recupero: parseInt(ex.tempo_recupero, 10) || 90,
                        note: ex.note || '',
                        set_type: ex.set_type || 'normal',
                        toUpdate: true // Flag per indicare che è un esercizio esistente da aggiornare
                    };
                    
                    console.log(`Loaded exercise ${index}:`, exerciseData);
                    return exerciseData;
                });
                
                setWorkoutData({
                    nome: response.data.nome || '',
                    descrizione: response.data.descrizione || '',
                    esercizi: esercizi
                });
                
                console.log('Workout data set:', esercizi.length, 'exercises');
            }
            return response.data;
        } catch (err) {
            console.error('Error loading workout details:', err);
            throw err;
        }
    }, [api, setWorkoutData]);

    // Carica i dati iniziali
    useEffect(() => {
        let mounted = true;

        const loadData = async () => {
            try {
                setLoading(true);
                
                // Carica tutti gli esercizi disponibili
                const exercises = await fetchExercises();
                if (!mounted) return;
                setAvailableExercises(exercises);
                console.log('Available exercises loaded:', exercises.length);

                // Se siamo in modalità modifica, carica i dettagli della scheda
                if (mode === 'edit' && initialWorkout?.scheda_id) {
                    await fetchWorkoutDetails(initialWorkout.scheda_id);
                } else if (mode === 'new') {
                    // In modalità nuova scheda, imposta un nome predefinito
                    setWorkoutData({
                        nome: `Nuova Scheda per ${user.username}`,
                        descrizione: '',
                        esercizi: []
                    });
                }
            } catch (err) {
                if (!mounted) return;
                console.error('Error loading data:', err);
                setError('Errore nel caricamento dei dati. Riprova più tardi.');
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            mounted = false;
        };
    }, [mode, initialWorkout, user.username, fetchExercises, fetchWorkoutDetails]);

    const handleAddExercise = (exerciseData) => {
        setWorkoutData(prev => ({
            ...prev,
            esercizi: [
                ...prev.esercizi,
                {
                    ...exerciseData,
                    tempId: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // ID veramente univoco
                    set_type: 'normal',
                    linked_to_previous: false
                }
            ]
        }));
    };

    const handleRemoveExercise = (index) => {
        console.log(`Removing exercise at index ${index}`);
    
        setWorkoutData(prev => {
            const exercise = prev.esercizi[index];
            console.log('Exercise to remove:', exercise);
    
            // Se è un esercizio esistente, marcalo per l'eliminazione invece di rimuoverlo
            if (exercise.id && exercise.toUpdate) {
                console.log(`Marking exercise ${exercise.id} for deletion`);
    
                // Crea una copia degli esercizi
                const updatedExercises = [...prev.esercizi];
                
                // Marca l'esercizio per la cancellazione
                updatedExercises[index] = { 
                    ...exercise,
                    toDelete: true  // Flag per indicare che l'esercizio deve essere eliminato
                };
    
                return {
                    ...prev,
                    esercizi: updatedExercises
                };
            }
    
            // Per i nuovi esercizi, rimuovili direttamente
            return {
                ...prev,
                esercizi: prev.esercizi.filter((_, i) => i !== index)
            };
        });
    };

    const handleExerciseChange = (index, field, value) => {
        if (typeof index === 'string') {
            // Se index è una stringa, stiamo modificando i campi principali
            setWorkoutData(prev => ({
                ...prev,
                [index]: value
            }));
        } else {
            // Altrimenti stiamo modificando un esercizio
            setWorkoutData(prev => ({
                ...prev,
                esercizi: prev.esercizi.map((ex, i) => {
                    if (i === index) {
                        let processedValue = value;
                        switch (field) {
                            case 'esercizio_id':
                                processedValue = parseInt(value, 10);
                                break;
                            case 'serie':
                            case 'ripetizioni':
                                processedValue = parseInt(value, 10);
                                break;
                            case 'peso':
                                processedValue = parseFloat(value);
                                break;
                            case 'tempo_recupero':
                                processedValue = parseInt(value, 10) || 90;
                                break;
                            default:
                                processedValue = value;
                        }
                        return { ...ex, [field]: processedValue };
                    }
                    return ex;
                })
            }));
        }
    };

    const handleExercisesReorder = (newExercises) => {
        console.log('Reordering exercises:', newExercises);
        setWorkoutData(prev => ({
            ...prev,
            esercizi: newExercises
        }));
    };

    const handleSubmit = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        if (saving) return;
    
        // Debug
        console.log("Starting submit process...");
        console.log("Current workout data:", workoutData);
        console.log("Exercises count:", workoutData.esercizi.length);
    
        try {
            setSaving(true);
            setError(null);
    
            if (!workoutData.nome.trim()) {
                throw new Error('Il nome della scheda è obbligatorio');
            }
    
            // Assicuriamoci che ci siano esercizi
            if (workoutData.esercizi.length === 0) {
                throw new Error('Aggiungi almeno un esercizio alla scheda');
            }
    
            // Preparare i dati per l'invio
            const prepareExerciseData = (ex) => {
                const baseData = {
                    esercizio_id: parseInt(ex.esercizio_id, 10),
                    serie: parseInt(ex.serie, 10) || 3,
                    ripetizioni: parseInt(ex.ripetizioni, 10) || 10,
                    peso: parseFloat(ex.peso) || 0,
                    tempo_recupero: parseInt(ex.tempo_recupero, 10) || 90,
                    note: ex.note || '',
                    set_type: ex.set_type || 'normal',
                };
                
                // Per gli esercizi esistenti, includi l'ID originale
                if (ex.id && ex.toUpdate) {
                    return {
                        ...baseData,
                        id: ex.id  // ID originale per l'aggiornamento
                    };
                }
                
                // Per i nuovi esercizi, non includere l'ID
                return baseData;
            };
    
            const dataToSend = {
                ...workoutData,
                esercizi: workoutData.esercizi.map(prepareExerciseData)
            };
    
            console.log('Sending data to server:', dataToSend);
    
            let response;
            if (mode === 'edit' && initialWorkout?.scheda_id) {
                console.log(`Updating workout with ID: ${initialWorkout.scheda_id}`);
                response = await api.put(`/schede.php?id=${initialWorkout.scheda_id}`, dataToSend);
            } else {
                console.log('Creating new workout');
                response = await api.post('/schede.php', dataToSend);
            }
    
            console.log('Server response:', response);
    
            if (response.data) {
                // Per nuove schede, assegna all'utente
                if (mode === 'new' || !initialWorkout) {
                    console.log(`Assigning workout to user ${user.id}`);
                    await api.post('/user_assignments.php', {
                        user_id: user.id,
                        scheda_id: response.data.id,
                        active: 1
                    });
                }
    
                if (onSuccess) onSuccess(response.data);
                onClose();
                
                // Forza il ricaricamento della pagina
                console.log('Reloading page...');
                window.location.reload();
            }
        } catch (err) {
            console.error('Error saving workout:', err);
            setError(err.response?.data?.error || err.message || 'Errore durante il salvataggio della scheda');
            setSaving(false);
        }
    };

const handleDelete = useCallback(async () => {
    if (!initialWorkout) return;
    
    try {
        setSaving(true);
        setError(null);

        console.log("Deleting workout:", initialWorkout);
        
        // Conferma esplicita prima dell'eliminazione
        const confirmDelete = window.confirm('Sei sicuro di voler eliminare questa scheda?');
        if (!confirmDelete) {
            setSaving(false);
            return; // Interrompe se l'utente annulla
        }

        // Prima elimina l'assegnazione
        console.log(`Deleting assignment with ID: ${initialWorkout.id}`);
        await api.delete(`/user_assignments.php?id=${initialWorkout.id}`);
        
        // Poi elimina la scheda
        if (initialWorkout.scheda_id) {
            console.log(`Deleting workout with ID: ${initialWorkout.scheda_id}`);
            await api.delete(`/schede.php?id=${initialWorkout.scheda_id}`);
        }

        console.log("Deletion successful");
        
        // Chiudi senza richiamare onSuccess per evitare l'apertura di una nuova finestra
        onClose();
        
        // Forza il ricaricamento della pagina
        console.log('Reloading page...');
        window.location.reload();
    } catch (err) {
        console.error('Error deleting workout:', err);
        setError(err.response?.data?.error || 'Errore durante l\'eliminazione della scheda');
    } finally {
        setSaving(false);
    }
}, [api, initialWorkout, onClose]);

    return {
        availableExercises,
        setAvailableExercises,
        loading,
        setLoading,
        saving,
        error,
        setError,
        workoutData,
        setWorkoutData,
        fetchExercises,
        fetchWorkoutDetails,
        handleAddExercise,
        handleRemoveExercise,
        handleExerciseChange,
        handleExercisesReorder,
        handleSubmit,
        handleDelete
    };
};