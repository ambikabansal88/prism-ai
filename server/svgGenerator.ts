/**
 * Generative SVG Visual Engine
 * Creates rich, scalable vector artwork tailored to user prompts
 * when remote image models have 0 quota or are unavailable.
 */

interface ThemeConfig {
  bgStart: string;
  bgEnd: string;
  accent: string;
  secondary: string;
  glow: string;
  elements: string[];
}

export function generatePromptSvg(prompt: string, aspectRatio = "1:1"): string {
  const p = prompt.toLowerCase();

  let width = 1024;
  let height = 1024;
  if (aspectRatio === "16:9") {
    width = 1024;
    height = 576;
  } else if (aspectRatio === "9:16") {
    width = 576;
    height = 1024;
  } else if (aspectRatio === "4:3") {
    width = 1024;
    height = 768;
  } else if (aspectRatio === "3:4") {
    width = 768;
    height = 1024;
  }

  // Theme matching
  let theme: ThemeConfig;

  if (p.includes("sunset") || p.includes("sunrise") || p.includes("dusk") || p.includes("dawn") || p.includes("golden hour")) {
    theme = {
      bgStart: "#1e1b4b", // deep indigo
      bgEnd: "#f97316",   // warm orange
      accent: "#fbbf24",  // amber gold
      secondary: "#ec4899", // pink coral
      glow: "#fef08a",
      elements: ["sunset", "sun", "mountains", "birds", "reflection"],
    };
  } else if (p.includes("space") || p.includes("galaxy") || p.includes("star") || p.includes("cosmic") || p.includes("universe") || p.includes("astronaut") || p.includes("moon")) {
    theme = {
      bgStart: "#030712",
      bgEnd: "#1e1b4b",
      accent: "#818cf8",
      secondary: "#c084fc",
      glow: "#38bdf8",
      elements: ["space", "stars", "planet", "nebula"],
    };
  } else if (p.includes("ocean") || p.includes("sea") || p.includes("water") || p.includes("beach") || p.includes("wave") || p.includes("underwater")) {
    theme = {
      bgStart: "#082f49",
      bgEnd: "#0284c7",
      accent: "#38bdf8",
      secondary: "#2dd4bf",
      glow: "#a5f3fc",
      elements: ["ocean", "waves", "foam", "distant_hills"],
    };
  } else if (p.includes("forest") || p.includes("tree") || p.includes("nature") || p.includes("mountain") || p.includes("garden") || p.includes("leaf")) {
    theme = {
      bgStart: "#064e3b",
      bgEnd: "#022c22",
      accent: "#34d399",
      secondary: "#a7f3d0",
      glow: "#fef08a",
      elements: ["nature", "mountains", "pines", "mist"],
    };
  } else if (p.includes("cyber") || p.includes("tech") || p.includes("neon") || p.includes("future") || p.includes("robot") || p.includes("ai") || p.includes("matrix") || p.includes("code")) {
    theme = {
      bgStart: "#09090b",
      bgEnd: "#18181b",
      accent: "#06b6d4",
      secondary: "#ec4899",
      glow: "#a855f7",
      elements: ["cyber", "grid", "nodes", "glowing_rings"],
    };
  } else {
    // Elegant modern abstract art
    theme = {
      bgStart: "#0f172a",
      bgEnd: "#334155",
      accent: "#6366f1",
      secondary: "#f43f5e",
      glow: "#38bdf8",
      elements: ["abstract", "fluid_waves", "orbs", "geometric"],
    };
  }

  // Generate SVG layers
  const cx = width / 2;
  const cy = height / 2;

  let visualElements = "";

  if (theme.elements.includes("sunset")) {
    visualElements += `
      <!-- Glowing Sun -->
      <circle cx="${cx}" cy="${cy - 50}" r="140" fill="url(#sunGlow)" filter="url(#softGlow)" />
      <circle cx="${cx}" cy="${cy - 50}" r="100" fill="${theme.accent}" />

      <!-- Mountain Range Back -->
      <path d="M0,${height * 0.65} Q${width * 0.25},${height * 0.45} ${width * 0.5},${height * 0.6} T${width},${height * 0.55} L${width},${height} L0,${height} Z" fill="#431407" opacity="0.8" />
      
      <!-- Mountain Range Middle -->
      <path d="M0,${height * 0.72} Q${width * 0.35},${height * 0.58} ${width * 0.7},${height * 0.7} T${width},${height * 0.68} L${width},${height} L0,${height} Z" fill="#260f06" opacity="0.9" />

      <!-- Foreground Ridge / Water -->
      <path d="M0,${height * 0.82} C${width * 0.3},${height * 0.8} ${width * 0.7},${height * 0.85} ${width},${height * 0.82} L${width},${height} L0,${height} Z" fill="#180702" />

      <!-- Flying birds silhouettes -->
      <path d="M${cx - 180},${cy - 160} Q${cx - 170},${cy - 175} ${cx - 160},${cy - 160} Q${cx - 150},${cy - 175} ${cx - 140},${cy - 160} L${cx - 160},${cy - 162} Z" fill="#ffffff" opacity="0.75"/>
      <path d="M${cx + 120},${cy - 200} Q${cx + 130},${cy - 212} ${cx + 140},${cy - 200} Q${cx + 150},${cy - 212} ${cx + 160},${cy - 200} L${cx + 140},${cy - 202} Z" fill="#ffffff" opacity="0.6"/>
    `;
  } else if (theme.elements.includes("space")) {
    // Generate star field
    let stars = "";
    for (let i = 0; i < 45; i++) {
      const sx = Math.floor((Math.sin(i * 99) * 0.5 + 0.5) * width);
      const sy = Math.floor((Math.cos(i * 77) * 0.5 + 0.5) * height);
      const r = (i % 3) + 1;
      const op = (i % 5 + 3) / 10;
      stars += `<circle cx="${sx}" cy="${sy}" r="${r}" fill="#ffffff" opacity="${op}" />`;
    }
    visualElements += `
      ${stars}
      <!-- Celestial Nebula Glow -->
      <ellipse cx="${cx - 100}" cy="${cy}" rx="300" ry="180" fill="${theme.secondary}" opacity="0.25" filter="url(#blurGlow)" />
      <ellipse cx="${cx + 150}" cy="${cy + 50}" rx="250" ry="140" fill="${theme.glow}" opacity="0.2" filter="url(#blurGlow)" />
      
      <!-- Planet with Ring -->
      <g transform="translate(${cx}, ${cy - 40}) rotate(-25)">
        <ellipse cx="0" cy="0" rx="260" ry="40" fill="none" stroke="${theme.accent}" stroke-width="8" opacity="0.8" filter="url(#softGlow)" />
        <circle cx="0" cy="0" r="110" fill="url(#planetGradient)" />
        <!-- Planet Atmosphere -->
        <circle cx="0" cy="0" r="110" fill="url(#planetLight)" opacity="0.6" />
      </g>
    `;
  } else if (theme.elements.includes("ocean")) {
    visualElements += `
      <!-- Sun or Moon reflection -->
      <circle cx="${cx}" cy="${height * 0.35}" r="80" fill="${theme.glow}" opacity="0.9" filter="url(#softGlow)" />
      
      <!-- Rolling Ocean Waves -->
      <path d="M0,${height * 0.5} Q${width * 0.25},${height * 0.46} ${width * 0.5},${height * 0.5} T${width},${height * 0.5} L${width},${height} L0,${height} Z" fill="${theme.bgStart}" opacity="0.6" />
      <path d="M0,${height * 0.62} C${width * 0.3},${height * 0.56} ${width * 0.6},${height * 0.68} ${width},${height * 0.6} L${width},${height} L0,${height} Z" fill="${theme.bgEnd}" opacity="0.75" />
      <path d="M0,${height * 0.74} C${width * 0.2},${height * 0.8} ${width * 0.7},${height * 0.7} ${width},${height * 0.76} L${width},${height} L0,${height} Z" fill="${theme.accent}" opacity="0.85" />
      <path d="M0,${height * 0.86} C${width * 0.4},${height * 0.82} ${width * 0.8},${height * 0.9} ${width},${height * 0.85} L${width},${height} L0,${height} Z" fill="#0369a1" />
      
      <!-- Foam crest lines -->
      <path d="M0,${height * 0.74} C${width * 0.2},${height * 0.79} ${width * 0.7},${height * 0.69} ${width},${height * 0.75}" stroke="#e0f2fe" stroke-width="3" fill="none" opacity="0.7" />
    `;
  } else if (theme.elements.includes("nature")) {
    visualElements += `
      <!-- Distant Mist & Mountains -->
      <path d="M0,${height * 0.5} L${width * 0.35},${height * 0.28} L${width * 0.65},${height * 0.45} L${width},${height * 0.32} L${width},${height} L0,${height} Z" fill="#065f46" opacity="0.4" />
      <path d="M0,${height * 0.6} L${width * 0.45},${height * 0.4} L${width},${height * 0.55} L${width},${height} L0,${height} Z" fill="#047857" opacity="0.6" />
      
      <!-- Pines Silhouette layer -->
      <g fill="#022c22">
        <polygon points="${width * 0.1},${height * 0.55} ${width * 0.05},${height * 0.85} ${width * 0.15},${height * 0.85}" />
        <polygon points="${width * 0.2},${height * 0.52} ${width * 0.14},${height * 0.85} ${width * 0.26},${height * 0.85}" />
        <polygon points="${width * 0.35},${height * 0.58} ${width * 0.28},${height * 0.88} ${width * 0.42},${height * 0.88}" />
        <polygon points="${width * 0.75},${height * 0.5} ${width * 0.68},${height * 0.85} ${width * 0.82},${height * 0.85}" />
        <polygon points="${width * 0.88},${height * 0.53} ${width * 0.82},${height * 0.85} ${width * 0.94},${height * 0.85}" />
      </g>
      <rect x="0" y="${height * 0.82}" width="${width}" height="${height * 0.18}" fill="#022c22" />
    `;
  } else if (theme.elements.includes("cyber")) {
    visualElements += `
      <!-- Perspective Cyber Grid -->
      <g stroke="${theme.accent}" stroke-width="1.5" opacity="0.3">
        <line x1="0" y1="${height * 0.7}" x2="${width}" y2="${height * 0.7}" />
        <line x1="0" y1="${height * 0.76}" x2="${width}" y2="${height * 0.76}" />
        <line x1="0" y1="${height * 0.84}" x2="${width}" y2="${height * 0.84}" />
        <line x1="0" y1="${height * 0.94}" x2="${width}" y2="${height * 0.94}" />
        <line x1="${cx}" y1="${height * 0.65}" x2="0" y2="${height}" />
        <line x1="${cx}" y1="${height * 0.65}" x2="${width * 0.25}" y2="${height}" />
        <line x1="${cx}" y1="${height * 0.65}" x2="${width * 0.5}" y2="${height}" />
        <line x1="${cx}" y1="${height * 0.65}" x2="${width * 0.75}" y2="${height}" />
        <line x1="${cx}" y1="${height * 0.65}" x2="${width}" y2="${height}" />
      </g>

      <!-- Glowing Cyber Core / Hexagon -->
      <g transform="translate(${cx}, ${cy - 50})">
        <polygon points="0,-120 104,-60 104,60 0,120 -104,60 -104,-60" fill="none" stroke="${theme.secondary}" stroke-width="4" filter="url(#softGlow)" />
        <circle cx="0" cy="0" r="70" fill="url(#cyberCore)" filter="url(#softGlow)" />
        <circle cx="0" cy="0" r="40" fill="${theme.accent}" />
      </g>
    `;
  } else {
    // Abstract Flow
    visualElements += `
      <!-- Ethereal flowing ribbons -->
      <path d="M-100,${height * 0.3} C${width * 0.3},${height * 0.1} ${width * 0.6},${height * 0.7} ${width + 100},${height * 0.4} L${width + 100},${height} L-100,${height} Z" fill="url(#flowGradient1)" opacity="0.65" />
      <path d="M-100,${height * 0.55} C${width * 0.4},${height * 0.85} ${width * 0.7},${height * 0.35} ${width + 100},${height * 0.65} L${width + 100},${height} L-100,${height} Z" fill="url(#flowGradient2)" opacity="0.75" />
      
      <!-- Glowing Orbs -->
      <circle cx="${cx - 120}" cy="${cy - 80}" r="110" fill="${theme.accent}" opacity="0.5" filter="url(#blurGlow)" />
      <circle cx="${cx + 140}" cy="${cy + 60}" r="90" fill="${theme.secondary}" opacity="0.4" filter="url(#blurGlow)" />
      <circle cx="${cx}" cy="${cy}" r="130" fill="none" stroke="${theme.glow}" stroke-width="2.5" opacity="0.8" filter="url(#softGlow)" />
    `;
  }

  // Sanitize prompt for SVG label text
  const cleanLabel = prompt
    .replace(/<[^>]*>?/gm, "")
    .replace(/["'&]/g, " ")
    .slice(0, 45);

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="mainBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${theme.bgStart}" />
      <stop offset="100%" stop-color="${theme.bgEnd}" />
    </linearGradient>

    <!-- Sun Glow -->
    <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${theme.glow}" stop-opacity="1" />
      <stop offset="60%" stop-color="${theme.accent}" stop-opacity="0.8" />
      <stop offset="100%" stop-color="${theme.secondary}" stop-opacity="0" />
    </radialGradient>

    <!-- Planet Gradient -->
    <linearGradient id="planetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.accent}" />
      <stop offset="100%" stop-color="${theme.bgStart}" />
    </linearGradient>
    <radialGradient id="planetLight" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.8" />
    </radialGradient>

    <!-- Cyber Core -->
    <radialGradient id="cyberCore" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="40%" stop-color="${theme.accent}" />
      <stop offset="100%" stop-color="${theme.secondary}" stop-opacity="0" />
    </radialGradient>

    <!-- Flow Gradients -->
    <linearGradient id="flowGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.accent}" />
      <stop offset="100%" stop-color="${theme.secondary}" />
    </linearGradient>
    <linearGradient id="flowGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${theme.glow}" />
      <stop offset="100%" stop-color="${theme.bgStart}" />
    </linearGradient>

    <!-- Soft Glow Filter -->
    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="16" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <!-- Heavy Blur Glow -->
    <filter id="blurGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="48" />
    </filter>
  </defs>

  <!-- Base Canvas Canvas -->
  <rect width="${width}" height="${height}" fill="url(#mainBg)" />

  <!-- Themed Illustration Elements -->
  ${visualElements}

  <!-- Vignette Overlay -->
  <rect width="${width}" height="${height}" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="24" />

  <!-- Bottom Brand & Prompt Overlay Pill -->
  <g transform="translate(32, ${height - 64})">
    <rect width="${Math.min(width - 64, 480)}" height="40" rx="20" fill="rgba(15,23,42,0.75)" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
    <circle cx="20" cy="20" r="6" fill="${theme.accent}" />
    <text x="34" y="24" fill="#f8fafc" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="600" letter-spacing="0.2px">
      ${cleanLabel}
    </text>
  </g>

  <g transform="translate(${width - 190}, ${height - 44})">
    <text x="0" y="0" fill="rgba(255,255,255,0.5)" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="500">
      Prism Visual Engine
    </text>
  </g>
</svg>
  `.trim();

  const base64Svg = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${base64Svg}`;
}
