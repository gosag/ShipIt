import { Server, Socket } from "socket.io";

interface OnlineUser {
    userId: string;
    userName: string;
    socketId: string;
}

const workspacePresence = new Map<string, Map<string, OnlineUser>>();

const broadcastOnlineMembers = (io: Server, workspaceId: string) => {
    const members = workspacePresence.get(workspaceId);
    const onlineList = members
        ? Array.from(members.values()).map(({ userId, userName }) => ({ userId, userName }))
        : [];
    io.to(`workspace-${workspaceId}`).emit("online-members", { workspaceId, members: onlineList });
};

export const initializeSockets = (io: Server) => {
    io.on("connection", (socket: Socket) => {
        console.log(`User connected with socket ID: ${socket.id}`);

        let joinedWorkspaces: string[] = [];

        socket.on("first-message", (info) => {
            console.log(info);
        });

        let projectId: string;

        socket.on("project-id", (pId) => {
            console.log("Project ID received:", pId);
            projectId = pId;
            socket.join(projectId);
            socket.to(projectId).emit("user-connected", `A new user has joined project ${projectId}`);
        });

        socket.on("join-workspace", ({ workspaceId, userId, userName }) => {
            if (!workspaceId || !userId) return;

            const room = `workspace-${workspaceId}`;
            socket.join(room);
            if (!joinedWorkspaces.includes(workspaceId)) {
                joinedWorkspaces.push(workspaceId);
            }

            if (!workspacePresence.has(workspaceId)) {
                workspacePresence.set(workspaceId, new Map());
            }
            workspacePresence.get(workspaceId)!.set(socket.id, {
                userId,
                userName: userName || "User",
                socketId: socket.id,
            });

            broadcastOnlineMembers(io, workspaceId);
        });

        socket.on("leave-workspace", ({ workspaceId }) => {
            if (!workspaceId) return;
            socket.leave(`workspace-${workspaceId}`);
            joinedWorkspaces = joinedWorkspaces.filter((id) => id !== workspaceId);

            const members = workspacePresence.get(workspaceId);
            if (members) {
                members.delete(socket.id);
                if (members.size === 0) workspacePresence.delete(workspaceId);
            }
            broadcastOnlineMembers(io, workspaceId);
        });

        socket.on("card-moved", (data) => {
            const { cardId, sourceColumnId, destinationColumnId, cardData, projectId } = data;
            console.log(`Card moved: ${cardId} from ${sourceColumnId} to ${destinationColumnId} in project ${projectId}`);
            socket.to(projectId).emit("cardMoved", { cardId, sourceColumnId, destinationColumnId, cardData });
        });

        socket.on("message-group", (groupId, message) => {
            console.log(`Message to group ${groupId}: ${message}`);
            socket.join(groupId);
            console.log(message);
            socket.to(groupId).emit("groupMessageOnCard", message);
        });

        socket.on("Activity-log", (projectId, activity) => {
            io.to(projectId).emit("newActivityLog", activity);
        });

        socket.on("disconnect", () => {
            console.log(`User with socket ID: ${socket.id} disconnected`);

            for (const workspaceId of joinedWorkspaces) {
                const members = workspacePresence.get(workspaceId);
                if (members?.has(socket.id)) {
                    members.delete(socket.id);
                    if (members.size === 0) workspacePresence.delete(workspaceId);
                    broadcastOnlineMembers(io, workspaceId);
                }
            }
        });
    });
};
