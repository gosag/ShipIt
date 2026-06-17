import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../axios";
import {
  Building2,
  Users,
  Calendar,
  Hash,
  Link2,
  Mail,
  Shield,
  Loader2,
  Crown,
  User as UserIcon,
  UserPlus
} from "lucide-react";

// Basic type definitions for better autocomplete and safety
interface Member {
  role: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
}

interface Workspace {
  _id: string;
  name: string;
  slug: string;
  createdAt: string;
  owner?: {
    name: string;
    email: string;
    _id?: string;
  };
  members: Member[];
}
const userData = JSON.parse(localStorage.getItem("userData") || "{}");
const WorkspaceInfo = () => {
  const { workspaceId } = useParams();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
 const [emailTOInvite, setEmailToInvite] = useState("");
  useEffect(() => {
    if (!workspaceId) return;

    const fetchWorkspace = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/api/workspace/${workspaceId}`);
        setWorkspace(response.data);
      } catch (error) {
        console.error("Error fetching workspace:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspace();
  }, [workspaceId]);

  // Helper to generate initials for the avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="animate-pulse font-medium">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-zinc-950 p-6 flex items-center justify-center">
        <p className="text-zinc-400 text-lg">Workspace not found.</p>
      </div>
    );
  }
const isAdmin=workspace.members.some(member=>member.user._id===userData._id && member.role.toLowerCase()==="admin");
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-4 md:p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col gap-1 border-b border-zinc-800 pb-6 mb-8">
          <div className="flex items-center gap-3 text-indigo-400 mb-2">
            <Building2 className="h-8 w-8" />
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {workspace.name}
            </h1>
          </div>
          <p className="text-zinc-400 text-sm md:text-base">
            Manage your workspace settings, view members, and configure access.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Column: General Info & Owner (Takes 1 column) */}
          <div className="space-y-6 md:col-span-1">
            
            {/* General Info Card */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-zinc-200">
                <Hash className="h-5 w-5 text-zinc-500" />
                Details
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Slug</p>
                  <div className="flex items-center gap-2 text-sm bg-zinc-950/50 px-3 py-2 rounded-lg border border-zinc-800/80 text-zinc-300">
                    <Link2 className="h-4 w-4 text-zinc-500" />
                    /{workspace.slug}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Created</p>
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <Calendar className="h-4 w-4 text-zinc-500" />
                    {new Date(workspace.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Workspace ID</p>
                  <p className="text-xs font-mono text-zinc-500 truncate bg-zinc-950/50 px-2 py-1 rounded border border-zinc-800/80">
                    {workspace._id}
                  </p>
                </div>
              </div>
            </div>

            {/* Owner Card */}
            {workspace.owner && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-zinc-200">
                  <Crown className="h-5 w-5 text-amber-500" />
                  Owner
                </h2>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-inner">
                    {getInitials(workspace.owner.name)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-medium text-zinc-200 truncate">{workspace.owner.name}</p>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{workspace.owner.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Members List (Takes 2 columns) */}
          
          <div className="md:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-zinc-200">
                <Users className="h-5 w-5 text-zinc-500" />
                Members ({workspace.members.filter(Boolean).length})
              </h2>
            </div>
  
            <div className="flex-1 overflow-hidden">
              {workspace.members.length > 0 ? (
                <ul className="divide-y divide-zinc-800/50">
                  {workspace.members.map((member) => {
                    if (!member?.user) return null;
                    
                    const isAdmin = member.role.toLowerCase() === 'admin';
                    
                    return (
                      <li key={member.user._id} className="py-4 flex items-center justify-between group hover:bg-zinc-800/20 px-2 -mx-2 rounded-xl transition-colors">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center font-medium text-zinc-300 border border-zinc-700/50">
                            {getInitials(member.user.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-zinc-200 truncate">
                              {member.user.name}
                            </p>
                            <p className="text-xs text-zinc-500 truncate flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3" />
                              {member.user.email}
                            </p>
                          </div>
                        </div>
                        
                        {/* Role Badge */}
                        <div className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border ${
                          isAdmin 
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                            : 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50'
                        }`}>
                          {isAdmin ? <Shield className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                          <span className="capitalize">{member.role}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-12">
                  <Users className="h-12 w-12 mb-3 opacity-20" />
                  <p>No active members found.</p>
                </div>
              )}
            </div>
            {(userData._id===workspace.owner._id || isAdmin) && 
            (<div className="flex gap-2 mt-4">
              <input
                type="text"
                placeholder="invite user by email..."
                className="w-[75%] px-2 py-2 rounded-lg bg-zinc-950/50 border border-zinc-800/80 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                value={emailTOInvite}
                onChange={(e) => setEmailToInvite(e.target.value)}
              />
              <button className="flex items-center gap-2 px-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors">
                <UserPlus className="h-4 w-4" />
                Invite
              </button>
            </div>)}
          </div>

        </div>
      </div>
    </div>
  );
};

export default WorkspaceInfo;