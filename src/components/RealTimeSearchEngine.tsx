import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Globe,
  ExternalLink,
  Sparkles,
  Clock,
  ArrowRight,
  TrendingUp,
  Newspaper,
  Cpu,
  LineChart,
  RefreshCw,
  Copy,
  Check,
  MessageSquare,
  X,
  History,
  Share2,
  CheckCircle2,
  ChevronRight,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";
import { SearchResult, SearchSource } from "../types";
import { safeStorage } from "../utils/storage";
import { copyToClipboard } from "../utils/clipboard";

interface RealTimeSearchEngineProps {
  onClose: () => void;
  onContinueInChat: (query: string, searchSummary: string, sources: SearchSource[]) => void;
  token?: string | null;
}

const CATEGORIES = [
  { id: "all", label: "All Web", icon: Globe },
  { id: "news", label: "News & Events", icon: Newspaper },
  { id: "tech", label: "Tech & Science", icon: Cpu },
  { id: "finance", label: "Markets & Finance", icon: LineChart },
];

const TIME_RANGES = [
  { id: "anytime", label: "Anytime" },
  { id: "day", label: "Past 24h" },
  { id: "week", label: "Past Week" },
  { id: "month", label: "Past Month" },
];

const SUGGESTED_QUERIES = [
  { text: "Latest breakthroughs in quantum computing and AI chips", category: "tech" },
  { text: "Current global financial market summary and inflation trends", category: "finance" },
  { text: "Major space exploration discoveries and missions this year", category: "tech" },
  { text: "Top world news and international diplomacy updates today", category: "news" },
  { text: "Breakthrough developments in renewable fusion & battery tech", category: "tech" },
];

export default function RealTimeSearchEngine({
  onClose,
  onContinueInChat,
  token,
}: RealTimeSearchEngineProps) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTimeRange, setSelectedTimeRange] = useState("anytime");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    return safeStorage.getJSON<string[]>("prism_search_history", []);
  });
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"results" | "sources">("results");
  const [loadingStep, setLoadingStep] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadingSteps = [
    "Connecting to Google live web index...",
    "Executing real-time search queries...",
    "Retrieving and verifying web citations...",
    "Synthesizing comprehensive intelligence...",
  ];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setLoadingStep(0);
      return;
    }
    const timer = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
    }, 1800);
    return () => clearInterval(timer);
  }, [isLoading]);

  const saveToHistory = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setSearchHistory((prev) => {
      const next = [trimmed, ...prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 10);
      safeStorage.setJSON("prism_search_history", next);
      return next;
    });
  };

  const handleSearch = async (overrideQuery?: string) => {
    const searchQuery = (overrideQuery || query).trim();
    if (!searchQuery || isLoading) return;

    if (overrideQuery) {
      setQuery(overrideQuery);
    }

    setIsLoading(true);
    setError(null);
    saveToHistory(searchQuery);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/search", {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: searchQuery,
          category: selectedCategory,
          timeRange: selectedTimeRange,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Search engine failed to retrieve results.");
      }

      const data: SearchResult = await res.json();
      setSearchResult(data);
      setActiveTab("results");
    } catch (err: any) {
      console.error("Search error:", err);
      setError(err?.message || "An unexpected error occurred while searching.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleCopySummary = async () => {
    if (!searchResult) return;
    const textToCopy = `# ${searchResult.query}\n\n${searchResult.answer}\n\n## Sources\n${searchResult.sources
      .map((s, i) => `${i + 1}. [${s.title}](${s.uri}) (${s.domain})`)
      .join("\n")}`;
    await copyToClipboard(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    safeStorage.removeItem("prism_search_history");
  };

  return (
    <div
      id="real-time-search-engine"
      className="flex-1 flex flex-col h-full overflow-hidden bg-[#FAFBFF] dark:bg-[#0A0E1A] transition-colors relative"
    >
      {/* Top Engine Header Bar */}
      <header className="h-16 px-4 sm:px-8 flex items-center justify-between border-b border-purple-100/70 dark:border-white/10 bg-white/80 dark:bg-[#0E1322]/80 backdrop-blur-xl shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-display font-bold text-slate-900 dark:text-slate-100">
                Real-Time Search Engine
              </h1>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                LIVE WEB
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Grounded by Google Search • Real-time indexing & intelligent synthesis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {searchResult && (
            <button
              onClick={() =>
                onContinueInChat(searchResult.query, searchResult.answer, searchResult.sources)
              }
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              title="Continue this search in the AI Chat conversation"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Continue in Chat</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Back to AI Chat"
            aria-label="Close Search Engine"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Search Content Area */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-5xl w-full mx-auto space-y-6">
        {/* Search Bar Console */}
        <section
          id="search-console"
          className="p-4 sm:p-5 rounded-3xl bg-white/90 dark:bg-[#121728]/90 border border-purple-100/80 dark:border-white/10 shadow-[0_8px_30px_rgba(79,70,229,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] backdrop-blur-xl space-y-4"
        >
          {/* Main Input Box */}
          <div className="relative flex items-center gap-3 p-2 pl-4 rounded-2xl bg-slate-50/90 dark:bg-[#182035]/90 border border-slate-200/80 dark:border-white/10 focus-within:border-blue-500/80 dark:focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
            <Search className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <input
              id="search-engine-input"
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search current events, facts, markets, technology, or live data..."
              className="flex-1 bg-transparent border-0 outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm sm:text-base font-sans"
              disabled={isLoading}
            />

            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                title="Clear"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              id="search-execute-button"
              type="button"
              onClick={() => handleSearch()}
              disabled={!query.trim() || isLoading}
              className={`px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-2 text-white transition-all cursor-pointer ${
                !query.trim() || isLoading
                  ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-70"
                  : "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-blue-500/25"
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <span>Search</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Filters Bar: Categories & Time Freshness */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Time Freshness Dropdown / Buttons */}
            <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5 mr-1" />
              <span>Freshness:</span>
              <div className="flex items-center gap-1">
                {TIME_RANGES.map((range) => (
                  <button
                    key={range.id}
                    onClick={() => setSelectedTimeRange(range.id)}
                    className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                      selectedTimeRange === range.id
                        ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold"
                        : "hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Loading Progress State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-3xl bg-white/90 dark:bg-[#121728]/90 border border-blue-100 dark:border-blue-900/30 shadow-lg text-center space-y-4 backdrop-blur-xl"
          >
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-900/40 border-t-blue-600 animate-spin" />
              <Globe className="w-7 h-7 text-blue-600 dark:text-blue-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                Searching Real-Time Web
              </h3>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                {loadingSteps[loadingStep]}
              </p>
            </div>
            <div className="max-w-xs mx-auto bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse w-3/4" />
            </div>
          </motion.div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => handleSearch()}
              className="px-3 py-1 rounded-lg bg-rose-600 text-white font-semibold text-[11px] hover:bg-rose-700 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Search Results Display */}
        {searchResult && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Search Metadata & Stats Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  "{searchResult.query}"
                </span>
                <span>•</span>
                <span>{(searchResult.searchTimeMs / 1000).toFixed(2)}s</span>
                <span>•</span>
                <span>{searchResult.sources.length} sources</span>
                <span>•</span>
                <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 uppercase">
                  {searchResult.model || "Gemini 3.8 Flash"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySummary}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white dark:bg-[#151C2F] border border-slate-200 dark:border-white/10 hover:border-purple-300 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                  title="Copy search report"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Report</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Key Takeaways Card */}
            {searchResult.keyTakeaways && searchResult.keyTakeaways.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 to-indigo-50/70 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/70 dark:border-blue-800/40">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-200 mb-3">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Key Takeaways</span>
                </div>
                <ul className="space-y-2">
                  {searchResult.keyTakeaways.map((takeaway, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Verified Sources Carousel / Grid */}
            {searchResult.sources && searchResult.sources.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-500" />
                    <span>Verified Web Sources ({searchResult.sources.length})</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Click to open external link</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {searchResult.sources.map((source, sIdx) => (
                    <a
                      key={sIdx}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 p-3 rounded-2xl bg-white/90 dark:bg-[#121728]/90 border border-slate-200/80 dark:border-white/10 hover:border-blue-400 dark:hover:border-blue-500/60 hover:shadow-md transition-all group/src text-left"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-white/10 overflow-hidden mt-0.5">
                        {source.domain ? (
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${source.domain}&sz=64`}
                            alt=""
                            className="w-4 h-4 object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <Globe className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover/src:text-blue-600 dark:group-hover/src:text-blue-400 line-clamp-2 leading-snug">
                          {source.title || source.domain || "Web Source"}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-1 flex items-center gap-1">
                          <span>{source.domain || "source"}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover/src:opacity-100" />
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* AI Synthesized Comprehensive Answer Card */}
            <div className="p-6 sm:p-7 rounded-3xl bg-white/95 dark:bg-[#121728]/95 border border-purple-100/80 dark:border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.4)] backdrop-blur-xl">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    AI
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Synthesized Real-Time Overview
                  </h3>
                </div>
                <button
                  onClick={() =>
                    onContinueInChat(searchResult.query, searchResult.answer, searchResult.sources)
                  }
                  className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Ask follow-ups</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Markdown Content */}
              <div className="markdown-body prose dark:prose-invert prose-blue max-w-none text-xs sm:text-sm text-slate-800 dark:text-slate-100 leading-relaxed">
                <Markdown>{searchResult.answer}</Markdown>
              </div>
            </div>

            {/* Related Searches Section */}
            {searchResult.relatedQueries && searchResult.relatedQueries.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-white/70 dark:bg-[#121728]/70 border border-slate-200/70 dark:border-white/10 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
                  <span>Related Searches & Deep Dives</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {searchResult.relatedQueries.map((rq, rIdx) => (
                    <button
                      key={rIdx}
                      onClick={() => handleSearch(rq)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50/80 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-800 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40 text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      <Search className="w-3 h-3 text-purple-500" />
                      <span>{rq}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Zero State / Suggested Topics */}
        {!searchResult && !isLoading && (
          <div className="space-y-6 pt-2">
            {/* Search History */}
            {searchHistory.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <History className="w-3.5 h-3.5 text-blue-500" />
                    <span>Recent Searches</span>
                  </div>
                  <button
                    onClick={clearHistory}
                    className="text-[11px] text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    Clear history
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSearch(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#151C2F] border border-slate-200/80 dark:border-white/10 hover:border-blue-400 text-xs text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all cursor-pointer"
                    >
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{item}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending / Suggested Topics */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                <span>Suggested Real-Time Explorations</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SUGGESTED_QUERIES.map((sq, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearch(sq.text)}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white/80 dark:bg-[#121728]/80 border border-slate-200/70 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 text-left transition-all group/item cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Search className="w-4 h-4" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 line-clamp-1">
                        {sq.text}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover/item:text-indigo-600 group-hover/item:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
