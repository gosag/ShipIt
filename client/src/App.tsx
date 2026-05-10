import { Route, Routes } from "react-router-dom";
import Register from "./auth/register";
const App=()=>{
  return(
    <>
    <Routes>
      <Route index element={<Register/>} />
    </Routes>
    </>
  )
};
export default App;