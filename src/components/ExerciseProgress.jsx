import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Plus, Check, RotateCw, Clock } from 'lucide-react';
import RestTimer from './RestTimer';
import InfoDialog from './InfoDialog';

const ExerciseProgress = ({ 
    exercise, 
    exerciseHistory, 
    serieCompletate = [], 
    onSerieComplete, 
    onTimerComplete,
    getRecoveryTime, // Nuovo parametro per ottenere il tempo di recupero personalizzato
    setTypeName,     // Nome del tipo di set per visualizzazione
    isLinkedToPrevious // Se questo esercizio è collegato al precedente (per superset)
}) => {
    const [currentWeight, setCurrentWeight] = useState(exercise.peso || 0);
    const [currentReps, setCurrentReps] = useState(exercise.ripetizioni);
    const [showTimer, setShowTimer] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    
    // Debug logs per tracciare i dati ricevuti
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${exercise.nome}] Exercise props:`, exercise);
            console.log(`[${exercise.nome}] Exercise history:`, exerciseHistory);
            console.log(`[${exercise.nome}] Serie completate:`, serieCompletate);
        }
    }, [exercise, exerciseHistory, serieCompletate]);

    // Calcola l'ultimo peso usato dallo storico degli allenamenti
    const getLastWeight = () => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${exercise.nome}] Calculating last weight`);
        }
        
        if (!exerciseHistory || !Array.isArray(exerciseHistory) || exerciseHistory.length === 0) {
            if (process.env.NODE_ENV === 'development') {
                console.log(`[${exercise.nome}] No history available`);
            }
            return null;
        }
        
        const sortedHistory = [...exerciseHistory].sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        const lastWeight = sortedHistory[0].peso;
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${exercise.nome}] Found last weight:`, lastWeight);
        }
        
        return lastWeight;
    };

    // Verifica se l'esercizio è stato completato
    const isExerciseCompleted = () => {
        return serieCompletate.length >= exercise.serie;
    };

    // Gestisce il completamento di una serie
    const handleSerieComplete = () => {
        if (isExerciseCompleted()) return;

        const newSerie = {
            peso: currentWeight,
            ripetizioni: currentReps,
            scheda_esercizio_id: exercise.id
        };
        
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${exercise.nome}] Completing serie ${serieCompletate.length + 1}/${exercise.serie}`);
            console.log(`[${exercise.nome}] Will be completed: ${(serieCompletate.length + 1) >= exercise.serie}`);
        }
        
        onSerieComplete(newSerie);
        
        // Ottieni il tempo di recupero personalizzato se disponibile
        const recoveryTime = getRecoveryTime ? getRecoveryTime() : exercise.tempo_recupero || 90;
        
        if (recoveryTime > 0) {
            setShowTimer(true);
        } else {
            // Se il recupero è zero (come nei superset), notifica immediatamente il completamento
            if (onTimerComplete) onTimerComplete();
        }
    };

    // Gestisce il completamento del timer
    const handleTimerComplete = () => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[${exercise.nome}] Timer completed`);
        }
        
        // Nascondi il timer
        setShowTimer(false);
        
        // Informa il parent che il timer è completato
        if (onTimerComplete) {
            onTimerComplete();
        }
    };

    const lastWeight = getLastWeight();
    
    // Classe CSS aggiuntiva per gli esercizi collegati
    const containerClass = `bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-4 transition-colors ${
        isLinkedToPrevious ? 'border-t-2 border-blue-500' : ''
    }`;

    return (
        <div className={containerClass}>
            <div className="flex justify-between items-start mb-4" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {exercise.nome}
                    </h3>
                    <InfoDialog exercise={exercise} />
                    
                    {/* Badge per il tipo di set */}
                    {setTypeName && exercise.set_type !== 'normal' && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                            {setTypeName}
                        </span>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-900 dark:text-white">
                        Serie: {serieCompletate.length}/{exercise.serie}
                    </p>
                    {lastWeight !== null && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Ultimo peso: {lastWeight}kg
                        </p>
                    )}
                </div>
            </div>

            {serieCompletate.length > 0 && (
                <div className="mb-4 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Serie completate:
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                        {serieCompletate.map((serie, idx) => (
                            <div key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                                Serie {idx + 1}: {serie.peso}kg × {serie.ripetizioni}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isExpanded && exerciseHistory && exerciseHistory.length > 0 && (
                <div className="mb-4 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Storico esercizio:
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                        {exerciseHistory.slice(0, 3).map((history, idx) => (
                            <div key={idx} className="bg-white dark:bg-gray-600 p-2 rounded text-xs">
                                <div className="flex justify-between">
                                    <span>
                                        {new Date(history.timestamp).toLocaleDateString()} - {history.peso}kg × {history.ripetizioni}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {exerciseHistory.length > 3 && (
                            <button 
                                className="text-blue-600 dark:text-blue-400 text-xs"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowHistory(!showHistory);
                                }}
                            >
                                {showHistory ? "Mostra meno" : `Mostra altri ${exerciseHistory.length - 3} risultati...`}
                            </button>
                        )}
                        {showHistory && exerciseHistory.slice(3).map((history, idx) => (
                            <div key={idx + 3} className="bg-white dark:bg-gray-600 p-2 rounded text-xs">
                                <div className="flex justify-between">
                                    <span>
                                        {new Date(history.timestamp).toLocaleDateString()} - {history.peso}kg × {history.ripetizioni}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label 
                        htmlFor={`peso-${exercise.id}`}
                        className="block text-sm text-gray-600 dark:text-gray-300 mb-1"
                    >
                        Peso (kg)
                    </label>
                    <input
                        id={`peso-${exercise.id}`}
                        type="number"
                        value={currentWeight}
                        onChange={(e) => setCurrentWeight(parseFloat(e.target.value) || 0)}
                        className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                        step="0.5"
                        min="0"
                    />
                </div>
                <div>
                    <label 
                        htmlFor={`ripetizioni-${exercise.id}`}
                        className="block text-sm text-gray-600 dark:text-gray-300 mb-1"
                    >
                        Ripetizioni
                    </label>
                    <input
                        id={`ripetizioni-${exercise.id}`}
                        type="number"
                        value={currentReps}
                        onChange={(e) => setCurrentReps(parseInt(e.target.value) || 0)}
                        className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                        min="1"
                    />
                </div>
            </div>

            {showTimer ? (
                <RestTimer 
                    duration={getRecoveryTime ? getRecoveryTime() : (exercise.tempo_recupero || 90)} 
                    onComplete={handleTimerComplete} 
                />
            ) : (
                <button
                    onClick={handleSerieComplete}
                    disabled={isExerciseCompleted()}
                    className={`w-full py-2 px-4 rounded font-medium text-white transition duration-200
                        ${isExerciseCompleted()
                            ? 'bg-gray-400 dark:bg-gray-600'
                            : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600'
                        }`}
                >
                    {isExerciseCompleted() ? 'Completato' : 'Completa Serie'}
                </button>
            )}
        </div>
    );
};

export default ExerciseProgress;