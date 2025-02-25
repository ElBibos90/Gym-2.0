import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useAuth } from './AuthContext';

export const SettingsDialog = ({ open, onOpenChange }) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-gray-800 p-6 rounded-lg shadow-xl w-[90vw] max-w-lg">
          <Dialog.Title className="text-xl font-bold text-white mb-4">
            Impostazioni
          </Dialog.Title>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2 text-gray-300">
                Visualizzazione
              </h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded border-gray-600" />
                  <span className="text-sm text-gray-400">
                    Mostra descrizioni estese
                  </span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded border-gray-600" />
                  <span className="text-sm text-gray-400">
                    Mostra immagini esercizi
                  </span>
                </label>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2 text-gray-300">
                Ordinamento Esercizi
              </h3>
              <select className="w-full p-2 rounded border border-gray-600 bg-gray-700 text-white">
                <option value="name">Nome</option>
                <option value="muscle">Gruppo Muscolare</option>
                <option value="equipment">Attrezzatura</option>
              </select>
            </div>
          </div>

          <Dialog.Close className="absolute top-4 right-4 text-gray-400 hover:text-gray-200">
            <X className="h-4 w-4" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export const InfoDialog = ({ open, onOpenChange }) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-gray-800 p-6 rounded-lg shadow-xl w-[90vw] max-w-lg">
          <Dialog.Title className="text-xl font-bold text-white mb-4">
            Informazioni
          </Dialog.Title>
          
          <div className="space-y-4 text-sm text-gray-400">
            <p>
              <strong className="text-white">Workout Manager 2.0</strong> è un sistema avanzato per la gestione 
              di esercizi e schede di allenamento.
            </p>
            
            <div>
              <h3 className="font-medium text-gray-300 mb-2">Funzionalità</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Gestione completa degli esercizi</li>
                <li>Creazione schede personalizzate</li>
                <li>Sistema di progressione</li>
                <li>Statistiche e monitoraggio</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-300 mb-2">Guida Rapida</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Usa i filtri per trovare gli esercizi</li>
                <li>Crea una nuova scheda dal pulsante +</li>
                <li>Trascina gli esercizi nella scheda</li>
                <li>Configura serie e ripetizioni</li>
              </ul>
            </div>
          </div>

          <Dialog.Close className="absolute top-4 right-4 text-gray-400 hover:text-gray-200">
            <X className="h-4 w-4" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export const NewWorkoutDialog = ({ open, onOpenChange, onWorkoutCreated }) => {
  const { getAuthenticatedApi } = useAuth();
  const api = getAuthenticatedApi();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!name.trim()) {
        throw new Error('Il nome della scheda è obbligatorio');
      }

      const response = await api.post('/schede.php', {
        nome: name,
        descrizione: description,
        esercizi: [] // Array vuoto iniziale
      });

      if (response.data && response.data.id) {
        // Recupera i dettagli completi della scheda appena creata
        const newWorkoutResponse = await api.get(`/schede.php?id=${response.data.id}`);
        
        if (newWorkoutResponse.data) {
          // Notifica il componente padre del successo
          if (onWorkoutCreated) {
            await onWorkoutCreated(newWorkoutResponse.data);
          }
          onOpenChange(false); // Chiudi il dialog
          setName('');
          setDescription('');
        }
      } else {
        throw new Error('Risposta non valida dal server');
      }
    } catch (err) {
      console.error('Errore nella creazione della scheda:', err);
      setError(err.message || 'Errore durante la creazione della scheda. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-[90vw] max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">
            Nuova Scheda
          </h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 text-red-200 rounded-lg border border-red-500">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nome Scheda
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500"
              placeholder="es: Scheda A - Petto e Bicipiti"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Descrizione
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Descrivi la scheda..."
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded"
              disabled={loading}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-800"
              disabled={loading}
            >
              {loading ? 'Creazione...' : 'Crea Scheda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};