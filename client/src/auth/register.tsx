import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"; 
import { api } from "../axios";
const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

const Register = () => {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema)
    });

    const onSubmit = async (data: FormData) => {
        const controller = new AbortController();
        try{
            // Sending to correct URL
            const res = await api.post(`/api/auth/register`, data, { signal: controller.signal })
            const responseData = res.data;

            if(!responseData.accessToken){
                throw new Error(responseData.message || "Something went wrong")
            }
            localStorage.setItem("accessToken", responseData.accessToken);
            window.location.href = "/";
        }catch(err){
            console.log(err)
            alert(err instanceof Error ? err.message : "Error registering");
        }
        return () => controller.abort();
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6 relative overflow-hidden font-sans text-white">
            {/* Ambient Background Glow matching 'Premium/Linear' aesthetic */}
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-200 h-100 bg-indigo-500/15 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="w-full max-w-100 relative z-10">
                {/* Clean minimalist logo block matching shipIt logo */}
                <div className="flex justify-center mb-10">
                    <div className="flex items-center">
                        <img src="/logo.png" alt="ShipIt Logo" className="h-12 w-auto object-contain" />
                    </div>
                </div>

                <div className="bg-[#111113] border border-white/5 p-8 rounded-2xl shadow-2xl backdrop-blur-xl">
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-bold mb-2 tracking-tight text-white/90">Create an account</h2>
                        <p className="text-[#A1A1AA] text-sm hidden sm:block">
                            Start building your next big thing
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-[#81818B] uppercase tracking-wider block" htmlFor="name">
                                Full Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                placeholder="John Doe"
                                autoComplete="name"
                                className={`w-full bg-[#0A0A0A] border ${errors.name ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-indigo-500/80'} rounded-lg px-4 py-3 text-sm text-white placeholder-[#52525B] focus:outline-none focus:ring-1 ${errors.name ? 'focus:ring-red-500' : 'focus:ring-indigo-500/50'} transition-all`}
                                {...register("name")}
                            />
                            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-[#81818B] uppercase tracking-wider block" htmlFor="email">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="name@company.com"
                                autoComplete="email"
                                className={`w-full bg-[#0A0A0A] border ${errors.email ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-indigo-500/80'} rounded-lg px-4 py-3 text-sm text-white placeholder-[#52525B] focus:outline-none focus:ring-1 ${errors.email ? 'focus:ring-red-500' : 'focus:ring-indigo-500/50'} transition-all`}
                                {...register("email")}
                            />
                            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-[#81818B] uppercase tracking-wider block" htmlFor="password">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                placeholder="Create a strong password"
                                autoComplete="new-password"
                                className={`w-full bg-[#0A0A0A] border ${errors.password ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-indigo-500/80'} rounded-lg px-4 py-3 text-sm text-white placeholder-[#52525B] focus:outline-none focus:ring-1 ${errors.password ? 'focus:ring-red-500' : 'focus:ring-indigo-500/50'} transition-all`}
                                {...register("password")}
                            />
                            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-white text-black hover:bg-[#E4E4E7] font-semibold rounded-lg px-4 py-3 text-sm shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4 active:scale-[0.98]"
                        >
                            {isSubmitting ? "Creating account..." : "Sign Up"}
                        </button>
                    </form>

                    <div className="mt-8 text-center border-t border-white/5 pt-6">
                        <p className="text-sm text-[#71717A]">
                            Already have an account?{" "}
                            <Link to="/login" className="text-white hover:text-indigo-400 transition-colors font-medium">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;