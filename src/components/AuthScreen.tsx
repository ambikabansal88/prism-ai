import React, { useState } from "react";
import {
  Sparkles,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { GoogleAuthSetupModal } from "./GoogleAuthSetupModal";

type AuthMode = "login" | "signup" | "forgot" | "reset";

export default function AuthScreen() {
  const {
    login,
    signup,
    loginWithGoogleCredential,
    loginWithGoogleToken,
    loginAsGuest,
    requestPasswordReset,
    resetPassword,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);

  // Show / Hide password toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [generatedCodeHint, setGeneratedCodeHint] = useState<string | null>(null);

  // Clear errors when switching modes
  const switchMode = (newMode: AuthMode) => {
    setError(null);
    setSuccessMsg(null);
    setGeneratedCodeHint(null);
    setMode(newMode);
  };

  // 1. Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await login(email, password);
    if (!res.success) {
      setError(res.error || "Login failed. Please check your credentials.");
      setIsLoading(false);
    }
  };

  // 2. Submit Signup
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name.trim())}`;
    const res = await signup(name, email, password, avatarUrl);
    if (!res.success) {
      setError(res.error || "Signup failed.");
      setIsLoading(false);
    }
  };

  // 3. Google Sign-In
  const handleGoogleClick = async () => {
    setError(null);

    try {
      // Check if valid Google OAuth is configured on server
      const configRes = await fetch("/api/auth/google/config");
      const config = await configRes.json().catch(() => ({ configured: false }));

      if (config.configured && config.clientId) {
        // 1. Try Google Identity Services token client first (supports prompt: select_account)
        if (
          typeof window !== "undefined" &&
          (window as any).google?.accounts?.oauth2
        ) {
          try {
            const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
              client_id: config.clientId,
              scope: "openid email profile",
              prompt: "select_account",
              callback: async (tokenResponse: any) => {
                if (tokenResponse && tokenResponse.access_token) {
                  setIsLoading(true);
                  const res = await loginWithGoogleToken(tokenResponse.access_token);
                  setIsLoading(false);
                  if (!res.success) {
                    setError(res.error || "Google authentication failed.");
                  }
                } else if (tokenResponse?.error) {
                  if (tokenResponse.error === "popup_closed_by_user") {
                    // Closed by user, no error
                  } else {
                    setError(`Google OAuth notice: ${tokenResponse.error_description || tokenResponse.error}`);
                  }
                }
              },
              error_callback: (err: any) => {
                console.warn("GSI error_callback:", err);
                setShowGoogleChooser(true);
              },
            });
            tokenClient.requestAccessToken({ prompt: "select_account" });
            return;
          } catch (gsiErr) {
            console.warn("GSI initTokenClient error:", gsiErr);
          }
        }

        // 2. Fallback to OAuth popup
        const urlRes = await fetch("/api/auth/google/url");
        const urlData = await urlRes.json().catch(() => ({}));
        if (urlData.configured && urlData.url) {
          const authWindow = window.open(
            urlData.url,
            "google_oauth_popup",
            "width=520,height=650,left=200,top=100"
          );
          if (authWindow) {
            return;
          }
        }
      }

      // If Google Client ID not yet configured or popup blocked, open the configuration modal
      setShowGoogleChooser(true);
    } catch (e: any) {
      console.error("Google auth initiation error:", e);
      setShowGoogleChooser(true);
    }
  };

  // 4. Request Password Reset
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your registered email address.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await requestPasswordReset(email);
    setIsLoading(false);

    if (res.success) {
      setSuccessMsg("Reset code generated! Please enter your verification code below.");
      if (res.code) {
        setGeneratedCodeHint(res.code);
        setResetCode(res.code);
      }
      setMode("reset");
    } else {
      setError(res.error || "Failed to process request. Check your email.");
    }
  };

  // 5. Submit Password Reset
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode || !password) {
      setError("Please enter the verification code and new password.");
      return;
    }
    if (password.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await resetPassword(email, resetCode, password);
    setIsLoading(false);

    if (res.success) {
      setSuccessMsg("Password successfully reset! Logging you in...");
    } else {
      setError(res.error || "Reset failed. Verification code may be invalid or expired.");
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#F8FAFD] text-slate-800 font-sans">
      {/* Background ambient mesh gradient layers */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[25%] -left-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#DDD6FE]/60 via-[#FCE7F3]/50 to-transparent blur-[110px] animate-pulse" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-[#BAE6FD]/50 via-[#CCFBF1]/40 to-transparent blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#E0E7FF]/40 blur-[130px]" />
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* Main Glassmorphic Authentication Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md backdrop-blur-2xl bg-white/85 border border-white/95 rounded-3xl p-6 sm:p-8 shadow-[0_14px_45px_-8px_rgba(147,112,219,0.12)]"
      >
        {/* App Logo & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#818CF8] via-[#C084FC] to-[#F472B6] text-white shadow-md shadow-purple-200 mb-3">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div className="text-[11px] font-bold tracking-widest text-purple-600 uppercase mb-1">
            Gemini Chatbot
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {mode === "login" && "Welcome back"}
            {mode === "signup" && "Create your account"}
            {mode === "forgot" && "Reset your password"}
            {mode === "reset" && "Set new password"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {mode === "login" && "Sign in to access your intelligent AI assistant"}
            {mode === "signup" && "Start having intelligent conversations with Gemini"}
            {mode === "forgot" && "Enter your email to receive a verification code"}
            {mode === "reset" && "Enter the verification code and choose a new password"}
          </p>
        </div>

        {/* Feedback Messages */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span className="flex-1">{error}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p>{successMsg}</p>
                {generatedCodeHint && (
                  <p className="mt-1 font-mono font-bold bg-emerald-100 px-2 py-1 rounded inline-block text-emerald-800 text-sm">
                    Verification Code: {generatedCodeHint}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ----------------- LOGIN VIEW ----------------- */}
        {mode === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-purple-50/40 border border-purple-100/80 text-sm text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-purple-300 focus:ring-1 focus:ring-purple-300 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="text-xs text-purple-600 hover:text-purple-700 transition-colors font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-purple-50/40 border border-purple-100/80 text-sm text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-purple-300 focus:ring-1 focus:ring-purple-300 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-tr from-[#818CF8] via-[#C084FC] to-[#F472B6] hover:opacity-95 text-white font-semibold text-sm shadow-[0_4px_16px_rgba(192,132,252,0.35)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white/90 px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider shrink-0">
                Or continue with
              </span>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl border border-purple-100 bg-white/90 hover:bg-purple-50/60 text-slate-700 text-sm font-medium transition-all flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-50 shadow-2xs cursor-pointer"
            >
              {/* Google official colored icon SVG */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </button>

            {/* Quick Guest / Demo Access */}
            <button
              type="button"
              id="guest-login-btn"
              onClick={() => loginAsGuest()}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200/80 hover:border-purple-300/80 bg-slate-50/60 hover:bg-white text-slate-600 hover:text-purple-700 text-xs font-semibold shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>Explore as Guest (Instant Access)</span>
            </button>

            {/* Switch to Signup */}
            <p className="text-center text-xs text-slate-500 pt-2">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className="text-purple-600 hover:text-purple-700 font-semibold transition-colors cursor-pointer"
              >
                Sign up
              </button>
            </p>
          </form>
        )}

        {/* ----------------- SIGNUP VIEW ----------------- */}
        {mode === "signup" && (
          <form onSubmit={handleSignupSubmit} className="space-y-3.5">
            {/* Name Field */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-purple-50/40 border border-purple-100/80 text-sm text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-purple-300 focus:ring-1 focus:ring-purple-300 transition-all"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-purple-50/40 border border-purple-100/80 text-sm text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-purple-300 focus:ring-1 focus:ring-purple-300 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2 rounded-xl bg-purple-50/40 border border-purple-100/80 text-sm text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-purple-300 focus:ring-1 focus:ring-purple-300 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Confirm Password</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2 rounded-xl bg-purple-50/40 border border-purple-100/80 text-sm text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-purple-300 focus:ring-1 focus:ring-purple-300 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 mt-2 rounded-xl bg-gradient-to-tr from-[#818CF8] via-[#C084FC] to-[#F472B6] hover:opacity-95 text-white font-semibold text-sm shadow-[0_4px_16px_rgba(192,132,252,0.35)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl border border-purple-100 bg-white/90 hover:bg-purple-50/60 text-slate-700 text-sm font-medium transition-all flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-50 shadow-2xs cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign up with Google
            </button>

            {/* Switch to Login */}
            <p className="text-center text-xs text-slate-500 pt-2">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="text-purple-600 hover:text-purple-700 font-semibold transition-colors cursor-pointer"
              >
                Log in
              </button>
            </p>

            {/* Quick Guest / Demo Access */}
            <button
              type="button"
              onClick={() => loginAsGuest()}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200/80 hover:border-purple-300/80 bg-slate-50/60 hover:bg-white text-slate-600 hover:text-purple-700 text-xs font-semibold shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>Explore as Guest (Instant Access)</span>
            </button>
          </form>
        )}

        {/* ----------------- FORGOT PASSWORD VIEW ----------------- */}
        {mode === "forgot" && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Account Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-purple-50/40 border border-purple-100/80 text-sm text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-purple-300 focus:ring-1 focus:ring-purple-300 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-tr from-[#818CF8] via-[#C084FC] to-[#F472B6] hover:opacity-95 text-white font-semibold text-sm shadow-[0_4px_16px_rgba(192,132,252,0.35)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sending code...
                </>
              ) : (
                <>
                  Send Verification Code
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => switchMode("login")}
              className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to login
            </button>
          </form>
        )}

        {/* ----------------- RESET PASSWORD VIEW ----------------- */}
        {mode === "reset" && (
          <form onSubmit={handleResetSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">6-Digit Verification Code</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="123456"
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-purple-50/40 border border-purple-100/80 text-sm font-mono tracking-widest text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-purple-300 focus:ring-1 focus:ring-purple-300 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2 rounded-xl bg-purple-50/40 border border-purple-100/80 text-sm text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-purple-300 focus:ring-1 focus:ring-purple-300 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Confirm New Password</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2 rounded-xl bg-purple-50/40 border border-purple-100/80 text-sm text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-purple-300 focus:ring-1 focus:ring-purple-300 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-tr from-[#818CF8] via-[#C084FC] to-[#F472B6] hover:opacity-95 text-white font-semibold text-sm shadow-[0_4px_16px_rgba(192,132,252,0.35)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Updating password...
                </>
              ) : (
                <>
                  Update Password & Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => switchMode("login")}
              className="w-full py-2 text-xs text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Cancel & return to login
            </button>
          </form>
        )}
      </motion.div>

      {/* Google OAuth Setup / Configuration Modal */}
      <GoogleAuthSetupModal
        isOpen={showGoogleChooser}
        onClose={() => setShowGoogleChooser(false)}
        onConfigured={() => {
          setShowGoogleChooser(false);
          handleGoogleClick();
        }}
      />
    </div>
  );
}
