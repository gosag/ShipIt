import {api} from "../axios"
import {useState} from "react"
const Search=()=>{
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<{name: string, slug: string, createdBy: string}>({ name: "", slug: "", createdBy: "" });
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
        </div>
    )
}
export default Search;