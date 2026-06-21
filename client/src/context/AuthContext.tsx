import {createContext, useContext, useState} from "react";
interface AuthContextInterface{
    isLoggedIn:boolean,
    setIsLoggedIn:(token:boolean)=>void
}
const AuthContext= createContext<AuthContextInterface | undefined>(undefined)
export const AuthProvider:React.FC<{children:React.ReactNode}>=({children})=>{
    const [isLoggedIn,setIsLoggedIn]= useState(!!localStorage.getItem("AccessToken"))
   return(
        <AuthContext.Provider value={{isLoggedIn, setIsLoggedIn}}>
            {children}
        </AuthContext.Provider>
   )
}
const useAuth=()=>{
    const context= useContext(AuthContext)
    if(!context){
        throw new Error("useAuth must be used within a AuthProvider")
    }
    return context
}
export default useAuth
