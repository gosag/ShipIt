import mongoose from "mongoose"
const DbConnect=async ()=>{
    const MONGO_URI=process.env.MONGO_URI;
    try{
        if(!MONGO_URI){
            throw new Error("MongoDb URi is not found ")
        }
        await mongoose.connect(MONGO_URI)
        console.log("MongoDB connected successfully")

    }catch(err){
        throw new Error(`${err}`)
    }
 }
export default DbConnect;