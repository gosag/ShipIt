import { Navigate, Route, Routes } from "react-router-dom";
import Register from "./auth/register";
import Login from "./auth/login";
import MainOutlet from "./components/outlet/mainOutlet";
const App=()=>{
  const savedToken=!!localStorage.getItem("accessToken")
  return(
    <>
    <Routes>
      {!savedToken?
      (<Route>
          <Route index element={<Register />} />
          <Route path="login" element={<Login />} />
          <Route path="*" element={<Navigate to="/" replace />} />
      </Route>):
      (<Route>
        <Route path="/" element={<MainOutlet />}>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>)}
    </Routes>
    </>
  )
};
export default App;