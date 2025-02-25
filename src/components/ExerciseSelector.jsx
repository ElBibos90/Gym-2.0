// components/admin/workout/ExerciseSelector.jsx
import React, { useState, useEffect } from 'react';
import { Search, Plus, Info } from 'lucide-react';
import { useAuth } from './AuthContext';

const MUSCLE_GROUPS = {
    'petto': 'Petto',
    'dorso': 'Dorso',
    'gambe': 'Gambe',
    'spalle': 'Spalle',
    'braccia': 'Braccia',
    'core': 'Core'
};

const ExerciseSelector = ({ onExerciseAdd, stopPropagation }) => {
    const { getAuthenticatedApi } = useAuth();
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('petto');
    const [expandedExercise, setExpandedExercise] = useState(null);

    // Assicura che stopPropagation sia disponibile
    const preventPropagation = stopPropagation || ((e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    useEffect(() => {
        const fetchExercises = async () => {
            try {
                const api = getAuthenticatedApi();
                const response = await api.get('/esercizi.php');
                console.log('Loaded exercises for selector:', response.data);
                setExercises(response.data || []);
            } catch (err) {
                console.error('Error fetching exercises:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchExercises();
    }, [getAuthenticatedApi]);

    const filteredExercises = exercises.filter(exercise => {
        const matchesSearch = exercise.nome.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGroup = activeTab === 'tutti' || exercise.gruppo_muscolare.toLowerCase() === activeTab;
        return matchesSearch && matchesGroup;
    });

    const handleAddExercise = (e, exercise) => {
        preventPropagation(e);
        
        onExerciseAdd({
            esercizio_id: parseInt(exercise.id, 10),
            serie: 3,
            ripetizioni: 12,
            peso: 0,
            tempo_recupero: 90,
            note: '',
            tipo_set: 'normal'
        });
    };

    const handleShowInfo = (e, exerciseId) => {
        preventPropagation(e);
        setExpandedExercise(expandedExercise === exerciseId ? null : exerciseId);
    };

    const handleTabClick = (e, tab) => {
        preventPropagation(e);
        setActiveTab(tab);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg" onClick={preventPropagation}>
            {/* Barra di ricerca */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onClick={preventPropagation}
                        placeholder="Cerca esercizio..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Tabs gruppi muscolari */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex overflow-x-auto">
                    {Object.entries(MUSCLE_GROUPS).map(([value, label]) => (
                        <button
                            key={value}
                            onClick={(e) => handleTabClick(e, value)}
                            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
                                activeTab === value
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                            type="button"
                        >
                            {label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Lista esercizi */}
            <div className="p-4 space-y-4">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : filteredExercises.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                        Nessun esercizio trovato
                    </p>
                ) : (
                    filteredExercises.map(exercise => (
                        <div 
                            key={exercise.id}
                            className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                            onClick={preventPropagation}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        {exercise.nome}
                                    </h3>
                                    
                                    {/* Tags */}
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                                            {exercise.gruppo_muscolare}
                                        </span>
                                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full">
                                            {exercise.attrezzatura}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => handleShowInfo(e, exercise.id)}
                                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                        type="button"
                                    >
                                        <Info className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={(e) => handleAddExercise(e, exercise)}
                                        className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                        type="button"
                                    >
                                        <Plus className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Dettagli espansi */}
                            {expandedExercise === exercise.id && (
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                                Dettagli Esecuzione
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                {exercise.descrizione}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                                Attrezzatura Necessaria
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                {exercise.attrezzatura}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ExerciseSelector;