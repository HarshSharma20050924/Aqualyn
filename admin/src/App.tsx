import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import AdminDashboardScreen from './AdminDashboardScreen';
import { ADMIN_ENDPOINTS } from './config/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      fetch(ADMIN_ENDPOINTS.STATS, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (res.ok) setIsAuthenticated(true);
          else localStorage.removeItem('adminToken');
        })
        .catch(() => localStorage.removeItem('adminToken'))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    setError('');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    if (isSetupMode && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = isSetupMode ? ADMIN_ENDPOINTS.SETUP : ADMIN_ENDPOINTS.LOGIN;
      const payload = isSetupMode ? { email, password, name } : { email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem('adminToken', data.token);
        setIsAuthenticated(true);
      } else if (response.status === 403) {
        setError('An admin already exists. Please use the Login form.');
        setIsSetupMode(false);
      } else {
        setError(data.error || 'Authentication failed.');
      }
    } catch (err) {
      setError('Network error. Is the backend running on port 5000?');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080c10]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-8 h-8 text-[#4d8eff]" />
        </motion.div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="App">
        <AdminDashboardScreen onBack={handleLogout} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center liquid-bg px-4 py-8 relative overflow-hidden"
    >
      <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-secondary-fixed/20 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] -right-[5%] w-[40%] h-[40%] rounded-full bg-primary-container/20 blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[420px] flex flex-col items-center">
        <AnimatePresence mode="wait">
          {/* Error banner */}
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 font-semibold text-sm text-center backdrop-blur-md"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          key={isSetupMode ? 'setup' : 'login'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full glass-card border border-white/30 rounded-[2.5rem] p-8 sm:p-10 inner-glow shadow-2xl"
        >
          {/* Logo + title */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-secondary/20 to-primary-container/20 flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-secondary" />
            </div>
            <h1 className="font-headline text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-primary to-secondary text-center">
              {isSetupMode ? 'Setup Admin' : 'Admin Portal'}
            </h1>
            <p className="text-on-surface-variant text-sm mt-1 font-medium text-center">
              {isSetupMode ? 'Create your admin account' : 'Aqualyn System Console'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {/* Name (setup only) */}
            <AnimatePresence>
              {isSetupMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2">
                    <label className="font-label text-sm font-semibold text-on-surface-variant ml-1">
                      Admin Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. System Admin"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full h-14 bg-white/40 border-outline-variant/20 border rounded-2xl px-4 py-3.5 focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all outline-none placeholder:text-on-surface-variant/50 font-body text-on-surface shadow-inner"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div className="space-y-2">
              <label className="font-label text-sm font-semibold text-on-surface-variant ml-1">
                Email Address
              </label>
              <div className="relative group">
                <input
                  type="email"
                  placeholder="admin@aqualyn.app"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full h-14 bg-white/40 border-outline-variant/20 border rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all outline-none placeholder:text-on-surface-variant/50 font-body text-on-surface shadow-inner"
                  autoFocus
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within:text-secondary transition-colors" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="font-label text-sm font-semibold text-on-surface-variant ml-1">
                Password
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  minLength={6}
                  required
                  className="w-full h-14 bg-white/40 border-outline-variant/20 border rounded-2xl pl-12 pr-12 py-3.5 focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-all outline-none placeholder:text-on-surface-variant/50 font-body text-on-surface shadow-inner"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within:text-secondary transition-colors" />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 bg-gradient-to-br from-secondary to-primary-container text-white font-headline font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span>{isSetupMode ? 'Create Admin Account' : 'Sign In'}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Toggle setup/login */}
          <p className="text-sm text-center text-on-surface-variant/70 mt-6 font-medium">
            {isSetupMode ? 'Already have an admin account?' : 'First time setup?'}
            <button
              type="button"
              onClick={() => { setIsSetupMode(v => !v); setError(''); }}
              className="text-secondary font-bold ml-1.5 hover:text-primary transition-colors"
            >
              {isSetupMode ? 'Login here' : 'Create Admin'}
            </button>
          </p>
        </motion.div>

        {/* Footer badge */}
        <div className="fixed bottom-0 left-0 p-6 sm:p-8 flex items-center gap-3 pointer-events-none z-0">
          <div className="w-3 h-3 rounded-full bg-secondary-fixed shadow-[0_0_10px_#0bfbff] animate-pulse" />
          <span className="text-[10px] font-bold tracking-[0.2em] text-on-surface-variant uppercase">
            Aqualyn Secure Console
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default App;
