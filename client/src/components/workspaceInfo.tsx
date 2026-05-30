import {useEffect, useState} from "react"
import { useParams } from "react-router-dom"
import { api } from "../axios"
import {} from "lucide-react"
const WorkspaceInfo = ()=>{
    const { workspaceId } = useParams();
    const [workspace, setWorkspace] = useState<any>(null);
    useEffect(()=>{
        if (!workspaceId) return;
        const fetchWorkspace = async () => {
            try {
                const response = await api.get(`/api/workspace/${workspaceId}`);
                setWorkspace(response.data);
                console.log("members in workspace:", response.data.members);
            } catch (error) {
                console.error("Error fetching workspace:", error);
            }
        };
        fetchWorkspace();
    },[workspaceId]);
    return(
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Workspace Information</h2>
            {workspace ? (
                <div className="space-y-2">
                    <p className="text-gray-200">Name: {workspace.name}</p>
                    <p className="text-gray-200">Slug: {workspace.slug}</p>
                    <p className="text-gray-200">Workspace ID: {workspace._id}</p>
                    <p className="text-gray-200">Created At: {new Date(workspace.createdAt).toLocaleString()}</p>
                    <p className="text-gray-200">Owner: {workspace.owner?.name} ({workspace.owner?.email || ""})</p>
                    {/*users in the workspace */}
                    <p className="text-gray-200">Members:</p>
                    <ul className="list-disc list-inside text-gray-200">
                        {workspace.members.map((member: any) => {
                            if(!member) return null ;
                            return (
                                <li key={member.user._id}>
                                    {member.user.name} ({member.user.email}) - Role: {member.role}
                                </li>
                            );
                        })}
                    </ul>

                </div>
            ) : (
                <p className="text-gray-600">Loading workspace details...</p>
            )}
            <p className="text-gray-600">This is where you can view and manage your workspace details.</p>
        </div>
    )
}
export default WorkspaceInfo;