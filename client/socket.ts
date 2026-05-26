import io from 'socket.io-client';
const socket = io("http://localhost:8000");
socket.on("connect",()=>{
    console.log("connected to the server with socket ID:",socket.id);
    socket.emit("first-message","Hello from the client!")
})
export default socket;
