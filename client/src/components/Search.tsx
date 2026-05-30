import { api } from "../axios";
import { useEffect, useState } from "react";
import { Search as SearchIcon, Loader2, Building2, User, ChevronRight, CheckCircle2, Clock, XCircle, Bell } from "lucide-react";

const Search = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<{name: string, slug: string, createdBy: string, userId: string, workspaceId: string}>({ name: "", slug: "", createdBy: "", userId: "", workspaceId: "" });
    const [joinRequestLoading, setJoinRequestLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [hasRequested, setHasRequested] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const handleSearch = async () => {
        if (!searchTerm.trim()) return;
        try {
            setIsSearching(true);
            setHasRequested(false);
            let slug = searchTerm.trim();
            if (slug.startsWith("/")) {
                slug = slug.slice(1);
            }
            const response = await api.get(`/api/workspace/get-slug/${slug}`);
            setSearchResults(response.data);
        } catch (error) {
            console.error("Error searching workspaces:", error);
            // Clear results on error
            setSearchResults({ name: "", slug: "", createdBy: "", userId: "", workspaceId: "" });
        } finally {
            setIsSearching(false);
        }
    }

    const handleJoin = async () => {
        try {
            setJoinRequestLoading(true);
            if (!searchResults.workspaceId) return;
            const response = await api.post("/api/notification/join-request", {
                workspaceId: searchResults.workspaceId,
                workspaceOwnerId: searchResults.userId,
                workSpaceName: searchResults.name
            });
            if (response.status === 201) {
                setHasRequested(true);
            }
        } catch (error) {
            console.error("Error joining workspace:", error);
            alert(error.response?.data?.error || "Failed to send join request. Please try again.");
        } finally {
            setJoinRequestLoading(false);
        }
    }
    const handleStatus = async () => {
        try {
            const response = await api.get("/api/notification/your-notifications");
            console.log("Your notifications:", response.data);
            setNotifications(response.data);

        } catch (error) {
            console.error("Error fetching your notifications:", error);
        }
    };
useEffect(() => {
    handleStatus();
}, [hasRequested]);
    return (
        <div className="max-w-2xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-white">Find a Workspace</h1>
                    <p className="text-gray-400 text-sm">Search by workspace slug to join your team</p>
                </div>

                {/* Search Input Area */}
                <div className="relative flex items-center w-full max-w-md mx-auto group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <SearchIcon className="w-5 h-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                    </div>
                    <input 
                        type="text"
                        placeholder="Search workspaces..." 
                        className="block w-full p-4 pl-12 pr-24 text-sm text-gray-200 border border-[#2C2C2E] rounded-2xl bg-[#141415] focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all shadow-sm focus:shadow-md"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    /> 
                    <button 
                        onClick={handleSearch}
                        disabled={isSearching || !searchTerm.trim()}
                        className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm px-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                    </button>
                </div>

                {/* Result Card */}
                {searchResults && searchResults.name && (
                    <div className="max-w-md mx-auto w-full bg-[#1C1C1E] border border-[#2C2C2E] rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-indigo-500/10 rounded-xl">
                                        <Building2 className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{searchResults.name}</h3>
                                        <p className="text-sm font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 inline-block px-2 py-0.5 rounded-md mt-1">
                                            /{searchResults.slug}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center text-sm text-gray-400 mb-6 bg-[#141415] p-3 rounded-xl border border-[#2C2C2E]">
                                <User className="w-4 h-4 mr-2 text-gray-500" />
                                <span>Created by <span className="font-semibold text-gray-200">{searchResults.createdBy}</span></span>
                            </div>

                            <button 
                                onClick={handleJoin} 
                                disabled={joinRequestLoading || hasRequested}
                                className={`w-full flex items-center justify-center py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                                    hasRequested 
                                        ? 'bg-green-500/10 text-green-400 border border-green-500/20 shadow-sm'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                                } disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none`}
                            >
                                {joinRequestLoading ? (
                                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending...</>
                                ) : hasRequested ? (
                                    <><CheckCircle2 className="w-5 h-5 mr-2" /> Request Sent</>
                                ) : (
                                    <>Ask to Join <ChevronRight className="w-4 h-4 ml-1" /></>
                                )}
                            </button>
                        </div>
                    </div>
                )}
                
                {/* Requests Status Section */}
                {notifications.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-[#2C2C2E] w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center space-x-2 mb-6">
                            <Bell className="w-5 h-5 text-gray-400" />
                            <h2 className="text-xl font-bold text-white">Request Status</h2>
                        </div>
                        <div className="space-y-4">
                            {notifications.map((notification) => {
                                const workspaceName = notification.message.includes('workspace') 
                                    ? notification.message.split('workspace ').pop() 
                                    : "Unknown Workspace";
                                
                                return (
                                    <div key={notification._id} className="bg-[#1C1C1E] border border-[#2C2C2E] rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-200 group">
                                        <div className="flex items-center space-x-4">
                                            <div className={`p-2.5 rounded-xl border ${
                                                notification.status === 'accepted' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                notification.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                            }`}>
                                                {notification.status === 'accepted' && <CheckCircle2 className="w-5 h-5" />}
                                                {notification.status === 'rejected' && <XCircle className="w-5 h-5" />}
                                                {notification.status === 'pending' && <Clock className="w-5 h-5" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-gray-200 line-clamp-1">
                                                    {workspaceName}
                                                </span>
                                                <span className="text-xs text-gray-500 mt-0.5 font-medium">
                                                    {new Date(notification.createdAt).toLocaleDateString(undefined, {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center pl-2">
                                            {notification.status === 'pending' && (
                                                <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-lg text-xs font-bold tracking-wide uppercase">
                                                    Pending
                                                </span>
                                            )}
                                            {notification.status === 'accepted' && (
                                                <span className="text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-lg text-xs font-bold tracking-wide uppercase">
                                                    Accepted
                                                </span>
                                            )}
                                            {notification.status === 'rejected' && (
                                                <span className="text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-lg text-xs font-bold tracking-wide uppercase">
                                                    Rejected
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Search;