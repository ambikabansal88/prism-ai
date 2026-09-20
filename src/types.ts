export interface FileAttachment {
  name: string;
  type: string; // 'image' | 'pdf' | 'text' | 'other'
  size: number;
  base64Data: string; // Raw base64 string
  mimeType: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isGenerating?: boolean;
  isError?: boolean;
  file?: {
    name: string;
    type: string;
    size: number;
    mimeType: string;
    imageUrl?: string; // If it's an image, used for preview
  };
  generatedImagePrompt?: string; // If this message was an image generation prompt
  enhancedImagePrompt?: string; // Enhanced photorealistic prompt used for generation
  imageStyle?: string; // e.g. "photorealistic", "cinematic", "portrait", "nature"
  generatedImageUrl?: string; // Full URL / data URL for generated images
  imageModel?: string; // Model or engine used to generate the image
  aspectRatio?: string; // Requested aspect ratio
  isImageMode?: boolean; // If triggered via image generator mode
  searchGrounding?: {
    queries?: string[];
    sources?: Array<{
      uri: string;
      title: string;
      domain?: string;
    }>;
    searchEntryPointHtml?: string;
  };
  usedSearchGrounding?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  temperature: number;
  systemInstruction?: string;
  createdAt: string;
  useSearchGrounding?: boolean;
}

export interface Settings {
  theme: "light" | "dark";
  fontSize: "sm" | "base" | "lg" | "xl";
  temperature: number;
  model: string;
  autoSpeak: boolean;
  voiceName: string;
  useSearchGrounding?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  provider?: "local" | "google";
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

export interface SearchSource {
  uri: string;
  title: string;
  domain?: string;
  snippet?: string;
}

export interface SearchResult {
  query: string;
  answer: string;
  sources: SearchSource[];
  queries: string[];
  relatedQueries: string[];
  keyTakeaways: string[];
  category?: string;
  timeRange?: string;
  searchTimeMs: number;
  timestamp: string;
  model?: string;
}
