import React, { useRef, useState, useEffect } from "react";
import {
  Send,
  Paperclip,
  Mic,
  MicOff,
  Image as ImageIcon,
  X,
  Sparkles,
  FileText,
  FileCode,
  Zap,
  Camera,
  Loader2,
  Code2,
  PenTool,
  Search,
  ArrowRight,
} from "lucide-react";
import { FileAttachment } from "../types";

interface InputAreaProps {
  onSendMessage: (
    content: string,
    file: FileAttachment | null,
    forceImage?: boolean,
    aspectRatio?: string,
    imageStyle?: string,
    enhanceRealism?: boolean,
    useSearchGrounding?: boolean
  ) => void;
  isGenerating: boolean;
  onSelectPrompt: (prompt: string) => void;
  searchGroundingEnabled?: boolean;
  onToggleSearchGrounding?: (enabled: boolean) => void;
  onOpenSearchEngine?: () => void;
}

export default function InputArea({
  onSendMessage,
  isGenerating,
  onSelectPrompt,
  searchGroundingEnabled = true,
  onToggleSearchGrounding,
  onOpenSearchEngine,
}: InputAreaProps) {
  const [inputValue, setInputValue] = useState("");
  const [attachedFile, setAttachedFile] = useState<FileAttachment | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isImageMode, setIsImageMode] = useState(false);
  const [searchGroundingActive, setSearchGroundingActive] = useState<boolean>(searchGroundingEnabled);
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "16:9" | "9:16" | "4:3">("1:1");
  const [imageStyle, setImageStyle] = useState<"photorealistic" | "cinematic" | "portrait" | "nature" | "artistic">("photorealistic");
  const [enhanceRealism, setEnhanceRealism] = useState<boolean>(true);
  const [dragActive, setDragActive] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setSearchGroundingActive(searchGroundingEnabled);
  }, [searchGroundingEnabled]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";

        rec.onstart = () => {
          setIsRecording(true);
        };

        rec.onresult = (e: any) => {
          const transcript = e.results[0][0].transcript;
          setInputValue((prev) => (prev ? prev + " " + transcript : transcript));
        };

        rec.onend = () => {
          setIsRecording(false);
        };

        rec.onerror = () => {
          setIsRecording(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  const handleSend = () => {
    if ((!inputValue.trim() && !attachedFile) || isGenerating) return;

    onSendMessage(
      inputValue.trim(),
      attachedFile,
      isImageMode,
      aspectRatio,
      imageStyle,
      enhanceRealism,
      searchGroundingActive
    );
    setInputValue("");
    setAttachedFile(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTriggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    const size = file.size;
    const typeStr = file.type;
    const name = file.name;

    let attachmentType: "image" | "pdf" | "text" | "other" = "other";
    if (typeStr.startsWith("image/")) {
      attachmentType = "image";
    } else if (typeStr === "application/pdf") {
      attachmentType = "pdf";
    } else if (
      typeStr.startsWith("text/") ||
      name.endsWith(".txt") ||
      name.endsWith(".log") ||
      name.endsWith(".json")
    ) {
      attachmentType = "text";
    }

    const reader = new FileReader();

    if (attachmentType === "text") {
      reader.onload = (event) => {
        const textContent = event.target?.result as string;
        const base64Data = btoa(unescape(encodeURIComponent(textContent)));
        setAttachedFile({
          name,
          type: "text",
          size,
          base64Data,
          mimeType: "text/plain",
        });
      };
      reader.readAsText(file);
    } else {
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const base64Data = dataUrl.split(",")[1];
        setAttachedFile({
          name,
          type: attachmentType,
          size,
          base64Data,
          mimeType: typeStr || "application/octet-stream",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleVoice = () => {
    if (!recognitionRef.current) {
      setActionNotice("Voice input is not supported in this browser or is restricted.");
      setTimeout(() => setActionNotice(null), 3500);
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const quickActions = [
    {
      label: "Google Search",
      prompt: "Search Google and give me the latest news and live updates on: ",
      icon: Search,
      color: "hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-blue-500/5 text-blue-600 dark:text-blue-400",
      isSearch: true,
    },
    {
      label: "Summarize File",
      prompt: "Please read the attached file and summarize its main findings and points clearly.",
      icon: FileText,
      color: "hover:border-amber-400 dark:hover:border-amber-500/50 hover:bg-amber-500/5",
    },
    {
      label: "Explain Code",
      prompt: "Analyze this code snippet, explain how it works step-by-step, and suggest performance optimizations:\n```\n\n```",
      icon: Code2,
      color: "hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-blue-500/5",
    },
    {
      label: "Write Email",
      prompt: "Draft a concise, professional email proposing a project status update meeting.",
      icon: PenTool,
      color: "hover:border-emerald-400 dark:hover:border-emerald-500/50 hover:bg-emerald-500/5",
    },
    {
      label: "Generate Image",
      prompt: "Generate a vibrant digital artwork of: ",
      icon: ImageIcon,
      color: "hover:border-purple-400 dark:hover:border-purple-500/50 hover:bg-purple-500/5",
    },
  ];

  const handleQuickAction = (action: (typeof quickActions)[0]) => {
    if ((action as any).isSearch) {
      setSearchGroundingActive(true);
      if (onToggleSearchGrounding) onToggleSearchGrounding(true);
      setInputValue(action.prompt);
      textareaRef.current?.focus();
    } else if (action.label === "Generate Image") {
      setIsImageMode(true);
      setInputValue("");
      textareaRef.current?.focus();
    } else if (action.label === "Summarize File" && !attachedFile) {
      setActionNotice("Upload a PDF, TXT or code file first, then click Summarize!");
      setTimeout(() => setActionNotice(null), 3500);
      handleTriggerFileSelect();
    } else {
      setInputValue(action.prompt);
      textareaRef.current?.focus();
    }
  };

  return (
    <div className="p-2 sm:p-3 md:p-4 md:px-8 border-t border-purple-100/60 dark:border-white/10 bg-white/70 dark:bg-[#0F1424]/90 backdrop-blur-2xl shrink-0 space-y-2 transition-colors">
      {/* Notice Banner */}
      {actionNotice && (
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] sm:text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between shadow-xs animate-in fade-in">
          <span>{actionNotice}</span>
          <button
            onClick={() => setActionNotice(null)}
            className="text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 font-bold ml-2 text-sm leading-none cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Quick Action Chips with Aurora Glassmorphic Style */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-0.5 max-w-3xl mx-auto px-0.5">
        {quickActions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <button
              key={idx}
              onClick={() => handleQuickAction(action)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-white/90 dark:border-white/10 bg-white/85 dark:bg-[#151C2F]/85 text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-purple-700 dark:hover:text-purple-300 hover:border-purple-300 dark:hover:border-purple-500/50 hover:bg-purple-50/70 dark:hover:bg-purple-900/30 hover:scale-105 active:scale-95 transition-all shadow-xs backdrop-blur-md shrink-0 cursor-pointer"
            >
              <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
              <span className="whitespace-nowrap">{action.label}</span>
            </button>
          );
        })}
      </div>

      <div
        className="max-w-3xl mx-auto relative font-sans"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,application/pdf,text/*,.log,.json,.ts,.js,.py"
          className="hidden"
        />

        {/* Drag and Drop Zone Overlay */}
        {dragActive && (
          <div className="absolute inset-0 bg-purple-500/10 border-2 border-dashed border-purple-400 rounded-3xl z-20 flex items-center justify-center backdrop-blur-md transition-all pointer-events-none">
            <div className="text-center space-y-1.5 p-4 rounded-2xl bg-white/95 shadow-xl border border-purple-200">
              <Zap className="w-7 h-7 text-purple-600 animate-bounce mx-auto" />
              <p className="text-xs font-bold text-slate-900">Drop file to attach instantly</p>
              <p className="text-[10px] text-slate-500">PDF, TXT, code, or images supported</p>
            </div>
          </div>
        )}

        {/* File Attachment Card with Glassmorphism */}
        {attachedFile && (
          <div className="flex items-center justify-between p-2.5 mb-2.5 rounded-2xl bg-white/90 dark:bg-[#151C2F]/95 border border-purple-100 dark:border-white/10 shadow-sm backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3 min-w-0">
              {attachedFile.type === "image" ? (
                <div className="w-11 h-11 rounded-xl overflow-hidden border border-purple-100 dark:border-white/10 shrink-0 bg-slate-100 dark:bg-slate-800">
                  <img
                    src={`data:${attachedFile.mimeType};base64,${attachedFile.base64Data}`}
                    alt="attached preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : attachedFile.type === "pdf" ? (
                <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/40">
                  <FileText className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-900/40">
                  <FileCode className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate max-w-xs">
                  {attachedFile.name}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  <span className="font-mono font-medium text-purple-600 dark:text-purple-400 uppercase">
                    {attachedFile.type}
                  </span>
                  <span>•</span>
                  <span>{(attachedFile.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setAttachedFile(null)}
              className="p-1.5 rounded-xl hover:bg-purple-50 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Remove attachment"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Gemini Photorealistic Image Generator Bar */}
        {isImageMode && (
          <div className="flex flex-col gap-2.5 p-3.5 mb-2.5 rounded-2xl bg-white/95 dark:bg-[#151C2F]/95 border border-purple-200/80 dark:border-purple-500/30 text-xs shadow-md backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between border-b border-purple-100 dark:border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xs">
                  <Camera className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-semibold text-purple-900 dark:text-purple-200">
                    Photorealistic Image Generator
                  </span>
                  <span className="text-[11px] text-purple-600 dark:text-purple-400 ml-1.5 hidden sm:inline">
                    • 8K optics & neural diffusion
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEnhanceRealism(!enhanceRealism)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                    enhanceRealism
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xs"
                      : "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 hover:bg-purple-100 dark:hover:bg-purple-900/40"
                  }`}
                  title="Toggle automatic camera optics and natural lighting enhancement"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{enhanceRealism ? "Optics On" : "Optics Off"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsImageMode(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  title="Close Image Generator"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1 shrink-0">
                  Style:
                </span>
                {[
                  { id: "photorealistic", label: "📸 8K Photo" },
                  { id: "cinematic", label: "🎬 Cinematic" },
                  { id: "portrait", label: "👤 Portrait" },
                  { id: "nature", label: "🌄 Nature" },
                  { id: "artistic", label: "🎨 Digital Art" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setImageStyle(s.id as any)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      imageStyle === s.id
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xs"
                        : "bg-purple-50/80 dark:bg-[#1A2238] text-slate-600 dark:text-slate-300 hover:bg-purple-100/80 dark:hover:bg-[#232D4B] border border-purple-100/60 dark:border-white/10"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">
                  Ratio:
                </span>
                {(["1:1", "16:9", "9:16", "4:3"] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                      aspectRatio === ratio
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xs"
                        : "bg-purple-50/80 dark:bg-[#1A2238] text-slate-600 dark:text-slate-300 hover:bg-purple-100/80 dark:hover:bg-[#232D4B] border border-purple-100/60 dark:border-white/10"
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Live Audio Recording Wave Indicator */}
        {isRecording && (
          <div className="mb-2.5 p-2.5 rounded-2xl bg-rose-50/90 border border-rose-200 flex items-center justify-between animate-in fade-in backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 h-5 px-1">
                <span className="w-1 bg-pink-500 rounded-full sound-wave-1" />
                <span className="w-1 bg-rose-500 rounded-full sound-wave-2" />
                <span className="w-1 bg-purple-500 rounded-full sound-wave-3" />
                <span className="w-1 bg-pink-500 rounded-full sound-wave-1" />
                <span className="w-1 bg-rose-500 rounded-full sound-wave-2" />
              </div>
              <span className="text-xs font-semibold text-rose-700">
                Prism Voice: Listening... Speak naturally
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleVoice}
              className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:opacity-90 text-white text-[11px] font-semibold transition-opacity shadow-xs cursor-pointer"
            >
              Stop
            </button>
          </div>
        )}

        {/* Live Search Engine Active Status Bar */}
        {searchGroundingActive && (
          <div className="flex items-center justify-between px-3.5 py-1.5 mb-2 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/40 text-[11px] text-blue-800 dark:text-blue-300 backdrop-blur-md animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="font-semibold">Real-Time Search Grounding ON</span>
              <span className="text-blue-600/80 dark:text-blue-400/80 hidden sm:inline">
                — Verified live Google Search citations active
              </span>
            </div>
            {onOpenSearchEngine && (
              <button
                type="button"
                onClick={onOpenSearchEngine}
                className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer hover:underline"
              >
                <span>Open Search Portal</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Main Floating Input Container with Aurora Glassmorphism */}
        <div className="relative flex items-end gap-1 sm:gap-2 p-1.5 sm:p-2.5 rounded-[22px] sm:rounded-[26px] bg-white/85 dark:bg-[#151C2F]/90 backdrop-blur-2xl border border-white/95 dark:border-white/10 shadow-[0_4px_30px_rgba(147,112,219,0.08)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)] focus-within:border-purple-300 dark:focus-within:border-purple-500/60 focus-within:shadow-[0_0_25px_rgba(192,132,252,0.2)] transition-all">
          {/* File Attachment Pin */}
          <button
            onClick={handleTriggerFileSelect}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center hover:bg-purple-50/80 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
            title="Attach file (PDF, TXT, code, or image)"
            aria-label="Attach file"
          >
            <Paperclip className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          {/* Google Search Grounding Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !searchGroundingActive;
              setSearchGroundingActive(next);
              if (onToggleSearchGrounding) onToggleSearchGrounding(next);
            }}
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
              searchGroundingActive
                ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 ring-1 ring-blue-300 dark:ring-blue-500/50 shadow-xs scale-105"
                : "hover:bg-purple-50/80 dark:hover:bg-white/10 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 opacity-70 hover:opacity-100 hover:scale-105 active:scale-95"
            }`}
            title={
              searchGroundingActive
                ? "Google Search Grounding: ACTIVE (Live Web Data & Citations)"
                : "Google Search Grounding: OFF (Click to enable)"
            }
            aria-label="Toggle Google Search Grounding"
          >
            <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" viewBox="0 0 24 24">
              <path
                fill={searchGroundingActive ? "#4285F4" : "currentColor"}
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill={searchGroundingActive ? "#34A853" : "currentColor"}
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill={searchGroundingActive ? "#FBBC05" : "currentColor"}
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill={searchGroundingActive ? "#EA4335" : "currentColor"}
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          </button>

          {/* Image Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsImageMode(!isImageMode)}
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
              isImageMode
                ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 ring-1 ring-purple-300 dark:ring-purple-500/50 shadow-xs scale-105"
                : "hover:bg-purple-50/80 dark:hover:bg-white/10 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:scale-105 active:scale-95"
            }`}
            title={isImageMode ? "Exit Image Generator" : "Image Generator Mode"}
            aria-label="Toggle Image Generator"
          >
            <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          {/* Auto-growing Text Area */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording
                ? "Listening... Speak clearly"
                : isImageMode
                ? "Describe the image to generate..."
                : searchGroundingActive
                ? "Ask with Google Search grounding..."
                : "Ask anything, or drop files..."
            }
            className="flex-1 min-w-0 max-h-[160px] sm:max-h-[180px] resize-none py-1.5 sm:py-2 px-1 text-xs sm:text-sm leading-relaxed bg-transparent border-0 outline-none focus:ring-0 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-sans"
            disabled={isRecording}
          />

          {/* Voice Input Button with Pulsing Microphone Animation */}
          <button
            onClick={handleToggleVoice}
            className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
              isRecording
                ? "bg-gradient-to-tr from-pink-400 via-rose-400 to-purple-400 text-white mic-pulse-aurora shadow-[0_0_20px_rgba(244,114,182,0.6)]"
                : "hover:bg-purple-50/80 dark:hover:bg-white/10 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:scale-105 active:scale-95"
            }`}
            title={isRecording ? "Stop listening" : "Voice input"}
            aria-label="Toggle Voice Input"
          >
            {isRecording ? <MicOff className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> : <Mic className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
          </button>

          {/* Send Button with Smooth Pastel Gradient and Subtle Hover Animation */}
          <button
            onClick={handleSend}
            disabled={(!inputValue.trim() && !attachedFile) || isGenerating}
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
              (!inputValue.trim() && !attachedFile) || isGenerating
                ? "bg-purple-50 dark:bg-white/5 text-purple-300 dark:text-slate-600 cursor-not-allowed border border-purple-100/60 dark:border-white/5"
                : "bg-gradient-to-tr from-[#818CF8] via-[#C084FC] to-[#F472B6] hover:opacity-95 hover:scale-105 active:scale-95 text-white shadow-[0_4px_18px_rgba(192,132,252,0.4)]"
            }`}
            title="Send Message"
            aria-label="Send Message"
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
          </button>
        </div>

        {/* Small Helper hint */}
        <p className="text-[9px] sm:text-[10px] text-center text-slate-400 dark:text-slate-500 mt-1 sm:mt-2 select-none">
          Supports multi-line with <span className="font-semibold text-slate-500 dark:text-slate-400">Shift + Enter</span>. Drop files to attach.
        </p>
      </div>
    </div>
  );
}
