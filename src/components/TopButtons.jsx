import React, { useState } from 'react';
import { Settings, Info, Plus } from 'lucide-react';
import { SettingsDialog, InfoDialog, NewWorkoutDialog } from './dialogs';

const TopButtons = ({ onWorkoutCreated }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [newWorkoutOpen, setNewWorkoutOpen] = useState(false);

  const handleWorkoutCreated = async (workout) => {
    if (onWorkoutCreated) {
      await onWorkoutCreated(workout);
    }
    setNewWorkoutOpen(false);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">
          Workout Manager 2.0
        </h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 text-gray-400 hover:bg-gray-700 rounded-lg transition-colors"
            title="Impostazioni"
          >
            <Settings className="h-5 w-5" />
          </button>
          <button
            onClick={() => setInfoOpen(true)}
            className="p-2 text-gray-400 hover:bg-gray-700 rounded-lg transition-colors"
            title="Informazioni"
          >
            <Info className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex justify-end mb-6">
        <button
          onClick={() => setNewWorkoutOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nuova Scheda
        </button>
      </div>

      <SettingsDialog 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen} 
      />
      <InfoDialog 
        open={infoOpen} 
        onOpenChange={setInfoOpen} 
      />
      <NewWorkoutDialog 
        open={newWorkoutOpen} 
        onOpenChange={setNewWorkoutOpen}
        onWorkoutCreated={handleWorkoutCreated}
      />
    </>
  );
};

export default TopButtons;