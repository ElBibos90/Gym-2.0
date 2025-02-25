import React, { useState, useEffect, useCallback } from 'react';
import { Timer } from 'lucide-react';

const RestTimer = ({ duration, onComplete = () => {} }) => {
    const [timeLeft, setTimeLeft] = useState(duration);
    const [isRunning, setIsRunning] = useState(true);
    const [isCompleted, setIsCompleted] = useState(false);

    useEffect(() => {
        if (!isRunning || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                const newTime = prev - 1;
                if (newTime <= 0) {
                    clearInterval(timer);
                    setIsCompleted(true);
                    return 0;
                }
                return newTime;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isRunning, timeLeft]);

    // Gestione del completamento del timer
    useEffect(() => {
        if (isCompleted && onComplete) {
            // Attendi un breve periodo prima di richiamare onComplete
            // Questo dà tempo all'interfaccia di aggiornare la visualizzazione
            const completeTimeout = setTimeout(() => {
                onComplete();
            }, 100);
            
            return () => clearTimeout(completeTimeout);
        }
    }, [isCompleted, onComplete]);

    const toggleTimer = () => setIsRunning(!isRunning);

    return (
        <div className="flex items-center space-x-2 text-lg font-semibold text-gray-900 dark:text-white">
            <Timer className="w-6 h-6" />
            <span>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
            <button
                onClick={toggleTimer}
                className="px-2 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
                {isRunning ? 'Pausa' : 'Riprendi'}
            </button>
        </div>
    );
};

export default RestTimer;