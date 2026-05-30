import {useEffect, useState} from "react"
import { useParams } from "react-router-dom"
import { api } from "../axios"
import {} from "lucide-react"
const WorkspaceInfo = ()=>{
    const workspaceId= useParams().workspaceId;
    const [workspace,setWorkspace]= useState();
    useEffect(()=>{
        const fetchWorkspace = async () => {
            try {
                const response = await api.get(`/workspaces/${workspaceId}`);
                setWorkspace(response.data);
                console.log("Fetched workspace:", response.data);
            } catch (error) {
                console.error("Error fetching workspace:", error);
            }
        };
        fetchWorkspace();
    },[]);
    return(
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Workspace Information</h2>
            <p className="text-gray-600">This is where you can view and manage your workspace details.</p>
        </div>
    )
}
export default WorkspaceInfo;