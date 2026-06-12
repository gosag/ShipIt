import express from 'express';
import cors from "cors"
import dotenv from "dotenv"
import morgan from "morgan"
import cookieParser from "cookie-parser"
import {createServer} from 'http';
import { Server } from 'socket.io';
import authRoutes from './src/routes/authRoutes.js'
import workspaceRouter from './src/routes/workSpaceRoutes.js';
import projectRouter from './src/routes/projectRoutes.js'; 
import cardsRouter from './src/routes/cardsRoutes.js';
import columnRouter from './src/routes/columnRoutes.js';
import messagesRouter from './src/routes/messagesRoutes.js';
import errorMiddleware from './src/middleware/errror.js';
import DbConnect from './config/db.js'; 
import notificationRouter from './src/routes/notificationRotes.js';
import dashboardRouter from './src/routes/dashboardRoutes.js';
import {initializeSockets} from './src/sockets/socketHadler.js';    
dotenv.config()
const app=express()
const PORT= process.env.PORT || 8000;
const allowedOrigins = [
  "http://localhost:5173",
  "https://ship-it-beta.vercel.app",
  "https://shipit.gosagirma.me",
];
const httpServer = createServer(app);
const corsOptions={
    origin: allowedOrigins,
    methods: 'GET,POST,PUT,DELETE,PATCH',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true,
  };
const io = new Server(httpServer, {
    cors: corsOptions
});
initializeSockets(io);
app.use(cors(corsOptions));
app.use(morgan("dev"))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspace', workspaceRouter);
app.use('/api/project', projectRouter);
app.use('/api/column', columnRouter);
app.use('/api', cardsRouter);
app.use('/api/notification', notificationRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/messages', messagesRouter);
app.get("/",(req,res)=>{
    res.json({message:"Hello from the ShipIt Server!"})
    console.log("nodemon activated")
})
app.use(errorMiddleware);
DbConnect().then(() => {
    httpServer.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((error) => {
    console.error("Failed to connect to the database:", error);
    process.exit(1);
});