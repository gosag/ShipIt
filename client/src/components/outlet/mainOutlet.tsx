import { Outlet, NavLink , useNavigate} from "react-router-dom";
import { useState ,useEffect} from "react";
import {
  FolderKanban, 
  LayoutDashboard, 
  Plus, 
  Settings, 
  Search,
  Menu,
  X,
  Trash2,
  Bell
} from "lucide-react";
import { api } from "../../axios";
const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative z-10 w-full max-w-md p-6 bg-[#1C1C1E] border border-[#2C2C2E] shadow-2xl rounded-xl">
        <h2 className="mb-4 text-xl font-semibold text-white">{title}</h2>
        {children}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

const MainOutlet = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
    const [projectModalOpen, setProjectModalOpen] = useState(false);
    const [userData,setUserData]=useState<{name:string,email:string,_id:string, avatar:string} | null>(null);
    const [workspaces, setWorkspaces] = useState<{_id:string, name:string, slug:string,owner:string, members:any[]}[]>([]);
    const navigate=useNavigate();
    const getWorkspace = async () => {
      try {
        const res = await api.get("/api/workspace/get-all");
        const workspacesData = res.data;
        const workspacesWithProjects = await Promise.all(
          workspacesData.map(async (ws: any) => {
            try {
              const projectRes = await api.get(`/api/project/getAll/${ws._id}`);
              return { ...ws, projects: projectRes.data };
            } catch (err) {
              return { ...ws, projects: [] };
            }
          })
        );
        
        setWorkspaces(workspacesWithProjects);
      } catch (err) {
        console.log(err);
      }
    };

    const refreshUserData = async () => {
      try {
        const res = await api.get("/api/auth/user-info");
        const returnedData = res.data;
        setUserData(returnedData);
        localStorage.setItem("userData", JSON.stringify(returnedData));
        localStorage.setItem("userProfile", returnedData.avatar || "");
      } catch (err) {
        console.log(err);
      }
    };

    useEffect(() => {
      refreshUserData();
      getWorkspace();
    }, []);
  useEffect(()=>{
    if(workspaces.length>0){
      localStorage.setItem("workspaces", JSON.stringify(workspaces));
    }
  },[workspaces])
  //create new WorkSpace
    const [newWorkspaceName, setNewWorkspaceName] = useState("");
    const [newProjectName, setNewProjectName] = useState("");
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
    const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<any>(null);
    const [deleteConfirmName, setDeleteConfirmName] = useState("");

    const handleDeleteProject = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!projectToDelete || deleteConfirmName !== projectToDelete.name) return;
      try {
        await api.delete(`/api/project/delete/${projectToDelete._id}`);
        setShowDeleteProjectModal(false);
        setProjectToDelete(null);
        setDeleteConfirmName("");
        getWorkspace(); // Refresh list after deletion
        navigate("/"); 
      } catch (err) {
        console.error("Error deleting project:", err);
      }
    };

    const handleCreateWorkspace = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newWorkspaceName.trim()) return;
      try {
        const slug = newWorkspaceName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        await api.post("/api/workspace/create", { name: newWorkspaceName, slug });
        setNewWorkspaceName("");
        setWorkspaceModalOpen(false);
        getWorkspace();
      } catch (err) {
        console.error("Error creating workspace:", err);
      }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newProjectName.trim() || !selectedWorkspaceId) return;
      try {
        await api.post(`/api/project/create/${selectedWorkspaceId}`, { name: newProjectName });
        setNewProjectName("");
        setSelectedWorkspaceId("");
        setProjectModalOpen(false);
        getWorkspace(); // Refresh the list of workspaces and projects
      } catch (err) {
        console.error("Error creating project:", err);
      }
    };
  
    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
   const firstLetter=(name:string)=>{
    if (!name) return "";
    const parts = name.trim().split(" ");
    const firstInitial = parts[0] ? parts[0][0] : "";
    const lastInitial = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (firstInitial + lastInitial).toUpperCase();
   };
   const [notifications, setNotifications] = useState<any[]>([]);
   const [showNotifications, setShowNotifications] = useState(false);
   const [notificationsToProcess, setNotificationsToProcess] = useState<any>(null);
  useEffect(()=>{
    const fetchNotifications = async () => {
      try {
        const res = await api.get("/api/notification");
        const data = res.data;
        const sortedNotifications = data.filter((n: any)=> n.status==="pending").sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotificationsToProcess(sortedNotifications);
        setNotifications(data);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };
    fetchNotifications();
  },[showNotifications]);
const joinRequestHandler = async (notificationId: string, workspaceId: string, userId: string, status: string) => {
  let response: any;
  try {
       if(status==="accepted"){
          response= await  api.put(`/api/workspace/join-request/${workspaceId}/accept`, { userId, notificationId });
       }
       if(status==="rejected"){
        response =  await  api.put(`/api/workspace/join-request/${workspaceId}/reject`, { userId, notificationId });
       }
       if(response.status === 200){
        setNotifications(prev => prev.filter(n => n._id !== notificationId));
        alert(`Join request ${status} successfully`);
       }
   } catch (err: any) {
  console.log(err.response?.data?.error || err);
  alert(err.response?.data?.error || "An error occurred");
}
}
const [avatarUrl, setAvatarUrl] = useState<string>("");
 useEffect(()=>{
   setAvatarUrl(userData?.avatar || localStorage.getItem("userProfile") || "");
 },[userData])
    return (
        <div className="flex h-screen overflow-hidden bg-[#0e0e0f] text-[#f2f2f2] font-sans antialiased selection:bg-indigo-500/30">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/50 z-20 md:hidden"
                onClick={toggleSidebar}
              />
            )}

            {/* Sidebar */}
            <aside 
              className={`fixed max-h-screen inset-y-0 left-0 z-30 md:static md:inset-auto flex flex-col w-64 md:w-72 h-full border-r border-[#2C2C2E] bg-[#141415] transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`}
            >
                {/* Branding / Top Nav */}
                <div className="flex items-center justify-between h-14 px-4 border-b border-[#2C2C2E]/50">
                   <div className="flex  gap-2 font-semibold">
                      <span className="text-white">Ship<span className="text-[hsl(263,99%,60%)]">It</span></span>
                   </div> 
                   <div className=" flex justify-end items-center gap-4">
                   <div className="relative ">
                      <button onClick={() => setShowNotifications(true)} className="relative" >
                        <Bell size={18}/></button>
                      <span className={`absolute -top-1 -right-1 w-3 h-3 ${notificationsToProcess?.length > 0 ? 'bg-red-500' : 'bg-gray-500'} text-white text-xs rounded-full flex items-center justify-center`}>
                        { notificationsToProcess?.length>0? notificationsToProcess.length : 0}
                      </span>
                   </div>
                   <button className="md:hidden p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-white/5" onClick={toggleSidebar}>
                     <X size={18} />
                   </button>
                   </div>
                </div>

                <div className="flex-1 px-3 py-4 space-y-6 ">
                    
                    {/* General Links */}
                    <div className="space-y-1">
                        <NavLink 
                          to="/" 
                          className={({isActive}) => `flex items-center gap-3 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150 ${isActive ? 'bg-[#2C2C2E] text-white' : 'text-gray-400 hover:text-gray-100 hover:bg-[#2C2C2E]/50'}`}
                        >
                          <LayoutDashboard size={16} /> Dashboard
                        </NavLink>
                        <NavLink to="/search"
                         
                         className={({isActive}) => `flex items-center gap-3 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150 ${isActive ? 'bg-[#2C2C2E] text-white' : 'text-gray-400 hover:text-gray-100 hover:bg-[#2C2C2E]/50'}`}
                        >
                          <Search size={16} /> Search
                        </NavLink>
                        <NavLink
                          to="/settings"
                          className={({isActive}) => `flex items-center gap-3 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150 ${isActive ? 'bg-[#2C2C2E] text-white' : 'text-gray-400 hover:text-gray-100 hover:bg-[#2C2C2E]/50'}`}
                        >
                          <Settings size={16} /> Settings
                        </NavLink>
                    </div>

                    {/* Workspaces Section */}
                    <div className="space-y-4 max-h-[70%] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between px-3 group">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Workspaces</h3>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => setProjectModalOpen(true)}
                              className="p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-white/10 rounded-md transition-all"
                              title="Create Project"
                            >
                              <FolderKanban size={14} />
                            </button>
                            <button 
                              onClick={() => setWorkspaceModalOpen(true)}
                              className="p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-white/10 rounded-md transition-all"
                              title="Create Workspace"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {workspaces.map((ws: any) => (
                            <div key={ws._id} className="space-y-1">
                              <NavLink 
                                to={`/workspace/${ws._id}`} 
                                className={({isActive}) => `flex items-center gap-3 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150 ${isActive ? 'bg-[#2C2C2E] text-white' : 'text-gray-400 hover:text-gray-100 hover:bg-[#2C2C2E]/50'}`}
                              >
                                {ws.avatar ? (
                                  <img src={ws.avatar} alt="" className="w-5 h-5 rounded object-cover shrink-0" />
                                ) : (
                                  <div className="flex items-center justify-center w-5 h-5 bg-linear-to-br from-indigo-500 to-purple-600 rounded shrink-0">
                                    <span className="text-[10px] text-white font-bold">{firstLetter(ws.name)}</span>
                                  </div>
                                )}
                                <span className="truncate">{ws.name}</span>
                              </NavLink>

                              {/* Render Projects for this Workspace */}
                              {ws.projects && ws.projects.length > 0 && (
                                <div className="pl-11 pr-3 space-y-1 mt-1 border-l border-[#2C2C2E]/30 ml-5.5">
                                  {ws.projects.map((project: any) => (
                                    <NavLink 
                                      key={project._id}
                                      to={`/projects/${project._id}`} 
                                      className={({isActive}) => `flex items-center gap-3 py-1.5 text-sm font-medium rounded transition-colors duration-150 ${isActive ? 'text-white' : 'text-gray-400 hover:text-gray-100'}`}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>
                                      <span className="truncate">{project.name}</span>
                                      {project.createdBy === userData?._id || ws.owner===userData?._id && (
                                        <button 
                                          className="ml-auto p-1 text-gray-400 hover:text-red-500 transition-colors" 
                                          title="Delete Project"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setProjectToDelete(project);
                                            
                                            setDeleteConfirmName("");
                                            setShowDeleteProjectModal(true);
                                          }}
                                        >
                                          <Trash2 size={12} className="text-gray-400 pointer-events-none" />
                                        </button>
                                      )}
                                    </NavLink>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                    </div>
                </div>

                {/* User Section */}
                <div className="p-4 border-t border-[#2C2C2E]/50 mt-auto">
                    <div className="flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-lg text-gray-300 hover:text-white hover:bg-[#2C2C2E]/50 cursor-pointer transition-colors">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="User Avatar" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <img src="/placeholder-pp.jpg" alt="Default Avatar" className="w-8 h-8 rounded-full object-cover" />
                      )}
                      <div className="truncate">
                        <p className="text-sm font-medium">{userData ? userData.name : "John Doe"}</p>
                        <p className="text-xs text-gray-500 truncate">{userData?.email ? userData.email : "gosa@shipit.app"}</p>
                      </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#0e0e0f] h-full overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden flex items-center justify-between h-14 px-4 border-b border-[#2C2C2E] bg-[#141415]">
                   <div className="flex items-center gap-2 font-semibold text-white">
                      <img src="/logo.png" alt="ShipIt Logo" className="h-5 w-auto object-contain" />
                      ShipIt
                   </div>
                   <button 
                     className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-white/5" 
                     onClick={toggleSidebar}
                   >
                     <Menu size={20} />
                   </button>
                </header>

                <div className="flex-1 overflow-hidden bg-[#0e0e0f] flex flex-col">
                  <div className="flex-1 w-full p-4 md:p-6 overflow-x-hidden overflow-y-auto custom-scrollbar">
                    <Outlet context={{ refreshWorkspaces: getWorkspace, refreshUserData }} />
                  </div>
                </div>
            </main>

            {/* Modals */}
            <Modal isOpen={workspaceModalOpen} onClose={() => setWorkspaceModalOpen(false)} title="Create Workspace">
              <form className="space-y-4" onSubmit={handleCreateWorkspace}>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Workspace Name</label>
                  <input 
                    type="text" 
                    value={newWorkspaceName} 
                    onChange={e => setNewWorkspaceName(e.target.value)} 
                    className="w-full px-3 py-2 bg-[#2C2C2E] border border-[#3C3C3E] rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white transition-all placeholder:text-gray-500" 
                    placeholder="e.g. Acme Corp" 
                    autoFocus 
                    required 
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setWorkspaceModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">Create Workspace</button>
                </div>
              </form>
            </Modal>

            <Modal isOpen={projectModalOpen} onClose={() => setProjectModalOpen(false)} title="Create Project">
              <form className="space-y-4" onSubmit={handleCreateProject}>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Workspace</label>
                  <select 
                    value={selectedWorkspaceId} 
                    onChange={e => setSelectedWorkspaceId(e.target.value)} 
                    className="w-full px-3 py-2 bg-[#2C2C2E] border border-[#3C3C3E] rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white transition-all"
                    required
                  >
                    <option value="" disabled>Select a Workspace</option>
                    {workspaces.map(ws => (
                      <option key={ws._id} value={ws._id}>{ws.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Project Name</label>
                  <input 
                    type="text" 
                    value={newProjectName} 
                    onChange={e => setNewProjectName(e.target.value)} 
                    className="w-full px-3 py-2 bg-[#2C2C2E] border border-[#3C3C3E] rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white transition-all placeholder:text-gray-500" 
                    placeholder="e.g. Q4 Marketing" 
                    autoFocus 
                    required 
                  />
                </div>
                {/* Identifier optionally removed since endpoint mostly relies on name/workspace */}
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setProjectModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">Create Project</button>
                </div>
              </form>
            </Modal>

            <Modal isOpen={showDeleteProjectModal} onClose={() => setShowDeleteProjectModal(false)} title="Delete Project">
              <form className="space-y-4" onSubmit={handleDeleteProject}>
                <div>
                  <p className="text-sm text-gray-400 mb-4">
                    This action cannot be undone. This will permanently delete the 
                    <span className="font-semibold text-white px-1">{projectToDelete?.name}</span> 
                    project and all of its tasks.
                  </p>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Type <span className="font-mono text-red-400 bg-red-400/10 px-1 py-0.5 rounded">{projectToDelete?.name}</span> to confirm
                  </label>
                  <input 
                    type="text" 
                    value={deleteConfirmName} 
                    onChange={e => setDeleteConfirmName(e.target.value)} 
                    className="w-full px-3 py-2 bg-[#2C2C2E] border border-[#3C3C3E] rounded-lg outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-white transition-all placeholder:text-gray-500" 
                    placeholder="Project Name" 
                    autoFocus 
                    required 
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setShowDeleteProjectModal(false)} className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">Cancel</button>
                  <button 
                    type="submit" 
                    disabled={deleteConfirmName !== projectToDelete?.name}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete Project
                  </button>
                </div>
              </form>
            </Modal>
            {showNotifications && (
              <div className="inset-0 fixed z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNotifications(false)}></div>
                <div className="relative z-10 w-full max-w-md max-h-[80vh] flex flex-col bg-[#1C1C1E] border border-[#2C2C2E] shadow-2xl rounded-xl">
                  <div className="flex items-center justify-between p-4 border-b border-[#2C2C2E]/50">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                       <Bell size={18} className="text-indigo-400" /> Notifications
                    </h2>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                        <Bell size={32} className="mb-3 opacity-20" />
                        <p className="text-sm">You have no new notifications.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {notifications.map((notification) => (
                          <div key={notification._id} className="p-3 bg-[#2C2C2E]/50 border border-[#3C3C3E]/50 rounded-lg flex flex-col gap-2 transition hover:bg-[#2C2C2E]">
                            <p className="text-sm text-gray-200 leading-relaxed">{notification.message}</p>
                            <span className="text-xs text-gray-500">
                              {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {notification.type === 'join_request' && notification.status === 'pending' && (
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => joinRequestHandler(notification._id, notification.workspace, notification.sender, 'accepted')}
                                  className="flex-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => joinRequestHandler(notification._id, notification.workspace, notification.sender, 'rejected')}
                                  className="flex-1 px-3 py-1.5 text-xs font-semibold text-gray-300 bg-[#2C2C2E] border border-[#3C3C3E] rounded-lg hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                            {notification.type === 'join_request' && notification.status !== 'pending' && (
                               <div className="mt-1">
                                 <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${notification.status === 'accepted' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                                 </span>
                               </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
        </div>
    );
};

export default MainOutlet;