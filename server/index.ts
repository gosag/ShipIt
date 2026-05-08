import express from 'express';
import cors from "cors"
import dotenv from "dotenv"
import morgan from "morgan"
import mongoose from "mongoose"
import cookieParser from "cookie-parser"

import * as models from './src/models/index.js'
import authRoutes from './src/routes/authRoutes.js'

dotenv.config()
const app=express()
const PORT= process.env.PORT || 8000
const corsOptions = {
    origin: 'http://localhost:5173',
    methods: 'GET,POST,PUT,DELETE,PATCH',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true,
  };
app.use(cors(corsOptions))
app.use(morgan("dev"))
app.use(express.json());
app.use(cookieParser());

console.log('Models loaded:', Object.keys(models));

// Routes
app.use('/api/auth', authRoutes);

app.get("/",(req,res)=>{
    res.json({message:"Hello from the server!111 hh"})
    console.log("nodemon activated")
})