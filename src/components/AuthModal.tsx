import React, { useState } from 'react';
import { X, Mail, Lock, User, LogIn, UserPlus, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { signUpWithEmail, signInWithEmail, loginWithGoogle } from '../firebase';
import { useStore } from '../context/StoreContext';
import { motion, AnimatePresence } from 'motion/react';

export function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen } = useStore();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setIsAuthModalOpen(false);
    // Reset state
    setError(null);
    setSuccess(null);
    setEmail('');
    setPassword('');
    setDisplayName('');
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await loginWithGoogle();
      setSuccess("Successfully signed in with Google!");
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (err: any) {
      console.error("Google authentication failed:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError("Sign-in popup was closed before completion.");
      } else {
        setError(err.message || "Failed to authenticate with Google.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      if (activeTab === 'signup') {
        if (!displayName.trim()) {
          setError("Please provide a display name.");
          setIsLoading(false);
          return;
        }
        await signUpWithEmail(email, password, displayName);
        setSuccess("Account created successfully! Welcome to Solemate.");
      } else {
        await signInWithEmail(email, password);
        setSuccess("Signed in successfully!");
      }

      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: any) {
      console.error("Email authentication failed:", err);
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError("This email is already registered. Please sign in instead.");
          break;
        case 'auth/invalid-email':
          setError("Invalid email format.");
          break;
        case 'auth/weak-password':
          setError("The password is too weak.");
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError("Incorrect email or password. Please try again.");
          break;
        case 'auth/operation-not-allowed':
          setError("Email and Password sign-in is not enabled. Please enable it in the Firebase console.");
          break;
        default:
          setError(err.message || "An authentication error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden z-10"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
            aria-label="Close authentication modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Branding Header */}
          <div className="p-6 pb-4 border-b border-zinc-100 flex flex-col items-center">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center mb-2 shadow-md shadow-orange-500/20">
              <span className="text-white font-black text-2xl leading-none">S</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900">Welcome to Solemate</h2>
            <p className="text-xs text-zinc-500 mt-1">Nairobi's Premium Sneaker Marketplace</p>
          </div>

          {/* Tab Selection */}
          <div className="flex border-b border-zinc-100 bg-zinc-50/50">
            <button
              onClick={() => { setActiveTab('signin'); setError(null); }}
              className={`flex-1 py-3 text-sm font-semibold tracking-wide border-b-2 transition-all flex items-center justify-center gap-2 ${
                activeTab === 'signin'
                  ? 'border-orange-500 text-orange-500 bg-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab('signup'); setError(null); }}
              className={`flex-1 py-3 text-sm font-semibold tracking-wide border-b-2 transition-all flex items-center justify-center gap-2 ${
                activeTab === 'signup'
                  ? 'border-orange-500 text-orange-500 bg-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Create Account
            </button>
          </div>

          <div className="p-6">
            {/* Success and Error messages */}
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs flex items-start gap-2 border border-red-200 mb-4 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs flex items-start gap-2 border border-emerald-200 mb-4">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{success}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleEmailAction} className="space-y-4">
              {activeTab === 'signup' && (
                <div>
                  <label htmlFor="auth-name" className="block text-xs font-black text-zinc-400 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      id="auth-name"
                      type="text"
                      placeholder="Jane Doe"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      disabled={isLoading}
                      required={activeTab === 'signup'}
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-zinc-800 font-medium"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="auth-email" className="block text-xs font-black text-zinc-400 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    id="auth-email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-zinc-800 font-medium"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="auth-password" className="block text-xs font-black text-zinc-400 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all text-zinc-800 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-orange-500 text-white font-bold text-sm tracking-wide rounded-xl hover:bg-orange-600 focus:ring-4 focus:ring-orange-200 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : activeTab === 'signup' ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Sign Up
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <div className="relative my-6 flex items-center justify-center text-xs text-zinc-400 select-none">
              <div className="absolute inset-x-0 h-px bg-zinc-100" />
              <span className="relative bg-white px-3 font-semibold uppercase tracking-wider">Or</span>
            </div>

            {/* Social Google Login Button */}
            <button
              onClick={handleGoogleLogin}
              type="button"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-white border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-all rounded-xl text-sm font-bold text-zinc-700 flex items-center justify-center gap-3 shadow-sm"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22l.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
