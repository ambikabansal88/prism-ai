import React, { useEffect, useState } from "react";
import { X, Sliders, Sun, Moon, Type, Trash2, Download, Volume2, Bot, Sparkles, Globe, Search } from "lucide-react";
import { Settings } from "../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdateSettings: (settings: Settings) => void;
  onClearHistory: () => void;
  onExportTXT: () => void;
  onExportPDF: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onClearHistory,
  onExportTXT,
  onExportPDF,
}: SettingsModalProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const updateVoices = () => {
        setVoices(window.speechSynthesis.getVoices());
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  if (!isOpen) return null;

  const fontSizes = [
    { label: "Small", value: "sm", desc: "14px text" },
    { label: "Normal", value: "base", desc: "16px text" },
    { label: "Large", value: "lg", desc: "18px text" },
    { label: "Extra", value: "xl", desc: "20px text" },
  ];

  const models = [
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Recommended)", desc: "High-speed multimodal intelligence with verified live Google Search grounding" },
    { value: "gemini-3.5-flash", label: "Gemini 3.5 Flash", desc: "Ultra-fast, smart general-purpose model with neural knowledge synthesis" },
    { value: "gemini-3.8-flash", label: "Gemini 3.8 Flash", desc: "Latest high-speed multimodal reasoning engine" },
    { value: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro (Preview)", desc: "Advanced reasoning, coding, & complex tasks" },
  ];

  return (
    <div id="settings-modal" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/75 backdrop-blur-xl transition-all">
      <div className="relative w-full max-w-lg max-h-[90dvh] flex flex-col bg-white dark:bg-[#0B1021]/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-800 dark:text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-slate-200/80 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/20 dark:border-purple-500/30 shrink-0">
              <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-display font-bold text-slate-900 dark:text-white">
                Application Settings
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">Configure AI models, themes, and neural sound</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto flex-1">
          {/* Section: AI Model Settings */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#6C3BFF]" />
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Gemini Model
              </label>
            </div>
            <select
              value={settings.model}
              onChange={(e) => onUpdateSettings({ ...settings, model: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0D17] text-slate-800 dark:text-white font-sans text-xs outline-none focus:border-[#6C3BFF] focus:ring-2 focus:ring-[#6C3BFF]/10 transition-all"
            >
              {models.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-1">
              {models.find((m) => m.value === settings.model)?.desc}
            </p>
          </div>

          {/* Google Search Grounding Setting */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-white dark:bg-[#0B0D17] border border-blue-500/30 flex items-center justify-center shadow-xs">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-semibold text-[#151A2D] dark:text-white">
                    Google Search Grounding
                  </span>
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-300 font-mono font-bold">
                    LIVE
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.useSearchGrounding !== false}
                  onChange={(e) => onUpdateSettings({ ...settings, useSearchGrounding: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4285F4]"></div>
              </label>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Grounds Gemini responses with real-time Google Search data for up-to-date facts, breaking news, sports results, and verified source citations.
            </p>
          </div>

          {/* Temperature Setting */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Creativity (Temperature): {settings.temperature}
              </label>
              <span className="text-[11px] px-2 py-0.5 rounded-lg bg-[#6C3BFF]/10 text-[#6C3BFF] dark:text-[#9B5CFF] font-medium border border-[#6C3BFF]/20">
                {settings.temperature <= 0.3 ? "Precise" : settings.temperature <= 0.7 ? "Balanced" : "Creative"}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.temperature}
              onChange={(e) => onUpdateSettings({ ...settings, temperature: parseFloat(e.target.value) })}
              className="w-full accent-[#6C3BFF] h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 px-1">
              <span>0.0 (Strict / Code)</span>
              <span>0.5 (Default)</span>
              <span>1.0 (Inventive)</span>
            </div>
          </div>

          {/* Theme Settings */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              {settings.theme === "dark" ? <Moon className="w-4 h-4 text-[#9B5CFF]" /> : <Sun className="w-4 h-4 text-amber-500" />}
              Appearance Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, theme: "light" })}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                  settings.theme === "light"
                    ? "border-[#6C3BFF] bg-[#6C3BFF]/10 text-[#6C3BFF] shadow-xs"
                    : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
              >
                <Sun className="w-4 h-4" /> Light Mode
              </button>
              <button
                type="button"
                onClick={() => onUpdateSettings({ ...settings, theme: "dark" })}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                  settings.theme === "dark"
                    ? "border-[#6C3BFF] bg-[#6C3BFF]/20 text-[#9B5CFF] shadow-xs"
                    : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
              >
                <Moon className="w-4 h-4" /> Dark Mode
              </button>
            </div>
          </div>

          {/* Font Size Settings */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Type className="w-4 h-4 text-[#6C3BFF]" />
              Chat Typography Size
            </label>
            <div className="grid grid-cols-4 gap-2">
              {fontSizes.map((size) => (
                <button
                  key={size.value}
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, fontSize: size.value as any })}
                  className={`py-2 text-xs font-medium rounded-xl border transition-all ${
                    settings.fontSize === size.value
                      ? "border-[#6C3BFF] bg-[#6C3BFF]/10 text-[#6C3BFF] dark:text-[#9B5CFF]"
                      : "border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>

          {/* Voice & TTS Settings */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#6C3BFF]" />
              Voice (Text-to-Speech)
            </label>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#0B0D17] border border-slate-200 dark:border-white/5">
                <span className="text-xs text-slate-600 dark:text-slate-400">Speak AI replies automatically</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoSpeak}
                    onChange={(e) => onUpdateSettings({ ...settings, autoSpeak: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#6C3BFF]"></div>
                </label>
              </div>

              {voices.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400">Select Voice</span>
                  <select
                    value={settings.voiceName}
                    onChange={(e) => onUpdateSettings({ ...settings, voiceName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B0D17] text-slate-800 dark:text-white font-sans text-xs outline-none focus:border-[#6C3BFF] transition-all"
                  >
                    <option value="">Default Browser Voice</option>
                    {voices.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <hr className="border-slate-200 dark:border-white/5" />

          {/* Section: Actions & Storage */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Data Management
            </h3>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onExportTXT}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
              >
                <Download className="w-3.5 h-3.5" /> Export TXT
              </button>
              <button
                type="button"
                onClick={onExportPDF}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all"
              >
                <Download className="w-3.5 h-3.5" /> Export PDF
              </button>
              <button
                type="button"
                onClick={onClearHistory}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-xl transition-all ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear All Chats
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-slate-200/80 dark:border-white/5 bg-slate-50/70 dark:bg-[#0B0D17]/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#6C3BFF] hover:bg-[#5922e3] rounded-xl transition-colors shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
