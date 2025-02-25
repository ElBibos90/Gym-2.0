import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableExerciseItem({ id, children, className, stopPropagation }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ 
    id,
    // Abilita solo il trascinamento quando viene utilizzata la maniglia
    modifiers: []
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Assicura che stopPropagation sia disponibile
  const preventPropagation = stopPropagation || ((e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  // Previeni la propagazione del click
  const handleClick = (e) => {
    preventPropagation(e);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={className}
      onClick={handleClick}
    >
      {/* Il primo elemento è la maniglia, il resto sono i children */}
      {React.Children.map(children, (child, index) => {
        if (index === 0) {
          // Solo al primo elemento (la maniglia) aggiungiamo gli attributi di trascinamento
          return React.cloneElement(child, {
            ...attributes,
            ...listeners,
            style: { cursor: 'grab' }
          });
        }
        return child;
      })}
    </div>
  );
}