import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"; 
import { api } from "../axios";
import { useState } from "react";
import axios from "axios";
  import { Mail, Lock, User, Plus, ShieldCheck, Zap } from "lucide-react";
const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  profilePicture: z.string().url("Invalid image URL").optional()
});

type FormData = z.infer<typeof schema>;

const Register = () => {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema)
    });
    
    const [profilePictureUrl, setProfilePictureUrl] = useState<string>("");
    const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

    const onSubmit = async (data: FormData) => {
        const controller = new AbortController();
        try {
            const payload = {
                ...data,
                avatar: profilePictureUrl || undefined
            };
            
            const res = await api.post(`/api/auth/register`, payload, { signal: controller.signal });
            const responseData = res.data;
            localStorage.setItem("accessToken", responseData.accessToken);
            localStorage.setItem("userProfile", responseData.user.avatar || "");
            window.location.href = "/";
        } catch (err: any) {
            console.error("Registration failed:", err);
           alert(err ? err.response?.data?.message || err.message : "Error regis...")
        }
        return () => controller.abort();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingImage(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "shipit_avatar");

        try {
            const response = await axios.post("https://api.cloudinary.com/v1_1/dhxvrjcoc/image/upload", formData);
            setProfilePictureUrl(response.data.secure_url);
        } catch (error: any) {
            console.error("Failed to upload image:", error.response?.data);
            alert("Failed to upload image. Please try again.");
        } finally {
            setIsUploadingImage(false);
        }
    };
    const handleGoogleLogin = () => {
        window.location.href = `${import.meta.env.VITE_API_BASE_URL}/api/auth/google`;
    }
  

return (
  <div className="relative min-h-screen overflow-hidden flex items-center justify-center p-8 font-sans"
    style={{ background: '#0A0A0A' }}>

    {/* Glows */}
    <div className="absolute pointer-events-none"
      style={{ top: -80, left: '50%', transform: 'translateX(-50%)', width: 600, height: 300,
        background: 'radial-gradient(ellipse, rgba(99,76,210,0.18) 0%, transparent 70%)' }} />
    <div className="absolute pointer-events-none"
      style={{ bottom: -100, right: -50, width: 400, height: 300,
        background: 'radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 70%)' }} />

    <div className="relative z-10 w-full max-w-md">

      <div className="flex items-center justify-center gap-2.5 mb-8">
        <div className="flex items-center justify-center w-8.5 h-8.5 rounded-[9px]"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #9F6EF3)' }}>
          <Zap size={16} color="white" strokeWidth={2.5} />
        </div>
        <p className="text-xl font-bold tracking-tight text-white">
          Ship<span className="text-purple-400">It</span>
        </p>
      </div>

      {/* Card */}
      <div className="relative overflow-hidden rounded-[20px] p-8"
        style={{ background: '#111115', border: '1px solid rgba(255,255,255,0.07)' }}>

        {/* Top shine line */}
        <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.3), transparent)' }} />

        {/* Header */}
        <div className="mb-7">
          <h2 className="text-[22px] font-bold tracking-[-0.03em] mb-1.5" style={{ color: '#F4F4F5' }}>
            Create an account
          </h2>
          <p className="text-[13.5px]" style={{ color: '#71717A' }}>
            Start building your next big thing
          </p>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2.5 rounded-[10px] px-4 py-2.75 text-sm font-medium transition-all mb-5"
          style={{ background: '#1C1C20', border: '1px solid rgba(255,255,255,0.1)', color: '#D4D4D8' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#222228'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#1C1C20'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign up with Google
        </button>

        <div className="flex items-center gap-2.5 mb-5">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
          <span className="text-xs whitespace-nowrap" style={{ color: '#52525B' }}>or sign up with email</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <div className="flex items-center gap-4 p-3 rounded-xl"
            style={{ background: '#0D0D10', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="relative shrink-0 group cursor-pointer">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center overflow-hidden transition-all
                ${errors.profilePicture ? 'ring-2 ring-red-500/50' : 'ring-1 ring-white/10 group-hover:ring-purple-500/40'}`}
                style={{ background: '#1A1A1F' }}>
                {isUploadingImage ? (
                  <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                ) : profilePictureUrl ? (
                  <img src={profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={20} className="group-hover:text-purple-400 transition-colors" style={{ color: '#52525B' }} />
                )}
              </div>
              {!isUploadingImage && (
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: '#7C3AED', border: '1.5px solid #111115' }}>
                  <Plus size={10} color="white" strokeWidth={3} />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                onChange={handleFileChange}
                disabled={isUploadingImage}
              />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: '#D4D4D8' }}>
                {isUploadingImage ? 'Uploading…' : profilePictureUrl ? 'Photo uploaded' : 'Profile photo'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#52525B' }}>
                {profilePictureUrl ? 'Click to change' : 'Optional · JPG, PNG up to 5MB'}
              </p>
            </div>
          </div>
          {errors.profilePicture && (
            <p className="text-xs text-red-500 -mt-2">{errors.profilePicture.message}</p>
          )}

          
          <div>
            <label htmlFor="name" className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5"
              style={{ color: '#71717A' }}>Full Name</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex" style={{ color: '#52525B' }}>
                <User size={16} />
              </span>
              <input
                id="name"
                type="text"
                placeholder="John Doe"
                autoComplete="name"
                className="w-full rounded-[10px] pl-10 pr-4 py-2.75 text-sm text-white outline-none transition-all"
                style={{
                  background: '#0D0D10',
                  border: errors.name ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: errors.name ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none',
                }}
                onFocus={e => !errors.name && (e.currentTarget.style.border = '1px solid rgba(139,92,246,0.6)', e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)')}
                onBlur={e => !errors.name && (e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)', e.currentTarget.style.boxShadow = 'none')}
                {...register("name")}
              />
            </div>
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5"
              style={{ color: '#71717A' }}>Email</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex" style={{ color: '#52525B' }}>
                <Mail size={16} />
              </span>
              <input
                id="email"
                type="email"
                placeholder="name@company.com"
                autoComplete="email"
                className="w-full rounded-[10px] pl-10 pr-4 py-2.75 text-sm text-white outline-none transition-all"
                style={{
                  background: '#0D0D10',
                  border: errors.email ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: errors.email ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none',
                }}
                onFocus={e => !errors.email && (e.currentTarget.style.border = '1px solid rgba(139,92,246,0.6)', e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)')}
                onBlur={e => !errors.email && (e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)', e.currentTarget.style.boxShadow = 'none')}
                {...register("email")}
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5"
              style={{ color: '#71717A' }}>Password</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex" style={{ color: '#52525B' }}>
                <Lock size={16} />
              </span>
              <input
                id="password"
                type="password"
                placeholder="Create a strong password"
                autoComplete="new-password"
                className="w-full rounded-[10px] pl-10 pr-4 py-2.75 text-sm text-white outline-none transition-all"
                style={{
                  background: '#0D0D10',
                  border: errors.password ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: errors.password ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none',
                }}
                onFocus={e => !errors.password && (e.currentTarget.style.border = '1px solid rgba(139,92,246,0.6)', e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)')}
                onBlur={e => !errors.password && (e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)', e.currentTarget.style.boxShadow = 'none')}
                {...register("password")}
              />
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isUploadingImage}
            className="relative w-full overflow-hidden rounded-[10px] py-3 text-sm font-semibold tracking-[-0.01em] transition-all active:scale-[0.99] disabled:opacity-55 disabled:cursor-not-allowed mt-1"
            style={{ background: '#fff', color: '#09090B' }}
            onMouseEnter={e => { if (!isSubmitting && !isUploadingImage) e.currentTarget.style.background = '#E4E4E7'; }}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            <span className="absolute inset-y-0 pointer-events-none"
              style={{
                width: '60%', left: '-100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                animation: 'shimmer 2.5s ease-in-out infinite 1s',
              }} />
            <style>{`@keyframes shimmer { 0% { left: -100% } 40%, 100% { left: 150% } }`}</style>
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="mt-6 pt-5 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="text-[13.5px]" style={{ color: '#52525B' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-medium transition-colors" style={{ color: '#D4D4D8' }}
              onMouseEnter={e => e.currentTarget.style.color = '#A78BFA'}
              onMouseLeave={e => e.currentTarget.style.color = '#D4D4D8'}>
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-4">
        <ShieldCheck size={13} color="#3F3F46" />
        <span className="text-[11.5px]" style={{ color: '#3F3F46' }}>
          256-bit SSL encrypted · Your data is safe
        </span>
      </div>

    </div>
  </div>
);
};

export default Register;