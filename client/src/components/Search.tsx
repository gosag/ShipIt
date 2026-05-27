import { api } from "../axios";
import { useState } from "react";
import { Search as SearchIcon, Loader2, Building2, User, ChevronRight, CheckCircle2 } from "lucide-react";

const Search = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<{name: string, slug: string, createdBy: string, userId: string, workspaceId: string}>({ name: "", slug: "", createdBy: "", userId: "", workspaceId: "" });
    const [joinRequestLoading, setJoinRequestLoading] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [hasRequested, setHasRequested] = useState(false);

    const handleSearch = async () => {
        if (!searchTerm.trim()) return;
        try {
            setIsSearching(true);
            setHasRequested(false);
            const response = await api.get(`/api/workspace/get-slug/${searchTerm}`);
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
        } finally {
            setJoinRequestLoading(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Find a Workspace</h1>
                    <p className="text-gray-500 text-sm">Search by workspace slug to join your team</p>
                </div>

                {/* Search Input Area */}
                <div className="relative flex items-center w-full max-w-md mx-auto group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                        <SearchIcon className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input 
                        type="text"
                        placeholder="Search workspaces..." 
                        className="block w-full p-4 pl-12 pr-24 text-sm text-gray-900 border-2 border-gray-200 rounded-2xl bg-white focus:ring-0 focus:border-blue-500 outline-none transition-all shadow-sm focus:shadow-md"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    /> 
                    <button 
                        onClick={handleSearch}
                        disabled={isSearching || !searchTerm.trim()}
                        className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm px-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                    </button>
                </div>

                {/* Result Card */}
                {searchResults && searchResults.name && (
                    <div className="max-w-md mx-auto w-full bg-white border border-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-blue-50 rounded-xl">
                                        <Building2 className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{searchResults.name}</h3>
                                        <p className="text-sm font-medium text-blue-600 bg-blue-50 inline-block px-2 py-0.5 rounded-md mt-1">
                                            /{searchResults.slug}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center text-sm text-gray-500 mb-6 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <User className="w-4 h-4 mr-2 text-gray-400" />
                                <span>Created by <span className="font-semibold text-gray-700">{searchResults.createdBy}</span></span>
                            </div>

                            <button 
                                onClick={handleJoin} 
                                disabled={joinRequestLoading || hasRequested}
                                className={`w-full flex items-center justify-center py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                                    hasRequested 
                                        ? 'bg-green-50 text-green-700 border border-green-200 shadow-sm'
                                        : 'bg-gray-900 hover:bg-gray-800 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
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
            </div>
        </div>
    )
}

export default Search;