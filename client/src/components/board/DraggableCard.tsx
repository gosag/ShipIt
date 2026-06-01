import React from 'react';
import { useDraggable } from '@dnd-kit/core';

export interface DraggableCardProps {
  card: any;
  columnId: string;
  activeCardId?: string | null;
  onClick: () => void;
  currentUserId?: string;
}

export const DraggableCard: React.FC<DraggableCardProps> = ({ card, columnId, activeCardId, onClick, currentUserId }) => {
  const { attributes, listeners, setNodeRef: setDraggableNodeRef, transform, isDragging } = useDraggable({ id: card._id, data: { columnId, card } });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  const isAssignedToMe = currentUserId && card.assignees && card.assignees.includes(currentUserId);

  return (
    <div
      ref={setDraggableNodeRef}
      onClick={onClick}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-[#1C1C1E] border border-[#2C2C2E] hover:border-[#3C3C3E] transition-colors rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing ${isDragging || activeCardId === card._id ? 'opacity-0' : ''}`}
    >
      <h4 className="text-gray-200 font-medium text-sm">{card.title}</h4>
      {card.description && (
        <p className="text-gray-400 text-xs mt-1 line-clamp-2">{card.description}</p>
      )}
      {(card.priority || isAssignedToMe) && (
        <div className="mt-3 flex  items-center gap-2">
          {card.priority && (
            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
              card.priority === 'urgent' ? 'bg-red-500/10 text-red-500' : 
              card.priority === 'high' ? 'bg-amber-500/10 text-amber-500' :
              card.priority === 'medium' ? 'bg-blue-500/10 text-blue-500' :
              'bg-slate-500/10 text-slate-400'
            }`}>
              {card.priority}
            </span>
          )}
          {isAssignedToMe && (
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400">
              For you
            </span>
          )}
        </div>
      )}
    </div>
  );
};
