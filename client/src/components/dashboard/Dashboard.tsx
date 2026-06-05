import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link, useOutletContext } from "react-router-dom";
import { api } from "../../axios";
import socket from "../../../socket";
import { formatActivityTime } from "../board/KanbanBoard";
import {
  LayoutDashboard,
  Loader2,
  ClipboardList,
  AlertTriangle,
  Clock,
  Activity,
  Building2,
  Users,
  FolderKanban,
  Circle,
  BarChart3,
  UserX,
  CalendarClock,
  Bell,
  MessageSquare,
  ArrowRightLeft,
  Zap,
  Plus,
  UserPlus,
  ChevronRight,
  CheckCircle2,
  X,
} from "lucide-react";

interface OutletContext {
  refreshWorkspaces: () => Promise<void>;
}

interface DashboardCard {
  _id: string;
  title: string;
  priority: string;
  dueDate?: string;
  updatedAt: string;
  project: { _id: string; name: string } | null;
  column: { _id: string; title: string } | null;
}

interface DashboardData {
  personal: {
    assignedCards: DashboardCard[];
    urgentCards: DashboardCard[];
    recentlyTouchedCards: DashboardCard[];
    activityCount: number;
  };
  workspaces: {
    _id: string;
    name: string;
    slug: string;
    memberCount: number;
    projectCount: number;
    isAdmin: boolean;
  }[];
  recentProjects: {
    _id: string;
    name: string;
    workspaceName: string;
    workspaceId: string;
    lastActivity: string;
  }[];
  boardHealth: {
    byStatus: { todo: number; inProgress: number; done: number; other: number };
    unassignedCount: number;
    overdueCount: number;
    totalCards: number;
  };
  activityFeed: {
    _id: string;
    action: string;
    createdAt: string;
    user: { _id: string; name: string; email?: string };
    project?: { _id: string; name: string };
    workspace: string;
  }[];
  pendingJoinRequests: {
    _id: string;
    message: string;
    sender: { _id: string; name: string; email?: string };
    workspace: string;
    createdAt: string;
  }[];
  notifications: {
    unreadCount: number;
    unread: any[];
    cardsWithUnreadMessages: {
      card: { _id: string; title: string; project: { name: string } };
      lastComment: { content: string; author: { name: string }; createdAt: string };
    }[];
    cardsMovedAssignedToYou: {
      card: DashboardCard;
      activity: { action: string; user: { name: string }; createdAt: string };
    }[];
  };
}

interface RecentProjectVisit {
  _id: string;
  name: string;
  workspaceName: string;
  visitedAt: string;
}

interface OnlineMember {
  userId: string;
  userName: string;
}

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "bg-red-500/10 text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  low: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md p-6 bg-[#1C1C1E] border border-[#2C2C2E] shadow-2xl rounded-xl">
        <h2 className="mb-4 text-xl font-semibold text-white">{title}</h2>
        {children}
        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors">
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

const CardRow = ({ card, onClick }: { card: DashboardCard; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="w-full min-h-18 shrink-0 flex items-center gap-3 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60 hover:bg-zinc-800/40 hover:border-zinc-700/60 transition-all text-left group"
  >
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-white transition-colors">{card.title}</p>
      <p className="text-xs text-zinc-500 truncate mt-0.5">
        {card.project?.name || "Project"} · {card.column?.title || "Column"}
      </p>
    </div>
    <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium border capitalize ${PRIORITY_STYLES[card.priority] || PRIORITY_STYLES.medium}`}>
      {card.priority}
    </span>
    <ChevronRight size={14} className="text-zinc-600 group-hover:text-zinc-400 shrink-0" />
  </button>
);

const EmptyState = ({ icon: Icon, message }: { icon: React.ElementType; message: string }) => (
  <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
    <Icon size={28} className="mb-2 opacity-20" />
    <p className="text-sm">{message}</p>
  </div>
);

const ItemScroll = ({
  children,
  itemHeight,
  gap,
  gapClass,
  visibleCount = 2,
}: {
  children: React.ReactNode;
  itemHeight: string;
  gap: string;
  gapClass: string;
  visibleCount?: number;
}) => (
  <div
    className={`${gapClass} overflow-y-auto custom-scrollbar`}
    style={{
      maxHeight: `calc(${visibleCount} * ${itemHeight} + ${Math.max(0, visibleCount - 1)} * ${gap})`,
    }}
  >
    {children}
  </div>
);

const SectionCard = ({
  title,
  icon: Icon,
  iconColor,
  children,
  action,
}: {
  title: string;
  icon: React.ElementType;
  iconColor?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-semibold flex items-center gap-2 text-zinc-200">
        <Icon size={16} className={iconColor || "text-zinc-500"} />
        {title}
      </h2>
      {action}
    </div>
    {children}
  </div>
);

const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: React.ElementType; color: string }) => (
  <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
    <div className={`p-2.5 rounded-xl ${color}`}>
      <Icon size={18} />
    </div>
    <div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-zinc-500">{label}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { refreshWorkspaces } = useOutletContext<OutletContext>();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlineByWorkspace, setOnlineByWorkspace] = useState<Record<string, OnlineMember[]>>({});
  const [visitedProjects, setVisitedProjects] = useState<RecentProjectVisit[]>([]);

  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);

  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newCardWorkspace, setNewCardWorkspace] = useState("");
  const [newCardProject, setNewCardProject] = useState("");
  const [newCardColumn, setNewCardColumn] = useState("");
  const [columns, setColumns] = useState<{ _id: string; title: string }[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectWorkspace, setNewProjectWorkspace] = useState("");

  const userData = JSON.parse(localStorage.getItem("userData") || "{}");

  const loadWorkspacesWithProjects = useCallback(async () => {
    const wsRes = await api.get("/api/workspace/get-all");
    const withProjects = await Promise.all(
      wsRes.data.map(async (ws: any) => {
        try {
          const pRes = await api.get(`/api/project/getAll/${ws._id}`);
          return { ...ws, projects: pRes.data };
        } catch {
          return { ...ws, projects: [] };
        }
      })
    );
    setWorkspaces(withProjects);
    localStorage.setItem("workspaces", JSON.stringify(withProjects));
    return withProjects;
  }, []);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/dashboard");
      setData(res.data);
    } catch (err: any) {
      console.error("Error fetching dashboard:", err);
      setError(err.response?.data?.error || "Failed to load dashboard data");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const stored = JSON.parse(localStorage.getItem("recentProjects") || "[]");
    setVisitedProjects(stored);

    const cachedWorkspaces = JSON.parse(localStorage.getItem("workspaces") || "[]");
    if (cachedWorkspaces.length) setWorkspaces(cachedWorkspaces);
    else loadWorkspacesWithProjects();
  }, [fetchDashboard, loadWorkspacesWithProjects]);

  useEffect(() => {
    if (!data?.workspaces.length || !userData._id) return;

    const handleOnlineMembers = (payload: { workspaceId: string; members: OnlineMember[] }) => {
      setOnlineByWorkspace((prev) => ({ ...prev, [payload.workspaceId]: payload.members }));
    };

    socket.on("online-members", handleOnlineMembers);

    data.workspaces.forEach((ws) => {
      socket.emit("join-workspace", {
        workspaceId: ws._id,
        userId: userData._id,
        userName: userData.name,
      });
    });

    return () => {
      socket.off("online-members", handleOnlineMembers);
      data.workspaces.forEach((ws) => {
        socket.emit("leave-workspace", { workspaceId: ws._id });
      });
    };
  }, [data?.workspaces, userData._id, userData.name]);

  useEffect(() => {
    if (!newCardProject) {
      setColumns([]);
      return;
    }
    api.get(`/api/column/${newCardProject}`).then((res) => {
      setColumns(res.data);
      if (res.data.length) setNewCardColumn(res.data[0]._id);
    });
  }, [newCardProject]);

  const goToCard = (card: DashboardCard) => {
    if (card.project?._id) navigate(`/projects/${card.project._id}`);
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardTitle.trim() || !newCardProject || !newCardColumn) return;
    try {
      await api.post(`/api/projects/${newCardProject}/columns/${newCardColumn}/cards`, {
        title: newCardTitle,
        assignees: [userData._id],
      });
      setNewCardTitle("");
      setCardModalOpen(false);
      fetchDashboard();
    } catch (err) {
      console.error(err);
      alert("Failed to create card");
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !newProjectWorkspace) return;
    try {
      await api.post(`/api/project/create/${newProjectWorkspace}`, { name: newProjectName });
      setNewProjectName("");
      setNewProjectWorkspace("");
      setProjectModalOpen(false);
      await loadWorkspacesWithProjects();
      await refreshWorkspaces();
      fetchDashboard();
    } catch (err) {
      console.error(err);
      alert("Failed to create project");
    }
  };

  const handleJoinRequest = async (notificationId: string, workspaceId: string, userId: string, status: string) => {
    try {
      const endpoint = status === "accepted" ? "accept" : "reject";
      await api.put(`/api/workspace/join-request/${workspaceId}/${endpoint}`, { notificationId, userId });
      fetchDashboard();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to process request");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/api/notification/read-all");
      fetchDashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const mergedRecentProjects = (() => {
    const apiProjects = data?.recentProjects || [];
    const visited = visitedProjects.slice(0, 4);
    const seen = new Set<string>();
    const merged: { _id: string; name: string; workspaceName: string; source: string }[] = [];

    for (const v of visited) {
      if (!seen.has(v._id)) {
        seen.add(v._id);
        merged.push({ _id: v._id, name: v.name, workspaceName: v.workspaceName, source: "visited" });
      }
    }
    for (const p of apiProjects) {
      if (!seen.has(p._id) && merged.length < 6) {
        seen.add(p._id);
        merged.push({ _id: p._id, name: p.name, workspaceName: p.workspaceName, source: "activity" });
      }
    }
    return merged;
  })();

  const allOnlineMembers = Object.values(onlineByWorkspace).flat();
  const uniqueOnline = Array.from(new Map(allOnlineMembers.map((m) => [m.userId, m])).values());

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertTriangle className="h-10 w-10 text-red-400" />
          <div>
            <p className="font-medium text-zinc-200">Could not load dashboard</p>
            <p className="text-sm text-zinc-500 mt-1">{error}</p>
          </div>
          <button
            onClick={fetchDashboard}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 mb-1">
            <LayoutDashboard size={22} />
            <span className="text-sm font-medium">Dashboard</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {greeting}, {userData.name?.split(" ")[0] || "there"}
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Your personal command center across all workspaces</p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCardModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={16} /> New Card
          </button>
          <button
            onClick={() => setProjectModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-200 bg-zinc-800 border border-zinc-700 rounded-xl hover:bg-zinc-700 transition-colors"
          >
            <FolderKanban size={16} /> New Project
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Assigned to you" value={data?.personal.assignedCards.length || 0} icon={ClipboardList} color="bg-indigo-500/10 text-indigo-400" />
        <StatCard label="High urgency" value={data?.personal.urgentCards.length || 0} icon={AlertTriangle} color="bg-red-500/10 text-red-400" />
        <StatCard label="Unread notifications" value={data?.notifications.unreadCount || 0} icon={Bell} color="bg-amber-500/10 text-amber-400" />
        <StatCard label="Your activity" value={data?.personal.activityCount || 0} icon={Activity} color="bg-emerald-500/10 text-emerald-400" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Column 1: Personal Overview */}
        <div className="space-y-6">
          <SectionCard title="Assigned to you" icon={ClipboardList} iconColor="text-indigo-400">
            {data?.personal.assignedCards.length ? (
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {data.personal.assignedCards.map((card) => (
                  <CardRow key={card._id} card={card} onClick={() => goToCard(card)} />
                ))}
              </div>
            ) : (
              <EmptyState icon={ClipboardList} message="No cards assigned to you" />
            )}
          </SectionCard>

          <SectionCard title="High urgency" icon={Zap} iconColor="text-red-400">
            {data?.personal.urgentCards.length ? (
              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                {data.personal.urgentCards.map((card) => (
                  <CardRow key={card._id} card={card} onClick={() => goToCard(card)} />
                ))}
              </div>
            ) : (
              <EmptyState icon={Zap} message="No urgent cards right now" />
            )}
          </SectionCard>

          <SectionCard title="Recently touched" icon={Clock} iconColor="text-amber-400">
            {data?.personal.recentlyTouchedCards.length ? (
              <ItemScroll itemHeight="4.5rem" gap="0.5rem" gapClass="space-y-2" visibleCount={1}>
                {data.personal.recentlyTouchedCards.map((card) => (
                  <CardRow key={card._id} card={card} onClick={() => goToCard(card)} />
                ))}
              </ItemScroll>
            ) : (
              <EmptyState icon={Clock} message="No recent card activity" />
            )}
          </SectionCard>
        </div>

        {/* Column 2: Workspace & Projects */}
        <div className="space-y-6">
          <SectionCard title="Your workspaces" icon={Building2} iconColor="text-indigo-400">
            {data?.workspaces.length ? (
              <div className="space-y-2">
                {data.workspaces.map((ws) => (
                  <Link
                    key={ws._id}
                    to={`/workspace/${ws._id}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60 hover:bg-zinc-800/40 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {ws.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate">{ws.name}</p>
                        <p className="text-xs text-zinc-500">{ws.memberCount} members · {ws.projectCount} projects</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-zinc-600 group-hover:text-zinc-400 shrink-0" />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState icon={Building2} message="No workspaces yet" />
            )}
          </SectionCard>

          <SectionCard title="Recent projects" icon={FolderKanban} iconColor="text-blue-400">
            {mergedRecentProjects.length ? (
              <div className="space-y-2">
                {mergedRecentProjects.map((proj) => (
                  <button
                    key={proj._id}
                    onClick={() => navigate(`/projects/${proj._id}`)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60 hover:bg-zinc-800/40 transition-all text-left group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">{proj.name}</p>
                      <p className="text-xs text-zinc-500">{proj.workspaceName}</p>
                    </div>
                    <span className="text-[10px] text-zinc-600 uppercase tracking-wider shrink-0 ml-2">
                      {proj.source === "visited" ? "Visited" : "Active"}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState icon={FolderKanban} message="Visit a project to see it here" />
            )}
          </SectionCard>

          <SectionCard title="Online now" icon={Users} iconColor="text-emerald-400">
            {uniqueOnline.length ? (
              <div className="flex flex-wrap gap-2">
                {uniqueOnline.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium"
                  >
                    <Circle size={8} className="fill-emerald-400 text-emerald-400" />
                    {member.userName}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Users} message="No teammates online right now" />
            )}
          </SectionCard>

        </div>

        {/* Column 3: Health, Activity, Notifications */}
        <div className="space-y-6">
          <SectionCard title="Board health" icon={BarChart3} iconColor="text-purple-400">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "To Do", value: data?.boardHealth.byStatus.todo || 0, color: "bg-zinc-600" },
                  { label: "In Progress", value: data?.boardHealth.byStatus.inProgress || 0, color: "bg-blue-500" },
                  { label: "Done", value: data?.boardHealth.byStatus.done || 0, color: "bg-emerald-500" },
                ].map((s) => (
                  <div key={s.label} className="text-center p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/60">
                    <p className="text-lg font-bold text-white">{s.value}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{s.label}</p>
                    <div className={`h-1 rounded-full mt-2 ${s.color} opacity-60`} style={{ width: `${Math.min(100, ((s.value / (data?.boardHealth.totalCards || 1)) * 100))}%`, margin: "8px auto 0" }} />
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <div className="flex-1 flex items-center gap-2 p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/60">
                  <UserX size={14} className="text-amber-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">{data?.boardHealth.unassignedCount || 0}</p>
                    <p className="text-[10px] text-zinc-500">Unassigned</p>
                  </div>
                </div>
                <div className="flex-1 flex items-center gap-2 p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/60">
                  <CalendarClock size={14} className="text-red-400 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">{data?.boardHealth.overdueCount || 0}</p>
                    <p className="text-[10px] text-zinc-500">Overdue</p>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title="Notifications"
            icon={Bell}
            iconColor="text-amber-400"
            action={
              (data?.notifications.unreadCount || 0) > 0 ? (
                <button onClick={handleMarkAllRead} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Mark all read
                </button>
              ) : undefined
            }
          >
            <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
              {data?.notifications.unread.length ? (
                data.notifications.unread.map((n: any) => (
                  <div key={n._id} className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
                    <p className="text-xs text-zinc-300 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-zinc-600 mt-1">{formatActivityTime(n.createdAt)}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-500 text-center py-2">All caught up!</p>
              )}

              {data?.notifications.cardsWithUnreadMessages.length ? (
                <div className="pt-2 border-t border-zinc-800/60">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <MessageSquare size={10} /> Unreplied messages
                  </p>
                  {data.notifications.cardsWithUnreadMessages.map((item) => (
                    <button
                      key={item.card._id}
                      onClick={() => item.card && navigate(`/projects/${(item.card as any).project?._id || ""}`)}
                      className="w-full text-left p-2 rounded-lg hover:bg-zinc-800/40 transition-colors mb-1"
                    >
                      <p className="text-xs font-medium text-zinc-300 truncate">{item.card.title}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{item.lastComment.author?.name}: {item.lastComment.content}</p>
                    </button>
                  ))}
                </div>
              ) : null}

              {data?.notifications.cardsMovedAssignedToYou.length ? (
                <div className="pt-2 border-t border-zinc-800/60">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <ArrowRightLeft size={10} /> Cards moved (yours)
                  </p>
                  {data.notifications.cardsMovedAssignedToYou.map((item) => (
                    <button
                      key={item.card._id}
                      onClick={() => goToCard(item.card)}
                      className="w-full text-left p-2 rounded-lg hover:bg-zinc-800/40 transition-colors mb-1"
                    >
                      <p className="text-xs font-medium text-zinc-300 truncate">{item.card.title}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{item.activity.user?.name} · {formatActivityTime(item.activity.createdAt)}</p>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard title="Recent activity" icon={Activity} iconColor="text-emerald-400">
            {data?.activityFeed.length ? (
              <ItemScroll itemHeight="3.5rem" gap="0.75rem" gapClass="space-y-3" visibleCount={2}>
                {data.activityFeed.map((act) => (
                  <div key={act._id} className="flex gap-3 items-start min-h-14 shrink-0">
                    <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 shrink-0 mt-0.5">
                      {act.user?.name?.charAt(0) || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        <span className="font-medium text-zinc-200">{act.user?.name}</span>{" "}
                        {act.action.replace(/Card titled:\(([^)]+)\)/, "$1")}
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">
                        {act.project?.name && `${act.project.name} · `}
                        {formatActivityTime(act.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </ItemScroll>
            ) : (
              <EmptyState icon={Activity} message="No recent activity" />
            )}
          </SectionCard>

          {(data?.pendingJoinRequests.length || 0) > 0 ? (
            <SectionCard title="Join requests" icon={UserPlus} iconColor="text-indigo-400">
              <div className="space-y-3">
                {data!.pendingJoinRequests.map((req) => (
                  <div key={req._id} className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                    <p className="text-xs text-zinc-300 mb-2">{req.message}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleJoinRequest(req._id, req.workspace, req.sender._id, "accepted")}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                      >
                        <CheckCircle2 size={12} /> Accept
                      </button>
                      <button
                        onClick={() => handleJoinRequest(req._id, req.workspace, req.sender._id, "rejected")}
                        className="flex-1 px-2 py-1.5 text-xs font-medium text-zinc-400 bg-zinc-800 border border-zinc-700 rounded-lg hover:text-red-400"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : (
            <div/>
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={cardModalOpen} onClose={() => setCardModalOpen(false)} title="Create a Card">
        <form onSubmit={handleCreateCard} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
            <input
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              className="w-full px-3 py-2 bg-[#2C2C2E] border border-[#3C3C3E] rounded-lg outline-none focus:border-indigo-500 text-white"
              placeholder="What needs to be done?"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Workspace</label>
            <select
              value={newCardWorkspace}
              onChange={(e) => { setNewCardWorkspace(e.target.value); setNewCardProject(""); }}
              className="w-full px-3 py-2 bg-[#2C2C2E] border border-[#3C3C3E] rounded-lg outline-none focus:border-indigo-500 text-white"
              required
            >
              <option value="" disabled>Select workspace</option>
              {workspaces.map((ws) => (
                <option key={ws._id} value={ws._id}>{ws.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Project</label>
            <select
              value={newCardProject}
              onChange={(e) => setNewCardProject(e.target.value)}
              className="w-full px-3 py-2 bg-[#2C2C2E] border border-[#3C3C3E] rounded-lg outline-none focus:border-indigo-500 text-white"
              required
              disabled={!newCardWorkspace}
            >
              <option value="" disabled>Select project</option>
              {workspaces.find((ws) => ws._id === newCardWorkspace)?.projects?.map((p: any) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>
          {columns.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Column</label>
              <select
                value={newCardColumn}
                onChange={(e) => setNewCardColumn(e.target.value)}
                className="w-full px-3 py-2 bg-[#2C2C2E] border border-[#3C3C3E] rounded-lg outline-none focus:border-indigo-500 text-white"
                required
              >
                {columns.map((col) => (
                  <option key={col._id} value={col._id}>{col.title}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setCardModalOpen(false)} className="px-4 py-2 text-sm text-gray-300 hover:text-white">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Create Card</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={projectModalOpen} onClose={() => setProjectModalOpen(false)} title="Create a Project">
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Workspace</label>
            <select
              value={newProjectWorkspace}
              onChange={(e) => setNewProjectWorkspace(e.target.value)}
              className="w-full px-3 py-2 bg-[#2C2C2E] border border-[#3C3C3E] rounded-lg outline-none focus:border-indigo-500 text-white"
              required
            >
              <option value="" disabled>Select workspace</option>
              {workspaces.map((ws) => (
                <option key={ws._id} value={ws._id}>{ws.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Project Name</label>
            <input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full px-3 py-2 bg-[#2C2C2E] border border-[#3C3C3E] rounded-lg outline-none focus:border-indigo-500 text-white"
              placeholder="e.g. Q4 Marketing"
              required
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setProjectModalOpen(false)} className="px-4 py-2 text-sm text-gray-300 hover:text-white">Cancel</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">Create Project</button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Dashboard;
