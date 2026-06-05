import { Navigate, Route, Routes } from "react-router-dom";
import Register from "./auth/register";
import Login from "./auth/login";
import MainOutlet from "./components/outlet/mainOutlet";
import { KanbanBoard } from "./components/board/KanbanBoard";
import Search from "./components/Search"
import WorkspaceInfo from "./components/workspaceInfo";
import Dashboard from "./components/dashboard/Dashboard";
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
          <Route index element={<Dashboard />} />
          <Route path="projects/:projectId" element={<KanbanBoard />} />
          <Route path="/workspace/:workspaceId" element={<WorkspaceInfo />} />
          <Route path="search" element={<Search/>}/>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>)}
    </Routes>
    </>
  )
};
export default App;