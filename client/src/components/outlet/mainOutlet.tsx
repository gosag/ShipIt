import { Outlet } from "react-router-dom";
const MainOutlet = ()=>{
    return(
        <div>
            <aside>
                hey
            </aside>
            <main>
                <Outlet/>
            </main>
        </div>
    )
}