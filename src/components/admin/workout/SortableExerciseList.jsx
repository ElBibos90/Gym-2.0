import React from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableExerciseItem } from './SortableExerciseItem';
import { X, GripVertical, Timer } from 'lucide-react';

const SET_TYPES = {
  normal: 'Normale',
  superset: 'Superset',
  dropset: 'Drop Set',
  circuit: 'Circuito'
};

// Utility per ottenere il nome dell'esercizio in modo sicuro
const getExerciseName = (exerciseId, availableExercises) => {
  if (!exerciseId) return 'Senza nome';
  
  const exercise = availableExercises.find(e => parseInt(e.id) === parseInt(exerciseId));
  if (!exercise) {
    console.warn(`Exercise with ID ${exerciseId} not found in:`, availableExercises);
    return 'Senza nome';
  }
  return exercise.nome;
};

const SortableExerciseList = ({
  exercises,
  availableExercises,
  handleExercisesReorder,
  onRemoveExercise,
  onExerciseChange,
  stopPropagation
}) => {
  // Assicura che stopPropagation sia disponibile
  const preventPropagation = stopPropagation || ((e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active && over && active.id !== over.id) {
      const oldIndex = exercises.findIndex(x => `exercise-${x.tempId}` === active.id);
      const newIndex = exercises.findIndex(x => `exercise-${x.tempId}` === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        handleExercisesReorder(arrayMove(exercises, oldIndex, newIndex));
      }
    }
  };

  const handleSetTypeChange = (e, index, value) => {
    preventPropagation(e);
    
    const newExercises = [...exercises];
    newExercises[index] = {
      ...newExercises[index],
      set_type: value
    };
    
    // Gestione superset: quando un esercizio diventa superset, 
    // l'esercizio successivo dovrebbe essere collegato ad esso
    if (value === 'superset' && index < exercises.length - 1) {
      newExercises[index + 1] = {
        ...newExercises[index + 1],
        linked_to_previous: true
      };
    } 
    // Se cambiamo da superset a qualcos'altro, rimuovi il collegamento dall'esercizio successivo
    else if (exercises[index].set_type === 'superset' && value !== 'superset' && index < exercises.length - 1) {
      newExercises[index + 1] = {
        ...newExercises[index + 1],
        linked_to_previous: false
      };
    }
    
    // Se questo esercizio era collegato al precedente ma ora è un tipo che non dovrebbe essere collegato
    if (exercises[index].linked_to_previous) {
      newExercises[index] = {
        ...newExercises[index],
        linked_to_previous: false
      };
    }
    
    handleExercisesReorder(newExercises);
  };

  // Console.log per debug
  console.log('Rendering sortable exercises:', exercises);
  console.log('Available exercises:', availableExercises);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={exercises.map(ex => `exercise-${ex.tempId || ex.id}`)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4" onClick={preventPropagation}>
          {exercises.map((exercise, index) => {
            // Assicura ID univoci
            const tempId = exercise.tempId || `temp-${Date.now()}-${index}`;
            if (!exercise.tempId) {
              exercise.tempId = tempId;
            }
            
            // Ottieni il nome dell'esercizio
            const exerciseName = getExerciseName(exercise.esercizio_id, availableExercises);
            console.log(`Exercise ${index}:`, exercise, 'Name:', exerciseName);

            return (
              <div key={tempId} className="relative">
                {exercise.linked_to_previous && (
                  <div className="absolute -top-4 left-4 h-4 border-l-2 border-dashed border-blue-500" />
                )}
                
                <SortableExerciseItem 
                  id={`exercise-${tempId}`}
                  className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-4 ${
                    exercise.linked_to_previous ? 'border-t-2 border-blue-500' : ''
                  }`}
                  stopPropagation={preventPropagation}
                >
                  {/* Maniglia di trascinamento */}
                  <div className="cursor-move text-gray-400 flex items-center h-full" onClick={preventPropagation}>
                    <GripVertical className="h-5 w-5" />
                  </div>
                  
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          <span className="font-semibold">Esercizio:</span> {exerciseName}
                          {exercise.set_type !== 'normal' && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                              {SET_TYPES[exercise.set_type]}
                            </span>
                          )}
                        </h4>
                        
                        <div className="flex items-center gap-2">
                          <select
                            value={exercise.set_type || 'normal'}
                            onChange={(e) => handleSetTypeChange(e, index, e.target.value)}
                            className="text-sm border rounded-lg p-1"
                            onClick={preventPropagation}
                          >
                            {Object.entries(SET_TYPES).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                          
                          <button
                            onClick={(e) => {
                              preventPropagation(e);
                              onRemoveExercise(index);
                            }}
                            className="p-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            type="button"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Serie
                          </label>
                          <input
                            type="number"
                            value={exercise.serie}
                            onChange={(e) => onExerciseChange(index, 'serie', e.target.value)}
                            className="w-full p-2 border rounded-lg"
                            min="1"
                            onClick={preventPropagation}
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Ripetizioni
                          </label>
                          <input
                            type="number"
                            value={exercise.ripetizioni}
                            onChange={(e) => onExerciseChange(index, 'ripetizioni', e.target.value)}
                            className="w-full p-2 border rounded-lg"
                            min="1"
                            onClick={preventPropagation}
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Peso (kg)
                          </label>
                          <input
                            type="number"
                            value={exercise.peso}
                            onChange={(e) => onExerciseChange(index, 'peso', e.target.value)}
                            className="w-full p-2 border rounded-lg"
                            min="0"
                            step="0.5"
                            onClick={preventPropagation}
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                            Recupero (sec)
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={exercise.tempo_recupero}
                              onChange={(e) => onExerciseChange(index, 'tempo_recupero', e.target.value)}
                              className="w-full p-2 border rounded-lg"
                              min="0"
                              step="5"
                              onClick={preventPropagation}
                            />
                            <button 
                              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 border rounded-lg"
                              onClick={preventPropagation}
                              type="button"
                            >
                              <Timer className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2">
                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Note
                        </label>
                        <input
                          type="text"
                          value={exercise.note || ''}
                          onChange={(e) => onExerciseChange(index, 'note', e.target.value)}
                          className="w-full p-2 border rounded-lg"
                          placeholder="Note sull'esercizio..."
                          onClick={preventPropagation}
                        />
                      </div>
                    </div>
                  </div>
                </SortableExerciseItem>
              </div>
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default SortableExerciseList;