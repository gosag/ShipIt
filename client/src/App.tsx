import { Route, Routes } from "react-router-dom";
import Register from "./auth/register";
import Login from "./auth/login";
const App=()=>{
  return(
    <>
    <Routes>
      <Route index element={<Register/>} />
      <Route path="/login" element={<Login/>} />
    </Routes>
    </>
  )
};
export default App;