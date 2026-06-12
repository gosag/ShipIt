import mongoose from "mongoose"
import {Schema} from "mongoose"
interface notificationSeen {
    user:mongoose.Types.ObjectId;
    lastReadAt: Date;
};
const notificationSeenSchema= new Schema<notificationSeen>({
    user:{type:Schema.Types.ObjectId, required:true},
    lastReadAt:{type:Date, required:true, default:Date.now()}
})
notificationSeenSchema.index({ user: 1 }, { unique: true });

const NotificationSeen= mongoose.model<notificationSeen>("NotificationSeen", notificationSeenSchema);
export default NotificationSeen;