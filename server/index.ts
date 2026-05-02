import express from 'express';
import cors from "cors"
import dotenv from "dotenv"
import morgan from "morgan"
dotenv.config()
const app=express()
const PORT= process.env.PORT || 8000
app.use(cors())
app.use(morgan("dev"))
app.listen(PORT,()=>{
    console.log("Server is started")
})
app.get("/",(req,res)=>{
    res.json({message:"TeamDone's endpoint"})
})