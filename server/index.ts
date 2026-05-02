import express from 'express';
import cors from "cors"
import dotenv from "dotenv"
import morgan from "morgan"
dotenv.config()
const app=express()
const PORT= process.env.PORT || 8000
const corsOptions = {
    origin: 'http://localhost:5173',
    methods: 'GET,POST,PUT,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true,
  };
app.use(cors(corsOptions))
app.use(morgan("dev"))
app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`)
})
app.get("/",(req,res)=>{
    res.json({message:"Hello from the server!"})
    console.log("nodemon activated")
})