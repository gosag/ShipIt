import { Outlet, NavLink } from "react-router-dom";
import { useState } from "react";
import {
  FolderKanban, 
  LayoutDashboard, 
  Plus, 
  Settings, 
  Search,
  Menu,
  X
} from "lucide-react";

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

    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

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
              className={`fixed inset-y-0 left-0 z-30 flex flex-col w-64 md:w-72 border-r border-[#2C2C2E] bg-[#141415] transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0 ${
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`}
            >
                {/* Branding / Top Nav */}
                <div className="flex items-center justify-between h-14 px-4 border-b border-[#2C2C2E]/50">
                   <div className="flex items-center gap-2 font-semibold">
                      
                      <span className="text-white">Ship<span className="text-[hsl(263,99%,60%)]">It</span></span>
                   </div>
                   <button className="md:hidden p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-white/5" onClick={toggleSidebar}>
                     <X size={18} />
                   </button>
                </div>

                <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto custom-scrollbar">
                    
                    {/* General Links */}
                    <div className="space-y-1">
                        <NavLink 
                          to="/" 
                          className={({isActive}) => `flex items-center gap-3 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150 ${isActive ? 'bg-[#2C2C2E] text-white' : 'text-gray-400 hover:text-gray-100 hover:bg-[#2C2C2E]/50'}`}
                        >
                          <LayoutDashboard size={16} /> Dashboard
                        </NavLink>
                        <button className="flex w-full items-center gap-3 px-3 py-1.5 text-sm font-medium text-gray-400 rounded-lg transition-colors duration-150 hover:text-gray-100 hover:bg-[#2C2C2E]/50">
                          <Search size={16} /> Search
                        </button>
                        <button className="flex w-full items-center gap-3 px-3 py-1.5 text-sm font-medium text-gray-400 rounded-lg transition-colors duration-150 hover:text-gray-100 hover:bg-[#2C2C2E]/50">
                          <Settings size={16} /> Settings
                        </button>
                    </div>

                    {/* Workspaces Section */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between px-3 mb-2 group">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Workspaces</h3>
                          <button 
                            onClick={() => setWorkspaceModalOpen(true)}
                            className="p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-white/10 rounded-md transition-all"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <NavLink 
                          to="/workspace" 
                          className={({isActive}) => `flex items-center gap-3 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150 ${isActive ? 'bg-[#2C2C2E] text-white' : 'text-gray-400 hover:text-gray-100 hover:bg-[#2C2C2E]/50'}`}
                        >
                          <div className="flex items-center justify-center w-5 h-5 bg-linear-to-br from-indigo-500 to-purple-600 rounded">
                            <span className="text-[10px] text-white font-bold">D</span>
                          </div>
                          Design Team
                        </NavLink>
                    </div>

                    {/* Projects Section */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between px-3 mb-2 group">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Projects</h3>
                          <button 
                            onClick={() => setProjectModalOpen(true)}
                            className="p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-white/10 rounded-md transition-all"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <NavLink 
                          to="/projects/webapp" 
                          className={({isActive}) => `flex items-center gap-3 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150 ${isActive ? 'bg-[#2C2C2E] text-white' : 'text-gray-400 hover:text-gray-100 hover:bg-[#2C2C2E]/50'}`}
                        >
                          <FolderKanban size={16} className="text-blue-400" />
                          Web App Launch
                        </NavLink>
                        <NavLink 
                          to="/projects/mobile" 
                          className={({isActive}) => `flex items-center gap-3 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-150 ${isActive ? 'bg-[#2C2C2E] text-white' : 'text-gray-400 hover:text-gray-100 hover:bg-[#2C2C2E]/50'}`}
                        >
                          <FolderKanban size={16} className="text-pink-400" />
                          Mobile Revamp
                        </NavLink>
                    </div>
                </div>

                {/* User Section */}
                <div className="p-4 border-t border-[#2C2C2E]/50 mt-auto">
                    <div className="flex items-center gap-3 px-2 py-2 text-sm font-medium rounded-lg text-gray-300 hover:text-white hover:bg-[#2C2C2E]/50 cursor-pointer transition-colors">
                      <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold shrink-0">
                        JS
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-medium">John Smith</p>
                        <p className="text-xs text-gray-500 truncate">john@shipit.app</p>
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

                <div className="flex-1 overflow-auto bg-[#0e0e0f]">
                  <div className="max-w-6xl mx-auto p-4 md:p-8">
                    <Outlet />
                  </div>
                </div>
            </main>

            {/* Modals */}
            <Modal isOpen={workspaceModalOpen} onClose={() => setWorkspaceModalOpen(false)} title="Create Workspace">
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setWorkspaceModalOpen(false); }}>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Workspace Name</label>
                  <input type="text" className="w-full px-3 py-2 bg-[#2C2C2E] border border-[#3C3C3E] rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white transition-all placeholder:text-gray-500" placeholder="e.g. Acme Corp" autoFocus />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setWorkspaceModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">Create Workspace</button>
                </div>
              </form>
            </Modal>

            <Modal isOpen={projectModalOpen} onClose={() => setProjectModalOpen(false)} title="Create Project">
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setProjectModalOpen(false); }}>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Project Name</label>
                  <input type="text" className="w-full px-3 py-2 bg-[#2C2C2E] border border-[#3C3C3E] rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white transition-all placeholder:text-gray-500" placeholder="e.g. Q4 Marketing" autoFocus />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Identifier</label>
                  <input type="text" className="w-full px-3 py-2 bg-[#2C2C2E] border border-[#3C3C3E] rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white transition-all placeholder:text-gray-500" placeholder="e.g. MKTG" />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setProjectModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">Create Project</button>
                </div>
              </form>
            </Modal>
        </div>
    );
};

export default MainOutlet;