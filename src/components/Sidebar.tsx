import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Search,
  Sun,
  Moon,
  Sparkles,
  User as UserIcon,
  LogOut,
  MoreVertical,
  Sliders,
  PanelLeftClose,
  FolderClock,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Conversation, User } from "../types";

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  user: User | null;
  onLogout: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  activeView?: "chat" | "search";
  onOpenSearchEngine?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  onOpenSettings,
  onOpenProfile,
  user,
  onLogout,
  theme,
  onToggleTheme,
  isSidebarOpen,
  onToggleSidebar,
  activeView = "chat",
  onOpenSearchEngine,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStartRename = (e: React.MouseEvent, id: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
    setMenuOpenId(null);
  };

  const handleSaveRename = (
    e: React.MouseEvent | React.KeyboardEvent | React.FormEvent,
    id: string
  ) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    onDeleteConversation(id);
    setMenuOpenId(null);
  };

  // Helper to extract a display title if conversation has placeholder or empty title
  const getConversationTitle = (c: Conversation) => {
    if (c.title && c.title !== "New Conversation") {
      return c.title;
    }
    const firstUserMsg = c.messages?.find((m) => m.role === "user");
    if (firstUserMsg && firstUserMsg.content) {
      let clean = firstUserMsg.content
        .replace(/^\[Document Attached:[^\]]+\]\s*```[^`]*```\s*/, "")
        .replace(/^\/(?:image|imagine|draw|img|pic|generate-image)\s+/i, "")
        .trim();
      if (clean) {
        return clean.length > 36 ? clean.substring(0, 36) + "..." : clean;
      }
    }
    return c.title || "New Conversation";
  };

  // Filter conversations by search query
  const filteredConversations = useMemo(() => {
    if (!conversations || !Array.isArray(conversations)) return [];
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter((c) => {
      const titleMatch = (c?.title || "").toLowerCase().includes(query);
      const messageMatch = Array.isArray(c?.messages) && c.messages.some((m) =>
        (m?.content || "").toLowerCase().includes(query)
      );
      return titleMatch || messageMatch;
    });
  }, [conversations, searchQuery]);

  // Group conversations by date
  const groupedConversations = useMemo(() => {
    const now = new Date();
    const today: Conversation[] = [];
    const previous7Days: Conversation[] = [];
    const older: Conversation[] = [];

    filteredConversations.forEach((c) => {
      if (!c) return;
      const date = c.createdAt ? new Date(c.createdAt) : new Date();
      const time = date.getTime();
      const diffTime = isNaN(time) ? 0 : Math.abs(now.getTime() - time);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) {
        today.push(c);
      } else if (diffDays <= 7) {
        previous7Days.push(c);
      } else {
        older.push(c);
      }
    });

    return [
      { label: "Today", items: today },
      { label: "Previous 7 Days", items: previous7Days },
      { label: "Older", items: older },
    ].filter((group) => group.items.length > 0);
  }, [filteredConversations]);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onToggleSidebar}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Sidebar Panel */}
      <aside
        id="conversation-history-sidebar"
        aria-label="Conversation History"
        className={`fixed md:static inset-y-0 left-0 z-40 flex flex-col h-full bg-white/90 dark:bg-[#0D1220]/95 backdrop-blur-2xl border-r border-slate-200/80 dark:border-white/10 transition-all duration-300 ease-in-out shrink-0 select-none shadow-[0_10px_35px_rgba(147,112,219,0.05)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.5)] text-slate-800 dark:text-slate-200 ${
          isSidebarOpen
            ? "w-[280px] sm:w-[290px] md:w-[280px] lg:w-[300px] max-w-[85vw] translate-x-0 opacity-100"
            : "-translate-x-full md:w-0 md:border-r-0 md:overflow-hidden md:opacity-0 md:pointer-events-none md:translate-x-0 w-[280px] max-w-[85vw]"
        }`}
      >
        {/* Brand / Logo & Collapse Header */}
        <div className="h-14 sm:h-16 px-4 flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Glowing animated aurora orb logo */}
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center bg-gradient-to-tr from-[#818CF8] via-[#C084FC] to-[#F472B6] shadow-[0_4px_16px_rgba(192,132,252,0.35)] shrink-0 overflow-hidden">
              <div className="absolute inset-0 bg-white/25 animate-pulse" />
              <Sparkles className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white relative z-10" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100 truncate">
                  Prism AI
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/40">
                  AURORA
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Chat History & Assistant
              </span>
            </div>
          </div>

          {/* Close/Collapse Button: X on Mobile, PanelLeftClose on Desktop */}
          <button
            id="sidebar-collapse-button"
            onClick={onToggleSidebar}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <X className="w-4 h-4 md:hidden" />
            <PanelLeftClose className="w-4 h-4 hidden md:block" />
          </button>
        </div>

        {/* Action Buttons: New Conversation & Real-Time Search */}
        <div className="p-3 shrink-0 space-y-2">
          {/* Real-Time Search Engine Switcher */}
          {onOpenSearchEngine && (
            <button
              id="sidebar-search-engine-button"
              onClick={onOpenSearchEngine}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                activeView === "search"
                  ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white border-blue-500 shadow-md shadow-blue-500/20"
                  : "bg-blue-50/70 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-900/40 hover:bg-blue-100/70 dark:hover:bg-blue-900/40"
              }`}
              title="Open Real-Time Search Engine"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-1 rounded-lg ${
                    activeView === "search" ? "bg-white/20" : "bg-blue-600 text-white"
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold tracking-wide">Live Search</span>
              </div>
              <span className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-300 font-bold border border-blue-500/30">
                <span className="w-1 h-1 rounded-full bg-blue-500 animate-ping" />
                REAL-TIME
              </span>
            </button>
          )}

          {/* New Conversation Button */}
          <button
            id="sidebar-new-chat-button"
            onClick={onNewChat}
            className="w-full group relative flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-[#818CF8] via-[#A855F7] to-[#F472B6] hover:opacity-95 text-white font-medium text-xs shadow-md shadow-purple-200/70 dark:shadow-purple-900/40 hover:shadow-lg hover:shadow-purple-300/60 hover:scale-[1.01] active:scale-[0.98] transition-all overflow-hidden cursor-pointer"
            title="Start a new conversation"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-lg bg-white/20">
                <Plus className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold tracking-wide">New Conversation</span>
            </div>
            <span className="text-[10px] font-mono opacity-80 group-hover:opacity-100 hidden sm:inline px-1.5 py-0.5 rounded bg-white/20">
              ⌘N
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-3 pb-2 shrink-0">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              id="sidebar-conversations-search-input"
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-7 py-1.5 text-xs rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-purple-300 dark:focus:border-purple-500/50 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-950/40 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List with Titles */}
        <div
          id="sidebar-conversations-list"
          className="flex-1 overflow-y-auto px-2 py-1 space-y-4 min-h-0"
        >
          {groupedConversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500">
              <FolderClock className="w-8 h-8 mx-auto mb-2 opacity-40 text-purple-400" />
              <p className="font-medium text-slate-600 dark:text-slate-300">
                {searchQuery ? "No matching conversations" : "No saved chats yet"}
              </p>
              <p className="text-[11px] mt-1 text-slate-400 dark:text-slate-500">
                {searchQuery ? "Try a different search keyword" : "Click New Conversation to start"}
              </p>
            </div>
          ) : (
            groupedConversations.map((group) => (
              <div key={group.label} className="space-y-1">
                <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                  {group.label}
                </div>
                {group.items.map((c) => {
                  const isActive = c.id === activeId;
                  const isEditing = c.id === editingId;
                  const displayTitle = getConversationTitle(c);

                  return (
                    <div
                      key={c.id}
                      id={`conversation-item-${c.id}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelectConversation(c.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectConversation(c.id);
                        }
                      }}
                      className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer text-xs font-medium transition-all min-w-0 ${
                        isActive
                          ? "bg-purple-50/90 dark:bg-[#151C2F] text-purple-900 dark:text-purple-200 border border-purple-200/80 dark:border-purple-500/40 shadow-xs shadow-purple-100/60 dark:shadow-none font-semibold"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent hover:border-slate-200/60 dark:hover:border-white/5"
                      }`}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <div className="absolute left-1 top-2 bottom-2 w-1 rounded-full bg-gradient-to-b from-[#818CF8] via-[#C084FC] to-[#F472B6]" />
                      )}

                      <MessageSquare
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive
                            ? "text-purple-600 dark:text-purple-400"
                            : "text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                        }`}
                      />

                      {isEditing ? (
                        <div
                          className="flex items-center gap-1.5 flex-1 min-w-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveRename(e, c.id);
                              if (e.key === "Escape") handleCancelRename(e);
                            }}
                            className="w-full bg-white dark:bg-[#1A2238] px-2 py-1 rounded-lg text-xs text-slate-800 dark:text-slate-100 outline-none ring-1 ring-purple-400 border border-purple-200 dark:border-purple-500/40"
                            autoFocus
                          />
                          <button
                            onClick={(e) => handleSaveRename(e, c.id)}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-emerald-600"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleCancelRename}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-white/10 text-rose-500"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <span
                            className="truncate flex-1 min-w-0 pr-6 text-xs text-left"
                            title={displayTitle}
                          >
                            {displayTitle}
                          </span>

                          {/* Action Menu Trigger Button */}
                          <div
                            className={`absolute right-1.5 flex items-center transition-opacity ${
                              isActive || menuOpenId === c.id
                                ? "opacity-100"
                                : "opacity-70 sm:opacity-0 group-hover:opacity-100 group-focus:opacity-100"
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => setMenuOpenId(menuOpenId === c.id ? null : c.id)}
                              className="p-1 rounded-lg hover:bg-slate-200/80 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                              title="Conversation options"
                              aria-label="Conversation options"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {/* Dropdown Options */}
                            {menuOpenId === c.id && (
                              <div
                                ref={dropdownRef}
                                className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-white/95 dark:bg-[#151C2F] backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100 text-xs text-slate-700 dark:text-slate-200"
                              >
                                <button
                                  onClick={(e) => handleStartRename(e, c.id, displayTitle)}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-purple-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer text-left"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                                  Rename
                                </button>
                                <button
                                  onClick={(e) => handleDelete(e, c.id)}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer text-left"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Sidebar Footer / User Profile & Settings */}
        <div className="p-3 border-t border-slate-200/80 dark:border-white/10 bg-white/40 dark:bg-transparent shrink-0 relative">
          <div ref={profileMenuRef} className="relative">
            <button
              id="sidebar-profile-menu-button"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="w-full flex items-center justify-between p-2 rounded-2xl hover:bg-white/80 dark:hover:bg-white/5 border border-transparent hover:border-purple-200 dark:hover:border-white/10 transition-all text-left group cursor-pointer"
              title="Account options"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative">
                  <img
                    src={
                      user?.avatarUrl ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.name || "User"}`
                    }
                    alt={user?.name || "User"}
                    className="w-8 h-8 rounded-xl object-cover ring-1 ring-purple-300 dark:ring-purple-500/50 shadow-xs bg-slate-100 dark:bg-slate-800 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.name || "User"}`;
                    }}
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-teal-400 border-2 border-white dark:border-slate-900 rounded-full shadow-2xs" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {user?.name || "My Account"}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                    {user?.email || "Online"}
                  </div>
                </div>
              </div>
              <MoreVertical className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 shrink-0" />
            </button>

            {/* Profile / Quick Settings Menu */}
            <AnimatePresence>
              {isProfileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full left-0 mb-2 w-56 p-1.5 rounded-2xl bg-white/95 dark:bg-[#151C2F] backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 shadow-2xl shadow-purple-900/10 dark:shadow-black/50 z-50 space-y-0.5 text-xs font-medium"
                >
                  {/* Account Header */}
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 mb-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {user?.name || "Prism AI User"}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user?.email}</p>
                  </div>

                  {/* Profile */}
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenProfile();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-purple-50/70 dark:hover:bg-white/10 transition-colors cursor-pointer text-left"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>My Profile</span>
                  </button>

                  {/* Settings */}
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-purple-50/70 dark:hover:bg-white/10 transition-colors cursor-pointer text-left"
                  >
                    <Sliders className="w-3.5 h-3.5 text-pink-500 dark:text-pink-400" />
                    <span>Settings</span>
                  </button>

                  {/* Theme Toggle */}
                  <button
                    onClick={onToggleTheme}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-purple-50/70 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      {theme === "dark" ? (
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                      ) : (
                        <Moon className="w-3.5 h-3.5 text-purple-600" />
                      )}
                      <span>Mode</span>
                    </div>
                    <span className="text-[10px] capitalize text-slate-400 dark:text-slate-500">{theme}</span>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-white/5" />

                  {/* Logout */}
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
