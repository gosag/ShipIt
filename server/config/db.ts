import mongoose from "mongoose"
const mongoDb=async ()=>{
    const MONGO_URI=process.env.MONGO_URI;
    try{
        if(!MONGO_URI){
            throw new Error("MongoDb URi is not found ")
        }
        await mongoose.connect(MONGO_URI)

    }catch(err){
        throw new Error(`${err}`)
    }
 }
export default mongoDb;