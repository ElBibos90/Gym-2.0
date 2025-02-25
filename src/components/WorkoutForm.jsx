import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://192.168.1.113/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

const WorkoutForm = ({ onWorkoutAdded }) => {
    const [formData, setFormData] = useState({
        nome: '',
        descrizione: '',
        esercizi: []
    });

    const [availableExercises, setAvailableExercises] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchExercises = async () => {
            try {
                const response = await api.get('/esercizi.php');
                setAvailableExercises(response.data);
            } catch (error) {
                console.error('Errore nel caricamento esercizi:', error);
                setError('Impossibile caricare la lista degli esercizi');
            }
        };

        fetchExercises();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const addExercise = () => {
        setFormData(prev => ({
            ...prev,
            esercizi: [
                ...prev.esercizi,
                {
                    esercizio_id: '',
                    serie: 3,
                    ripetizioni: 12,
                    peso: 0,
                    tempo_recupero: 90,
                    note: ''
                }
            ]
        }));
    };

    const removeExercise = (index) => {
        setFormData(prev => ({
            ...prev,
            esercizi: prev.esercizi.filter((_, i) => i !== index)
        }));
    };

    const handleExerciseChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            esercizi: prev.esercizi.map((ex, i) => {
                if (i === index) {
                    return { ...ex, [field]: value };
                }
                return ex;
            })
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/schede.php', formData);
            if (response.data.id) {
                if (onWorkoutAdded) {
                    await onWorkoutAdded();
                }
                setFormData({
                    nome: '',
                    descrizione: '',
                    esercizi: []
                });
            }
        } catch (error) {
            console.error('Errore:', error);
            setError('Errore durante il salvataggio della scheda');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Crea Nuova Scheda</h2>

            {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="nome">
                        Nome Scheda
                    </label>
                    <input
                        type="text"
                        id="nome"
                        name="nome"
                        value={formData.nome}
                        onChange={handleChange}
                        required
                        className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                        placeholder="Es: Scheda A - Petto e Bicipiti"
                    />
                </div>

                <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="descrizione">
                        Descrizione
                    </label>
                    <textarea
                        id="descrizione"
                        name="descrizione"
                        value={formData.descrizione}
                        onChange={handleChange}
                        className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        placeholder="Note o descrizione della scheda..."
                    />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Esercizi</h3>
                        <button
                            type="button"
                            onClick={addExercise}
                            className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                        >
                            Aggiungi Esercizio
                        </button>
                    </div>

                    <div className="space-y-4">
                        {formData.esercizi.map((esercizio, index) => (
                            <div
                                key={index}
                                className="flex flex-col p-4 border rounded bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                                            Esercizio
                                        </label>
                                        <select
                                            value={esercizio.esercizio_id}
                                            onChange={(e) => handleExerciseChange(index, 'esercizio_id', e.target.value)}
                                            required
                                            className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Seleziona esercizio</option>
                                            {availableExercises.map(ex => (
                                                <option key={ex.id} value={ex.id}>
                                                    {ex.nome}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                                                Serie
                                            </label>
                                            <input
                                                type="number"
                                                value={esercizio.serie}
                                                onChange={(e) => handleExerciseChange(index, 'serie', parseInt(e.target.value))}
                                                min="1"
                                                required
                                                className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                                                Ripetizioni
                                            </label>
                                            <input
                                                type="number"
                                                value={esercizio.ripetizioni}
                                                onChange={(e) => handleExerciseChange(index, 'ripetizioni', parseInt(e.target.value))}
                                                min="1"
                                                required
                                                className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                                                Peso (kg)
                                            </label>
                                            <input
                                                type="number"
                                                value={esercizio.peso}
                                                onChange={(e) => handleExerciseChange(index, 'peso', parseFloat(e.target.value))}
                                                min="0"
                                                step="0.5"
                                                className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
                                                Recupero
                                            </label>
                                            <input
                                                type="number"
                                                value={esercizio.tempo_recupero}
                                                onChange={(e) => handleExerciseChange(index, 'tempo_recupero', parseInt(e.target.value))}
                                                min="0"
                                                step="5"
                                                className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center">
                                    <input
                                        type="text"
                                        value={esercizio.note || ''}
                                        onChange={(e) => handleExerciseChange(index, 'note', e.target.value)}
                                        placeholder="Note sull'esercizio..."
                                        className="flex-1 p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 mr-4"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeExercise(index)}
                                        className="px-3 py-1 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors"
                                    >
                                        Rimuovi
                                    </button>
                                </div>
                            </div>
                        ))}

                        {formData.esercizi.length === 0 && (
                            <div className="text-center p-8 bg-gray-50 dark:bg-gray-700 rounded border border-dashed border-gray-300 dark:border-gray-600">
                                <p className="text-gray-500 dark:text-gray-400">
                                    Nessun esercizio aggiunto. Usa il pulsante "Aggiungi Esercizio" per iniziare.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading || formData.esercizi.length === 0}
                    className={`w-full py-2 px-4 rounded font-medium text-white transition-colors
                        ${(loading || formData.esercizi.length === 0)
                            ? 'bg-blue-400 dark:bg-blue-500'
                            : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600'
                        }`}
                >
                    {loading ? 'Salvataggio...' : 'Crea Scheda'}
                </button>
            </form>
        </div>
    );
};

export default WorkoutForm;