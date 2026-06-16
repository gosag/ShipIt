import io from 'socket.io-client';
const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const socket = io(VITE_API_BASE_URL);
socket.on("connect",()=>{
    console.log("connected to the server with socket ID:",socket.id);
    socket.emit("first-message","Hello from the client!")
})
socket.on("disconnect",()=>{
    console.log("disconnected from the server");
});

export default socket;
