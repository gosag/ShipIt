import express from 'express';
import cors from "cors"
import dotenv from "dotenv"
import morgan from "morgan"
import cookieParser from "cookie-parser"
import {createServer} from 'http';
import { Server } from 'socket.io';
import * as models from './src/models/index.js'
import authRoutes from './src/routes/authRoutes.js'
import workspaceRouter from './src/routes/workSpaceRoutes.js';
import projectRouter from './src/routes/projectRoutes.js'; 
import cardsRouter from './src/routes/cardsRoutes.js';
import columnRouter from './src/routes/columnRoutes.js';
import errorMiddleware from './src/middleware/errror.js';
import DbConnect from './config/db.js'; 
dotenv.config()
const app=express()
const PORT= process.env.PORT || 8000;
const httpServer = createServer(app);
const corsOptions={
    origin: 'http://localhost:5173',
    methods: 'GET,POST,PUT,DELETE,PATCH',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true,
  };
const io = new Server(httpServer, {
    cors: corsOptions
});
io.on("connection", (socket) => {
    console.log(`User connected with socket ID: ${socket.id}`);
    socket.on("first-message",(info)=>{
        console.log(info)
    })
    socket.on("disconnect", () => {
        console.log(`User with socket ID: ${socket.id} disconnected`);
    });
});
app.use(cors(corsOptions));
app.use(morgan("dev"))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

console.log('Models loaded:', Object.keys(models));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspace', workspaceRouter);
app.use('/api/project', projectRouter);
app.use('/api/column', columnRouter);
app.use('/api', cardsRouter);
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