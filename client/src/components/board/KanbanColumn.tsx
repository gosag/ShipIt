import React, { useEffect, useState } from 'react';
import {  Plus, Loader, Calendar, Tag, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { api } from '../../axios';
import {X} from 'lucide-react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import socket from '../../../socket';
interface KanbanColumnProps {
  id: string;
  title: string;
  badgeColor: string;
  onAddTask?: () => void;
  refreshTrigger?: number;
  activeCardId?: string | null;
}

const DraggableCard: React.FC<{ card: any; columnId: string; activeCardId?: string | null; onClick: () => void; currentUserId?: string }> = ({ card, columnId, activeCardId, onClick, currentUserId }) => {
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

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, title, badgeColor, onAddTask, refreshTrigger, activeCardId }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardInfo, setCardInfo] = useState<any>(null);
  const [showCardInfo, setShowCardInfo] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [actionLoading, setActionLoading] = useState(false);
  useEffect(() => {
    const fetchCards = async () => {
      if (!projectId || !id) return;
      setLoading(true);
      try {
        const res = await api.get(`/api/projects/${projectId}/columns/${id}/cards`);
        setCards(res.data);
      } catch (error) {
        console.error("Failed to fetch cards:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, [projectId, id, refreshTrigger]);

  useEffect(() => {
    const handleCardMoved = (e: CustomEvent) => {
      const { cardId, sourceColumnId, destinationColumnId, cardData } = e.detail;
      
      if (id === sourceColumnId) {
        // Remove from source column immediately
        setCards(prev => prev.filter(c => c._id !== cardId));
      } else if (id === destinationColumnId) {
        // Add to destination column immediately
        setCards(prev => {
          if (prev.some(c => c?._id === cardId)) return prev;
          if (!cardData) return prev; // Safety check
          return [...prev, cardData];
        });
      }
    };

    window.addEventListener('cardMoved', handleCardMoved as EventListener);
    return () => window.removeEventListener('cardMoved', handleCardMoved as EventListener);
  }, [id]);

  const cardInfoHandler=(cardId:string)=>{
    const card = cards.find((c) => c._id === cardId);
    setCardInfo(card);
    console.log("Selected card info:", card);
    setShowCardInfo(true);
  }
  const { isOver, setNodeRef: setDroppableNodeRef } = useDroppable({ id });

  let currentMembers: any[] = [];
  try {
    const workspacesData = JSON.parse(localStorage.getItem("workspaces") || "[]");
    if (Array.isArray(workspacesData)) {
      const currentWorkspace = workspacesData.find((ws: any) => ws && ws.projects && ws.projects.some((p: any) => p && p._id === projectId));
      if (currentWorkspace && Array.isArray(currentWorkspace.members)) {
        currentMembers = currentWorkspace.members.map((m: any) => m && m.user ? m.user : null).filter(Boolean);
      }
    }
  } catch (e) {
    console.error("Error parsing workspaces from local storage", e);
  }

   useEffect(() => {
    const handleSocketCardMoved = (data: any) => {
      const { cardId, sourceColumnId, destinationColumnId, cardData } = data;
      if (id === sourceColumnId) {
        setCards(prev => prev.filter(c => c._id !== cardId));
      } else if (id === destinationColumnId) {
        setCards(prev => {
          if (prev.some(c => c?._id === cardId)) return prev;
          if (!cardData) return prev; // Safety check
          return [...prev, cardData];
        });
      } 
    };
    socket.on("cardMoved", handleSocketCardMoved);
    return () => {
      socket.off("cardMoved", handleSocketCardMoved);
    };
   }, [id]);
   
  const handleDeleteCard = async () => {
    if (!cardInfo) return;
    if (!window.confirm("Are you sure you want to delete this card?")) return;
    setActionLoading(true);
    try {
      await api.delete(`/api/columns/${id}/cards/${cardInfo._id}`);
      setCards(prev => prev.filter(c => c._id !== cardInfo._id));
      setShowCardInfo(false);
      setCardInfo(null);
    } catch (error) {
      console.error("Failed to delete card:", error);
      alert("Failed to delete card");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateCard = async () => {
    if (!cardInfo || !editForm.title?.trim()) {
      alert("Title is required");
      return;
    }
    setActionLoading(true);
    try {
      // Ensure labels is formatted nicely if it's a string from input
      const dataToSubmit = { ...editForm };
      
      const res = await api.put(`/api/columns/${id}/cards/${cardInfo._id}`, dataToSubmit);
      setCards(prev => prev.map(c => c._id === res.data._id ? res.data : c));
      setCardInfo(res.data);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update card:", error);
      alert("Failed to update card");
    } finally {
      setActionLoading(false);
    }
  };

  const startEditing = () => {
    setEditForm({
      title: cardInfo.title || '',
      description: cardInfo.description || '',
      dueDate: cardInfo.dueDate ? cardInfo.dueDate.split('T')[0] : '',
      priority: cardInfo.priority || 'medium',
      labels: cardInfo.labels ? cardInfo.labels.join(', ') : '',
      assignees: cardInfo.assignees || []

    });
    setIsEditing(true);
  };
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
        <div className="flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity focus-within:opacity-100" style={{ opacity: 1 /* Keeping it visible for now to match designs where actions are clear */}}>
          <button 
            onClick={onAddTask}
            className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-[#2C2C2E] rounded-md transition-colors"
          >
            {cards.length!==0 ? <Plus size={16} /> : null}
          </button>
        </div>
      </div>

      {/* Column Body / Drop Zone */}
      <div ref={setDroppableNodeRef} className={`flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto custom-scrollbar transition-colors rounded-xl bg-[#141415] border border-[#2C2C2E] p-3 shadow-sm ${isOver ? 'ring-2 ring-indigo-500/40' : ''}`}>
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader className="animate-spin text-gray-500" size={24} />
          </div>
        ) : cards.length > 0 ? (
          cards.map((card) => {
            if (!card) return null; // Safe guard
            
            let currentUserId;
            try {
              currentUserId = JSON.parse(localStorage.getItem("userData") || "{}")?._id;
            } catch (e) {}

            return (
              <DraggableCard 
                key={card._id} 
                card={card} 
                columnId={id}
                activeCardId={activeCardId}
                currentUserId={currentUserId}
                onClick={() => cardInfoHandler(card._id)}
              />
            );
          })
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-2 z-100 p-4">
          <div className="bg-[#1C1C1E] relative border border-[#2C2C2E] shadow-2xl rounded-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#2C2C2E] bg-[#141415]">
              <h2 className="text-lg font-bold text-white truncate pr-4">
                {isEditing ? 'Edit Card' : cardInfo.title}
              </h2>
              <button 
                onClick={() => { setShowCardInfo(false); setIsEditing(false); }} 
                className="p-1.5 text-gray-400 hover:text-white hover:bg-[#2C2C2E] rounded-md transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Title <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      value={editForm.title} 
                      onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                      className="w-full bg-[#141415] border border-[#2C2C2E] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      placeholder="Card Title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                    <textarea 
                      value={editForm.description} 
                      onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                      className="w-full bg-[#141415] border border-[#2C2C2E] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors min-h-25 resize-y"
                      placeholder="Add a more detailed description..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Due Date</label>
                      <input 
                        type="date" 
                        value={editForm.dueDate} 
                        onChange={(e) => setEditForm({...editForm, dueDate: e.target.value})}
                        className="w-full bg-[#141415] border border-[#2C2C2E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
                      <select 
                        value={editForm.priority} 
                        onChange={(e) => setEditForm({...editForm, priority: e.target.value})}
                        className="w-full bg-[#141415] border border-[#2C2C2E] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
               {/* make the creator choose assignees based on available users */}
                  {<div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Assignees</label>
                    <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar p-2 bg-[#141415] border border-[#3C3C3E] rounded-lg">
                      {currentMembers.length === 0 ? (
                        <p className="text-sm text-gray-500">No members found</p>
                      ) : (
                        currentMembers.map((member: any) => (
                          <label key={member._id} className="flex items-center gap-2 cursor-pointer group">
                            <input 
                              type="checkbox"
                              value={member._id}
                              checked={(editForm.assignees || []).includes(member._id)}
                              onChange={(e) => {
                                const currentAssignees = editForm.assignees || [];
                                if (e.target.checked) setEditForm({ ...editForm, assignees: [...currentAssignees, member._id] });
                                else setEditForm({ ...editForm, assignees: currentAssignees.filter((id: string) => id !== member._id) });
                              }}
                              className="w-4 h-4 rounded border-[#3C3C3E] bg-[#2C2C2E] text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                            />
                            <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{member.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Labels (comma separated)</label>
                    <input 
                      type="text" 
                      value={editForm.labels} 
                      onChange={(e) => setEditForm({...editForm, labels: e.target.value})}
                      className="w-full bg-[#141415] border border-[#2C2C2E] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      placeholder="Frontend, Bug, Feature"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {cardInfo.description && (
                    <div className="bg-[#141415] rounded-lg p-4 border border-[#2C2C2E]">
                      <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
                      <p className="text-gray-200 whitespace-pre-wrap text-sm leading-relaxed">{cardInfo.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#141415] rounded-lg p-3 border border-[#2C2C2E] flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Due Date</p>
                        <p className="text-sm text-gray-200 font-semibold mt-0.5">
                          {cardInfo.dueDate ? new Date(cardInfo.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No due date'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-[#141415] rounded-lg p-3 border border-[#2C2C2E] flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        cardInfo.priority === 'urgent' ? 'bg-red-500/10 text-red-500' : 
                        cardInfo.priority === 'high' ? 'bg-amber-500/10 text-amber-500' :
                        cardInfo.priority === 'medium' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        <AlertCircle size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Priority</p>
                        <p className="text-sm font-semibold mt-0.5 capitalize" style={{
                          color: cardInfo.priority === 'urgent' ? '#ef4444' : 
                                 cardInfo.priority === 'high' ? '#f59e0b' :
                                 cardInfo.priority === 'medium' ? '#3b82f6' : '#94a3b8'
                        }}>
                          {cardInfo.priority || 'None'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {cardInfo.assignees && cardInfo.assignees.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-1.5">
                        Assignees
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {cardInfo.assignees.map((assigneeId: string) => {
                          const user = currentMembers.find(m => m._id === assigneeId);
                          return (
                            <span key={assigneeId} className="text-xs font-medium px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              {user ? user.name : 'Unknown User'}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {cardInfo.labels && cardInfo.labels.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-1.5">
                        <Tag size={14} /> Labels
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {cardInfo.labels.map((label: string, index: number) => (
                          <span key={index} className="text-xs font-medium px-2.5 py-1 rounded bg-[#2C2C2E] text-gray-300 border border-[#3C3C3E]">
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer / Actions */}
            <div className="p-4 border-t border-[#2C2C2E] bg-[#141415] flex justify-end gap-3">
              {isEditing ? (
                <>
                  <button 
                    onClick={() => setIsEditing(false)}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-[#2C2C2E] transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpdateCard}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading && <Loader size={14} className="animate-spin" />}
                    Save Changes
                  </button>
                </>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <button 
                    onClick={handleDeleteCard}
                    disabled={actionLoading}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium disabled:opacity-50"
                  >
                    {actionLoading ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                  
                  <button 
                    onClick={startEditing}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Edit2 size={16} />
                    Edit Card
                  </button>
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
};
