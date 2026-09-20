/**
 * Helper to detect and extract image generation prompts from user input
 */

export interface ImageRequestResult {
  isImageRequest: boolean;
  cleanPrompt: string;
  isExplicitRealistic?: boolean;
}

const DEFAULT_REALISTIC_PROMPTS = [
  "A breathtaking cinematic landscape of towering snow-capped mountain peaks reflected in a crystal turquoise alpine lake at golden hour, soft atmospheric mist rising from the water, dramatic natural lighting, shot on 35mm f/2.8 lens, hyperrealistic 8k photography",
  "A majestic snow leopard perched on a frost-covered Himalayan mountain ridge at golden sunrise, piercing amber eyes, ultra-detailed fur texture, cinematic depth of field, 8k National Geographic photography",
  "A stunning architectural portrait of a modern luxury glass villa cantilevered over a serene coastal cliff at twilight, warm ambient interior illumination, hyper-realistic reflections on infinity pool, 8k resolution",
  "A close-up candid portrait of an elderly watchmaker working on an intricate antique brass timepiece in a sunlit workshop, dust motes in golden sunbeams, macro lens detail, authentic realism",
];

export function parseImageRequest(rawContent: string): ImageRequestResult {
  if (!rawContent || typeof rawContent !== "string") {
    return { isImageRequest: false, cleanPrompt: "" };
  }

  // Normalize multi-spaces and trim
  const trimmed = rawContent.trim().replace(/\s+/g, " ");
  const lower = trimmed.toLowerCase();

  const getRandomRealisticDefault = () => {
    const idx = Math.floor(Math.random() * DEFAULT_REALISTIC_PROMPTS.length);
    return DEFAULT_REALISTIC_PROMPTS[idx];
  };

  // 1. Direct slash commands: /image, /imagine, /draw, /img, /pic, /generate-image
  const slashCommands = ["/image", "/imagine", "/draw", "/img", "/pic", "/generate-image"];
  for (const cmd of slashCommands) {
    if (lower.startsWith(cmd + " ") || lower === cmd) {
      const remainder = trimmed.substring(cmd.length).trim();
      const clean = cleanPromptText(remainder);
      return {
        isImageRequest: true,
        cleanPrompt: clean || getRandomRealisticDefault(),
        isExplicitRealistic: lower.includes("real") || lower.includes("photo"),
      };
    }
  }

  // 2. Direct check for standalone/open realistic image requests:
  // e.g. "generate a realistic images", "generate realistic images", "generate a realistic image", "generate realistic photo", "realistic images", "make a realistic image"
  const standaloneRealisticRegex =
    /^(?:please\s+)?(?:can\s+you\s+|could\s+you\s+|would\s+you\s+)?(?:generate|create|make|produce|render|draw|show\s+me|display|give\s+me)?\s*(?:an?\s+|some\s+)?(?:hyper-?realistic|photorealistic|ultra-?realistic|realistic|cinematic|high-?detail|real-?life|hd|8k|4k)?\s*(?:images?|photos?|pictures?|photographs?|portraits?|renders?|wallpapers?)\s*$/i;

  if (standaloneRealisticRegex.test(trimmed)) {
    // Check if it specifically requested realistic
    const isRealistic = /realistic|photo|cinematic|real|8k|hd/i.test(trimmed);
    return {
      isImageRequest: true,
      cleanPrompt: getRandomRealisticDefault(),
      isExplicitRealistic: isRealistic,
    };
  }

  // 3. Realistic image request with a subject or description:
  // e.g. "generate a realistic images of...", "generate realistic photo of...", "make a realistic image showing..."
  const realisticWithSubjectRegex =
    /^(?:please\s+)?(?:can\s+you\s+|could\s+you\s+|would\s+you\s+)?(?:generate|create|make|produce|render|synthesize|draw|paint|sketch|show\s+me|give\s+me|display)\s+(?:me\s+)?(?:an?\s+|some\s+)?(?:hyper-?realistic|photorealistic|ultra-?realistic|realistic|cinematic|high-?detail|real-?life|beautiful|stunning|high-?quality|hd|8k|4k)\s+(?:images?|photos?|pictures?|photographs?|illustrations?|portraits?|artworks?|wallpapers?|renders?)(?:\s+(?:of|showing|depicting|about|with|featuring)|\s*:)?\s*(.*)$/i;

  const realisticMatch = trimmed.match(realisticWithSubjectRegex);
  if (realisticMatch) {
    const rawSubject = (realisticMatch[1] || "").trim();
    const clean = cleanPromptText(rawSubject);
    return {
      isImageRequest: true,
      cleanPrompt: clean || getRandomRealisticDefault(),
      isExplicitRealistic: true,
    };
  }

  // 4. Quick action prompt & template patterns
  if (lower.includes("illustration of") || lower.includes("high-quality digital illustration")) {
    const idx = lower.indexOf("illustration of");
    if (idx !== -1) {
      const remainder = trimmed.substring(idx + "illustration of".length).trim();
      const clean = cleanPromptText(remainder);
      return {
        isImageRequest: true,
        cleanPrompt: clean || "a beautiful digital illustration",
        isExplicitRealistic: false,
      };
    }
  }

  // 5. Direct noun-phrase image requests: "image of...", "an image of...", "photo of...", "realistic picture of..."
  const directNounMatch = trimmed.match(
    /^(?:an?\s+|some\s+)?(?:high-quality\s+|hd\s+|realistic\s+|photorealistic\s+|cinematic\s+|beautiful\s+|stunning\s+)?(?:images?|photos?|pictures?|photographs?|illustrations?|drawings?|sketches?|wallpapers?|portraits?|artworks?)\s+(?:of|showing|depicting|about|featuring)\s+(.+)$/i
  );
  if (directNounMatch && directNounMatch[1]) {
    const clean = cleanPromptText(directNounMatch[1]);
    if (clean.length > 0) {
      return {
        isImageRequest: true,
        cleanPrompt: clean,
        isExplicitRealistic: /realistic|photo|cinematic/i.test(trimmed),
      };
    }
  }

  // 6. Imperative/Request patterns ("show me an image of...", "can you give me a picture of...")
  const imperativeMatch = trimmed.match(
    /^(?:please\s+)?(?:can\s+you\s+|could\s+you\s+|would\s+you\s+)?(?:show\s+me|give\s+me|send\s+me|find\s+me|display|provide)?\s*(?:an?\s+|some\s+)?(?:images?|pictures?|photos?|illustrations?|drawings?|renders?|wallpapers?)\s+(?:of|showing|depicting|about|featuring)\s+(.+)$/i
  );
  if (imperativeMatch && imperativeMatch[1]) {
    const clean = cleanPromptText(imperativeMatch[1]);
    if (clean.length > 0) {
      return {
        isImageRequest: true,
        cleanPrompt: clean,
        isExplicitRealistic: /realistic|photo|cinematic/i.test(trimmed),
      };
    }
  }

  // 7. General action verbs ("generate", "create", "make", "draw", "paint", "produce") with plural/singular
  const patterns: RegExp[] = [
    /^(?:please\s+)?(?:can\s+you\s+)?(?:could\s+you\s+)?(?:generate|create|make|produce|render|synthesize|draw|paint|sketch|write)\s+(?:me\s+)?(?:an?\s+|some\s+)?(?:beautiful\s+|high-quality\s+|stunning\s+|realistic\s+|photorealistic\s+)?(?:images?|pictures?|photos?|illustrations?|drawings?|artworks?|renders?|paintings?)(?:\s+(?:of|showing|about|depicting|featuring)|\s*:)?\s*(.*)$/i,
    /^(?:please\s+)?(?:can\s+you\s+)?(?:could\s+you\s+)?(?:draw|paint|sketch|illustrate)\s+(?:me\s+)?(?:an?\s+)?(?:images?\s+of\s+|pictures?\s+of\s+|illustrations?\s+of\s+)?(.*)$/i,
    /^(?:generate|create|make|draw|paint)\s+images?\s*[:\s-]\s*(.*)$/i,
    /(?:generate|create|draw|paint|make)\s+(?:an?\s+|some\s+)?(?:images?|pictures?|photos?|illustrations?)\s+(?:of|showing|depicting|about|featuring)\s+(.*)$/i,
    /^(?:show|display)\s+(?:an?\s+|some\s+)?(?:images?|pictures?|photos?)\s+(?:of|showing|depicting|featuring)\s+(.*)$/i,
  ];

  for (const regex of patterns) {
    const match = trimmed.match(regex);
    if (match) {
      const candidate = (match[1] || "").trim();
      const clean = cleanPromptText(candidate);
      if (clean.length > 0) {
        return {
          isImageRequest: true,
          cleanPrompt: clean,
          isExplicitRealistic: /realistic|photo|cinematic/i.test(trimmed),
        };
      } else {
        return {
          isImageRequest: true,
          cleanPrompt: getRandomRealisticDefault(),
          isExplicitRealistic: /realistic|photo|cinematic/i.test(trimmed),
        };
      }
    }
  }

  // 8. Intent trigger phrases fallback
  const intentPhrases = [
    "generate an image of",
    "generate an image for",
    "generate an image:",
    "generate images of",
    "generate image of",
    "generate image for",
    "generate image:",
    "create an image of",
    "create an image for",
    "create an image:",
    "create images of",
    "create image of",
    "create image for",
    "create image:",
    "draw an image of",
    "draw a picture of",
    "draw a photo of",
    "draw an illustration of",
    "generate a picture of",
    "create a picture of",
    "generate an illustration of",
    "create an illustration of",
    "make an image of",
    "make a picture of",
    "write an image of",
    "paint an image of",
    "show me an image of",
    "show me a picture of",
    "give me an image of",
    "give me a picture of",
    "realistic image of",
    "realistic photo of",
    "image of ",
    "photo of ",
    "picture of ",
  ];

  for (const phrase of intentPhrases) {
    const idx = lower.indexOf(phrase);
    if (idx !== -1) {
      const remainder = trimmed.substring(idx + phrase.length).trim();
      const clean = cleanPromptText(remainder);
      if (clean.length > 0) {
        return {
          isImageRequest: true,
          cleanPrompt: clean,
          isExplicitRealistic: /realistic|photo|cinematic/i.test(trimmed),
        };
      }
    }
  }

  return { isImageRequest: false, cleanPrompt: trimmed };
}

/**
 * Remove noise, leading colons, quotes, question marks, and helper prepositions
 */
function cleanPromptText(text: string): string {
  let cleaned = text.trim();
  // Strip leading colons, hyphens, spaces
  cleaned = cleaned.replace(/^[:\s-]+/, "");
  // Strip leading preposition/articles
  cleaned = cleaned.replace(/^(?:of|showing|depicting|with)\s+/i, "");
  // Strip leading and trailing quotes
  cleaned = cleaned.replace(/^["'`]+|["'`]+$/g, "");
  // Strip trailing question mark or period
  cleaned = cleaned.replace(/[?]+$/, "");
  return cleaned.trim();
}
