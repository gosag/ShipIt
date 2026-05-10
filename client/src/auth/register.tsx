import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
const Register=()=>{
    const navigate = useNavigate();
    type FormData = z.infer<typeof schema>;
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
    const onSubmit = async (data: FormData) => {
        const controller= new AbortController();
        try{
            const result= await fetch(`${import.meta.env.VITE_URL}/register`,{
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify(data),
                signal:controller.signal
            })
            const res= await result.json()
            if(!res.ok){
                throw new Error("Something went wrong ")
            }
        }catch(err){
            console.log(err)
        }
        return()=>controller.abort();
    }
    return(
        <div>
            <form onSubmit={handleSubmit(onSubmit)}>
                <input type="email" placeholder="Email" {...register("email")} />
                {errors.email && <p>{errors.email.message}</p>}
                <input type="password" placeholder="Password" {...register("password")} />
                {errors.password && <p>{errors.password.message}</p>}
                <button type="submit">Submit</button>
            </form>
        </div>
    )
};
export default Register;