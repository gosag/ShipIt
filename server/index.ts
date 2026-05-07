import express from 'express';
import cors from "cors"
import dotenv from "dotenv"
import morgan from "morgan"
import mongoose from "mongoose"

import * as models from './src/models/index.js'

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

console.log('Models loaded:', Object.keys(models));

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/team-done')
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT,()=>{
        console.log(`Server is running on port ${PORT}`)
    })
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

app.get("/",(req,res)=>{
    res.json({message:"Hello from the server!111 hh"})
    console.log("nodemon activated")
})