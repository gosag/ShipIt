import {api} from "../axios"
import {useState} from "react"
const Search=()=>{
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<{name: string, slug: string, createdBy: string, userId: string, workspaceId: string}>({ name: "", slug: "", createdBy: "", userId: "", workspaceId: "" });
    const [joinRequestLoading, setJoinRequestLoading] = useState(false);
    const handleSearch=async()=>{
        try{
            if(!searchTerm) return;
            const response=await api.get(`/api/workspace/get-slug/${searchTerm}`);
            console.log("Search result:", response.data);
            setSearchResults(response.data);
        } catch (error) {
            console.error("Error searching workspaces:", error);
        }
    }
    const handleJoin=async()=>{
        try{
            setJoinRequestLoading(true);
            if(!searchResults.workspaceId) return;
            const response = await api.post("/api/notification/join-request",{
                workspaceId: searchResults.workspaceId,
                workspaceOwnerId: searchResults.userId,
                workSpaceName: searchResults.name
            });
            if(response.status === 201){
                console.log("Join request sent successfully");
            }
            else{
                console.error("Failed to send join request:", response.data);
            }

        } catch (error) {
            console.error("Error joining workspace:", error);
        }
        finally{
            setJoinRequestLoading(false);
        }
    }
    return(
        <div>
            <input 
                placeholder="Search workspaces..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            /> 
            <button onClick={handleSearch}>Search</button>
            {searchResults && searchResults.name && (
                <div>
                    <h2>Search Results:</h2>
                    <p>Name: {searchResults.name}</p>
                    <p>Slug: {searchResults.slug}</p>
                    <p>Created By: {searchResults.createdBy}</p>
                </div>
            )}
            <button onClick={handleJoin} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded" disabled={joinRequestLoading}>
                {joinRequestLoading ? "Joining..." : "Join"}
            </button>
        </div>
    )
}
export default Search;