import React from 'react';
import { X, Save, AlertCircle, Loader2, Dumbbell } from 'lucide-react';
import ExerciseSelector from './../ExerciseSelector';
import SortableExerciseList from './workout/SortableExerciseList';

const WorkoutManagerUI = ({
    loading,
    saving,
    error,
    workoutData,
    availableExercises,
    mode,
    initialWorkout,
    user,
    onClose,
    handleAddExercise,
    handleRemoveExercise,
    handleExerciseChange,
    handleExercisesReorder,
    handleSubmit,
    setWorkoutData
}) => {
    // Previene la chiusura quando si clicca sulla finestra modale
    const stopPropagation = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    // Funzione per gestire il submit del form
    const onFormSubmit = (e) => {
        stopPropagation(e);
        console.log("Submitting form...");
        handleSubmit(e);
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={stopPropagation}>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6" onClick={stopPropagation}>
                    <Loader2 className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
            </div>
        );
    }

    // Determina il titolo in base alla modalità e al nome della scheda
    const getTitle = () => {
        if (mode === 'edit') {
            return `Modifica Scheda: ${workoutData.nome}`;
        } else if (mode === 'new') {
            return 'Nuova Scheda';
        } else {
            return 'Gestione Scheda';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={stopPropagation}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Dumbbell className="h-6 w-6 mr-2" />
                        {getTitle()}
                    </h2>
                    <button
                        onClick={(e) => {
                            stopPropagation(e);
                            onClose();
                        }}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        type="button"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* NUOVO: Pulsante salvataggio in alto */}
                <div className="flex justify-end mb-6">
                    <button
                        onClick={onFormSubmit}
                        disabled={saving || workoutData.esercizi.length === 0}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 dark:disabled:bg-green-800 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                        type="button"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                Salvataggio...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                {mode === 'edit' ? 'Aggiorna Scheda' : 'Crea Scheda'}
                            </>
                        )}
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <form 
                    onSubmit={onFormSubmit} 
                    className="space-y-6"
                    onClick={stopPropagation}
                >
                    <div className="grid gap-6">
                        {/* Informazioni base della scheda */}
                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 mb-2">
                                Nome Scheda
                            </label>
                            <input
                                type="text"
                                value={workoutData.nome}
                                onChange={(e) => setWorkoutData(prev => ({ ...prev, nome: e.target.value }))}
                                className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                                placeholder="Nome della scheda"
                                required
                                onClick={stopPropagation}
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 dark:text-gray-300 mb-2">
                                Descrizione
                            </label>
                            <textarea
                                value={workoutData.descrizione}
                                onChange={(e) => setWorkoutData(prev => ({ ...prev, descrizione: e.target.value }))}
                                className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                                rows="3"
                                placeholder="Descrizione della scheda..."
                                onClick={stopPropagation}
                            />
                        </div>

                        {/* Lista degli esercizi */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                Esercizi
                            </h3>

                            {workoutData.esercizi.length > 0 && (
                                <div className="mb-6">
                                    <SortableExerciseList
                                        exercises={workoutData.esercizi}
                                        availableExercises={availableExercises}
                                        handleExercisesReorder={handleExercisesReorder}
                                        onRemoveExercise={handleRemoveExercise}
                                        onExerciseChange={handleExerciseChange}
                                        stopPropagation={stopPropagation}
                                    />
                                </div>
                            )}

                            {/* Selettore esercizi */}
                            <div className="border rounded-lg overflow-hidden">
                                <ExerciseSelector 
                                    onExerciseAdd={handleAddExercise} 
                                    stopPropagation={stopPropagation}
                                />
                            </div>
                        </div>

                        {/* Pulsanti azione */}
                        <div className="flex justify-end space-x-4 mt-8">
                            <button
                                type="button"
                                onClick={(e) => {
                                    stopPropagation(e);
                                    onClose();
                                }}
                                disabled={saving}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                            >
                                Annulla
                            </button>
                            <button
                                type="submit"
                                disabled={saving || workoutData.esercizi.length === 0}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 dark:disabled:bg-green-800 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={stopPropagation}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                        Salvataggio...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        {mode === 'edit' ? 'Aggiorna Scheda' : 'Crea Scheda'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WorkoutManagerUI;