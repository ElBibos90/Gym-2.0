import React from 'react';
import { Info, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import ResponsiveImage from './ResponsiveImage';

const InfoDialog = ({ exercise }) => {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
          <Info className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] max-w-2xl bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
              {exercise.nome}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>
          
          {exercise.immagine_url && (
            <div className="mb-6">
              <ResponsiveImage
                src={exercise.immagine_url}
                alt={exercise.nome}
                maxHeight="max-h-80"
              />
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Gruppo Muscolare
              </h4>
              <p className="text-gray-900 dark:text-white">
                {exercise.gruppo_muscolare}
              </p>
            </div>
            
            {exercise.attrezzatura && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Attrezzatura
                </h4>
                <p className="text-gray-900 dark:text-white">
                  {exercise.attrezzatura}
                </p>
              </div>
            )}
            
            {exercise.descrizione && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Descrizione
                </h4>
                <p className="text-gray-900 dark:text-white whitespace-pre-line">
                  {exercise.descrizione}
                </p>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default InfoDialog;