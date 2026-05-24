import React, { useEffect, useState } from 'react';
import { MoreVertical, Plus, Loader } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { api } from '../../axios';
import {X} from 'lucide-react';
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
  const [cardInfo, setCardInfo] = useState(null);
  const [showCardInfo, setShowCardInfo] = useState(false);
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
  const cardInfoHandler=(cardId:string)=>{
    const card = cards.find((c) => c._id === cardId);
    setCardInfo(card);
    console.log("Selected card info:", card);
    setShowCardInfo(true);
  }
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
            <div key={card._id} onClick={() => cardInfoHandler(card._id)} className="bg-[#1C1C1E] border border-[#2C2C2E] hover:border-[#3C3C3E] transition-colors rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing">
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
      {/* Card Info Modal */}
      {showCardInfo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-2 z-50 p-4">
            
          <div className="bg-[#1C1C1E] relative border border-[#2C2C2E] rounded-xl w-full max-w-md p-6">
            <button onClick={()=>setShowCardInfo(false)} className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-200 hover:bg-[#2C2C2E] rounded-md transition-colors">
                <X size={18} />
            </button>
            <h2 className="text-xl font-bold text-white mb-4">{cardInfo.title}</h2>
            {cardInfo.description &&
            <div className=" flex flex-wrap gap-2">
               <p className="text-md font-semibold text-gray-200">Description:</p>
               <p className="text-gray-400">{cardInfo.description}</p>
            </div>
            }

            <p className="text-gray-200 mt-4 text-sm">Due Date: <span className='text-gray-400'>{cardInfo.dueDate ? new Date(cardInfo.dueDate).toLocaleDateString() : 'No due date'}</span></p>
            <div className="mt-4 flex flex-wrap gap-2">
              <h3 className="text-sm font-semibold text-gray-200 mb-2">Labels:</h3>
              <div className="flex flex-wrap gap-2">
                {cardInfo.labels && cardInfo.labels.length > 0 ? (
                  cardInfo.labels.map((label: string, index: number) => (
                    <span key={index} className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">
                      {label}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No labels</p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className={`text-xs font-medium px-2 py-1 rounded-full border ${
                cardInfo.priority === 'urgent' ? 'bg-red-500/10 text-red-500' : 
                cardInfo.priority === 'high' ? 'bg-amber-500/10 text-amber-500' :
                cardInfo.priority === 'medium' ? 'bg-blue-500/10 text-blue-500' :
                'bg-slate-500/10 text-slate-400'
              }`}>
                {cardInfo.priority}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
