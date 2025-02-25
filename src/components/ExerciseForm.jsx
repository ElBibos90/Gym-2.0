import React, { useState } from 'react';
import axios from 'axios';
import { Upload, X } from 'lucide-react';

const ExerciseForm = ({ onExerciseAdded }) => {
    const initialState = {
        nome: '',
        descrizione: '',
        immagine_url: '',
        gruppo_muscolare: '',
        attrezzatura: ''
    };

    const [formData, setFormData] = useState(initialState);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageError, setImageError] = useState(false);

    const gruppiMuscolari = [
        'Petto',
        'Schiena',
        'Spalle',
        'Bicipiti',
        'Tricipiti',
        'Gambe',
        'Addominali',
        'Core'
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Reset errori immagine quando si modifica l'URL
        if (name === 'immagine_url') {
            setImageError(false);
            setImagePreview(value);
        }
    };

    const handleImageError = () => {
        setImageError(true);
        setImagePreview('/api/placeholder/400/320');
    };

    const clearImage = () => {
        setFormData(prev => ({ ...prev, immagine_url: '' }));
        setImagePreview(null);
        setImageError(false);
    };

    const validateImageUrl = async (url) => {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            const contentType = response.headers.get('content-type');
            return contentType.startsWith('image/');
        } catch {
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Validazione URL immagine se presente
            if (formData.immagine_url) {
                const isValidImage = await validateImageUrl(formData.immagine_url);
                if (!isValidImage) {
                    setError('L\'URL fornito non è un\'immagine valida');
                    setLoading(false);
                    return;
                }
            }

            const response = await axios.post('http://192.168.1.113/api/esercizi.php', formData);
            if (response.data.id) {
                onExerciseAdded();
                setFormData(initialState);
                setImagePreview(null);
                setImageError(false);
            }
        } catch (error) {
            console.error('Errore:', error);
            setError(error.response?.data?.message || 'Errore durante il salvataggio dell\'esercizio');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = () => {
        return formData.nome && formData.gruppo_muscolare;
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                Aggiungi Nuovo Esercizio
            </h2>

            {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="nome">
                        Nome Esercizio *
                    </label>
                    <input
                        type="text"
                        id="nome"
                        name="nome"
                        value={formData.nome}
                        onChange={handleChange}
                        required
                        className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                        placeholder="Es: Panca Piana"
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
                        placeholder="Descrivi l'esecuzione dell'esercizio..."
                    />
                </div>

                <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="gruppo_muscolare">
                        Gruppo Muscolare *
                    </label>
                    <select
                        id="gruppo_muscolare"
                        name="gruppo_muscolare"
                        value={formData.gruppo_muscolare}
                        onChange={handleChange}
                        required
                        className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Seleziona gruppo muscolare</option>
                        {gruppiMuscolari.map(gruppo => (
                            <option key={gruppo} value={gruppo}>
                                {gruppo}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="attrezzatura">
                        Attrezzatura
                    </label>
                    <input
                        type="text"
                        id="attrezzatura"
                        name="attrezzatura"
                        value={formData.attrezzatura}
                        onChange={handleChange}
                        className="w-full p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                        placeholder="Es: Bilanciere, Manubri"
                    />
                </div>

                <div>
                    <label className="block text-gray-700 dark:text-gray-300 mb-2" htmlFor="immagine_url">
                        URL Immagine
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="url"
                            id="immagine_url"
                            name="immagine_url"
                            value={formData.immagine_url}
                            onChange={handleChange}
                            className="flex-1 p-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                            placeholder="https://esempio.com/immagine.jpg"
                        />
                        {formData.immagine_url && (
                            <button
                                type="button"
                                onClick={clearImage}
                                className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                title="Rimuovi immagine"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    {imageError && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            Impossibile caricare l'immagine dall'URL fornito
                        </p>
                    )}
                </div>

                {formData.immagine_url && (
                    <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Anteprima Immagine
                        </h4>
                        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                            <img
                                src={imagePreview || formData.immagine_url}
                                alt="Anteprima"
                                className="w-full h-full object-cover"
                                onError={handleImageError}
                            />
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || !validateForm()}
                    className={`w-full py-2 px-4 rounded font-medium text-white transition-colors
                        ${(loading || !validateForm())
                            ? 'bg-blue-400 dark:bg-blue-600 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600'
                        }`}
                >
                    {loading ? 'Salvataggio...' : 'Aggiungi Esercizio'}
                </button>
            </form>
        </div>
    );
};

export default ExerciseForm;