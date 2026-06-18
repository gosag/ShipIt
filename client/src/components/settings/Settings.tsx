import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
import { api } from "../../axios";
import {
  User,
  Building2,
  Bell,
  Loader2,
  Shield,
  Mail,
  Lock,
  Image,
  Trash2,
  Users,
  Crown,
  UserIcon,
  AlertTriangle,
  ArrowRightLeft,
  MessageSquare,
  
} from "lucide-react";

type SettingsTab = "profile" | "workspace" | "notifications";

interface OutletContext {
  refreshUserData: () => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Member {
  role: string;
  user: { _id: string; name: string; email: string };
}

interface Workspace {
  _id: string;
  name: string;
  slug: string;
  avatar?: string;
  owner: string | { _id: string };
  members: Member[];
}

interface NotificationPrefs {
  cardMoves: boolean;
  messages: boolean;
  joinRequests: boolean;
}

const inputClass =
  "w-full px-3 py-2 bg-[#2C2C2E] border border-[#3C3C3E] rounded-lg outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white transition-all placeholder:text-gray-500";

const cardClass =
  "bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm";

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const Toggle = ({
  enabled,
  onChange,
  label,
  description,
  icon: Icon,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
  icon: React.ElementType;
}) => (
  <div className="flex items-center justify-between py-4 border-b border-zinc-800/50 last:border-0">
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-zinc-800/50 text-zinc-400">
        <Icon size={16} />
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-200">{label}</p>
        <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
      </div>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900 ${
        enabled ? "bg-indigo-600" : "bg-zinc-700"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  </div>
);

const Settings = () => {
  const navigate = useNavigate();
  const { refreshUserData, refreshWorkspaces } = useOutletContext<OutletContext>();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [user, setUser] = useState<UserData | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    cardMoves: true,
    messages: true,
    joinRequests: true,
  });

  const [name, setName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  const [wsName, setWsName] = useState("");
  const [wsAvatar, setWsAvatar] = useState("");
  const [isUploadingWsImage, setIsUploadingWsImage] = useState(false);
  const [deleteWsConfirm, setDeleteWsConfirm] = useState("");

  const adminWorkspaces = workspaces.filter((ws) =>
    ws.members?.some(
      (m) => m?.user?._id === user?._id && m?.role === "admin"
    )
  );

  const showToast = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [userRes, wsRes, prefsRes] = await Promise.all([
          api.get("/api/auth/user-info"),
          api.get("/api/workspace/get-all"),
          api.get("/api/auth/notification-preferences"),
        ]);
        setUser(userRes.data);
        setName(userRes.data.name);
        setNewEmail(userRes.data.email);
        setAvatarUrl(userRes.data.avatar || "");
        setWorkspaces(wsRes.data);
        setNotifPrefs(prefsRes.data);
        const adminWs = wsRes.data.filter((ws: Workspace) =>
          ws.members?.some(
            (m: Member) =>
              m?.user?._id === userRes.data._id && m?.role === "admin"
          )
        );
        if (adminWs.length > 0) {
          setSelectedWorkspaceId(adminWs[0]._id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (!selectedWorkspaceId) return;
    const fetchWs = async () => {
      try {
        const res = await api.get(`/api/workspace/${selectedWorkspaceId}`);
        setWorkspace(res.data);
        setWsName(res.data.name);
        setWsAvatar(res.data.avatar || "");
      } catch (err) {
        console.error(err);
      }
    };
    fetchWs();
  }, [selectedWorkspaceId]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch("/api/auth/profile", { name });
      setUser(res.data);
      await refreshUserData();
      showToast("success", "Name updated successfully");
    } catch (err: any) {
      showToast("error", err.response?.data?.error || err.response?.data?.message || "Failed to update name");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch("/api/auth/email", { email: newEmail, password: emailPassword });
      setUser(res.data);
      await refreshUserData();
      setEmailPassword("");
      showToast("success", "Email updated successfully");
    } catch (err: any) {
      showToast("error", err.response?.data?.error || err.response?.data?.message || "Failed to update email");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast("error", "Passwords do not match");
      return;
    }
    setSaving(true);
    try {
      await api.patch("/api/auth/password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("success", "Password updated successfully");
    } catch (err: any) {
      showToast("error", err.response?.data?.error || err.response?.data?.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "shipit_avatar");

    try {
      const response = await axios.post(
        "https://api.cloudinary.com/v1_1/dhxvrjcoc/image/upload",
        formData
      );
      const secureUrl = response.data.secure_url;
      setAvatarUrl(secureUrl);

      const res = await api.patch("/api/auth/avatar", { avatar: secureUrl });
      setUser(res.data);
      await refreshUserData();
      showToast("success", "Profile picture updated");
    } catch (error: any) {
      console.log(error.response?.data);
      showToast("error", "Failed to upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm("Are you sure? This action cannot be undone.")) return;
    setSaving(true);
    try {
      await api.delete("/api/auth/account", { data: { password: deletePassword } });
      localStorage.clear();
      navigate("/login");
    } catch (err: any) {
      showToast("error", err.response?.data?.error || err.response?.data?.message || "Failed to delete account");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateWorkspaceName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspaceId) return;
    setSaving(true);
    try {
      const res = await api.put(`/api/workspace/update/${selectedWorkspaceId}`, { name: wsName });
      setWorkspace(res.data);
      setWorkspaces((prev) =>
        prev.map((ws) => (ws._id === selectedWorkspaceId ? { ...ws, name: wsName } : ws))
      );
      await refreshWorkspaces();
      showToast("success", "Workspace name updated");
    } catch (err: any) {
      showToast("error", err.response?.data?.error || err.response?.data?.message || "Failed to update workspace");
    } finally {
      setSaving(false);
    }
  };

  const handleWsFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedWorkspaceId) return;

    setIsUploadingWsImage(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "shipit_avatar");

    try {
      const response = await axios.post(
        "https://api.cloudinary.com/v1_1/dhxvrjcoc/image/upload",
        formData
      );
      const secureUrl = response.data.secure_url;
      setWsAvatar(secureUrl);

      const res = await api.put(`/api/workspace/update/${selectedWorkspaceId}`, {
        avatar: secureUrl,
      });
      setWorkspace(res.data);
      setWorkspaces((prev) =>
        prev.map((ws) => (ws._id === selectedWorkspaceId ? { ...ws, avatar: secureUrl } : ws))
      );
      await refreshWorkspaces();
      showToast("success", "Workspace icon updated");
    } catch (error: any) {
      console.log(error.response?.data);
      showToast("error", "Failed to upload image. Please try again.");
    } finally {
      setIsUploadingWsImage(false);
      e.target.value = "";
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedWorkspaceId || !window.confirm("Remove this member from the workspace?")) return;
    try {
      const res = await api.delete(`/api/workspace/${selectedWorkspaceId}/members/${memberId}`);
      setWorkspace(res.data);
      showToast("success", "Member removed");
      await refreshWorkspaces();
    } catch (err: any) {
      showToast("error", err.response?.data?.error || err.response?.data?.message || "Failed to remove member");
    }
  };

  const handleChangeRole = async (memberId: string, role: string) => {
    if (!selectedWorkspaceId) return;
    try {
      const res = await api.patch(`/api/workspace/${selectedWorkspaceId}/members/${memberId}/role`, { role });
      setWorkspace(res.data);
      showToast("success", "Role updated");
    } catch (err: any) {
      showToast("error", err.response?.data?.error || err.response?.data?.message || "Failed to update role");
    }
  };
  const logoutHandler= async()=>{
    try{
     await api.post("/api/auth/logout")
     localStorage.clear()
     refreshUserData()
    }catch(err){
      console.log(err)
    }
  }
  const handleDeleteWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspaceId || deleteWsConfirm !== workspace?.name) return;
    if (!window.confirm("Delete this workspace permanently? All projects and data will be lost.")) return;
    setSaving(true);
    try {
      await api.delete(`/api/workspace/delete/${selectedWorkspaceId}`);
      setWorkspaces((prev) => prev.filter((ws) => ws._id !== selectedWorkspaceId));
      const remaining = adminWorkspaces.filter((ws) => ws._id !== selectedWorkspaceId);
      setSelectedWorkspaceId(remaining[0]?._id || "");
      setWorkspace(null);
      setDeleteWsConfirm("");
      showToast("success", "Workspace deleted");
      await refreshWorkspaces();
    } catch (err: any) {
      showToast("error", err.response?.data?.error || err.response?.data?.message || "Failed to delete workspace");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotif = async (key: keyof NotificationPrefs, value: boolean) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    try {
      await api.patch("/api/auth/notification-preferences", { [key]: value });
    } catch (err: any) {
      setNotifPrefs(notifPrefs);
      showToast("error", err.response?.data?.error || err.response?.data?.message || "Failed to update preference");
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: "profile", label: "Profile", icon: User },
    ...(adminWorkspaces.length > 0
      ? [{ id: "workspace" as SettingsTab, label: "Workspace", icon: Building2 }]
      : []),
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="animate-pulse font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full text-zinc-50 font-sans selection:bg-indigo-500/30">
      <div className="max-w-4xl mx-auto space-y-6">
        {message && (
          <div
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-xl border ${
              message.type === "success"
                ? "bg-green-500/10 text-green-400 border-green-500/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="border-b border-zinc-800 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Manage your account, workspace, and notification preferences.
          </p>
        </div>

        <div className="flex gap-2 border-b border-zinc-800 pb-0">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px ${
                activeTab === id
                  ? "text-white border-indigo-500 bg-zinc-900/50"
                  : "text-zinc-400 border-transparent hover:text-zinc-200"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className={cardClass}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-zinc-200">
                <Image className="h-5 w-5 text-zinc-500" />
                Profile Picture
              </h2>
              <div className="flex flex-col items-start gap-3">
                <div className="relative group cursor-pointer">
                  <div
                    className={`w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden bg-[#2C2C2E] transition-all duration-300 border-zinc-700 group-hover:border-indigo-500/50`}
                  >
                    {isUploadingImage ? (
                      <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                    ) : avatarUrl ? (
                      <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-lg">
                        {user ? getInitials(user.name) : "?"}
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    onChange={handleFileChange}
                    disabled={isUploadingImage}
                  />
                </div>
                <p className="text-sm text-zinc-400">
                  {isUploadingImage ? "Uploading..." : "Click to upload a new profile picture"}
                </p>
              </div>
            </div>

            <div className={cardClass}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-zinc-200">
                <User className="h-5 w-5 text-zinc-500" />
                Update Name
              </h2>
              <form onSubmit={handleUpdateName} className="space-y-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="Your name"
                  required
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  Save Name
                </button>
              </form>
            </div>

            <div className={cardClass}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-zinc-200">
                <Mail className="h-5 w-5 text-zinc-500" />
                Change Email
              </h2>
              <form onSubmit={handleUpdateEmail} className="space-y-3">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className={inputClass}
                  placeholder="New email address"
                  required
                />
                <input
                  type="password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Current password to confirm"
                  required
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  Update Email
                </button>
              </form>
            </div>

            <div className={cardClass}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-zinc-200">
                <Lock className="h-5 w-5 text-zinc-500" />
                Change Password
              </h2>
              <form onSubmit={handleUpdatePassword} className="space-y-3">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Current password"
                  required
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass}
                  placeholder="New password"
                  required
                  minLength={6}
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  Update Password
                </button>
              </form>
            </div>

            <div className={`${cardClass} border-red-500/20`}>
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                Delete Account
              </h2>
              <p className="text-sm text-zinc-500 mb-4">
                Permanently delete your account and all associated data. This cannot be undone.
              </p>
              <form onSubmit={handleDeleteAccount} className="space-y-3">
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className={`${inputClass} focus:border-red-500 focus:ring-red-500`}
                  placeholder="Enter your password to confirm"
                  required
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Delete Account
                </button>
              </form>
            </div> 
            <div className="border  rounded-lg border-zinc-800 bg-zinc-900 p-4" onClick={logoutHandler}>
                  <button className="bg-red-900  text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors active:scale-95 flex items-center gap-2">
                    Logout
                  </button>
            </div>
          </div>
        )}

        {activeTab === "workspace" && adminWorkspaces.length > 0 && (
          <div className="space-y-6">
            <div className={cardClass}>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                Select Workspace
              </label>
              <select
                value={selectedWorkspaceId}
                onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                className={inputClass}
              >
                {adminWorkspaces.map((ws) => (
                  <option key={ws._id} value={ws._id}>
                    {ws.name}
                  </option>
                ))}
              </select>
            </div>

            {workspace && (
              <>
                <div className={cardClass}>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-zinc-200">
                    <Building2 className="h-5 w-5 text-zinc-500" />
                    Workspace Details
                  </h2>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-3">Workspace Icon</label>
                    <div className="flex flex-col items-start gap-3">
                      <div className="relative group cursor-pointer">
                        <div
                          className={`w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-[#2C2C2E] transition-all duration-300 border-zinc-700 group-hover:border-indigo-500/50`}
                        >
                          {isUploadingWsImage ? (
                            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                          ) : wsAvatar ? (
                            <img src={wsAvatar} alt="Workspace icon" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-lg">
                              {getInitials(wsName)}
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          onChange={handleWsFileChange}
                          disabled={isUploadingWsImage}
                        />
                      </div>
                      <p className="text-sm text-zinc-400">
                        {isUploadingWsImage ? "Uploading..." : "Click to upload a new workspace icon"}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateWorkspaceName} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Workspace Name</label>
                      <input
                        type="text"
                        value={wsName}
                        onChange={(e) => setWsName(e.target.value)}
                        className={inputClass}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      Save Name
                    </button>
                  </form>
                </div>

                <div className={cardClass}>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-zinc-200">
                    <Users className="h-5 w-5 text-zinc-500" />
                    Members ({workspace.members.filter(Boolean).length})
                  </h2>
                  <ul className="divide-y divide-zinc-800/50">
                    {workspace.members.map((member) => {
                      if (!member?.user) return null;
                      const isAdmin = member.role === "admin";
                      const isOwner =
                        (typeof workspace.owner === "object"
                          ? workspace.owner._id
                          : workspace.owner) === member.user._id;
                      const isSelf = member.user._id === user?._id;

                      return (
                        <li
                          key={member.user._id}
                          className="py-4 flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center font-medium text-zinc-300 border border-zinc-700/50 shrink-0">
                              {getInitials(member.user.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-zinc-200 truncate flex items-center gap-1.5">
                                {member.user.name}
                                {isOwner && <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                              </p>
                              <p className="text-xs text-zinc-500 truncate">{member.user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {!isOwner && !isSelf && (
                              <>
                                <select
                                  value={member.role}
                                  onChange={(e) => handleChangeRole(member.user._id, e.target.value)}
                                  className="px-2 py-1 text-xs bg-[#2C2C2E] border border-[#3C3C3E] rounded-lg text-zinc-300 outline-none focus:border-indigo-500"
                                >
                                  <option value="admin">Admin</option>
                                  <option value="member">Member</option>
                                </select>
                                <button
                                  onClick={() => handleRemoveMember(member.user._id)}
                                  className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                  title="Remove member"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                            {(isOwner || isSelf) && (
                              <div
                                className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border ${
                                  isAdmin
                                    ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                    : "bg-zinc-800/50 text-zinc-400 border-zinc-700/50"
                                }`}
                              >
                                {isAdmin ? <Shield className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />}
                                <span className="capitalize">{member.role}</span>
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className={`${cardClass} border-red-500/20`}>
                  <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-red-400">
                    <Trash2 className="h-5 w-5" />
                    Delete Workspace
                  </h2>
                  <p className="text-sm text-zinc-500 mb-4">
                    Permanently delete this workspace and all its projects. Type the workspace name to confirm.
                  </p>
                  <form onSubmit={handleDeleteWorkspace} className="space-y-3">
                    <input
                      type="text"
                      value={deleteWsConfirm}
                      onChange={(e) => setDeleteWsConfirm(e.target.value)}
                      className={`${inputClass} focus:border-red-500 focus:ring-red-500`}
                      placeholder={workspace.name}
                    />
                    <button
                      type="submit"
                      disabled={saving || deleteWsConfirm !== workspace.name}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete Workspace
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "notifications" && (
          <div className={cardClass}>
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-zinc-200">
              <Bell className="h-5 w-5 text-zinc-500" />
              Notification Preferences
            </h2>
            <p className="text-sm text-zinc-500 mb-4">
              Choose which notifications you want to receive.
            </p>
            <Toggle
              enabled={notifPrefs.cardMoves}
              onChange={(v) => handleToggleNotif("cardMoves", v)}
              label="Card moves"
              description="Get notified when cards assigned to you are moved"
              icon={ArrowRightLeft}
            />
            <Toggle
              enabled={notifPrefs.messages}
              onChange={(v) => handleToggleNotif("messages", v)}
              label="Messages"
              description="Get notified about new messages on your cards"
              icon={MessageSquare}
            />
           {/*  <Toggle
              enabled={notifPrefs.joinRequests}
              onChange={(v) => handleToggleNotif("joinRequests", v)}
              label="Join requests"
              description="Get notified when someone requests to join your workspace"
              icon={UserPlus}
            /> */}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
