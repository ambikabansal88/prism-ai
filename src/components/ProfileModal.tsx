import React, { useState, useEffect } from "react";
import {
  X,
  User as UserIcon,
  Mail,
  Lock,
  Camera,
  Check,
  AlertCircle,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../context/AuthContext";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Felix",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Luna",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Cyber",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Nova",
];

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Sync state whenever modal opens or user identity changes
  useEffect(() => {
    if (user && isOpen) {
      setName(user.name || "");
      setEmail(user.email || "");
      setAvatarUrl(user.avatarUrl || "");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setError(null);
      setSuccess(null);
    }
  }, [user?.id, user?.name, user?.email, user?.avatarUrl, isOpen]);

  if (!isOpen || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError("Name cannot be empty.");
      return;
    }
    if (!email.trim()) {
      setError("Email cannot be empty.");
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        setError("New password must be at least 6 characters long.");
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setError("New passwords do not match.");
        return;
      }
      if (user.provider === "local" && !currentPassword) {
        setError("Please enter your current password to set a new password.");
        return;
      }
    }

    setIsUpdating(true);

    const updatePayload: any = {
      name: name.trim(),
      email: email.trim(),
      avatarUrl: avatarUrl.trim(),
    };

    if (newPassword) {
      updatePayload.newPassword = newPassword;
      updatePayload.currentPassword = currentPassword;
    }

    const res = await updateProfile(updatePayload);
    setIsUpdating(false);

    if (res.success) {
      setSuccess("Profile updated successfully!");
      // Immediately reflect saved values in the local input fields
      setName(updatePayload.name);
      setEmail(updatePayload.email);
      if (updatePayload.avatarUrl) {
        setAvatarUrl(updatePayload.avatarUrl);
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } else {
      setError(res.error || "Failed to update profile.");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-lg max-h-[90dvh] flex flex-col bg-white dark:bg-[#0B1021]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-7 text-slate-800 dark:text-white my-auto overflow-y-auto"
        >
          {/* Glowing Prism accent header line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#38BDF8] via-[#A855F7] to-[#EC4899]" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 sm:top-5 right-3.5 sm:right-5 p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-2xl bg-[#6C3BFF]/10 text-[#6C3BFF] dark:text-[#9B5CFF]">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white">My Profile</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage your account identity and credentials
              </p>
            </div>
          </div>

          {/* Feedback alerts */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            {/* Avatar Section */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-400">
                Avatar Image
              </label>

              <div className="flex items-center gap-4">
                <img
                  src={avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`}
                  alt="Avatar"
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-[#6C3BFF]/40 shadow-sm bg-slate-800"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`;
                  }}
                />

                <div className="flex-1 space-y-1.5">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Choose a preset avatar:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {AVATAR_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatarUrl(preset)}
                        className={`w-7 h-7 rounded-xl overflow-hidden border-2 transition-all ${
                          avatarUrl === preset
                            ? "border-[#6C3BFF] scale-105 shadow-xs"
                            : "border-transparent opacity-75 hover:opacity-100"
                        }`}
                      >
                        <img src={preset} alt="preset" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Custom Avatar URL input */}
              <div className="mt-2">
                <input
                  type="url"
                  placeholder="Or paste custom image URL..."
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0B0D17] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 outline-none focus:border-[#6C3BFF] focus:ring-2 focus:ring-[#6C3BFF]/10 transition-all font-sans"
                />
              </div>
            </div>

            {/* Name & Email Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0B0D17] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 outline-none focus:border-[#6C3BFF] focus:ring-2 focus:ring-[#6C3BFF]/10 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0B0D17] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 outline-none focus:border-[#6C3BFF] focus:ring-2 focus:ring-[#6C3BFF]/10 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Provider indicator */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0D17] border border-slate-200 dark:border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#6C3BFF]" />
                <span className="text-slate-500 dark:text-slate-400">Account Type:</span>
              </div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                {user.provider === "google" ? "Google Connected" : "Email Account"}
              </span>
            </div>

            {/* Change Password Collapsible Section */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B0D17] border border-slate-200 dark:border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold tracking-wide uppercase text-slate-600 dark:text-slate-300">
                <KeyRound className="w-4 h-4 text-[#6C3BFF]" />
                <span>Change Password</span>
                <span className="text-[10px] font-normal text-slate-400 lowercase">(optional)</span>
              </div>

              {/* Current Password (if local provider) */}
              {user.provider === "local" && (
                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-1.5 pr-9 text-xs rounded-xl bg-white dark:bg-[#121624] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 outline-none focus:border-[#6C3BFF]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* New Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-1.5 pr-9 text-xs rounded-xl bg-white dark:bg-[#121624] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 outline-none focus:border-[#6C3BFF]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-slate-600 dark:text-slate-400">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repeat new password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full px-3 py-1.5 pr-9 text-xs rounded-xl bg-white dark:bg-[#121624] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 outline-none focus:border-[#6C3BFF]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="py-2 px-5 rounded-xl bg-gradient-to-r from-[#6C3BFF] via-[#9B5CFF] to-[#4F8CFF] hover:opacity-95 text-white text-xs font-semibold shadow-md shadow-[#6C3BFF]/25 active:scale-98 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
