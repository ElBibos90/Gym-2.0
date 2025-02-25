import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const EditWorkoutForm = ({ scheda, onClose, onWorkoutUpdated }) => {
    const { getAuthenticatedApi } = useAuth();
    const api = getAuthenticatedApi();

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
    }, [api]);

    useEffect(() => {
        if (scheda) {
            setFormData({
                nome: scheda.nome,
                descrizione: scheda.descrizione || '',
                esercizi: scheda.esercizi?.map(ex => ({
                    id: ex.id,
                    esercizio_id: ex.esercizio_id,
                    serie: ex.serie,
                    ripetizioni: ex.ripetizioni,
                    peso: ex.peso,
                    tempo_recupero: ex.tempo_recupero || 90,
                    note: ex.note || ''
                })) || []
            });
        }
    }, [scheda]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleExerciseChange = (index, field, value) => {
        let processedValue = value;
        switch(field) {
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

        setFormData(prev => ({
            ...prev,
            esercizi: prev.esercizi.map((ex, i) => {
                if (i === index) {
                    return { ...ex, [field]: processedValue };
                }
                return ex;
            })
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!formData.nome.trim()) {
                throw new Error('Il nome della scheda è obbligatorio');
            }

            const response = await api.put(`/schede.php?id=${scheda.id}`, formData);
            
            if (response.data) {
                if (onWorkoutUpdated) {
                    await onWorkoutUpdated();
                }
                onClose();
            }
        } catch (err) {
            console.error('Errore completo:', err);
            setError(err.response?.data?.error || err.message || 'Errore durante l\'aggiornamento della scheda');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Modifica Scheda</h2>
                <button
                    onClick={onClose}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                    ✕
                </button>
            </div>

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
                                            value={esercizio.esercizio_id || ''}
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
                                        className="px-3 py-1 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                                    >
                                        Rimuovi
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        Annulla
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-4 py-2 rounded font-medium text-white transition-colors
                            ${loading 
                                ? 'bg-blue-400 dark:bg-blue-600' 
                                : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600'
                            }`}
                    >
                        {loading ? 'Salvataggio...' : 'Salva Modifiche'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditWorkoutForm;