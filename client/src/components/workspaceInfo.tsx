import { useEffect, useState } from "react";
import { useParams, useOutletContext } from "react-router-dom";
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
  UserPlus,
  Trash,
  Pencil,
  X,
  Check,
  Kanban
} from "lucide-react";
import socket from "../../socket";

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

interface Project {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
}

interface EditModalProps {
  project: Project;
  onClose: () => void;
  onSave: (id: string, name: string, description: string) => Promise<void>;
}

const EditModal = ({ project, onClose, onSave }: EditModalProps) => {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave(project._id, name.trim(), description.trim());
    setSaving(false);
  };

  return (
    // Faux viewport so fixed-like overlay works in iframe
    <div
      style={{ minHeight: "100vh" }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <Pencil className="h-4 w-4 text-indigo-400" />
            Edit project
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 transition-colors p-1 rounded-lg hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Project name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors placeholder:text-zinc-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description (optional)"
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors placeholder:text-zinc-600 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm text-white font-medium transition-colors"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

const userData = JSON.parse(localStorage.getItem("userData") || "{}");

const WorkspaceInfo = () => {
  const { workspaceId } = useParams();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { refreshWorkspaces } = useOutletContext<{
    refreshWorkspaces: () => void;
  }>();

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

  const getProjectsByWorkspaceId = async () => {
    if (!workspaceId) return;
    try {
      const response = await api.get(`/api/project/getAll/${workspaceId}`);
      setProjects(response.data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  useEffect(() => {
    getProjectsByWorkspaceId();
  }, [workspaceId]);

  const deleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;
    try {
      setDeletingId(projectId);
      const response = await api.delete(`/api/project/delete/${projectId}`);
      if (response.status === 200) {
        setProjects((prev) => prev.filter((p) => p._id !== projectId));
        refreshWorkspaces();
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const updateProject = async (id: string, name: string, description: string) => {
    try {
      const response = await api.put(`/api/project/update/${id}`, {
        name,
        description,
      });
      if (response.status === 200) {
        setProjects((prev) =>
          prev.map((p) =>
            p._id === id ? { ...p, name, description } : p
          )
        );
        setEditingProject(null);
      }
    } catch (error) {
      console.error("Error updating project:", error);
      alert("Failed to update project. Please try again.");
    }
  };

  const handleInvite = async () => {
    try {
      setLoadingInvite(true);
      const response = await api.post(
        `/api/notification/invitation?username=${userName}`,
        { workspaceId }
      );
      if (response.status !== 201) {
        alert("User not found. Please check the username and try again.");
        return;
      }
      socket.emit(
        "notification",
        response.data.receipentID,
        response.data.notification
      );
      alert(`Invitation sent to ${userName} successfully!`);
      setUserName("");
    } catch (error) {
      console.error("Error sending invite:", error);
      alert("Something went wrong. Please make sure the username is correct.");
    } finally {
      setLoadingInvite(false);
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="animate-pulse font-medium text-sm">Loading workspace…</p>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Workspace not found.</p>
      </div>
    );
  }

  const isAdmin = workspace.members.some(
    (member) =>
      member?.user?._id === userData._id &&
      member?.role.toLowerCase() === "admin"
  );
  const isQualified =
    userData._id === workspace.owner?._id || isAdmin;

  return (
    <>
      {editingProject && (
        <EditModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSave={updateProject}
        />
      )}

      <div className="min-h-screen bg-zinc-950 text-zinc-50 p-4 md:p-8 font-sans">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Header */}
          <div className="border-b border-zinc-800 pb-6 mb-8">
            <div className="flex items-center gap-3 text-indigo-400 mb-1.5">
              <Building2 className="h-7 w-7" />
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                {workspace.name}
              </h1>
            </div>
            <p className="text-zinc-500 text-sm">
              Manage workspace settings, view members, and configure access.
            </p>
          </div>

          {/* Top grid: details + owner | members */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Left column */}
            <div className="space-y-5 md:col-span-1">

              {/* Details card */}
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
                <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 text-zinc-300">
                  <Hash className="h-4 w-4 text-zinc-500" />
                  Details
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">
                      Slug
                    </p>
                    <div className="flex items-center gap-2 text-xs bg-zinc-950/60 px-3 py-2 rounded-lg border border-zinc-800 text-zinc-400">
                      <Link2 className="h-3.5 w-3.5 text-zinc-600" />
                      /{workspace.slug}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1.5">
                      Created
                    </p>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <Calendar className="h-3.5 w-3.5 text-zinc-600" />
                      {new Date(workspace.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Owner card */}
              {workspace.owner && (
                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
                  <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 text-zinc-300">
                    <Crown className="h-4 w-4 text-amber-500" />
                    Owner
                  </h2>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-semibold text-indigo-300 border border-indigo-500/30 shrink-0">
                      {getInitials(workspace.owner.name)}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium text-zinc-200 truncate">
                        {workspace.owner.name}
                      </p>
                      <div className="flex items-center gap-1 text-[11px] text-zinc-500 mt-0.5">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{workspace.owner.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Members card */}
            <div className="md:col-span-2 bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 flex flex-col">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 text-zinc-300">
                <Users className="h-4 w-4 text-zinc-500" />
                Members
                <span className="ml-auto text-xs font-normal text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                  {workspace.members.filter(Boolean).length}
                </span>
              </h2>

              <div className="flex-1">
                {workspace.members.length > 0 ? (
                  <ul className="divide-y divide-zinc-800/60">
                    {workspace.members.map((member) => {
                      if (!member?.user) return null;
                      const memberIsAdmin = member.role.toLowerCase() === "admin";
                      return (
                        <li
                          key={member.user._id}
                          className="py-3 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-medium text-zinc-300 border border-zinc-700/50 shrink-0">
                              {getInitials(member.user.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-zinc-200 truncate">
                                {member.user.name}
                              </p>
                              <p className="text-[11px] text-zinc-500 truncate flex items-center gap-1 mt-0.5">
                                <Mail className="h-3 w-3" />
                                {member.user.email}
                              </p>
                            </div>
                          </div>
                          <div
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 border shrink-0 ${
                              memberIsAdmin
                                ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                : "bg-zinc-800/50 text-zinc-400 border-zinc-700/50"
                            }`}
                          >
                            {memberIsAdmin ? (
                              <Shield className="h-3 w-3" />
                            ) : (
                              <UserIcon className="h-3 w-3" />
                            )}
                            <span className="capitalize">{member.role}</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
                    <Users className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm">No active members found.</p>
                  </div>
                )}
              </div>

              {isQualified && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-800/60">
                  <input
                    type="text"
                    placeholder="Invite user by username…"
                    className="flex-1 px-3 py-2 rounded-lg bg-zinc-950/60 border border-zinc-800 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors placeholder:text-zinc-600"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && userName && handleInvite()}
                  />
                  <button
                    disabled={loadingInvite || !userName}
                    onClick={handleInvite}
                    className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
                  >
                    {loadingInvite ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    Invite
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Projects section */}
          {projects.length > 0 && (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 text-zinc-300">
                <Kanban className="h-4 w-4 text-zinc-500" />
                Projects
                <span className="ml-auto text-xs font-normal text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                  {projects.length}
                </span>
              </h2>

              <ul className="divide-y divide-zinc-800/60">
                {projects.map((project) => (
                  <li
                    key={project._id}
                    className="py-3.5 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">
                        {project.name}
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                        {project.description || "No description provided."}
                        <span className="mx-1.5 text-zinc-700">·</span>
                        {new Date(project.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    {isQualified && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setEditingProject(project)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => deleteProject(project._id)}
                          disabled={deletingId === project._id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingId === project._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash className="h-3.5 w-3.5" />
                          )}
                          Delete
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default WorkspaceInfo;