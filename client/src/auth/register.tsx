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
    return (
        <div className="flex min-h-screen font-sans bg-white">
            {/* Left Section - Hero/Brand (Hidden on Mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-indigo-900 items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 opacity-90 mix-blend-multiply"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] opacity-30 mix-blend-overlay bg-cover bg-center"></div>
                
                {/* Decorative glowing blobs */}
                <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500 rounded-full mix-blend-screen filter blur-[80px] opacity-70 animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500 rounded-full mix-blend-screen filter blur-[100px] opacity-60"></div>
                
                <div className="relative z-10 text-center px-12 text-white max-w-2xl">
                    <div className="mx-auto mb-8 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h1 className="text-5xl font-extrabold tracking-tight mb-6">
                        Unlock Your Potential.
                    </h1>
                    <p className="text-xl text-indigo-100 mb-10 leading-relaxed font-light">
                        Join thousands of professionals changing the way they work. Experience a platform built for speed, reliability, and beautiful design.
                    </p>
                    <div className="flex items-center justify-center gap-4 bg-black/20 w-max mx-auto py-3 px-6 rounded-full backdrop-blur-md border border-white/10">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map((i) => (
                                <img key={i} className="w-10 h-10 rounded-full border-2 border-indigo-500 object-cover" src={`https://i.pravatar.cc/100?img=${i + 15}`} alt="User" />
                            ))}
                        </div>
                        <span className="text-sm font-medium tracking-wide">Join 10,000+ amazing users</span>
                    </div>
                </div>
            </div>

            {/* Right Section - Registration Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-white relative">
                {/* Mobile-only background accent */}
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-50 to-white lg:hidden -z-10"></div>
                
                <div className="w-full max-w-md mx-auto">
                    <div className="mb-10 lg:mb-12">
                        {/* Mobile Icon */}
                        <div className="lg:hidden inline-flex items-center justify-center w-14 h-14 rounded-xl bg-indigo-600 shadow-lg mb-6">
                             <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl mb-3">Create an account</h2>
                        <p className="text-base text-gray-500 font-medium">
                            Already have an account?{' '}
                            <a href="#" className="text-indigo-600 hover:text-indigo-500 transition-colors">
                                Sign in here
                            </a>
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        <div className="space-y-1.5 group">
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 transition-colors group-focus-within:text-indigo-600">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className={`h-5 w-5 ${errors.email ? 'text-red-400' : 'text-gray-400 group-focus-within:text-indigo-500'} transition-colors duration-200`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="name@company.com"
                                    className={`pl-11 block w-full px-4 py-3.5 bg-gray-50/50 border ${errors.email ? 'border-red-300 ring-4 ring-red-50 focus:border-red-500 focus:ring-red-100 bg-red-50/50' : 'border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 hover:border-gray-300'} rounded-xl text-gray-900 placeholder-gray-400 shadow-sm sm:text-sm transition-all duration-200 outline-none`}
                                    {...register("email")}
                                />
                            </div>
                            {errors.email && <p className="text-sm text-red-500 mt-1.5 font-medium">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-1.5 group">
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 transition-colors group-focus-within:text-indigo-600">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className={`h-5 w-5 ${errors.password ? 'text-red-400' : 'text-gray-400 group-focus-within:text-indigo-500'} transition-colors duration-200`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="Create a strong password"
                                    className={`pl-11 block w-full px-4 py-3.5 bg-gray-50/50 border ${errors.password ? 'border-red-300 ring-4 ring-red-50 focus:border-red-500 focus:ring-red-100 bg-red-50/50' : 'border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 hover:border-gray-300'} rounded-xl text-gray-900 placeholder-gray-400 shadow-sm sm:text-sm transition-all duration-200 outline-none`}
                                    {...register("password")}
                                />
                            </div>
                            {errors.password && <p className="text-sm text-red-500 mt-1.5 font-medium">{errors.password.message}</p>}
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                className="w-full flex justify-center items-center gap-2 py-4 px-6 border border-transparent rounded-xl shadow-lg shadow-indigo-200 text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 active:scale-[0.98] transition-all duration-200 ease-in-out"
                            >
                                Create Account
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="mt-8 text-center text-sm text-gray-500 font-medium">
                            By creating an account, you agree to our{' '}
                            <a href="#" className="text-indigo-600 hover:text-indigo-800 transition-colors">Terms</a>{' '}
                            and{' '}
                            <a href="#" className="text-indigo-600 hover:text-indigo-800 transition-colors">Privacy</a>.
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
export default Register;