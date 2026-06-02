import { Server, Socket } from "socket.io";

export const initializeSockets = (io: Server) => {
    io.on("connection", (socket: Socket) => {
        console.log(`User connected with socket ID: ${socket.id}`);

        socket.on("first-message", (info) => {
            console.log(info);
        });
        let projectId;
        socket.on("project-id", (pId) => {
            console.log("Project ID received:", pId);
            projectId=pId;
            socket.join(projectId);
            socket.to(projectId).emit("user-connected", `A new user has joined project ${projectId}`);
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
        socket.on("disconnect", () => {
            console.log(`User with socket ID: ${socket.id} disconnected`);
        });
    });
};