import React from 'react';
import { MoreVertical, Plus } from 'lucide-react';

interface KanbanColumnProps {
  id: string;
  title: string;
  badgeColor: string;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ title, badgeColor }) => {
  return (
    <div className="flex flex-col flex-shrink-0 w-[300px] h-full max-h-full">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 sticky top-0">
        <div className="flex items-center gap-2.5">
          <h3 className="font-semibold text-gray-200 text-sm tracking-wide">{title}</h3>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${badgeColor}`}>
            0
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity focus-within:opacity-100" style={{ opacity: 1 /* Keeping it visible for now to match designs where actions are clear */}}>
          <button className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-[#2C2C2E] rounded-md transition-colors">
            <Plus size={16} />
          </button>
          <button className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-[#2C2C2E] rounded-md transition-colors">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* Column Body / Drop Zone */}
      <div className="flex-1 flex flex-col gap-3 min-h-[150px] transition-colors rounded-xl bg-[#141415] border border-[#2C2C2E] p-3 shadow-sm">
        {/* We will map the cards here later. For now, it's an empty drop zone placeholder */}
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#2C2C2E] hover:border-[#3C3C3E] rounded-lg transition-colors duration-200 py-8 group cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-[#1C1C1E] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Plus size={20} className="text-gray-500 group-hover:text-indigo-400 transition-colors" />
          </div>
          <span className="text-sm font-medium text-gray-500 text-center px-4 group-hover:text-gray-400 transition-colors">
            Drag cards here or click to add a new task
          </span>
        </div>
      </div>
    </div>
  );
};
