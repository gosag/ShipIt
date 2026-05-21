import React from 'react';
import { KanbanColumn } from './KanbanColumn';
import { Plus, Filter, Search } from 'lucide-react';

const COLUMNS = [
  { id: 'todo', title: 'To do', badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  { id: 'processing', title: 'Processing', badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { id: 'being-approved', title: 'Being Approved', badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { id: 'done', title: 'Done', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
];

export const KanbanBoard: React.FC = () => {
  return (
    <div className="flex flex-col h-full w-full">
      {/* Board Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Project Board</h1>
          <p className="text-sm text-gray-400 mt-1">Manage tasks and track project progress</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              className="py-2 pl-9 pr-4 bg-[#141415] border border-[#2C2C2E] rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all w-64"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-[#141415] border border-[#2C2C2E] text-gray-300 rounded-lg hover:bg-[#2C2C2E]/50 transition-colors text-sm font-medium">
            <Filter size={16} />
            <span className="hidden sm:inline">Filter</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm shadow-indigo-900/20">
            <Plus size={16} />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Board Scrollable Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar pb-4">
        <div className="flex h-full items-start gap-6 min-w-max">
          {COLUMNS.map((column) => (
            <KanbanColumn 
              key={column.id} 
              id={column.id} 
              title={column.title} 
              badgeColor={column.badgeColor} 
            />
          ))}
          
          {/* Add Column Button */}
          <button className="flex-shrink-0 w-[300px] h-[52px] rounded-xl border border-dashed border-[#3C3C3E] flex items-center justify-center text-gray-500 hover:text-gray-300 hover:border-[#5C5C5E] hover:bg-[#141415]/50 transition-all cursor-pointer font-medium mt-1 group">
            <Plus size={18} className="mr-2 group-hover:scale-110 transition-transform" />
            Add Section
          </button>
        </div>
      </div>
    </div>
  );
};
