import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../src/models/User.js";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "fallback-client-id";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "fallback-client-secret";
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "fallback-callback-url";
try{
passport.use( new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL,
}, async(accessToken, refreshToken, profile: { id: string; displayName: string; emails?: { value: string }[], photos?: { value: string }[] } | undefined, done: (error: any, user?: any) => void) => {
    try{
        const googleId = profile?.id;
        const email = profile?.emails?.[0]?.value;
        const displayName = profile?.displayName;
        const avatar = profile?.photos?.[0]?.value;

        // Guard: email is essential
        if (!email || !googleId) {
            return done(new Error("Google profile is missing email or ID"), undefined);
        }
        let user = await User.findOne({ googleId})
        if(!user){
            user = await User.findOne({ email });
            if(user){
                user.googleId = googleId;
                await user.save();
            }else{
                const username= `${email.split('@')[0]}${Math.floor(Math.random() * 10000)}`;
                user = new User({
                    googleId,
                    name:displayName,
                    username,
                    email: email,
                    avatar,
                })
                await user.save();
            }
        }
        done(null, user);
    } catch (error) {
        done(error as Error, undefined);
    }

}))}catch(error){
    console.error("Error initializing Google Strategy:", error);
}


