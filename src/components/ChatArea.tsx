import React, { useRef, useEffect, useState, useMemo } from "react";
import {
  Bot,
  User as UserIcon,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  Trash2,
  Edit2,
  Download,
  ExternalLink,
  X,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Camera,
  FileText,
  FileCode,
  ArrowDown,
  ThumbsUp,
  ThumbsDown,
  Code2,
  Search,
  Wand2,
  PenTool,
  Globe,
} from "lucide-react";
import Markdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import { Message, Settings } from "../types";

interface ChatAreaProps {
  messages: Message[];
  settings: Settings;
  onCopyText: (text: string) => void;
  onEditMessage: (id: string, newContent: string) => void;
  onDeleteMessage: (id: string) => void;
  onRegenerateMessage: (id: string) => void;
  isGenerating: boolean;
  onRetry: () => void;
  apiError: string | null;
  isOnline: boolean;
  suggestedPrompts: string[];
  onSelectPrompt: (prompt: string) => void;
}

export default function ChatArea({
  messages,
  settings,
  onCopyText,
  onEditMessage,
  onDeleteMessage,
  onRegenerateMessage,
  isGenerating,
  onRetry,
  apiError,
  isOnline,
  suggestedPrompts,
  onSelectPrompt,
}: ChatAreaProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [previewImage, setPreviewImage] = useState<{ url: string; title?: string } | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [ttsNotice, setTtsNotice] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<{ [id: string]: "up" | "down" }>({});
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);

  // Progressive thinking messages
  const thinkingStates = useMemo(
    () => [
      "Analyzing prompt...",
      "Searching reasoning pathways...",
      "Composing intelligent response...",
    ],
    []
  );

  useEffect(() => {
    if (!isGenerating) {
      setThinkingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setThinkingStep((prev) => (prev + 1) % thinkingStates.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [isGenerating, thinkingStates.length]);

  // Track scroll position to toggle scroll-to-bottom floating button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceFromBottom > 160);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto scroll to bottom when messages or generation changes
  useEffect(() => {
    if (!showScrollBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isGenerating, showScrollBottom]);

  // ESC key handler to dismiss lightbox preview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPreviewImage(null);
      }
    };
    if (previewImage) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewImage]);

  // Copy helper
  const handleCopy = (id: string, text: string) => {
    onCopyText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Edit Message
  const handleStartEdit = (msg: Message) => {
    setEditingId(msg.id);
    setEditContent(msg.content);
  };

  const handleSaveEdit = (id: string) => {
    if (editContent.trim()) {
      onEditMessage(id, editContent.trim());
    }
    setEditingId(null);
  };

  // Text-To-Speech
  const handleToggleSpeak = (msgId: string, text: string) => {
    try {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        setTtsNotice("Text-to-speech is not supported in this browser.");
        setTimeout(() => setTtsNotice(null), 3000);
        return;
      }

      if (speakingMessageId === msgId) {
        window.speechSynthesis.cancel();
        setSpeakingMessageId(null);
        return;
      }

      window.speechSynthesis.cancel();

      // Strip markdown characters for cleaner audio
      const cleanText = text
        .replace(/[*_#`~[\]()]/g, "")
        .replace(/https?:\/\/\S+/g, "link")
        .trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);

      if (settings.voiceName) {
        const voices = window.speechSynthesis.getVoices();
        const matched = voices.find((v) => v.name === settings.voiceName);
        if (matched) utterance.voice = matched;
      }

      utterance.onend = () => setSpeakingMessageId(null);
      utterance.onerror = () => setSpeakingMessageId(null);

      setSpeakingMessageId(msgId);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis playback error:", e);
      setSpeakingMessageId(null);
    }
  };

  // Feedback reaction
  const handleFeedback = (msgId: string, type: "up" | "down") => {
    setFeedbackGiven((prev) => ({ ...prev, [msgId]: type }));
    setTtsNotice(type === "up" ? "Thank you for your feedback!" : "Feedback recorded. We'll improve this.");
    setTimeout(() => setTtsNotice(null), 2500);
  };

  // Image Download Helper
  const handleDownloadImage = async (imageUrl: string, filename?: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = (filename || "gemini-generated-image") + ".png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      try {
        window.open(imageUrl, "_blank");
      } catch {
        // Ignored
      }
    }
  };

  const getFontSizeClass = () => {
    switch (settings.fontSize) {
      case "sm":
        return "text-[11px] sm:text-xs";
      case "lg":
        return "text-sm sm:text-base";
      case "xl":
        return "text-base sm:text-lg";
      default:
        return "text-xs sm:text-sm";
    }
  };

  // Suggestion cards data (cinematic tools removed; focus on core chat intelligence)
  const suggestionCards = [
    {
      id: "search",
      title: "Live Google Search",
      desc: "Real-time facts, breaking news, sports, & citations",
      icon: Globe,
      prompt: "Search Google and tell me the latest news and discoveries in space exploration this week.",
      accent: "from-blue-600 via-indigo-600 to-cyan-500",
    },
    {
      id: "write",
      title: "Write & Draft",
      desc: "Draft a polished email, essay, or executive summary",
      icon: PenTool,
      prompt: "Draft a professional yet friendly email explaining a brief project timeline adjustment to key stakeholders.",
      accent: "from-purple-500 to-indigo-600",
    },
    {
      id: "code",
      title: "Debug & Code",
      desc: "Debug, explain, or refactor TypeScript & Python code",
      icon: Code2,
      prompt: "Explain how React concurrent rendering works and show an example of optimizing a sluggish list using useTransition.",
      accent: "from-blue-500 to-cyan-600",
    },
    {
      id: "analyze",
      title: "Analyze & Research",
      desc: "Analyze documents, compare concepts, or summarize notes",
      icon: Search,
      prompt: "Summarize the architectural differences between vector search in pgvector versus dedicated vector databases like Pinecone.",
      accent: "from-emerald-500 to-teal-600",
    },
    {
      id: "create",
      title: "Create & Imagine",
      desc: "Generate creative imagery, concepts, or storyboards",
      icon: Wand2,
      prompt: "Generate an image of a futuristic floating hydroponic greenhouse overlooking a neon cyberpunk city at dusk.",
      accent: "from-violet-500 to-fuchsia-600",
    },
  ];

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-4 sm:px-4 sm:py-6 md:px-8 space-y-4 sm:space-y-6 select-text scroll-smooth min-h-0 w-full"
    >
      {/* Offline Status Warning Bar */}
      {!isOnline && (
        <div className="max-w-3xl mx-auto p-2.5 sm:p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>You appear to be offline. Responses may fail until connectivity returns.</span>
          </div>
        </div>
      )}

      {/* Hero / Empty Chat Screen with Aurora Glass Theme */}
      {messages.length === 0 && (
        <div className="max-w-3xl mx-auto my-auto min-h-[55vh] sm:min-h-[65vh] flex flex-col items-center justify-center text-center px-2 sm:px-4 py-4 sm:py-8 animate-in fade-in zoom-in-95 duration-300">
          {/* Animated Aurora Glass Orb */}
          <div className="relative mb-4 sm:mb-6 flex items-center justify-center">
            {/* Diffuse pastel multi-color glowing aura */}
            <div className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-[#C4B5FD] via-[#FBCFE8] to-[#BFDBFE] opacity-60 dark:opacity-20 filter blur-3xl animate-pulse pointer-events-none" />

            {/* Futuristic layered orb sphere */}
            <div className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl p-[1.5px] bg-gradient-to-tr from-[#93C5FD] via-[#C084FC] to-[#F472B6] shadow-[0_8px_30px_rgba(192,132,252,0.3)] flex items-center justify-center animate-gentle-float">
              <div className="w-full h-full rounded-[14px] sm:rounded-[22px] bg-white/95 dark:bg-[#151C2F]/95 backdrop-blur-xl flex items-center justify-center relative overflow-hidden border border-white/90 dark:border-white/10">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100/40 dark:from-purple-900/20 via-transparent to-pink-100/40 dark:to-pink-900/20" />
                <Sparkles className="w-6 h-6 sm:w-9 sm:h-9 text-purple-600 dark:text-purple-400 animate-pulse relative z-10" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <h1 className="font-display font-extrabold text-xl sm:text-3xl md:text-4xl text-slate-900 dark:text-slate-100 tracking-tight mb-2 sm:mb-3">
            What will we explore today?
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed mb-5 sm:mb-8">
            Harnessing multimodal neural intelligence with live Google search grounding, visual synthesis, and accelerated reasoning.
          </p>

          {/* Interactive Suggestion Cards with Aurora Glassmorphism */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5 w-full max-w-2xl text-left">
            {suggestionCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  onClick={() => onSelectPrompt(card.prompt)}
                  className="group relative p-3 sm:p-4 rounded-xl sm:rounded-2xl glass-aurora-card dark:bg-[#151C2F]/80 dark:border-white/10 hover:-translate-y-0.5 text-left cursor-pointer border border-white/90 shadow-[0_4px_20px_rgba(147,112,219,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
                >
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <div
                      className={`p-2 sm:p-2.5 rounded-xl bg-gradient-to-tr ${card.accent} text-white shadow-md shadow-purple-300/40 group-hover:scale-105 transition-transform shrink-0`}
                    >
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
                        {card.title}
                      </h3>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 leading-snug">
                        {card.desc}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages Feed with Smooth Animations */}
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 w-full">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          const isSpeaking = speakingMessageId === msg.id;
          const feedback = feedbackGiven[msg.id];

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`flex gap-2 sm:gap-3.5 ${isUser ? "flex-row-reverse" : "flex-row"} group items-start`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-7 h-7 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                  isUser
                    ? "bg-gradient-to-tr from-[#818CF8] via-[#A855F7] to-[#F472B6] text-white shadow-md shadow-purple-200/60 dark:shadow-purple-900/40"
                    : "bg-white dark:bg-[#151C2F] border border-purple-200/80 dark:border-purple-500/30 text-purple-600 dark:text-purple-400 shadow-sm shadow-purple-100 dark:shadow-none"
                }`}
              >
                {isUser ? (
                  <UserIcon className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                ) : (
                  <div className="relative flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-teal-400 shadow-[0_0_6px_rgba(45,212,191,0.8)]" />
                  </div>
                )}
              </div>

              {/* Message Content Bubble Container */}
              <div className={`flex flex-col space-y-1 sm:space-y-1.5 max-w-[88%] xs:max-w-[84%] sm:max-w-[80%] min-w-0 ${isUser ? "items-end" : "items-start"}`}>
                {/* Sender Tag and Timestamp */}
                <div className="flex items-center gap-1.5 sm:gap-2 px-1 text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-sans">
                  <span className={`font-semibold ${isUser ? "text-purple-700 dark:text-purple-300" : "text-slate-700 dark:text-slate-300"}`}>
                    {isUser ? "You" : "Prism AI"}
                  </span>
                  <span>•</span>
                  <span>{msg.timestamp || "Just now"}</span>
                </div>

                {/* Bubble Body with Aurora Glassmorphism */}
                <div
                  className={`rounded-2xl sm:rounded-[22px] p-3 sm:p-4 md:p-5 transition-all max-w-full overflow-hidden ${
                    isUser
                      ? "bg-gradient-to-br from-[#818CF8] via-[#A855F7] to-[#F472B6] text-white rounded-tr-sm shadow-[0_8px_25px_-6px_rgba(168,85,247,0.35)] border border-white/30 backdrop-blur-xl"
                      : "bg-white/90 dark:bg-[#151C2F]/90 backdrop-blur-2xl border border-white/95 dark:border-white/10 text-slate-800 dark:text-slate-100 rounded-tl-sm shadow-[0_4px_25px_rgba(147,112,219,0.05)] dark:shadow-[0_4px_25px_rgba(0,0,0,0.4)]"
                  }`}
                >
                  {/* File Attachment in Message */}
                  {msg.file && (
                    <div className="mb-3 p-2.5 rounded-2xl bg-black/10 dark:bg-white/5 border border-white/10 flex items-center gap-2.5 max-w-sm">
                      {msg.file.imageUrl ? (
                        <img
                          src={msg.file.imageUrl}
                          alt="attached preview"
                          className="w-12 h-12 rounded-xl object-cover cursor-pointer hover:opacity-90"
                          onClick={() =>
                            setPreviewImage({
                              url: msg.file?.imageUrl || "",
                              title: msg.file?.name,
                            })
                          }
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0 text-xs">
                        <p className="font-medium truncate">{msg.file.name}</p>
                        <p className="text-[10px] opacity-75">
                          {(msg.file.size / 1024).toFixed(1)} KB • {msg.file.type.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Generated Image Showcase Card */}
                  {msg.generatedImageUrl && (
                    <div className="mb-4 rounded-2xl overflow-hidden border border-purple-200/50 dark:border-purple-800/40 bg-purple-500/5 shadow-md">
                      <div className="relative group/img cursor-pointer" onClick={() => setPreviewImage({ url: msg.generatedImageUrl!, title: msg.generatedImagePrompt })}>
                        <img
                          src={msg.generatedImageUrl}
                          alt={msg.generatedImagePrompt || "Gemini Generated"}
                          className="w-full h-auto max-h-[440px] object-cover transition-transform group-hover/img:scale-[1.01]"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white text-xs font-semibold">
                          <span className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-sm flex items-center gap-1.5">
                            <ExternalLink className="w-3.5 h-3.5" /> Full Size
                          </span>
                        </div>
                      </div>
                      <div className="p-3 bg-white/60 dark:bg-[#121624]/60 border-t border-purple-100 dark:border-purple-900/30 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 italic truncate max-w-xs">
                          {msg.generatedImagePrompt}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleDownloadImage(msg.generatedImageUrl!, msg.generatedImagePrompt)}
                            className="px-2.5 py-1 rounded-lg bg-[#6C3BFF] hover:bg-[#5922e3] text-white flex items-center gap-1.5 text-[11px] font-semibold transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Editing inline state for user message */}
                  {editingId === msg.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 text-[#151A2D] dark:text-white text-xs outline-none ring-2 ring-[#6C3BFF] resize-none"
                        rows={3}
                      />
                      <div className="flex justify-end gap-2 text-xs">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 rounded-lg hover:bg-black/10 text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(msg.id)}
                          className="px-3 py-1 rounded-lg bg-white text-[#6C3BFF] font-semibold"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Markdown Body */
                    <div
                      className={`markdown-body break-words prose dark:prose-invert prose-purple max-w-none ${getFontSizeClass()} ${
                        isUser ? "text-white prose-headings:text-white prose-p:text-white prose-a:text-white underline" : ""
                      }`}
                    >
                      <Markdown
                        components={{
                          code({ className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || "");
                            const isInline = !className;
                            return !isInline && match ? (
                              <div className="my-2 sm:my-3 rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-900 text-slate-100 font-mono shadow-sm max-w-full">
                                <div className="bg-slate-950/90 px-3 sm:px-4 py-1.5 sm:py-2 flex justify-between items-center text-[11px] sm:text-xs text-slate-400 border-b border-white/5">
                                  <span className="font-semibold text-purple-400 truncate max-w-[120px] sm:max-w-none">{match[1].toUpperCase()}</span>
                                  <button
                                    onClick={() => handleCopy(msg.id, String(children))}
                                    className="p-1 rounded-lg hover:bg-slate-800 flex items-center gap-1 sm:gap-1.5 transition-colors text-slate-300 cursor-pointer"
                                  >
                                    {copiedId === msg.id ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                        <span className="text-[10px] sm:text-[11px] text-emerald-400 font-medium">Copied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span className="text-[10px] sm:text-[11px]">Copy Code</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                                <pre className="p-3 sm:p-4 overflow-x-auto text-[11px] sm:text-xs font-mono text-slate-200 max-w-full">
                                  <code>{children}</code>
                                </pre>
                              </div>
                            ) : (
                              <code
                                className={`px-1.5 py-0.5 rounded-md font-mono text-[11px] sm:text-xs break-all ${
                                  isUser
                                    ? "bg-white/20 text-white"
                                    : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                                }`}
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          },
                        }}
                      >
                        {msg.content}
                      </Markdown>
                    </div>
                  )}

                  {/* Google Search Grounding Sources & Queries */}
                  {!isUser && msg.searchGrounding && (
                    <div className="mt-4 pt-3.5 border-t border-slate-200/70 dark:border-white/10 space-y-3">
                      {/* Grounding Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                          <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                            </svg>
                          </div>
                          <span>Google Search Sources</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium border border-blue-500/20">
                            Live Grounded
                          </span>
                        </div>
                        {msg.searchGrounding.sources && msg.searchGrounding.sources.length > 0 && (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            {msg.searchGrounding.sources.length} citation{msg.searchGrounding.sources.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      {/* Search Queries Executed */}
                      {msg.searchGrounding.queries && msg.searchGrounding.queries.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <Search className="w-3 h-3 text-blue-500" /> Queries:
                          </span>
                          {msg.searchGrounding.queries.map((q, idx) => (
                            <a
                              key={idx}
                              href={`https://www.google.com/search?q=${encodeURIComponent(q)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[11px] font-medium border border-blue-200/60 dark:border-blue-800/40 transition-colors"
                              title="Search on Google"
                            >
                              <span>"{q}"</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Sources Grid */}
                      {msg.searchGrounding.sources && msg.searchGrounding.sources.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {msg.searchGrounding.sources.map((source, sIdx) => (
                            <a
                              key={sIdx}
                              href={source.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50/80 dark:bg-[#0B0D17]/80 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 border border-slate-200/70 dark:border-white/5 hover:border-blue-300/60 dark:hover:border-blue-700/50 transition-all group/src text-left"
                            >
                              <div className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-white/10 shadow-2xs overflow-hidden">
                                {source.domain ? (
                                  <img
                                    src={`https://www.google.com/s2/favicons?domain=${source.domain}&sz=32`}
                                    alt=""
                                    className="w-3.5 h-3.5 object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <Globe className="w-3 h-3 text-blue-500" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200 group-hover/src:text-blue-600 dark:group-hover/src:text-blue-400 line-clamp-1">
                                  {source.title || source.domain || "Web Source"}
                                </p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                  {source.domain || source.uri}
                                </p>
                              </div>
                              <ExternalLink className="w-3 h-3 text-slate-400 group-hover/src:text-blue-500 opacity-0 group-hover/src:opacity-100 transition-opacity shrink-0" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Message Hover Actions Bar */}
                <div
                  className={`flex flex-wrap items-center gap-0.5 sm:gap-1 px-1 text-slate-400 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <button
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="p-1.5 rounded-lg hover:bg-purple-100/60 dark:hover:bg-white/10 text-slate-400 dark:text-slate-400 hover:text-purple-700 dark:hover:text-purple-300 hover:scale-105 active:scale-95 transition-all"
                    title="Copy message"
                    aria-label="Copy message"
                  >
                    {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => handleToggleSpeak(msg.id, msg.content)}
                    className={`p-1.5 rounded-lg hover:bg-purple-100/60 dark:hover:bg-white/10 hover:scale-105 active:scale-95 transition-all ${
                      isSpeaking
                        ? "text-purple-700 dark:text-purple-300 bg-purple-100/80 dark:bg-purple-950/60 ring-1 ring-purple-300 dark:ring-purple-500/50 shadow-xs"
                        : "text-slate-400 dark:text-slate-400 hover:text-purple-700 dark:hover:text-purple-300"
                    }`}
                    title={isSpeaking ? "Stop Speaking" : "Read Aloud"}
                    aria-label={isSpeaking ? "Stop Speaking" : "Read Aloud"}
                  >
                    {isSpeaking ? (
                      <div className="flex items-center gap-0.5 h-3.5 px-0.5">
                        <span className="w-0.5 bg-gradient-to-t from-purple-500 to-pink-500 sound-wave-1 rounded-full" />
                        <span className="w-0.5 bg-gradient-to-t from-purple-500 to-pink-500 sound-wave-2 rounded-full" />
                        <span className="w-0.5 bg-gradient-to-t from-purple-500 to-pink-500 sound-wave-3 rounded-full" />
                      </div>
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {isUser ? (
                    <button
                      onClick={() => handleStartEdit(msg)}
                      className="p-1.5 rounded-lg hover:bg-purple-100/60 dark:hover:bg-white/10 text-slate-400 dark:text-slate-400 hover:text-purple-700 dark:hover:text-purple-300 hover:scale-105 active:scale-95 transition-all"
                      title="Edit message"
                      aria-label="Edit message"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => onRegenerateMessage(msg.id)}
                        className="p-1.5 rounded-lg hover:bg-purple-100/60 dark:hover:bg-white/10 text-slate-400 dark:text-slate-400 hover:text-purple-700 dark:hover:text-purple-300 hover:scale-105 active:scale-95 transition-all"
                        title="Regenerate response"
                        aria-label="Regenerate response"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleFeedback(msg.id, "up")}
                        className={`p-1.5 rounded-lg hover:bg-purple-100/60 dark:hover:bg-white/10 hover:scale-105 active:scale-95 transition-all ${
                          feedback === "up"
                            ? "text-emerald-600 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/60 shadow-xs"
                            : "text-slate-400 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                        }`}
                        title="Helpful response"
                        aria-label="Helpful response"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleFeedback(msg.id, "down")}
                        className={`p-1.5 rounded-lg hover:bg-purple-100/60 dark:hover:bg-white/10 hover:scale-105 active:scale-95 transition-all ${
                          feedback === "down"
                            ? "text-rose-600 dark:text-rose-400 bg-rose-100/80 dark:bg-rose-950/60 shadow-xs"
                            : "text-slate-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                        }`}
                        title="Unhelpful response"
                        aria-label="Unhelpful response"
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => onDeleteMessage(msg.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-100/60 dark:hover:bg-rose-950/40 text-slate-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:scale-105 active:scale-95 transition-all"
                    title="Delete message"
                    aria-label="Delete message"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Gently Pulsing AI Thinking Indicator - Aurora Glass */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="flex items-start gap-3.5"
          >
            {/* Pulsing Aurora Avatar */}
            <div className="relative w-9 h-9 rounded-2xl flex items-center justify-center shrink-0">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#93C5FD] via-[#C084FC] to-[#F472B6] opacity-60 dark:opacity-40 blur-[6px] animate-pulse" />
              <div className="relative w-full h-full rounded-2xl bg-white dark:bg-[#151C2F] border border-purple-200/80 dark:border-purple-500/40 flex items-center justify-center text-purple-600 dark:text-purple-300 z-10 shadow-[0_0_14px_rgba(192,132,252,0.25)]">
                <Sparkles className="w-4.5 h-4.5 animate-spin text-purple-600 dark:text-purple-300" style={{ animationDuration: "3s" }} />
              </div>
            </div>

            {/* Glowing Frosted Thinking Card with Gentle Pulse */}
            <div className="relative p-4 sm:px-5 sm:py-4 rounded-2xl rounded-tl-sm bg-white/90 dark:bg-[#151C2F]/90 backdrop-blur-2xl border border-purple-200/80 dark:border-purple-500/30 shadow-[0_4px_25px_rgba(147,112,219,0.08)] dark:shadow-[0_4px_25px_rgba(0,0,0,0.5)] flex items-center gap-4 animate-gentle-pulse">
              {/* Aurora Pastel Wave Dots with Soft Glow */}
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.7)]"></span>
                </span>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75 [animation-delay:0.2s]"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.7)]"></span>
                </span>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75 [animation-delay:0.4s]"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.7)]"></span>
                </span>
              </div>

              {/* Dynamic Thinking State Text with Aurora Shimmer */}
              <div className="flex items-center gap-2 font-sans">
                <span className="text-xs font-semibold aurora-text-gradient">
                  {thinkingStates[thinkingStep]}
                </span>
                <span className="text-[10px] font-mono text-purple-600/70 dark:text-purple-400/70 hidden sm:inline">
                  • aurora flow
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error State with Retry Button */}
        {apiError && (
          <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/80 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 space-y-3 font-sans shadow-xs animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
              <span className="font-semibold text-sm">Response Generation Failed</span>
            </div>
            <p className="text-xs text-rose-600 dark:text-rose-400 pl-7">{apiError}</p>
            <div className="flex pl-7">
              <button
                onClick={onRetry}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs shadow-xs transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry Request
              </button>
            </div>
          </div>
        )}

        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-24 right-8 z-30 p-2.5 rounded-full bg-white dark:bg-[#121624] text-[#6C3BFF] border border-slate-200 dark:border-white/10 shadow-xl hover:scale-110 active:scale-95 transition-all"
          title="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Temporary Toast Notice banner */}
      {ttsNotice && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#151A2D] text-white rounded-2xl shadow-xl text-xs font-medium animate-in fade-in slide-in-from-bottom-2 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#9B5CFF]" />
          <span>{ttsNotice}</span>
        </div>
      )}

      {/* High-Resolution Image Lightbox Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-4 bg-slate-950/80 border-b border-slate-800 text-white text-xs">
              <span className="truncate max-w-md font-medium text-slate-300">
                {previewImage.title || "Gemini Generated Showcase"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadImage(previewImage.url, previewImage.title)}
                  className="px-3 py-1.5 rounded-xl bg-[#6C3BFF] hover:bg-[#5922e3] text-white font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <a
                  href={previewImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Tab</span>
                </a>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 flex items-center justify-center overflow-auto bg-black/40 min-h-[300px]">
              <img
                src={previewImage.url}
                alt={previewImage.title || "Preview"}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
