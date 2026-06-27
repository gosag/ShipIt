import React, { useEffect, useState } from 'react';
import { Plus, Loader } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { api } from '../../axios';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DraggableCard } from './DraggableCard';
import { CardModal } from './CardModal';

interface KanbanColumnProps {
  id: string;
  title: string;
  badgeColor: string;
  onAddTask?: () => void;
  refreshTrigger?: number;
  activeCardId?: string | null;
  searchTerm?: string;
  priorityFilter?: string;
  assigneeFilter?: string;
  newCardAdded?: any | null;
  // Lifted from board
  cards?: any[];
  onCardsLoaded: (columnId: string, cards: any[]) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  badgeColor,
  onAddTask,
  refreshTrigger,
  activeCardId,
  searchTerm = '',
  priorityFilter = 'all',
  assigneeFilter = 'all',
  cards: boardCards,
  onCardsLoaded,
}) => {
  const { projectId } = useParams<{ projectId: string }>();
  const [loading, setLoading] = useState(true);
  const [cardInfo, setCardInfo] = useState<any>(null);
  const [showCardInfo, setShowCardInfo] = useState(false);

  // cards prop from board is the source of truth once loaded.
  // We use boardCards directly for rendering; local state only for cardInfo updates.
  const cards = boardCards ?? [];

  const workspaceId = cards.length > 0 ? cards[0].workspace : null;

  // ── Fetch cards on mount / refreshTrigger, report up to board ──
  useEffect(() => {
    const fetchCards = async () => {
      if (!projectId || !id) return;
      setLoading(true);
      try {
        const res = await api.get(`/api/projects/${projectId}/columns/${id}/cards`);
        onCardsLoaded(id, res.data);
      } catch (error) {
        console.error('Failed to fetch cards:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, [projectId, id, refreshTrigger]);

  // ── Droppable for empty column (SortableContext handles cards when present) ──
  const { isOver, setNodeRef: setDroppableNodeRef } = useDroppable({ id });

  // ── Members from localStorage ──
  let currentMembers: any[] = [];
  try {
    const workspacesData = JSON.parse(localStorage.getItem('workspaces') || '[]');
    if (Array.isArray(workspacesData)) {
      const currentWorkspace = workspacesData.find(
        (ws: any) => ws?.projects?.some((p: any) => p?._id === projectId)
      );
      if (currentWorkspace && Array.isArray(currentWorkspace.members)) {
        currentMembers = currentWorkspace.members
          .map((m: any) => (m?.user ? { ...m.user, role: m.role } : null))
          .filter(Boolean);
      }
    }
  } catch (e) {
    console.error('Error parsing workspaces from local storage', e);
  }

  const cardInfoHandler = (cardId: string) => {
    const card = cards.find((c) => c._id === cardId);
    setCardInfo(card);
    setShowCardInfo(true);
  };

  // ── Filter cards for display (board owns order, we just filter) ──
  let currentUserId: string | undefined;
  try {
    currentUserId = JSON.parse(localStorage.getItem('userData') || '{}')?._id;
  } catch (e) {}

  const filteredCards = cards.filter((card) => {
    if (!card) return false;
    if (
      searchTerm &&
      !card.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !(card.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    ) return false;
    if (priorityFilter !== 'all' && card.priority !== priorityFilter) return false;
    if (assigneeFilter === 'me') {
      if (!currentUserId || !card.assignees?.includes(currentUserId)) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col w-full h-full">
      {/* Column Header */}
      <div className="flex-none flex items-center justify-between mb-4 sticky top-0">
        <div className="flex items-center gap-2.5">
          <h3 className="font-semibold text-gray-200 text-sm tracking-wide">{title}</h3>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${badgeColor}`}>
            {loading ? '-' : cards.length}
          </span>
        </div>
        <div className="flex items-center gap-1" style={{ opacity: 1 }}>
          <button
            onClick={onAddTask}
            className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-[#2C2C2E] rounded-md transition-colors"
          >
            {cards.length !== 0 ? <Plus size={16} /> : null}
          </button>
        </div>
      </div>

      {/* Column Body / Drop Zone */}
      <div
        ref={setDroppableNodeRef}
        className={`flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto custom-scrollbar transition-colors rounded-xl bg-[#141415] border border-[#2C2C2E] p-3 shadow-sm ${
          isOver ? 'ring-2 ring-indigo-500/40' : ''
        }`}
      >
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader className="animate-spin text-gray-500" size={24} />
          </div>
        ) : cards.length > 0 ? (
          <SortableContext
            items={cards.map((c) => c._id)}
            strategy={verticalListSortingStrategy}
          >
            {filteredCards.length > 0 ? (
              filteredCards.map((card) => (
                <DraggableCard
                  key={card._id}
                  card={card}
                  columnId={id}
                  activeCardId={activeCardId}
                  currentUserId={currentUserId}
                  workspaceId={workspaceId}
                  onClick={() => cardInfoHandler(card._id)}
                />
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center py-8">
                <span className="text-sm font-medium text-gray-500 text-center px-4">
                  No tasks match your filters
                </span>
              </div>
            )}
            </SortableContext>
  ) : (
    <div
      onClick={onAddTask}
      className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#2C2C2E] hover:border-[#3C3C3E] rounded-lg transition-colors duration-200 py-8 group cursor-pointer"
    >
      <div className="w-10 h-10 rounded-full bg-[#1C1C1E] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
        <Plus size={20} className="text-gray-500 group-hover:text-indigo-400 transition-colors" />
      </div>
      <span className="text-sm font-medium text-gray-500 text-center px-4 group-hover:text-gray-400 transition-colors">
        Drag cards here or click to add a new task
      </span>
    </div>
  )}
</div>

      {/* Card Info Modal */}
      {showCardInfo && cardInfo && (
        <CardModal
          card={cardInfo}
          columnId={id}
          currentMembers={currentMembers}
          onClose={() => {
            setShowCardInfo(false);
            setCardInfo(null);
          }}
          onUpdate={(updatedCard) => {
            // Report the updated card back up to board
            const updatedCards = cards.map((c) =>
              c._id === updatedCard._id ? updatedCard : c
            );
            onCardsLoaded(id, updatedCards);
            setCardInfo(updatedCard);
          }}
          onDelete={(deletedCardId) => {
            onCardsLoaded(id, cards.filter((c) => c._id !== deletedCardId));
            setShowCardInfo(false);
            setCardInfo(null);
          }}
        />
      )}
    </div>
  );
};