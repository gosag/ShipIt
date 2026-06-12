import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { KanbanColumn } from './KanbanColumn';
import { Filter, Search, Loader, X, MessageSquare} from 'lucide-react';
import { api } from '../../axios';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, type DragCancelEvent, type DragStartEvent } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import  socket  from '../../../socket';
interface ColumnType {
  _id: string;
  title: string;
}
import { ScrollText} from "lucide-react"; 
interface ActiveCardData {
  _id: string;
  title: string;
  description?: string;
  priority?: string;
  labels?: string[];
  dueDate?: string;
}

const BADGE_COLORS = [
  'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
];
export function formatActivityTime(createdAt?: string): string {
  if (!createdAt) return 'Now';

  const created = new Date(createdAt);
  const now = new Date();

  const diffMs = now.getTime() - created.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours >= 24) {
    return created.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: created.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }

  return created.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
export const KanbanBoard: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [columns, setColumns] = useState<ColumnType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<ActiveCardData | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // New state for task modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskLabels, setTaskLabels] = useState("");
  const [selectedColumnId, setSelectedColumnId] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskAssignees, setTaskAssignees] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [newActivityLog, setNewActivityLog] = useState<string | null>(null);
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
    if (!projectId) return;
    try {
      const workspacesData = JSON.parse(localStorage.getItem("workspaces") || "[]");
      for (const ws of workspacesData) {
        const project = ws.projects?.find((p: any) => p._id === projectId);
        if (project) {
          const recent = JSON.parse(localStorage.getItem("recentProjects") || "[]");
          const entry = {
            _id: project._id,
            name: project.name,
            workspaceName: ws.name,
            visitedAt: new Date().toISOString(),
          };
          const filtered = recent.filter((r: any) => r._id !== projectId);
          localStorage.setItem("recentProjects", JSON.stringify([entry, ...filtered].slice(0, 10)));
          break;
        }
      }
    } catch (e) {
      console.error("Error tracking recent project", e);
    }
  }, [projectId]);

  useEffect(() => {
    const fetchColumns = async () => {
      try {
        if (!projectId) return;
        setLoading(true);
        const res = await api.get(`/api/column/${projectId}`);
        setColumns(res.data);
      } catch (error) {
        console.error("Failed to fetch columns", error);
      } finally {
        setLoading(false);
      }}
    fetchColumns();
  }, [projectId])
  ;

  const handleOpenTaskModal = (columnId?: string) => {
    setSelectedColumnId(columnId || (columns.length > 0 ? columns[0]._id : ""));
    setIsTaskModalOpen(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!taskTitle.trim() || !selectedColumnId) return;
    try {
      await api.post(`/api/projects/${projectId}/columns/${selectedColumnId}/cards`, {
        title: taskTitle,
        description: taskDescription,
        priority: taskPriority,
        labels: taskLabels,
        dueDate: taskDueDate,
        assignees: taskAssignees,
        order: 0,
      });
      setTaskTitle("");
      setTaskDescription("");
      setTaskPriority("medium");
      setTaskLabels("");
      setTaskDueDate("");
      setTaskAssignees([]);
      setIsTaskModalOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const card = event.active.data.current?.card as ActiveCardData | undefined;
    setActiveCard(card ?? null);
  };

  const handleDragCancel = (_event: DragCancelEvent) => {
    setActiveCard(null);
  };
  // You can add useEffect here to listen for real-time updates via WebSocket if needed
  useEffect(() => {
    socket.emit("project-id", projectId);
    socket.on("user-connected", (message) => {
      console.log(message);
    });
    return () => {
      socket.off("user-connected");
    };
  }, [projectId]);

const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;
  setActiveCard(null);
  if (!over) return;
  const cardId = String(active.id);
  const destinationColumnId = String(over.id);
 
  const sourceColumnId = active?.data?.current?.columnId as string | undefined;
  const cardData = active?.data?.current?.card;

  if (!cardId || !destinationColumnId || sourceColumnId === undefined) return;
  if (sourceColumnId === destinationColumnId) return;

  window.dispatchEvent(new CustomEvent('cardMoved', {
    detail: { cardId, sourceColumnId, destinationColumnId, cardData }
  }));

  try {
    const response = await api.put(`/api/columns/${sourceColumnId}/cards/${cardId}/move`, {
      newColumnId: destinationColumnId,
      newOrder: 0,
    });
    const newActivity = response.data.newActivity;
    const receipentsID = response.data.notificationRecipientId;
    const notification = response.data.notification;
    console.log("Card moved successfully, notifying other clients...");
    console.log("receipentId:", receipentsID);
    socket.emit("card-moved", { cardId, sourceColumnId, destinationColumnId, projectId, cardData });
    socket.emit("notification", receipentsID, notification);
    socket.emit("Activity-log", projectId, newActivity);
  } catch (error) {
    console.error('Failed to move card:', error);
    setRefreshTrigger(prev => prev + 1);
  }
};
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const getActivityLogs=async ()=>{
    try{
      const res= await api.get(`/api/project/${projectId}/activity-log`)
      setActivityLog(res.data)
    }catch(err){
      console.log(err)
    }
  }
 const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => {
  socket.on("newActivityLog", (newActivity) => {
    setActivityLog(prev => prev.length === 0 ? [newActivity] : [newActivity, ...prev]);
    setNewActivityLog(newActivity.action);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setNewActivityLog(null);
    }, 5000);
  });

  return () => {
    socket.off("newActivityLog");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };
}, []);
  return (
    <div onClick={()=>{showFilters?setShowFilters(false):""}} className="flex flex-col h-full w-full">
      {/* Board Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
        <div>
          <h1 className="text-2xl font-bold text-white">Project Board</h1>
          <p className="text-sm text-gray-400 mt-1">Manage tasks and track project progress</p>
        </div>
        <div className="flex items-center gap-3 relative">
          <button className='' onClick={() => {setShowActivityLog(true); getActivityLogs() }} title='Activity Log'>
              <ScrollText size={26} className="hover:text-indigo-400 hover:scale-105 transition-all duration-200" />
            </button>
          <div className="relative group hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search tasks..."
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="py-2 pl-9 pr-4 bg-[#141415] border border-[#2C2C2E] rounded-lg text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all w-64"
            />
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors text-sm font-medium ${
                showFilters || priorityFilter !== 'all' || assigneeFilter !== 'all' 
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                  : 'bg-[#141415] border-[#2C2C2E] text-gray-300 hover:bg-[#2C2C2E]/50'
              }`}
            >
              <Filter size={16} />
              <span className="hidden sm:inline">Filter</span>
            </button>
            
            
            {showFilters && (
              <div onClick={(e)=>{e.stopPropagation()}} className="absolute sm:right-0  mt-2 w-56 bg-[#1C1C1E] border border-[#2C2C2E] rounded-lg shadow-xl z-10 p-3">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Priority</label>
                    <select 
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="w-full bg-[#141415] border border-[#2C2C2E] text-gray-300 rounded text-sm px-2 py-1.5 outline-none focus:border-indigo-500/50"
                    >
                      <option value="all">All Priorities</option>
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Assignee</label>
                    <select 
                      value={assigneeFilter}
                      onChange={(e) => setAssigneeFilter(e.target.value)}
                      className="w-full bg-[#141415] border border-[#2C2C2E] text-gray-300 rounded text-sm px-2 py-1.5 outline-none focus:border-indigo-500/50"
                    >
                      <option value="all">Anyone</option>
                      <option value="me">Assigned to Me</option>
                    </select>
                  </div>
                  {(priorityFilter !== 'all' || assigneeFilter !== 'all') && (
                    <button 
                      onClick={() => {
                        setPriorityFilter('all');
                        setAssigneeFilter('all');
                      }}
                      className="w-full text-xs text-center text-gray-400 hover:text-white py-1 transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          
        </div>
        {newActivityLog && (
          <div className={`absolute ${showFilters ? '-top-4' : 'top-12'} right-0 bg-zinc-800 rounded-md px-0.5 text-blue-500 font-semibold border border-zinc-700 animate-fade-in pointer-events-none text-xs py-0.5 transition-all duration-200`}>
            {newActivityLog}
          </div>
        )}
      </div>

      {/* Board Area */}
      <div className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto lg:overflow-hidden pb-4 custom-scrollbar">
        {loading ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <Loader className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : (
          <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6 h-auto lg:h-full">
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragCancel={handleDragCancel} onDragEnd={handleDragEnd}>
            {columns.map((column, index) => (
              <div key={column._id} className="flex flex-col h-125 lg:h-full min-h-0">
                <KanbanColumn 
                  id={column._id} 
                  title={column.title}
                  badgeColor={BADGE_COLORS[index % BADGE_COLORS.length]} 
                  onAddTask={() => handleOpenTaskModal(column._id)}
                  refreshTrigger={refreshTrigger}
                  activeCardId={activeCard?._id ?? null}
                  searchTerm={searchTerm}
                  priorityFilter={priorityFilter}
                  assigneeFilter={assigneeFilter}
                />
              </div>
            ))}
            <DragOverlay>
              {activeCard ? (() => {
                  let currentUserId;
                  try {
                    currentUserId = JSON.parse(localStorage.getItem("userData") || "{}")?._id;
                  } catch (e) {}
                  
                  const isAssignedToMe = currentUserId && (activeCard as any).assignees && (activeCard as any).assignees.includes(currentUserId);
                  return (
                    <div className="bg-[#1C1C1E] border border-[#2C2C2E] rounded-lg p-3 shadow-2xl cursor-grabbing md:w-40 opacity-95">
                      <div className='flex justify-between items-start'>
                        <h4 className="text-gray-200 font-medium text-sm">{activeCard.title}</h4>
                        <button className="p-1 rounded relative  hover:bg-[#2C2C2E] transition-colors">
                              <MessageSquare size={16} />
                        </button>
                      </div>
                  
                      
                      {(activeCard.priority || isAssignedToMe) && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          {activeCard.priority && (
                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                              activeCard.priority === 'urgent' ? 'bg-red-500/10 text-red-500' :
                              activeCard.priority === 'high' ? 'bg-amber-500/10 text-amber-500' :
                              activeCard.priority === 'medium' ? 'bg-blue-500/10 text-blue-500' :
                              'bg-slate-500/10 text-slate-400'
                            }`}>
                              {activeCard.priority}
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
              })() : null}
            </DragOverlay>
            </DndContext>
          </div>
        )}
      </div>

      {/* Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C1C1E] border border-[#2C2C2E] rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <h2 className="text-xl font-bold text-white mb-4">Create New Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Title (A must)</label>
                <input 
                  type="text" 
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#2C2C2E] border border-[#3C3C3E] rounded-lg outline-none focus:border-indigo-500 focus:ring-1 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea 
                  value={taskDescription}
                  onChange={e => setTaskDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#2C2C2E] border border-[#3C3C3E] rounded-lg outline-none focus:border-indigo-500 focus:ring-1 text-white h-24 resize-none"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
                <select 
                  value={taskPriority}
                  onChange={e => setTaskPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-[#2C2C2E] border border-[#3C3C3E] rounded-lg outline-none focus:border-indigo-500 focus:ring-1 text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Labels (comma separated)</label>
                <input 
                  type="text"
                  value={taskLabels}
                  onChange={e => setTaskLabels(e.target.value)}
                  className="w-full px-3 py-2 bg-[#2C2C2E] border border-[#3C3C3E] rounded-lg outline-none focus:border-indigo-500 focus:ring-1 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Due Date</label>
                <input 
                  type="date" 
                  className="w-full px-3 py-2 bg-[#2C2C2E] border border-[#3C3C3E] rounded-lg outline-none focus:border-indigo-500 focus:ring-1 text-white"
                  value={taskDueDate}
                  onChange={e => setTaskDueDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Column</label>
                <select 
                  value={selectedColumnId}
                  onChange={e => setSelectedColumnId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#2C2C2E] border border-[#3C3C3E] rounded-lg outline-none focus:border-indigo-500 focus:ring-1 text-white"
                >
                  {columns.map(c => (
                    <option key={c._id} value={c._id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div>
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
                          checked={taskAssignees.includes(member._id)}
                          onChange={(e) => {
                            if (e.target.checked) setTaskAssignees([...taskAssignees, member._id]);
                            else setTaskAssignees(taskAssignees.filter(id => id !== member._id));
                          }}
                          className="w-4 h-4 rounded border-[#3C3C3E] bg-[#2C2C2E] text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                        />
                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{member.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#2C2C2E]">
                <button 
                  type="button" 
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  disabled={!taskTitle.trim() || !selectedColumnId}
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
       {/* Activity Log Modal */}
      {showActivityLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-2 z-100 p-4">
          <div className="bg-[#1C1C1E] relative border border-[#2C2C2E] shadow-2xl rounded-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-[#2C2C2E] bg-[#141415]">
              <h2 className="text-lg font-bold text-white">Activity Log</h2>
              <button 
                onClick={() => setShowActivityLog(false)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-[#2C2C2E] rounded-md transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {activityLog.length === 0 || !Array.isArray(activityLog) ? (
                <p className="text-sm text-gray-500">No activity logged.</p>
              ) : (
                activityLog.map((activity: { action: string; createdAt?: string; user?: { name: string; avatar?: string } }, index) => (
                    <div key={index} className="flex items-start gap-3 py-3 border-b border-[#2C2C2E] last:border-0">
                      <div className="w-7 h-7 rounded-full bg-[#2C2C2E] flex items-center justify-center shrink-0 mt-0.5">
                        {activity.user?.avatar ? (
                          <img src={activity.user.avatar} alt={activity.user.name} className="w-7 h-7 rounded-full object-cover" />
                        ) : (
                          <img src="/placeholder-pp.jpg" alt="Default Avatar" className="w-7 h-7 rounded-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-white">{activity.user?.name ?? 'Unknown User'}</span>
                          <span className="text-xs text-gray-500">
                            {activity.createdAt ? formatActivityTime(activity.createdAt) : 'Now'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-0.5 leading-snug">{activity.action}</p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
