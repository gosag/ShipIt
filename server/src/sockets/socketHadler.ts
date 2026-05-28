import { Server, Socket } from "socket.io";

export const initializeSockets = (io: Server) => {
    io.on("connection", (socket: Socket) => {
        console.log(`User connected with socket ID: ${socket.id}`);

        socket.on("first-message", (info) => {
            console.log(info);
        });

        socket.on("project-id", (projectId) => {
            console.log("Project ID received:", projectId);
            socket.join(projectId);
            socket.to(projectId).emit("user-connected", `A new user has joined project ${projectId}`);
        });

        socket.on("disconnect", () => {
            console.log(`User with socket ID: ${socket.id} disconnected`);
        });
    });
};