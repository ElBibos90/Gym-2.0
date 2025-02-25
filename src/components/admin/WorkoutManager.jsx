import React, { useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useWorkoutLogic } from './WorkoutManagerLogic';
import WorkoutManagerUI from './WorkoutManagerUI';

const WorkoutManager = ({ user, onClose, onSuccess, mode = 'view', initialWorkout = null }) => {
    const { getAuthenticatedApi } = useAuth();
    const api = getAuthenticatedApi();

    const {
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
        handleSubmit,
        handleExercisesReorder  // Assicurati che questa funzione venga importata correttamente
    } = useWorkoutLogic(api, user, mode, initialWorkout, onClose, onSuccess);

    useEffect(() => {
        let mounted = true;

        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Carica gli esercizi disponibili
                const exercises = await fetchExercises();
                if (!mounted) return;
                setAvailableExercises(exercises);

                // Se in modalità edit, carica i dettagli della scheda
                if (mode === 'edit' && initialWorkout?.scheda_id) {
                    const workout = await fetchWorkoutDetails(initialWorkout.scheda_id);
                    if (!mounted) return;

                    if (workout) {
                        setWorkoutData(prev => ({
                            ...prev,
                            nome: workout.nome || '',
                            descrizione: workout.descrizione || '',
                            esercizi: workout.esercizi || []
                        }));
                    }
                } else if (mode === 'new') {
                    setWorkoutData(prev => ({
                        ...prev,
                        nome: ``,
                        descrizione: '',
                        esercizi: []
                    }));
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
    }, [mode, initialWorkout, user.username, fetchExercises, fetchWorkoutDetails, setAvailableExercises, setWorkoutData, setLoading, setError]);

    return (
        <WorkoutManagerUI
            loading={loading}
            saving={saving}
            error={error}
            workoutData={workoutData}
            setWorkoutData={setWorkoutData}
            availableExercises={availableExercises}
            mode={mode}
            initialWorkout={initialWorkout}
            user={user}
            onClose={onClose}
            handleAddExercise={handleAddExercise}
            handleRemoveExercise={handleRemoveExercise}
            handleExerciseChange={handleExerciseChange}
            handleSubmit={handleSubmit}
            handleExercisesReorder={handleExercisesReorder}  // Passa questa funzione
        />
    );
};

export default WorkoutManager;