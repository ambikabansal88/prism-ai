import React, { useState, useEffect, useCallback } from "react";
import { Sparkles, Menu, Sidebar as SidebarIcon, Sliders, Volume2, Bot, AlertTriangle, User as UserIcon, Sun, Moon, Search, MessageSquare, Globe } from "lucide-react";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import InputArea from "./components/InputArea";
import RealTimeSearchEngine from "./components/RealTimeSearchEngine";
import SettingsModal from "./components/SettingsModal";
import ProfileModal from "./components/ProfileModal";
import AuthScreen from "./components/AuthScreen";
import CinematicBackgroundStudio from "./components/CinematicBackgroundStudio";
import PrismNeuralBackground from "./components/PrismNeuralBackground";
import { useAuth } from "./context/AuthContext";
import { Conversation, Message, Settings, FileAttachment, SearchSource } from "./types";
import { parseImageRequest } from "./utils/imageParser";
import { safeFetchJson } from "./utils/api";
import { safeStorage } from "./utils/storage";
import { copyToClipboard } from "./utils/clipboard";

const SUGGESTED_PROMPTS = [
  "What are the latest updates on space missions and Artemis this week?",
  "Search Google for current world news headlines today.",
  "Write a TypeScript function to debounce an API query.",
  "Summarize the key differences between SQL and NoSQL databases.",
];

const DEFAULT_SETTINGS: Settings = {
  theme: "dark",
  fontSize: "base",
  temperature: 0.7,
  model: "gemini-2.5-flash",
  autoSpeak: false,
  voiceName: "",
  useSearchGrounding: true,
};

export default function App() {
  const { user, token, isLoading, logout } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768; // Desktop shows conversation list by default
    }
    return true;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isCinematicStudioOpen, setIsCinematicStudioOpen] = useState(false);
  const [cinematicStudioImage, setCinematicStudioImage] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"chat" | "search">("chat");

  const handleContinueSearchInChat = useCallback(
    (searchQuery: string, searchSummary: string, sources: SearchSource[]) => {
      setActiveView("chat");

      const userMsgId = "user_" + Date.now();
      const assistantMsgId = "assistant_" + (Date.now() + 1);

      const userMsg: Message = {
        id: userMsgId,
        role: "user",
        content: `Search findings for: "${searchQuery}"`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        usedSearchGrounding: true,
      };

      const assistantMsg: Message = {
        id: assistantMsgId,
        role: "assistant",
        content: `${searchSummary}\n\n*Live research findings retrieved via Google Search grounding.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        searchGrounding: {
          queries: [searchQuery],
          sources: sources.map((s) => ({
            uri: s.uri,
            title: s.title,
            domain: s.domain,
          })),
        },
        usedSearchGrounding: true,
      };

      setConversations((prev) => {
        if (prev.length === 0) {
          const fresh: Conversation = {
            id: "chat_" + Date.now(),
            title: searchQuery.slice(0, 32),
            messages: [userMsg, assistantMsg],
            model: settings.model,
            temperature: settings.temperature,
            createdAt: new Date().toISOString(),
            useSearchGrounding: true,
          };
          setActiveId(fresh.id);
          return [fresh];
        }

        const activeExists = prev.some((c) => c.id === activeId);
        const targetId = activeExists ? activeId : prev[0].id;

        return prev.map((c) => {
          if (c.id === targetId) {
            return {
              ...c,
              title: c.messages.length === 0 ? searchQuery.slice(0, 32) : c.title,
              messages: [...c.messages, userMsg, assistantMsg],
            };
          }
          return c;
        });
      });
    },
    [activeId, settings.model, settings.temperature]
  );

  const handleOpenCinematicStudio = useCallback((initialImg?: string) => {
    setCinematicStudioImage(initialImg || null);
    setIsCinematicStudioOpen(true);
  }, []);

  const handleInsertCinematicToChat = useCallback((imageDataUrl: string, promptInfo: string) => {
    handleSendMessage(
      `Here is my cinematic background composition:\n\n*${promptInfo}*`,
      {
        name: "cinematic-composition.png",
        type: "image",
        size: Math.round(imageDataUrl.length * 0.75),
        mimeType: "image/png",
        base64Data: imageDataUrl.split(",")[1] || imageDataUrl,
      }
    );
  }, []);

  // Storage key scoped to authenticated user
  const conversationsStorageKey = user
    ? `gemini_chatbot_conversations_${user.id}`
    : "gemini_chatbot_conversations";

  // Initialize: Load from localStorage whenever user changes
  useEffect(() => {
    // 1. Load Settings
    const parsedSettings = safeStorage.getJSON<Settings | null>("gemini_chatbot_settings", null);
    if (parsedSettings) {
      setSettings(parsedSettings);
    }

    if (!user) return;

    // 2. Load Conversations for current user (with legacy fallback)
    const parsedConversations = safeStorage.getJSON<Conversation[] | null>(conversationsStorageKey, null);
    const fallbackConversations = safeStorage.getJSON<Conversation[] | null>("gemini_chatbot_conversations", null);

    if (parsedConversations && Array.isArray(parsedConversations) && parsedConversations.length > 0) {
      setConversations(parsedConversations);
      setActiveId(parsedConversations[0].id);
    } else if (fallbackConversations && Array.isArray(fallbackConversations) && fallbackConversations.length > 0) {
      setConversations(fallbackConversations);
      setActiveId(fallbackConversations[0].id);
      safeStorage.setJSON(conversationsStorageKey, fallbackConversations);
    } else {
      // Create initial conversation with a clean welcome title
      const firstChat: Conversation = {
        id: "chat_" + Date.now(),
        title: "Welcome to Prism AI",
        messages: [
          {
            id: "msg_welcome",
            role: "assistant",
            content:
              "Hello! I am **Prism AI**, powered by Google Gemini. You can chat with me, search the live web in real time, generate realistic images, and analyze documents.\n\nHow can I help you today?",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ],
        model: settings.model || "gemini-2.5-flash",
        temperature: 0.7,
        createdAt: new Date().toISOString(),
      };
      setConversations([firstChat]);
      setActiveId(firstChat.id);
    }
  }, [user, conversationsStorageKey]);

  // Keep sidebar responsive across desktop (>=768px) and mobile (<768px)
  useEffect(() => {
    let prevWidth = typeof window !== "undefined" ? window.innerWidth : 1024;
    const handleResize = () => {
      if (typeof window === "undefined") return;
      const currentWidth = window.innerWidth;
      if (prevWidth < 768 && currentWidth >= 768) {
        setIsSidebarOpen(true);
      } else if (prevWidth >= 768 && currentWidth < 768) {
        setIsSidebarOpen(false);
      }
      prevWidth = currentWidth;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Save Conversations whenever state changes
  useEffect(() => {
    if (conversations.length > 0) {
      safeStorage.setJSON(conversationsStorageKey, conversations);
      safeStorage.setJSON("gemini_chatbot_conversations", conversations);
    }
  }, [conversations, user, conversationsStorageKey]);

  // Save Settings whenever state changes
  useEffect(() => {
    safeStorage.setJSON("gemini_chatbot_settings", settings);

    // Sync theme class to documentElement
    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings]);

  // Handle Online/Offline Status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const getActiveConversation = () => {
    return conversations.find((c) => c.id === activeId) || null;
  };

  // Toggle Theme
  const handleToggleTheme = () => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === "dark" ? "light" : "dark",
    }));
  };

  // Create a New Chat
  const handleNewChat = () => {
    const newChat: Conversation = {
      id: "chat_" + Date.now(),
      title: "New Conversation",
      messages: [],
      model: settings.model,
      temperature: settings.temperature,
      createdAt: new Date().toISOString(),
    };
    setConversations((prev) => [newChat, ...prev]);
    setActiveId(newChat.id);
    setApiError(null);
  };

  // Delete a Conversation
  const handleDeleteConversation = (id: string) => {
    let nextActiveId: string | null = null;

    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      let finalConversations: Conversation[];

      if (updated.length === 0) {
        // If all conversations are deleted, provide a fresh conversation
        const fallbackChat: Conversation = {
          id: "chat_" + Date.now(),
          title: "New Conversation",
          messages: [],
          model: settings.model || "gemini-3.5-flash",
          temperature: settings.temperature ?? 0.7,
          createdAt: new Date().toISOString(),
        };
        finalConversations = [fallbackChat];
        nextActiveId = fallbackChat.id;
      } else {
        finalConversations = updated;
        if (activeId === id) {
          nextActiveId = updated[0].id;
        }
      }

      // Synchronously write to storage to guarantee immediate persistence
      safeStorage.setJSON(conversationsStorageKey, finalConversations);
      safeStorage.setJSON("gemini_chatbot_conversations", finalConversations);

      return finalConversations;
    });

    if (nextActiveId) {
      setActiveId(nextActiveId);
    }
    setApiError(null);
  };

  // Rename a Conversation
  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c));
      safeStorage.setJSON(conversationsStorageKey, updated);
      safeStorage.setJSON("gemini_chatbot_conversations", updated);
      return updated;
    });
  };

  // Clear Chat History completely
  const handleClearAllHistory = () => {
    const freshChat: Conversation = {
      id: "chat_" + Date.now(),
      title: "New Conversation",
      messages: [],
      model: settings.model || "gemini-3.5-flash",
      temperature: settings.temperature ?? 0.7,
      createdAt: new Date().toISOString(),
    };
    safeStorage.setJSON(conversationsStorageKey, [freshChat]);
    safeStorage.setJSON("gemini_chatbot_conversations", [freshChat]);
    setConversations([freshChat]);
    setActiveId(freshChat.id);
    setIsSettingsOpen(false);
    setApiError(null);
  };

  // Delete specific message
  const handleDeleteMessage = (messageId: string) => {
    if (!activeId) return;
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeId) {
          return {
            ...c,
            messages: c.messages.filter((m) => m.id !== messageId),
          };
        }
        return c;
      })
    );
  };

  // Copy message text helper safely
  const handleCopyText = async (text: string) => {
    await copyToClipboard(text);
  };

  // Trigger text-to-speech for AI response safely
  const triggerAutoSpeak = (text: string) => {
    try {
      if (!settings.autoSpeak || typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }
      window.speechSynthesis.cancel();
      const cleanText = text
        .replace(/[*#`_\-]/g, "")
        .replace(/\[.*?\]\(.*?\)/g, "");

      const utterance = new SpeechSynthesisUtterance(cleanText);
      if (settings.voiceName) {
        const voices = window.speechSynthesis.getVoices();
        const selectedVoice = voices.find((v) => v.name === settings.voiceName);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Auto-speak playback failed safely:", e);
    }
  };

  // Core API call trigger
  const triggerAICall = async (
    currentConversation: Conversation,
    updatedMessages: Message[],
    fileToUpload: FileAttachment | null = null,
    forceImage: boolean = false,
    aspectRatio: string = "1:1",
    imageStyle: string = "photorealistic",
    enhanceRealism: boolean = true,
    useSearchGrounding: boolean = true
  ) => {
    setIsGenerating(true);
    setApiError(null);

    // Inspect if user wants an image
    const lastUserMsg = updatedMessages[updatedMessages.length - 1];
    const imageReq = lastUserMsg ? parseImageRequest(lastUserMsg.content) : { isImageRequest: false, cleanPrompt: "" };
    const isImageTask = forceImage || lastUserMsg?.isImageMode || imageReq.isImageRequest;
    const promptText = (imageReq.cleanPrompt || lastUserMsg?.content || "a creative digital illustration").trim();
    const effectiveAspectRatio = aspectRatio || lastUserMsg?.aspectRatio || "1:1";
    const effectiveStyle = imageStyle || lastUserMsg?.imageStyle || "photorealistic";

    // Create placeholder assistant message
    const assistantMsgId = "assistant_" + Date.now();
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isGenerating: true,
      generatedImagePrompt: isImageTask ? promptText : undefined,
      imageStyle: effectiveStyle,
      usedSearchGrounding: useSearchGrounding,
    };

    // Append AI response placeholder to message list
    setConversations((prev) =>
      prev.map((c) =>
        c.id === currentConversation.id
          ? { ...c, messages: [...updatedMessages, initialAssistantMsg] }
          : c
      )
    );

    try {
      // 1. Check if we need to generate an image
      if (isImageTask) {
        const authHeaders: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) {
          authHeaders["Authorization"] = `Bearer ${token}`;
        }

        const imgResult = await safeFetchJson<{
          imageUrl: string;
          model?: string;
          notice?: string;
          enhancedPrompt?: string;
          style?: string;
        }>("/api/generate-image", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            prompt: promptText,
            aspectRatio: effectiveAspectRatio,
            style: effectiveStyle,
            enhanceRealism: imageReq.isExplicitRealistic ? true : enhanceRealism,
          }),
        });

        if (!imgResult.ok || !imgResult.data?.imageUrl) {
          const errorDetail = imgResult.error || "Failed to generate image.";

          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === currentConversation.id) {
                return {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          content: `⚠️ **Unable to generate image**\n\n${errorDetail}`,
                          isGenerating: false,
                          isError: true,
                          generatedImagePrompt: promptText,
                        }
                      : m
                  ),
                };
              }
              return c;
            })
          );
          setApiError(errorDetail);
          setIsGenerating(false);
          return;
        }

        const { imageUrl, model, notice, enhancedPrompt, style: returnedStyle } = imgResult.data;

        // Update assistant response with the image
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === currentConversation.id) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: `🎨 Generated realistic image for: **"${promptText}"**${notice ? `\n\n*${notice}*` : ""}`,
                        isGenerating: false,
                        isError: false,
                        generatedImageUrl: imageUrl,
                        generatedImagePrompt: promptText,
                        enhancedImagePrompt: enhancedPrompt,
                        imageStyle: returnedStyle || effectiveStyle,
                        imageModel: model || "Gemini Photorealistic Diffusion",
                        aspectRatio: effectiveAspectRatio,
                        file: {
                          name: `gemini_image_${Date.now()}.png`,
                          type: "image",
                          size: Math.round((imageUrl.length * 3) / 4),
                          mimeType: "image/png",
                          imageUrl,
                        },
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );

        triggerAutoSpeak(`I have generated a realistic image for: ${promptText}`);
        setIsGenerating(false);
        return;
      }

      // 2. Otherwise run regular Gemini streaming
      // Exclude the currently generating assistant message from the history sent to server
      const chatHistory = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Prepare attachment formatting
      let filePayload = null;
      if (fileToUpload) {
        filePayload = {
          base64Data: fileToUpload.base64Data,
          mimeType: fileToUpload.mimeType,
        };
      }

      const chatHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        chatHeaders["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: chatHeaders,
        body: JSON.stringify({
          messages: chatHistory,
          model: currentConversation.model || settings.model,
          temperature: currentConversation.temperature || settings.temperature,
          file: filePayload,
          useSearchGrounding: useSearchGrounding ?? currentConversation.useSearchGrounding ?? settings.useSearchGrounding ?? true,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Server failed to initiate response.");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      if (!reader) throw new Error("Null stream response from server.");

      let accumulatedContent = "";
      let parsedGrounding: any = undefined;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // Check for injected API errors in chunk
        if (chunk.includes("[API_ERROR:")) {
          const errMsg = chunk.substring(chunk.indexOf("[API_ERROR:") + 11, chunk.indexOf("]"));
          throw new Error(errMsg);
        }

        accumulatedContent += chunk;

        // Check for injected grounding metadata delimiter
        let displayContent = accumulatedContent;
        const metaMatch = accumulatedContent.match(/<!--GROUNDING_METADATA:(.*?)-->/);
        if (metaMatch) {
          try {
            const raw = JSON.parse(metaMatch[1]);
            const rawSources = raw.groundingChunks || raw.sources || [];
            parsedGrounding = {
              queries: raw.webSearchQueries || raw.queries || [],
              sources: rawSources.map((s: any) => {
                let domain = "";
                try {
                  domain = new URL(s.uri).hostname.replace(/^www\./, "");
                } catch {
                  domain = "";
                }
                return {
                  uri: s.uri,
                  title: s.title || domain || "Web Source",
                  domain,
                };
              }),
              searchEntryPointHtml: raw.searchEntryPointHtml,
            };
            displayContent = accumulatedContent.replace(/<!--GROUNDING_METADATA:(.*?)-->/, "").trimEnd();
          } catch (e) {
            console.error("Failed to parse grounding metadata", e);
          }
        }

        // Stream contents incrementally to UI
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === currentConversation.id) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: displayContent,
                        searchGrounding: parsedGrounding || m.searchGrounding,
                        usedSearchGrounding: !!parsedGrounding || m.usedSearchGrounding,
                      }
                    : m
                ),
              };
            }
            return c;
          })
        );
      }

      // Mark streaming completed with clean final content and parsed grounding
      const finalDisplayContent = accumulatedContent.replace(/<!--GROUNDING_METADATA:(.*?)-->/, "").trimEnd();
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === currentConversation.id) {
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: finalDisplayContent,
                      isGenerating: false,
                      searchGrounding: parsedGrounding || m.searchGrounding,
                      usedSearchGrounding: !!parsedGrounding || m.usedSearchGrounding,
                    }
                  : m
              ),
            };
          }
          return c;
        })
      );

      triggerAutoSpeak(finalDisplayContent);
    } catch (err: any) {
      console.error(err);
      setApiError(err?.message || "An unexpected error occurred during request.");

      // Remove the failed placeholder or mark as error
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === currentConversation.id) {
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: "Sorry, I encountered an error. Please try clicking the retry button.",
                      isGenerating: false,
                      isError: true,
                    }
                  : m
              ),
            };
          }
          return c;
        })
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Send Message triggered from InputArea
  const handleSendMessage = async (
    content: string,
    file: FileAttachment | null = null,
    forceImage: boolean = false,
    aspectRatio: string = "1:1",
    imageStyle: string = "photorealistic",
    enhanceRealism: boolean = true,
    useSearchGrounding: boolean = true
  ) => {
    const currentConversation = getActiveConversation();
    if (!currentConversation || isGenerating) return;

    // Build fresh user message
    const userMsgId = "user_" + Date.now();
    const newUserMsg: Message = {
      id: userMsgId,
      role: "user",
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isImageMode: forceImage,
      aspectRatio,
      imageStyle,
      usedSearchGrounding: useSearchGrounding,
    };

    // If file is text-like, append it directly into user content block for rich file context parsing
    if (file && file.type === "text") {
      const textContent = decodeURIComponent(escape(atob(file.base64Data)));
      newUserMsg.content = `[Document Attached: ${file.name}]\n\`\`\`\n${textContent}\n\`\`\`\n\n${content}`;
      newUserMsg.file = {
        name: file.name,
        type: "text",
        size: file.size,
        mimeType: file.mimeType,
      };
    } else if (file) {
      newUserMsg.file = {
        name: file.name,
        type: file.type,
        size: file.size,
        mimeType: file.mimeType,
        imageUrl: file.type === "image" ? `data:${file.mimeType};base64,${file.base64Data}` : undefined,
      };
    }

    const updatedMessages = [...currentConversation.messages, newUserMsg];

    // If it's the first message or title is placeholder, update conversation title automatically from clean content
    let title = currentConversation.title;
    if (!title || title === "New Conversation" || title === "Welcome to Prism AI" || currentConversation.messages.length === 0) {
      let cleanTitle = content
        .replace(/^\[Document Attached:[^\]]+\]\s*```[^`]*```\s*/, "")
        .replace(/^\/(?:image|imagine|draw|img|pic|generate-image)\s+/i, "")
        .trim();
      if (!cleanTitle) cleanTitle = "New Conversation";
      title = cleanTitle.length > 36 ? cleanTitle.substring(0, 36) + "..." : cleanTitle;
    }

    // Set conversations with the user message instantly
    setConversations((prev) =>
      prev.map((c) =>
        c.id === currentConversation.id
          ? {
              ...c,
              title,
              messages: updatedMessages,
            }
          : c
      )
    );

    // Call AI securely
    // Pass non-text files as inlineData attachments (PDFs and Images)
    const binaryFileAttachment = file && file.type !== "text" ? file : null;
    await triggerAICall(
      currentConversation,
      updatedMessages,
      binaryFileAttachment,
      forceImage,
      aspectRatio,
      imageStyle,
      enhanceRealism,
      useSearchGrounding
    );
  };

  // Retry failed response
  const handleRetry = async () => {
    const currentConversation = getActiveConversation();
    if (!currentConversation || isGenerating) return;

    // Filter out any error messages at the end
    const messagesToKeep = [...currentConversation.messages];
    const lastMsg = messagesToKeep[messagesToKeep.length - 1];

    if (lastMsg && lastMsg.role === "assistant" && (lastMsg.isError || lastMsg.content === "")) {
      messagesToKeep.pop(); // remove error message
    }

    // Call AI again
    await triggerAICall(currentConversation, messagesToKeep);
  };

  // Edit and Regenerate
  const handleEditMessage = async (messageId: string, newContent: string) => {
    const currentConversation = getActiveConversation();
    if (!currentConversation || isGenerating) return;

    // Find message index
    const index = currentConversation.messages.findIndex((m) => m.id === messageId);
    if (index === -1) return;

    // Keep messages leading up to and including the edited message
    const messagesToKeep = currentConversation.messages.slice(0, index);

    // Reconstruct edited user message
    const originalMsg = currentConversation.messages[index];
    const editedMsg: Message = {
      ...originalMsg,
      content: newContent,
    };

    const updatedMessages = [...messagesToKeep, editedMsg];

    // Set state
    setConversations((prev) =>
      prev.map((c) => (c.id === currentConversation.id ? { ...c, messages: updatedMessages } : c))
    );

    // Call AI securely
    await triggerAICall(currentConversation, updatedMessages);
  };

  // Regenerate Response from AI message click
  const handleRegenerateMessage = async (messageId: string) => {
    const currentConversation = getActiveConversation();
    if (!currentConversation || isGenerating) return;

    const index = currentConversation.messages.findIndex((m) => m.id === messageId);
    if (index === -1) return;

    // Keep all messages up to this AI response index
    const messagesToKeep = currentConversation.messages.slice(0, index);

    // Call AI securely
    await triggerAICall(currentConversation, messagesToKeep);
  };

  // Export Chat as Plain Text (TXT)
  const handleExportTXT = () => {
    const currentConversation = getActiveConversation();
    if (!currentConversation || currentConversation.messages.length === 0) {
      setApiError("No messages to export in this conversation yet.");
      setTimeout(() => setApiError(null), 4000);
      return;
    }

    let fileContent = `CHAT CONVERSATION HISTORY: ${currentConversation.title}\n`;
    fileContent += `Date Exported: ${new Date().toLocaleString()}\n`;
    fileContent += `Model Used: ${currentConversation.model || settings.model}\n`;
    fileContent += `==========================================================\n\n`;

    currentConversation.messages.forEach((m) => {
      fileContent += `[${m.role.toUpperCase()}] (${m.timestamp}):\n`;
      fileContent += `${m.content}\n`;
      if (m.file) {
        fileContent += `Attachment: ${m.file.name} (${(m.file.size / 1024).toFixed(1)} KB)\n`;
      }
      fileContent += `----------------------------------------------------------\n\n`;
    });

    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentConversation.title.toLowerCase().replace(/\s+/g, "_")}_history.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export Chat as Print / PDF (triggers native print view)
  const handleExportPDF = () => {
    window.print();
  };

  // 1. Sleek loading state while checking session
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F8FAFD] text-slate-800 font-sans relative overflow-hidden">
        {/* Soft background pastel glow */}
        <div className="absolute w-96 h-96 rounded-full bg-gradient-to-tr from-[#DDD6FE]/60 via-[#FCE7F3]/50 to-[#BAE6FD]/40 blur-[100px] pointer-events-none animate-pulse" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#818CF8] via-[#C084FC] to-[#F472B6] flex items-center justify-center shadow-lg shadow-purple-300/50 animate-pulse mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div className="space-y-1 text-center">
            <p className="text-sm font-semibold text-slate-800">Starting Gemini Chatbot...</p>
            <p className="text-xs text-slate-500">Connecting to Aurora Neural Link</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. ChatGPT-Style Authentication Screen if not logged in
  if (!user) {
    return <AuthScreen />;
  }

  // 3. Authenticated Dashboard with Aurora Glass Theme
  return (
    <div className="relative flex h-[100dvh] min-h-[100dvh] max-h-[100dvh] w-full max-w-[100vw] overflow-hidden bg-[#F8FAFD] dark:bg-[#070A13] text-slate-800 dark:text-slate-200 font-sans">
      {/* Background Aurora Blobs, Particles & Gentle Light Waves */}
      <PrismNeuralBackground />

      {/* Sidebar Navigation */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={(id) => {
          setActiveId(id);
          setActiveView("chat");
          if (typeof window !== "undefined" && window.innerWidth < 768) {
            setIsSidebarOpen(false);
          }
        }}
        onNewChat={() => {
          handleNewChat();
          setActiveView("chat");
          if (typeof window !== "undefined" && window.innerWidth < 768) {
            setIsSidebarOpen(false);
          }
        }}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onOpenSettings={() => {
          setIsSettingsOpen(true);
          if (typeof window !== "undefined" && window.innerWidth < 768) {
            setIsSidebarOpen(false);
          }
        }}
        onOpenProfile={() => {
          setIsProfileOpen(true);
          if (typeof window !== "undefined" && window.innerWidth < 768) {
            setIsSidebarOpen(false);
          }
        }}
        user={user}
        onLogout={logout}
        theme={settings.theme}
        onToggleTheme={handleToggleTheme}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        activeView={activeView}
        onOpenSearchEngine={() => {
          setActiveView("search");
          if (typeof window !== "undefined" && window.innerWidth < 768) {
            setIsSidebarOpen(false);
          }
        }}
      />

      {/* Main Chat Area Stage */}
      <div className="flex-1 flex flex-col h-full min-h-0 min-w-0 relative overflow-hidden z-10">
        {/* Top Header Controls Bar - Aurora Glass */}
        <header className="h-14 sm:h-16 border-b border-white/80 dark:border-white/10 bg-white/70 dark:bg-[#0D1220]/80 backdrop-blur-2xl flex items-center justify-between px-2.5 sm:px-4 md:px-8 shrink-0 z-20 shadow-[0_4px_25px_rgba(147,112,219,0.03)] dark:shadow-none transition-colors">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Sidebar toggle button (Mobile drawer trigger or Desktop re-open) */}
            <button
              id="sidebar-toggle-button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:border-purple-300 dark:hover:border-purple-500/40 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all items-center justify-center shadow-2xs shrink-0 cursor-pointer ${
                !isSidebarOpen ? "flex" : "flex md:hidden"
              }`}
              title={isSidebarOpen ? "Close sidebar" : "Open conversation history"}
              aria-label={isSidebarOpen ? "Close sidebar" : "Open conversation history"}
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Conversation Title or Search Engine Title */}
            <div className="flex flex-col min-w-0">
              {activeView === "search" ? (
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <h1 className="font-display font-bold text-xs sm:text-base tracking-tight text-slate-900 dark:text-white truncate">
                    Real-Time Search
                  </h1>
                  <span className="flex items-center gap-1 text-[9px] sm:text-[10px] py-0.5 px-1.5 sm:px-2 rounded-lg font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-500/40 shadow-2xs shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                    LIVE
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <h1 className="font-display font-bold text-xs sm:text-base tracking-tight text-slate-900 dark:text-white truncate max-w-[100px] xs:max-w-[150px] sm:max-w-xs md:max-w-md">
                    {getActiveConversation()?.title || "Prism AI"}
                  </h1>
                  <span className="text-[9px] sm:text-[10px] py-0.5 px-1.5 sm:px-2.5 rounded-lg font-mono font-medium bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-500/40 shadow-2xs shrink-0 hidden xs:inline-block">
                    {getActiveConversation()?.model || settings.model}
                  </span>
                </div>
              )}

              {/* Status Indicator */}
              <div className="hidden xs:flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500 shadow-[0_0_6px_rgba(20,184,166,0.6)]"></span>
                </span>
                <span className="font-medium text-teal-700 dark:text-teal-400 text-[9px] sm:text-[10px] truncate">
                  {activeView === "search" ? "Google Search Grounded" : "Aurora Neural Link"}
                </span>
                <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">•</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate hidden sm:inline">
                  {activeView === "search" ? "Live Web Intelligence" : "Multimodal Reasoning Engine"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* View Switcher Pill: AI Chat vs Live Search */}
            <div className="flex items-center p-0.5 sm:p-1 rounded-xl sm:rounded-2xl bg-slate-100/90 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-[11px] sm:text-xs shadow-2xs">
              <button
                id="header-tab-chat"
                onClick={() => setActiveView("chat")}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-semibold transition-all cursor-pointer ${
                  activeView === "chat"
                    ? "bg-white dark:bg-[#1C2438] text-purple-700 dark:text-purple-300 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
                title="Switch to AI Chat"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Chat</span>
              </button>
              <button
                id="header-tab-search"
                onClick={() => setActiveView("search")}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-semibold transition-all cursor-pointer ${
                  activeView === "search"
                    ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
                title="Switch to Real-Time Search Engine"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse hidden sm:inline-block" />
              </button>
            </div>

            {/* Theme Toggle Button in Top Header */}
            <button
              onClick={handleToggleTheme}
              className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:border-purple-300 dark:hover:border-purple-500/40 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-2xs cursor-pointer"
              title={`Switch to ${settings.theme === "dark" ? "light" : "dark"} mode`}
              aria-label="Toggle color theme"
            >
              {settings.theme === "dark" ? (
                <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
              ) : (
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
              )}
            </button>

            {/* User Quick Profile Button in Header */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="hidden md:flex items-center gap-2 p-1.5 pr-3 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:border-purple-300 dark:hover:border-purple-500/40 text-slate-700 dark:text-slate-200 transition-all text-xs font-medium shadow-2xs cursor-pointer"
              title="My Profile"
            >
              <img
                src={
                  user.avatarUrl ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`
                }
                alt={user.name}
                className="w-6 h-6 rounded-xl object-cover ring-1 ring-purple-300 dark:ring-purple-500/40"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`;
                }}
              />
              <span className="max-w-[90px] truncate">{user.name}</span>
            </button>

            {/* Settings button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:border-purple-300 dark:hover:border-purple-500/40 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all font-sans flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Application Settings"
              aria-label="Application Settings"
            >
              <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-semibold hidden lg:inline">Settings</span>
            </button>
          </div>
        </header>

        {/* Dynamic Main Body: Real-Time Search Engine or AI Chat */}
        {activeView === "search" ? (
          <RealTimeSearchEngine
            onClose={() => setActiveView("chat")}
            onContinueInChat={handleContinueSearchInChat}
            token={token}
          />
        ) : (
          <>
            {/* Dynamic Chat Area Body */}
            <ChatArea
              messages={getActiveConversation()?.messages || []}
              settings={settings}
              onCopyText={handleCopyText}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
              onRegenerateMessage={handleRegenerateMessage}
              isGenerating={isGenerating}
              onRetry={handleRetry}
              apiError={apiError}
              isOnline={isOnline}
              suggestedPrompts={SUGGESTED_PROMPTS}
              onSelectPrompt={(p) => handleSendMessage(p, null)}
            />

            {/* Input Text/Doc Stage */}
            <InputArea
              onSendMessage={handleSendMessage}
              isGenerating={isGenerating}
              onSelectPrompt={(p) => handleSendMessage(p, null)}
              searchGroundingEnabled={settings.useSearchGrounding !== false}
              onToggleSearchGrounding={(enabled) =>
                setSettings((prev) => ({ ...prev, useSearchGrounding: enabled }))
              }
              onOpenSearchEngine={() => setActiveView("search")}
            />
          </>
        )}
      </div>

      {/* Settings Dialog Overlay */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        onClearHistory={handleClearAllHistory}
        onExportTXT={handleExportTXT}
        onExportPDF={handleExportPDF}
      />

      {/* Profile & Account Security Dialog */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Cinematic Background Studio Modal */}
      <CinematicBackgroundStudio
        isOpen={isCinematicStudioOpen}
        onClose={() => setIsCinematicStudioOpen(false)}
        onInsertToChat={handleInsertCinematicToChat}
        initialImage={cinematicStudioImage}
      />
    </div>
  );
}
