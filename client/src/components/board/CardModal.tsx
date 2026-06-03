import React, { useState } from 'react';
import { X, Calendar, Tag, AlertCircle, Edit2, Trash2, User, Loader } from 'lucide-react';
import { api } from '../../axios';

interface CardModalProps {
  card: any; 
  columnId: string;
  currentMembers: any[];
  onClose: () => void;
  onUpdate: (updatedCard: any) => void;
  onDelete: (cardId: string) => void;
}

export const CardModal: React.FC<CardModalProps> = ({
  card,
  columnId,
  currentMembers,
  onClose,
  onUpdate,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [actionLoading, setActionLoading] = useState(false);

  const startEditing = () => {
    setEditForm({
      title: card.title || '',
      description: card.description || '',
      dueDate: card.dueDate ? card.dueDate.split('T')[0] : '',
      priority: card.priority || 'medium',
      labels: card.labels && Array.isArray(card.labels) ? card.labels.join(', ') : (card.labels || ''),
      assignees: card.assignees || []
    });
    setIsEditing(true);
  };

  const handleDeleteCard = async () => {
    if (!window.confirm("Are you sure you want to delete this card?")) return;
    setActionLoading(true);
    try {
      await api.delete(`/api/columns/${columnId}/cards/${card._id}`);
      onDelete(card._id);
    } catch (error) {
      console.error("Failed to delete card:", error);
      alert("Failed to delete card");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateCard = async () => {
    if (!editForm.title?.trim()) {
      alert("Title is required");
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.put(`/api/columns/${columnId}/cards/${card._id}`, { ...editForm });
      onUpdate(res.data);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update card:", error);
      alert("Failed to update card");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-2 z-100 p-4">
      <div className="bg-[#1C1C1E] relative border border-[#2C2C2E] shadow-2xl rounded-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2C2C2E] bg-[#141415]">
          <h2 className="text-lg font-bold text-white truncate pr-4">
            {isEditing ? 'Edit Card' : card.title}
          </h2>
          <button 
            onClick={() => { onClose(); setIsEditing(false); }} 
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
              {card.description && (
                <div className="bg-[#141415] rounded-lg p-4 border border-[#2C2C2E]">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Description</h3>
                  <p className="text-gray-200 whitespace-pre-wrap text-sm leading-relaxed">{card.description}</p>
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
                      {card.dueDate ? new Date(card.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No due date'}
                    </p>
                  </div>
                </div>
                
                <div className="bg-[#141415] rounded-lg p-3 border border-[#2C2C2E] flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    card.priority === 'urgent' ? 'bg-red-500/10 text-red-500' : 
                    card.priority === 'high' ? 'bg-amber-500/10 text-amber-500' :
                    card.priority === 'medium' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-slate-500/10 text-slate-400'
                  }`}>
                    <AlertCircle size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Priority</p>
                    <p className="text-sm font-semibold mt-0.5 capitalize" style={{
                      color: card.priority === 'urgent' ? '#ef4444' : 
                             card.priority === 'high' ? '#f59e0b' :
                             card.priority === 'medium' ? '#3b82f6' : '#94a3b8'
                    }}>
                      {card.priority || 'None'}
                    </p>
                  </div>
                </div>
              </div>

              {card.createdBy && (
                <div className="flex items-center gap-2 mt-4 text-sm text-gray-400 bg-[#1C1C1E] border border-[#2C2C2E] p-2.5 rounded-lg w-max">
                  <User size={16} className="text-indigo-400" />
                  <span>Created by:</span>
                  <span className="text-gray-200 font-medium">
                    {currentMembers.find(m => m._id === card.createdBy)?.name || 'Unknown'}
                  </span>
                </div>
              )}

              {card.assignees && card.assignees.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-1.5">
                    Assignees
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {card.assignees.map((assigneeId: string) => {
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

              {card.labels && card.labels.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-1.5">
                    <Tag size={14} /> Labels
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {card.labels.map((label: string, index: number) => (
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
  );
};
