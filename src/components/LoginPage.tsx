import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { Lock as LockIcon, User as UserIcon, Loader2, Calendar, FileText, Calculator } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  onLoginSuccess: (token: string, user: User) => void;
}

export const LoginPage: React.FC<Props> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Lütfen kullanıcı adı ve şifre giriniz.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.login(username, password);
      onLoginSuccess(result.token, result.user);
    } catch (err: any) {
      setError('Kullanıcı adı veya şifre hatalı');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] relative overflow-hidden font-sans">
      {/* Soft Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-400/10 rounded-full blur-[100px] transition-opacity duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}
          style={{ animation: 'float 10s ease-in-out infinite' }}
        ></div>
        <div 
          className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-400/10 rounded-full blur-[100px] transition-opacity duration-1000 delay-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}
          style={{ animation: 'float 12s ease-in-out infinite reverse' }}
        ></div>
      </div>

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] px-6 z-10"
      >
        {/* Login Card */}
        <div className="bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col">
          
          {/* Top Section (Header) */}
          <div className="bg-gradient-to-b from-[#0f172a] to-[#1e293b] pt-14 pb-12 px-8 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Subtle background glow in header */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.1)_0%,transparent_70%)]"></div>

            {/* Logo Area with Floating Animation */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                y: [0, -10, 0] // Floating effect
              }}
              transition={{ 
                scale: { duration: 0.7, delay: 0.2, ease: "easeOut" },
                opacity: { duration: 0.7, delay: 0.2 },
                y: { duration: 4, repeat: Infinity, ease: "easeInOut" }
              }}
              className="relative mb-8 group"
            >
              <div className="absolute inset-0 bg-cyan-400/20 blur-2xl rounded-full animate-pulse"></div>
              
              {/* Main Circle */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-b from-[#1e293b] to-[#0f172a] border-[3px] border-cyan-500/30 flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(6,182,212,0.3)] group-hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] transition-shadow duration-500">
                <div className="relative w-full h-full flex items-center justify-center">
                  <Calendar className="w-10 h-10 text-blue-500 absolute transform -translate-x-2 -translate-y-2" strokeWidth={2.5} />
                  <div className="absolute transform translate-x-3 translate-y-3 bg-[#0f172a] rounded-full p-0.5">
                    <UserIcon className="w-8 h-8 text-emerald-400" strokeWidth={2.5} />
                  </div>
                </div>
              </div>

              {/* Floating Orbiting Icons */}
              <motion.div 
                animate={{ y: [0, 5, 0], x: [0, -2, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-2 -right-2 bg-[#1e293b] p-1.5 rounded-lg border border-cyan-500/20 shadow-lg z-20"
              >
                <FileText className="w-4 h-4 text-cyan-400" />
              </motion.div>

              <motion.div 
                animate={{ y: [0, -5, 0], x: [0, 2, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -bottom-1 -left-2 bg-[#1e293b] p-1.5 rounded-lg border border-cyan-500/20 shadow-lg z-20"
              >
                <Calculator className="w-4 h-4 text-emerald-400" />
              </motion.div>
            </motion.div>

            {/* Brand Text */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-center relative z-10"
            >
              <h1 className="text-6xl font-black tracking-tight mb-3 flex items-center justify-center select-none gap-2">
                <span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]">ik</span>
                <span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">360</span>
              </h1>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.4em] opacity-90">
                YENİ NESİL KOLAY İK SİSTEMİ
              </p>
            </motion.div>
          </div>

          {/* Bottom Section (Form) */}
          <div className="p-8 bg-white">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                className="p-3 bg-red-50 border border-red-100 text-red-500 rounded-xl text-xs font-medium text-center"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username Input */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="space-y-1.5"
              >
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  KULLANICI ADI
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-sm font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal"
                  placeholder="Kullanıcı adınızı yazın"
                  autoComplete="username"
                />
              </motion.div>

              {/* Password Input */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="space-y-1.5"
              >
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  ŞİFRE
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-sm font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal tracking-widest"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </motion.div>

              {/* Remember Me */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="flex items-center pt-1 pb-2"
              >
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center justify-center w-4 h-4">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="peer appearance-none w-4 h-4 border border-slate-300 rounded bg-white checked:bg-brand-500 checked:border-brand-500 transition-colors cursor-pointer"
                    />
                    <svg
                      className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
                      viewBox="0 0 14 10"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M1 5L4.5 8.5L13 1"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span className="text-[13px] font-medium text-slate-600 group-hover:text-slate-800 transition-colors">
                    Beni Hatırla
                  </span>
                </label>
              </motion.div>

              {/* Submit Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#0ea5e9] text-white font-semibold rounded-xl hover:bg-[#0284c7] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none shadow-sm shadow-brand-500/20"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <LockIcon className="w-4 h-4" />
                    <span className="text-sm">Sisteme Giriş Yap</span>
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-8 text-center"
        >
          <p className="text-[10px] font-medium text-slate-400 tracking-widest uppercase">
            © 2026 | ik360 | İNSAN KAYNAKLARI
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};
