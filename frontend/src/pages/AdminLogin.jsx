import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Connect to the Flask backend
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      if (response.data.success) {
        // Store mock token
        localStorage.setItem('adminToken', response.data.token);
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Login Container */}
      <div className="w-full max-w-[480px] bg-white/5 dark:bg-[#1c2127]/80 backdrop-blur-xl border border-slate-200 dark:border-[#3b4754]/50 rounded-xl shadow-2xl p-8 md:p-12 relative z-10">

        {/* Header / Logo Area */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 mb-4">
            <span className="material-symbols-outlined text-white text-3xl">explore</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Admin Portal</h1>
          <p className="text-slate-500 dark:text-[#9dabb9] text-sm mt-2 text-center">AI Indoor Navigation System</p>
        </div>

        {/* Form Fields */}
        <form className="flex flex-col gap-5" onSubmit={handleLogin}>

          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-100 dark:bg-red-900/30 rounded-lg text-center">
              {error}
            </div>
          )}

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Email Address</span>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">mail</span>
              <input
                className="form-input w-full rounded-lg bg-slate-50 dark:bg-[#101922] border border-slate-200 dark:border-[#3b4754] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748b] h-12 pl-11 pr-4 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                placeholder="admin@navsystem.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </label>

          <label className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Password</span>
              <a className="text-xs font-medium text-primary hover:text-blue-400 transition-colors" href="#">Forgot Password?</a>
            </div>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">lock</span>
              <input
                className="form-input w-full rounded-lg bg-slate-50 dark:bg-[#101922] border border-slate-200 dark:border-[#3b4754] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#64748b] h-12 pl-11 pr-12 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex items-center justify-center"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </label>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className={`mt-2 w-full h-12 ${loading ? 'bg-primary/70 cursor-not-allowed' : 'bg-primary hover:bg-blue-600'} text-white font-semibold rounded-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-[0.98] flex items-center justify-center gap-2`}
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            {!loading && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-[#3b4754]/50 flex flex-col items-center gap-4">
          <p className="text-sm text-slate-500 dark:text-[#9dabb9]">
            Don't have an account?
            <a className="font-medium text-primary hover:text-blue-400 transition-colors" href="#"> Request Admin Access</a>
          </p>
        </div>
      </div>

      {/* Decorative Map Graphic Suggestion */}
      <div className="fixed right-0 bottom-0 w-1/3 h-1/3 opacity-[0.03] dark:opacity-[0.05] pointer-events-none -z-10"
        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCRTPkvI6nKX-LZCi5sOLrjY7nU7C5q-swux9LS6rCQKOuwpuxy1wrbBqbGfxoxtN68hZ8v26IDSbN4HmIPbYPPZ1ogxnpanZMiQ675XV3MPM1o5iZDVedXZsD6U2aUMpyL7r9IZJNEgRHvUK_n9oRR-KbCljSLXHAJBT1HZlfJ0LoLlvsiOxAqNm2Y5dKdmY17x5SKgJ-1nX3SjBmCmMFqZ6ErAHJzcdkpA50yOgALwbyo_aSFBbbf1sjmQB8S9oX3dTly9HjYaSDP')", backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "bottom right" }}>
      </div>
    </div>
  );
};

export default AdminLogin;
