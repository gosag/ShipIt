import React, { useEffect, useState } from 'react';
import { MoreVertical, Plus, Loader } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { api } from '../../axios';

interface KanbanColumnProps {
  id: string;
  title: string;
  badgeColor: string;
  onAddTask?: () => void;
  refreshTrigger?: number;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ id, title, badgeColor, onAddTask, refreshTrigger }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          <button className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-[#2C2C2E] rounded-md transition-colors">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* Column Body / Drop Zone */}
      <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto custom-scrollbar transition-colors rounded-xl bg-[#141415] border border-[#2C2C2E] p-3 shadow-sm">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader className="animate-spin text-gray-500" size={24} />
          </div>
        ) : cards.length > 0 ? (
          cards.map((card) => (
            <div key={card._id} className="bg-[#1C1C1E] border border-[#2C2C2E] hover:border-[#3C3C3E] transition-colors rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing">
              <h4 className="text-gray-200 font-medium text-sm">{card.title}</h4>
              {card.description && (
                <p className="text-gray-400 text-xs mt-1 line-clamp-2">{card.description}</p>
              )}
              {card.priority && (
                <div className="mt-3 flex items-center gap-2">
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    card.priority === 'urgent' ? 'bg-red-500/10 text-red-500' : 
                    card.priority === 'high' ? 'bg-amber-500/10 text-amber-500' :
                    card.priority === 'medium' ? 'bg-blue-500/10 text-blue-500' :
                    'bg-slate-500/10 text-slate-400'
                  }`}>
                    {card.priority}
                  </span>
                </div>
              )}
            </div>
          ))
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
    </div>
  );
};
