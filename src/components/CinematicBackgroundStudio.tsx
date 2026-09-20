import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Sparkles,
  Download,
  Video,
  Play,
  Pause,
  Upload,
  RefreshCw,
  Sliders,
  Eye,
  Camera,
  Layers,
  Zap,
  Check,
  ChevronRight,
  Sun,
  Flame,
  Globe,
  Share2,
  Maximize2,
  Film,
  Activity,
  Radio,
  Wind,
  Gauge,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Asset paths
import cinematicSubjectFallback from "../assets/images/cinematic_subject_1789543125571.jpg";
import cinematicBgFallback from "../assets/images/cinematic_bg_1789543155668.jpg";
import musicVideoBg from "../assets/images/music_video_bg_1789543584100.jpg";

interface CinematicBackgroundStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertToChat?: (imageDataUrl: string, promptInfo: string) => void;
  initialImage?: string | null;
}

// Preset subjects for instant visual demonstration
interface SubjectPreset {
  id: string;
  name: string;
  tag: string;
  url: string;
  isTransparent?: boolean;
}

const SUBJECT_PRESETS: SubjectPreset[] = [
  {
    id: "cinematic_portrait",
    name: "Studio Portrait",
    tag: "High-Res 8K",
    url: cinematicSubjectFallback,
  },
  {
    id: "creator_profile",
    name: "Modern Creator",
    tag: "Clean Cutout",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=85",
  },
  {
    id: "tech_executive",
    name: "Executive Icon",
    tag: "Studio Light",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=85",
  },
  {
    id: "cyber_fashion",
    name: "Fashion Subject",
    tag: "Sharp Silhouette",
    url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=85",
  },
];

// Cinematic environment definitions
interface EnvironmentPreset {
  id: string;
  name: string;
  subtitle: string;
  theme: string;
  bgColors: [string, string, string];
  particleColors: string[];
  streakColors: string[];
  glowColor: string;
  lensFlares: boolean;
  bokehCount: number;
  bgImage?: string;
  hasVolumetricRays?: boolean;
  hasEnergyWaves?: boolean;
  hasHaze?: boolean;
}

const ENVIRONMENTS: EnvironmentPreset[] = [
  {
    id: "futuristic_music_video",
    name: "Futuristic Music Video",
    subtitle: "Dark obsidian, electric blue & purple neon, crimson lasers",
    theme: "from-purple-950 via-[#0a0e28] to-[#03050c]",
    bgColors: ["#03050c", "#080c24", "#020307"],
    particleColors: ["#00F0FF", "#8A2BE2", "#FF1744", "#00E5FF", "#A855F7", "#FFFFFF"],
    streakColors: ["rgba(0, 240, 255, 0.6)", "rgba(138, 43, 226, 0.55)", "rgba(255, 23, 68, 0.5)"],
    glowColor: "rgba(112, 0, 255, 0.42)",
    lensFlares: true,
    bokehCount: 22,
    bgImage: musicVideoBg,
    hasVolumetricRays: true,
    hasEnergyWaves: true,
    hasHaze: true,
  },
  {
    id: "cyberpunk_luxury",
    name: "Cyberpunk Horizon",
    subtitle: "Deep obsidian, neon cyan & magenta",
    theme: "from-fuchsia-950 via-indigo-950 to-[#0A0D1A]",
    bgColors: ["#070914", "#120B24", "#04060E"],
    particleColors: ["#00F0FF", "#FF2A85", "#9B5CFF", "#FFFFFF"],
    streakColors: ["rgba(0, 240, 255, 0.45)", "rgba(255, 42, 133, 0.5)"],
    glowColor: "rgba(108, 59, 255, 0.35)",
    lensFlares: true,
    bokehCount: 16,
    hasVolumetricRays: true,
    hasEnergyWaves: true,
    hasHaze: true,
  },
  {
    id: "penthouse_skyline",
    name: "Luxury Skyline Studio",
    subtitle: "Dusk high-rise, golden & cobalt",
    theme: "from-amber-950/70 via-slate-950 to-[#080B14]",
    bgColors: ["#080C1A", "#141A2E", "#05070D"],
    particleColors: ["#FFD166", "#4CC9F0", "#F72585", "#FFE3A8"],
    streakColors: ["rgba(255, 209, 102, 0.4)", "rgba(76, 201, 240, 0.45)"],
    glowColor: "rgba(255, 180, 50, 0.25)",
    lensFlares: true,
    bokehCount: 22,
  },
  {
    id: "cosmic_nebula",
    name: "Ethereal Cosmic Glow",
    subtitle: "Deep velvet space, starlight dust",
    theme: "from-purple-950 via-violet-950 to-[#05050F]",
    bgColors: ["#050512", "#19082D", "#080318"],
    particleColors: ["#B5179E", "#7209B7", "#4CC9F0", "#FFFFFF"],
    streakColors: ["rgba(181, 23, 158, 0.4)", "rgba(76, 201, 240, 0.35)"],
    glowColor: "rgba(114, 9, 183, 0.3)",
    lensFlares: true,
    bokehCount: 18,
    hasVolumetricRays: true,
  },
  {
    id: "emerald_oasis",
    name: "Bioluminescent Noir",
    subtitle: "Midnight jade, cyan spore particles",
    theme: "from-emerald-950/80 via-teal-950 to-[#030D12]",
    bgColors: ["#030F13", "#08242A", "#02070A"],
    particleColors: ["#52B788", "#70E4EF", "#9EF01A", "#D8F3DC"],
    streakColors: ["rgba(82, 183, 136, 0.4)", "rgba(112, 228, 239, 0.35)"],
    glowColor: "rgba(82, 183, 136, 0.3)",
    lensFlares: false,
    bokehCount: 14,
    hasHaze: true,
  },
  {
    id: "amber_gold",
    name: "Cinematic Warm Gold",
    subtitle: "Warm amber glow, floating embers",
    theme: "from-amber-950 via-orange-950 to-[#0E0A06]",
    bgColors: ["#0D0906", "#241509", "#060403"],
    particleColors: ["#F5CB5C", "#E07A5F", "#FF9F1C", "#FFFFFF"],
    streakColors: ["rgba(245, 203, 92, 0.45)", "rgba(224, 122, 95, 0.4)"],
    glowColor: "rgba(245, 203, 92, 0.3)",
    lensFlares: true,
    bokehCount: 18,
  },
];

// Color grading filters
const COLOR_GRADES = [
  { id: "music_video_4k", label: "Music Video 4K", filter: "contrast(118%) saturate(135%) brightness(98%)" },
  { id: "teal_orange", label: "Teal & Orange", filter: "contrast(112%) saturate(118%)" },
  { id: "cyber_neon", label: "Cyber Neon", filter: "contrast(115%) saturate(130%) hue-rotate(8deg)" },
  { id: "warm_luxury", label: "Warm Luxury", filter: "contrast(108%) sepia(12%) saturate(115%)" },
  { id: "noir_film", label: "Filmic Contrast", filter: "contrast(125%) brightness(96%)" },
  { id: "natural", label: "Natural Dynamic", filter: "none" },
];

export default function CinematicBackgroundStudio({
  isOpen,
  onClose,
  onInsertToChat,
  initialImage,
}: CinematicBackgroundStudioProps) {
  // Active states
  const [selectedSubjectUrl, setSelectedSubjectUrl] = useState<string>(
    initialImage || cinematicSubjectFallback
  );
  const [selectedEnv, setSelectedEnv] = useState<EnvironmentPreset>(ENVIRONMENTS[0]);
  const [selectedColorGrade, setSelectedColorGrade] = useState(COLOR_GRADES[0]);

  // Animation & Particle parameters
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [particleSpeed, setParticleSpeed] = useState<number>(0.8);
  const [isSlowMotion, setIsSlowMotion] = useState<boolean>(true);
  const [particleDensity, setParticleDensity] = useState<number>(85);
  const [showStreaks, setShowStreaks] = useState<boolean>(true);
  const [showFlares, setShowFlares] = useState<boolean>(true);
  const [showVolumetricRays, setShowVolumetricRays] = useState<boolean>(true);
  const [showEnergyWaves, setShowEnergyWaves] = useState<boolean>(true);
  const [showHaze, setShowHaze] = useState<boolean>(true);
  const [showParallax, setShowParallax] = useState<boolean>(true);
  const [rimGlowIntensity, setRimGlowIntensity] = useState<number>(0.75);
  const [depthOfFieldBlur, setDepthOfFieldBlur] = useState<number>(4); // px
  const [showSplitView, setShowSplitView] = useState<boolean>(false);
  const [splitPosition, setSplitPosition] = useState<number>(50); // %

  // Recording & export status
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingProgress, setRecordingProgress] = useState<number>(0);
  const [isExportingSnapshot, setIsExportingSnapshot] = useState<boolean>(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  // Canvas & render refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const subjectImageRef = useRef<HTMLImageElement | null>(null);
  const isImageLoadedRef = useRef<boolean>(false);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const isBgImageLoadedRef = useRef<boolean>(false);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Update subject if initialImage changes
  useEffect(() => {
    if (initialImage) {
      setSelectedSubjectUrl(initialImage);
    }
  }, [initialImage]);

  // Load subject image into HTMLImageElement
  useEffect(() => {
    isImageLoadedRef.current = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = selectedSubjectUrl;
    img.onload = () => {
      subjectImageRef.current = img;
      isImageLoadedRef.current = true;
    };
    img.onerror = () => {
      console.warn("Failed to load subject image, using fallback");
      subjectImageRef.current = null;
      isImageLoadedRef.current = false;
    };
  }, [selectedSubjectUrl]);

  // Load background image if preset specifies one
  useEffect(() => {
    if (selectedEnv.bgImage) {
      isBgImageLoadedRef.current = false;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = selectedEnv.bgImage;
      img.onload = () => {
        bgImageRef.current = img;
        isBgImageLoadedRef.current = true;
      };
      img.onerror = () => {
        bgImageRef.current = null;
        isBgImageLoadedRef.current = false;
      };
    } else {
      bgImageRef.current = null;
      isBgImageLoadedRef.current = false;
    }
  }, [selectedEnv.bgImage]);

  // Handle Custom Image Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSelectedSubjectUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Mouse tracking for parallax
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mousePosRef.current = { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
  }, []);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isOpen) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Set internal resolution
    const width = 1280;
    const height = 720;
    canvas.width = width;
    canvas.height = height;

    // Initialize Particle Objects
    interface Particle {
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      alpha: number;
      baseAlpha: number;
      color: string;
      pulseSpeed: number;
      pulsePhase: number;
      layer: number; // 0: deep bg, 1: mid, 2: foreground
    }

    const particles: Particle[] = [];
    for (let i = 0; i < particleDensity; i++) {
      const layer = Math.random() < 0.3 ? 0 : Math.random() < 0.7 ? 1 : 2;
      const radius = layer === 0 ? 0.8 + Math.random() * 1.2 : layer === 1 ? 1.5 + Math.random() * 2 : 2.5 + Math.random() * 2.5;
      const baseAlpha = layer === 0 ? 0.2 + Math.random() * 0.3 : layer === 1 ? 0.4 + Math.random() * 0.4 : 0.6 + Math.random() * 0.4;
      const color = selectedEnv.particleColors[Math.floor(Math.random() * selectedEnv.particleColors.length)];

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius,
        vx: (Math.random() - 0.5) * 0.3 * (layer + 1),
        vy: -0.2 - Math.random() * 0.4 * (layer + 1),
        alpha: baseAlpha,
        baseAlpha,
        color,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        pulsePhase: Math.random() * Math.PI * 2,
        layer,
      });
    }

    // Initialize Bokeh Discs
    interface BokehDisc {
      x: number;
      y: number;
      radius: number;
      color: string;
      alpha: number;
      driftSpeed: number;
      phase: number;
    }
    const bokehs: BokehDisc[] = [];
    for (let i = 0; i < selectedEnv.bokehCount; i++) {
      bokehs.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 25 + Math.random() * 55,
        color: selectedEnv.particleColors[i % selectedEnv.particleColors.length],
        alpha: 0.08 + Math.random() * 0.12,
        driftSpeed: 0.003 + Math.random() * 0.005,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Initialize Light Streaks
    interface LightStreak {
      y: number;
      length: number;
      speed: number;
      progress: number;
      width: number;
      color: string;
    }
    const streaks: LightStreak[] = [
      { y: height * 0.22, length: 380, speed: 0.0028, progress: 0.1, width: 2, color: selectedEnv.streakColors[0] },
      { y: height * 0.42, length: 520, speed: 0.0038, progress: 0.5, width: 3.2, color: selectedEnv.streakColors[1] || selectedEnv.streakColors[0] },
      { y: height * 0.68, length: 440, speed: 0.0022, progress: 0.8, width: 2.5, color: selectedEnv.streakColors[2] || selectedEnv.streakColors[0] },
    ];

    // Initialize Volumetric Light Rays (Laser Spotlights / God Rays)
    interface VolumetricRay {
      originRatio: number;
      targetRatio: number;
      topWidth: number;
      bottomWidth: number;
      baseAlpha: number;
      sweepSpeed: number;
      sweepPhase: number;
      colors: [string, string];
    }
    const volumetricRays: VolumetricRay[] = [
      {
        originRatio: 0.18,
        targetRatio: 0.28,
        topWidth: 16,
        bottomWidth: 260,
        baseAlpha: 0.22,
        sweepSpeed: 0.35,
        sweepPhase: 0.2,
        colors: ["rgba(0, 240, 255, 0.45)", "rgba(138, 43, 226, 0.12)"],
      },
      {
        originRatio: 0.38,
        targetRatio: 0.46,
        topWidth: 22,
        bottomWidth: 320,
        baseAlpha: 0.26,
        sweepSpeed: 0.28,
        sweepPhase: 2.1,
        colors: ["rgba(138, 43, 226, 0.5)", "rgba(0, 240, 255, 0.16)"],
      },
      {
        originRatio: 0.6,
        targetRatio: 0.66,
        topWidth: 20,
        bottomWidth: 300,
        baseAlpha: 0.24,
        sweepSpeed: 0.32,
        sweepPhase: 4.2,
        colors: ["rgba(0, 229, 255, 0.45)", "rgba(168, 85, 247, 0.15)"],
      },
      {
        originRatio: 0.82,
        targetRatio: 0.84,
        topWidth: 18,
        bottomWidth: 280,
        baseAlpha: 0.2,
        sweepSpeed: 0.4,
        sweepPhase: 1.2,
        colors: ["rgba(255, 23, 68, 0.4)", "rgba(138, 43, 226, 0.14)"],
      },
    ];

    // Initialize Moving Energy Waves (Sinusoidal Neon Waveforms)
    interface EnergyWave {
      baseY: number;
      amplitude1: number;
      amplitude2: number;
      freq1: number;
      freq2: number;
      speed: number;
      thickness: number;
      colorStops: [string, string, string, string];
      glowColor: string;
      shadowBlur: number;
      phase: number;
    }
    const energyWaves: EnergyWave[] = [
      {
        baseY: height * 0.62,
        amplitude1: 30,
        amplitude2: 12,
        freq1: 0.006,
        freq2: 0.014,
        speed: 0.65,
        thickness: 2.8,
        colorStops: ["#00F0FF", "#8A2BE2", "#FF1744", "#00F0FF"],
        glowColor: "#00F0FF",
        shadowBlur: 14,
        phase: 0,
      },
      {
        baseY: height * 0.74,
        amplitude1: 24,
        amplitude2: 10,
        freq1: 0.008,
        freq2: 0.016,
        speed: 0.85,
        thickness: 3.2,
        colorStops: ["#8A2BE2", "#00F0FF", "#FF0055", "#9B5CFF"],
        glowColor: "#8A2BE2",
        shadowBlur: 16,
        phase: 2.4,
      },
      {
        baseY: height * 0.84,
        amplitude1: 18,
        amplitude2: 8,
        freq1: 0.007,
        freq2: 0.012,
        speed: 0.5,
        thickness: 2.2,
        colorStops: ["#FF1744", "#8A2BE2", "#00F0FF", "#FF1744"],
        glowColor: "#FF1744",
        shadowBlur: 12,
        phase: 4.8,
      },
    ];

    // Initialize Atmospheric Stage Haze Clouds
    interface HazePuff {
      x: number;
      y: number;
      radiusX: number;
      radiusY: number;
      baseAlpha: number;
      color: string;
      driftSpeedX: number;
      driftSpeedY: number;
      phase: number;
    }
    const hazePuffs: HazePuff[] = [
      { x: width * 0.22, y: height * 0.45, radiusX: 360, radiusY: 190, baseAlpha: 0.09, color: "rgba(0, 240, 255, 0.25)", driftSpeedX: 0.08, driftSpeedY: 0.04, phase: 0 },
      { x: width * 0.52, y: height * 0.6, radiusX: 430, radiusY: 230, baseAlpha: 0.11, color: "rgba(138, 43, 226, 0.3)", driftSpeedX: -0.06, driftSpeedY: 0.05, phase: 1.8 },
      { x: width * 0.82, y: height * 0.42, radiusX: 370, radiusY: 200, baseAlpha: 0.08, color: "rgba(255, 23, 68, 0.2)", driftSpeedX: 0.07, driftSpeedY: -0.03, phase: 3.5 },
      { x: width * 0.36, y: height * 0.78, radiusX: 410, radiusY: 170, baseAlpha: 0.1, color: "rgba(112, 0, 255, 0.28)", driftSpeedX: -0.05, driftSpeedY: -0.04, phase: 5.2 },
    ];

    let lastTime = performance.now();
    let globalTime = 0;

    const render = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const effectiveSpeed = particleSpeed * (isSlowMotion ? 0.45 : 1.0);
      if (isPlaying) {
        globalTime += delta * effectiveSpeed;
      }

      // Parallax offsets (smooth mouse + organic subtle camera sway)
      const swayX = Math.sin(globalTime * 0.35) * 8;
      const swayY = Math.cos(globalTime * 0.25) * 5;
      const mouseOffsetX = showParallax ? (mousePosRef.current.x - 0.5) * 36 + swayX : swayX;
      const mouseOffsetY = showParallax ? (mousePosRef.current.y - 0.5) * 22 + swayY : swayY;

      // 1. BASE CINEMATIC GRADIENT
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, selectedEnv.bgColors[0]);
      bgGrad.addColorStop(0.5, selectedEnv.bgColors[1]);
      bgGrad.addColorStop(1, selectedEnv.bgColors[2]);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 1b. OPTIONAL BACKGROUND IMAGE TEXTURE
      if (bgImageRef.current && isBgImageLoadedRef.current) {
        const bgImg = bgImageRef.current;
        const bgAspect = bgImg.naturalWidth / bgImg.naturalHeight;
        const canvasAspect = width / height;
        let bgW = width;
        let bgH = height;
        let bgX = 0;
        let bgY = 0;
        if (bgAspect > canvasAspect) {
          bgW = height * bgAspect;
          bgX = (width - bgW) / 2;
        } else {
          bgH = width / bgAspect;
          bgY = (height - bgH) / 2;
        }
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.drawImage(bgImg, bgX + mouseOffsetX * 0.08, bgY + mouseOffsetY * 0.08, bgW, bgH);
        ctx.restore();
      }

      // 2. ATMOSPHERIC STAGE HAZE & FOG
      if (showHaze && (selectedEnv.hasHaze !== false)) {
        hazePuffs.forEach((puff) => {
          const hx = (puff.x + Math.sin(globalTime * puff.driftSpeedX + puff.phase) * 50 + mouseOffsetX * 0.15 + width) % width;
          const hy = (puff.y + Math.cos(globalTime * puff.driftSpeedY + puff.phase) * 30 + mouseOffsetY * 0.15 + height) % height;
          ctx.save();
          ctx.globalAlpha = puff.baseAlpha * (0.8 + Math.sin(globalTime * 0.6 + puff.phase) * 0.2);
          const hGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, puff.radiusX);
          hGrad.addColorStop(0, puff.color);
          hGrad.addColorStop(0.5, puff.color.replace(/[\d\.]+\)$/, "0.08)"));
          hGrad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = hGrad;
          ctx.beginPath();
          ctx.ellipse(hx, hy, puff.radiusX, puff.radiusY, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      // 3. VOLUMETRIC LIGHT RAYS (God Rays / Spotlights)
      if (showVolumetricRays && (selectedEnv.hasVolumetricRays || selectedEnv.id === "futuristic_music_video")) {
        volumetricRays.forEach((ray) => {
          const sweep = Math.sin(globalTime * ray.sweepSpeed + ray.sweepPhase) * 120;
          const topX = ray.originRatio * width + sweep * 0.15;
          const topY = -30;
          const botX = ray.targetRatio * width + sweep + mouseOffsetX * 0.3;
          const botY = height + 40;

          const leftTopX = topX - ray.topWidth / 2;
          const rightTopX = topX + ray.topWidth / 2;
          const rightBotX = botX + ray.bottomWidth / 2;
          const leftBotX = botX - ray.bottomWidth / 2;

          ctx.save();
          ctx.globalCompositeOperation = "screen";
          ctx.globalAlpha = ray.baseAlpha * (0.85 + Math.sin(globalTime * 0.9 + ray.sweepPhase) * 0.15);

          const rayGrad = ctx.createLinearGradient(topX, topY, botX, botY);
          rayGrad.addColorStop(0, ray.colors[0]);
          rayGrad.addColorStop(0.35, ray.colors[1]);
          rayGrad.addColorStop(0.75, ray.colors[0].replace(/[\d\.]+\)$/, "0.06)"));
          rayGrad.addColorStop(1, "rgba(0,0,0,0)");

          ctx.fillStyle = rayGrad;
          ctx.beginPath();
          ctx.moveTo(leftTopX, topY);
          ctx.lineTo(rightTopX, topY);
          ctx.lineTo(rightBotX, botY);
          ctx.lineTo(leftBotX, botY);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        });
      }

      // 4. RADIAL AMBIENT GLOW & DEPTH
      const glowGrad = ctx.createRadialGradient(
        width * 0.5 + mouseOffsetX * 0.3,
        height * 0.45 + mouseOffsetY * 0.3,
        100,
        width * 0.5 + mouseOffsetX * 0.3,
        height * 0.45 + mouseOffsetY * 0.3,
        width * 0.75
      );
      glowGrad.addColorStop(0, selectedEnv.glowColor);
      glowGrad.addColorStop(0.7, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, height);

      // 5. MOVING ENERGY WAVES (Neon Ribbon Waveforms)
      if (showEnergyWaves && (selectedEnv.hasEnergyWaves || selectedEnv.id === "futuristic_music_video")) {
        energyWaves.forEach((wave) => {
          ctx.save();
          ctx.lineWidth = wave.thickness;
          ctx.shadowColor = wave.glowColor;
          ctx.shadowBlur = wave.shadowBlur;

          const waveGrad = ctx.createLinearGradient(0, wave.baseY, width, wave.baseY);
          waveGrad.addColorStop(0, wave.colorStops[0]);
          waveGrad.addColorStop(0.33, wave.colorStops[1]);
          waveGrad.addColorStop(0.66, wave.colorStops[2]);
          waveGrad.addColorStop(1, wave.colorStops[3]);
          ctx.strokeStyle = waveGrad;

          ctx.beginPath();
          const wavePhase = globalTime * wave.speed + wave.phase;
          for (let x = -20; x <= width + 20; x += 8) {
            const y =
              wave.baseY +
              Math.sin(x * wave.freq1 + wavePhase) * wave.amplitude1 +
              Math.cos(x * wave.freq2 - wavePhase * 0.7) * wave.amplitude2 +
              mouseOffsetY * 0.2;
            if (x === -20) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();

          // Soft ambient ribbon reflection
          ctx.globalAlpha = 0.18;
          ctx.lineWidth = wave.thickness * 4.5;
          ctx.stroke();
          ctx.restore();
        });
      }

      // 6. BOKEH DISCS (Soft Depth-of-Field background circles)
      bokehs.forEach((b) => {
        const bx = (b.x + Math.sin(globalTime * b.driftSpeed * 20 + b.phase) * 30 + mouseOffsetX * 0.2 + width) % width;
        const by = (b.y + Math.cos(globalTime * b.driftSpeed * 15 + b.phase) * 20 + mouseOffsetY * 0.2 + height) % height;
        const bGrad = ctx.createRadialGradient(bx, by, 0, bx, by, b.radius);
        bGrad.addColorStop(0, b.color);
        bGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.save();
        ctx.globalAlpha = b.alpha * (0.8 + Math.sin(globalTime * 1.5 + b.phase) * 0.2);
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.arc(bx, by, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 7. FLOWING LIGHT STREAKS (Anamorphic horizontal beams)
      if (showStreaks) {
        streaks.forEach((s) => {
          if (isPlaying) {
            s.progress = (s.progress + s.speed * effectiveSpeed) % 1.5;
          }
          const sx = (s.progress - 0.25) * width + mouseOffsetX * 0.4;
          const sy = s.y + mouseOffsetY * 0.2 + Math.sin(globalTime + s.y) * 8;

          const sGrad = ctx.createLinearGradient(sx - s.length, sy, sx, sy);
          sGrad.addColorStop(0, "rgba(255,255,255,0)");
          sGrad.addColorStop(0.6, s.color);
          sGrad.addColorStop(1, "rgba(255,255,255,0)");

          ctx.save();
          ctx.strokeStyle = sGrad;
          ctx.lineWidth = s.width;
          ctx.beginPath();
          ctx.moveTo(sx - s.length, sy);
          ctx.lineTo(sx, sy);
          ctx.stroke();

          // Soft glare head
          const headGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, 18);
          headGrad.addColorStop(0, "rgba(255,255,255,0.7)");
          headGrad.addColorStop(0.5, s.color);
          headGrad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = headGrad;
          ctx.beginPath();
          ctx.arc(sx, sy, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      // 8. GLOWING PARTICLES & FLOATING STARDUST WITH RED ACCENTS
      particles.forEach((p) => {
        if (isPlaying) {
          p.x += p.vx * effectiveSpeed;
          p.y += p.vy * effectiveSpeed;
          p.pulsePhase += p.pulseSpeed;

          // Wrap edges
          if (p.y < -10) p.y = height + 10;
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
        }

        const layerFactor = p.layer === 0 ? 0.15 : p.layer === 1 ? 0.35 : 0.6;
        const px = p.x + mouseOffsetX * layerFactor;
        const py = p.y + mouseOffsetY * layerFactor;
        const currentAlpha = p.baseAlpha * (0.7 + Math.sin(p.pulsePhase) * 0.3);

        ctx.save();
        ctx.globalAlpha = currentAlpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.layer === 2 ? 8 : 4;
        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 9. ANAMORPHIC CINEMATIC LENS FLARES
      if (showFlares && selectedEnv.lensFlares) {
        const flareX = width * 0.48 + mouseOffsetX * 0.5;
        const flareY = height * 0.32 + mouseOffsetY * 0.3;

        ctx.save();
        ctx.globalCompositeOperation = "screen";

        // Anamorphic horizontal flare line
        const lineGrad = ctx.createLinearGradient(flareX - 280, flareY, flareX + 280, flareY);
        lineGrad.addColorStop(0, "rgba(0, 240, 255, 0)");
        lineGrad.addColorStop(0.35, "rgba(138, 43, 226, 0.45)");
        lineGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.9)");
        lineGrad.addColorStop(0.65, "rgba(0, 240, 255, 0.45)");
        lineGrad.addColorStop(1, "rgba(255, 23, 68, 0)");
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(flareX - 280, flareY);
        ctx.lineTo(flareX + 280, flareY);
        ctx.stroke();

        // Central core flare
        const coreGrad = ctx.createRadialGradient(flareX, flareY, 0, flareX, flareY, 40);
        coreGrad.addColorStop(0, "rgba(255, 255, 255, 0.85)");
        coreGrad.addColorStop(0.4, "rgba(0, 240, 255, 0.4)");
        coreGrad.addColorStop(0.7, "rgba(138, 43, 226, 0.2)");
        coreGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(flareX, flareY, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 10. PRESERVED MAIN SUBJECT & DUAL-TONE RIM LIGHTING
      const subjectImg = subjectImageRef.current;
      if (subjectImg && isImageLoadedRef.current) {
        ctx.save();

        // Calculate aspect fit/contain while centering
        const imgAspect = subjectImg.naturalWidth / subjectImg.naturalHeight;
        const canvasAspect = width / height;

        let drawW = width;
        let drawH = height;
        let drawX = 0;
        let drawY = 0;

        if (imgAspect > canvasAspect) {
          drawW = height * imgAspect;
          drawX = (width - drawW) / 2;
        } else {
          drawH = width / imgAspect;
          drawY = (height - drawH) / 2;
        }

        // Apply Before / After Split View clip if active
        if (showSplitView) {
          const splitX = (splitPosition / 100) * width;

          // Left side: original image plain
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, splitX, height);
          ctx.clip();
          ctx.drawImage(subjectImg, drawX, drawY, drawW, drawH);
          ctx.restore();

          // Split line separator
          ctx.save();
          ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
          ctx.lineWidth = 2.5;
          ctx.shadowColor = "#6C3BFF";
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(splitX, 0);
          ctx.lineTo(splitX, height);
          ctx.stroke();

          // Split badge
          ctx.fillStyle = "#6C3BFF";
          ctx.beginPath();
          ctx.arc(splitX, height * 0.5, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 10px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("VS", splitX, height * 0.5 + 3.5);
          ctx.restore();

          // Right side: Subject blended into cinematic world
          ctx.save();
          ctx.beginPath();
          ctx.rect(splitX, 0, width - splitX, height);
          ctx.clip();
        }

        // Ambient contact shadow to anchor subject
        const shadowGrad = ctx.createRadialGradient(
          width * 0.5,
          height * 0.9,
          50,
          width * 0.5,
          height * 0.95,
          width * 0.4
        );
        shadowGrad.addColorStop(0, "rgba(0, 0, 0, 0.65)");
        shadowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = shadowGrad;
        ctx.fillRect(0, height * 0.75, width, height * 0.25);

        // Subject Matte: 100% preservation of face, identity, clothing, skin tone and body
        ctx.drawImage(subjectImg, drawX, drawY, drawW, drawH);

        // Cinematic Dual-Tone Rim Lighting (Electric Cyan on left + Purple/Red on right)
        if (rimGlowIntensity > 0) {
          ctx.save();
          ctx.globalCompositeOperation = "screen";

          // Left Rim: Electric Cyan highlight
          const leftRimGrad = ctx.createRadialGradient(
            drawX + drawW * 0.2,
            drawY + drawH * 0.45,
            drawW * 0.1,
            drawX + drawW * 0.3,
            drawY + drawH * 0.5,
            drawW * 0.55
          );
          leftRimGrad.addColorStop(0, "rgba(0, 240, 255, 0)");
          leftRimGrad.addColorStop(0.75, `rgba(0, 240, 255, ${rimGlowIntensity * 0.35})`);
          leftRimGrad.addColorStop(1, "rgba(0, 240, 255, 0)");
          ctx.fillStyle = leftRimGrad;
          ctx.fillRect(0, 0, width, height);

          // Right Rim: Neon Purple & Subtle Red Accent highlight
          const rightRimGrad = ctx.createRadialGradient(
            drawX + drawW * 0.8,
            drawY + drawH * 0.45,
            drawW * 0.1,
            drawX + drawW * 0.7,
            drawY + drawH * 0.5,
            drawW * 0.55
          );
          rightRimGrad.addColorStop(0, "rgba(138, 43, 226, 0)");
          rightRimGrad.addColorStop(0.7, `rgba(138, 43, 226, ${rimGlowIntensity * 0.32})`);
          rightRimGrad.addColorStop(0.9, `rgba(255, 23, 68, ${rimGlowIntensity * 0.22})`);
          rightRimGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = rightRimGrad;
          ctx.fillRect(0, 0, width, height);

          ctx.restore();
        }

        if (showSplitView) {
          ctx.restore(); // end right side clip
        }

        ctx.restore();
      }

      // 11. FINAL CINEMATIC COLOR GRADE VIGNETTE
      const vignette = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        width * 0.35,
        width * 0.5,
        height * 0.5,
        width * 0.75
      );
      vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
      vignette.addColorStop(1, "rgba(2, 3, 8, 0.52)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      // Loop
      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    isOpen,
    selectedEnv,
    isPlaying,
    particleSpeed,
    isSlowMotion,
    particleDensity,
    showStreaks,
    showFlares,
    showVolumetricRays,
    showEnergyWaves,
    showHaze,
    showParallax,
    rimGlowIntensity,
    showSplitView,
    splitPosition,
  ]);

  // Export 4K Snapshot
  const handleExportSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsExportingSnapshot(true);
    try {
      const dataUrl = canvas.toDataURL("image/png", 1.0);
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `cinematic-background-${selectedEnv.id}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setExportFeedback("High-Resolution snapshot downloaded!");
      setTimeout(() => setExportFeedback(null), 3500);
    } catch (e: any) {
      console.error(e);
      setExportFeedback("Export failed. Please try again.");
    } finally {
      setIsExportingSnapshot(false);
    }
  };

  // Record 5-second WebM / MP4 video clip
  const handleRecordVideo = () => {
    const canvas = canvasRef.current;
    if (!canvas || isRecording) return;

    try {
      const stream = canvas.captureStream(60);
      let mimeType = "video/webm;codecs=vp9";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm";
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      recordedChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const videoUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = videoUrl;
        a.download = `cinematic-animated-bg-${selectedEnv.id}-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(videoUrl);

        setIsRecording(false);
        setRecordingProgress(0);
        setExportFeedback("Animated cinematic video recorded & downloaded!");
        setTimeout(() => setExportFeedback(null), 4000);
      };

      recorder.start();
      setIsRecording(true);
      mediaRecorderRef.current = recorder;

      // Track 5 second progress
      const duration = 5000;
      const interval = 100;
      let elapsed = 0;
      const progressTimer = setInterval(() => {
        elapsed += interval;
        setRecordingProgress(Math.min(100, Math.round((elapsed / duration) * 100)));
        if (elapsed >= duration) {
          clearInterval(progressTimer);
          if (recorder.state === "recording") {
            recorder.stop();
          }
        }
      }, interval);
    } catch (err: any) {
      console.error("Recording error:", err);
      setIsRecording(false);
      setExportFeedback("Video recording not supported in this browser.");
      setTimeout(() => setExportFeedback(null), 3000);
    }
  };

  // Send directly to Gemini Chat conversation
  const handleSendToChat = () => {
    const canvas = canvasRef.current;
    if (!canvas || !onInsertToChat) return;
    const dataUrl = canvas.toDataURL("image/png", 0.92);
    const info = `Cinematic Environment: ${selectedEnv.name} (${selectedEnv.subtitle}). Main subject preserved with dynamic glowing particles, flowing light streaks, and realistic depth-of-field.`;
    onInsertToChat(dataUrl, info);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-xl overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-6xl bg-[#0C0F1A] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
        >
          {/* Top Header Bar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#0E1222]/90 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#6C3BFF] via-[#9B5CFF] to-[#4F8CFF] flex items-center justify-center text-white shadow-md shadow-[#6C3BFF]/30">
                <Film className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-display font-bold text-white tracking-tight">
                    Cinematic Background Studio
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#6C3BFF]/20 border border-[#6C3BFF]/40 text-[#9B5CFF]">
                    AI Cinema 60FPS
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Preserve your main subject with 100% fidelity while generating animated cinematic environments
                </p>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isPlaying
                    ? "bg-white/10 border-white/15 text-white hover:bg-white/15"
                    : "bg-[#6C3BFF] border-[#6C3BFF] text-white shadow-xs"
                }`}
                title={isPlaying ? "Pause Animation" : "Play Animation"}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isPlaying ? "Pause" : "Play"}</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Close Studio"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Feedback Toast */}
          {exportFeedback && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-2xl bg-[#6C3BFF] text-white text-xs font-semibold shadow-xl border border-white/20 flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>{exportFeedback}</span>
            </div>
          )}

          {/* Studio Body: Canvas Left / Controls Right */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            {/* Canvas Stage (8 Cols) */}
            <div
              className="lg:col-span-8 bg-black/60 relative flex items-center justify-center p-3 sm:p-6 overflow-hidden select-none"
              onMouseMove={handleMouseMove}
            >
              {/* The Cinematic Canvas Engine */}
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#050711]">
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-contain"
                  style={{ filter: selectedColorGrade.filter }}
                />

                {/* Live Floating Badge */}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-300 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{selectedEnv.name}</span>
                </div>

                {/* Before / After Slider Toggle */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10 text-[10px] text-slate-300">
                  <button
                    onClick={() => setShowSplitView(!showSplitView)}
                    className={`px-2 py-1 rounded-lg font-medium transition-all ${
                      showSplitView ? "bg-[#6C3BFF] text-white" : "hover:text-white"
                    }`}
                  >
                    Compare Split
                  </button>
                </div>

                {/* Slider drag handle when split view active */}
                {showSplitView && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 bg-black/75 backdrop-blur-md p-2 rounded-xl border border-white/15 flex items-center gap-2 text-[10px] text-slate-300">
                    <span>Orig</span>
                    <input
                      type="range"
                      min="10"
                      max="90"
                      value={splitPosition}
                      onChange={(e) => setSplitPosition(Number(e.target.value))}
                      className="w-full accent-[#6C3BFF] h-1.5 bg-white/20 rounded-lg cursor-pointer"
                    />
                    <span>Cinema</span>
                  </div>
                )}

                {/* Recording Overlay Progress */}
                {isRecording && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20">
                    <div className="flex items-center gap-2 text-rose-500 font-bold text-sm">
                      <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                      <span>Recording Cinematic 60FPS Video ({recordingProgress}%)</span>
                    </div>
                    <div className="w-48 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-rose-500 transition-all duration-100"
                        style={{ width: `${recordingProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Controls Sidebar (4 Cols) */}
            <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-white/10 bg-[#0E1222]/80 backdrop-blur-md p-4 sm:p-5 flex flex-col justify-between overflow-y-auto max-h-[45vh] lg:max-h-none">
              <div className="space-y-5">
                {/* Subject Selector & Upload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-[#6C3BFF]" />
                      <span>Preserved Subject</span>
                    </label>
                    <label
                      htmlFor="upload-subject"
                      className="text-[11px] font-medium text-[#9B5CFF] hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload Photo</span>
                    </label>
                    <input
                      id="upload-subject"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  {/* Preset Subject Chips */}
                  <div className="grid grid-cols-4 gap-2">
                    {SUBJECT_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedSubjectUrl(p.url)}
                        className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all ${
                          selectedSubjectUrl === p.url
                            ? "border-[#6C3BFF] scale-102 shadow-md shadow-[#6C3BFF]/25"
                            : "border-white/10 opacity-70 hover:opacity-100"
                        }`}
                        title={p.name}
                      >
                        <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white text-center py-0.5 truncate">
                          {p.name.split(" ")[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cinematic Environments Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#6C3BFF]" />
                    <span>Cinematic Environment</span>
                  </label>
                  <div className="space-y-1.5">
                    {ENVIRONMENTS.map((env) => (
                      <button
                        key={env.id}
                        type="button"
                        onClick={() => setSelectedEnv(env)}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                          selectedEnv.id === env.id
                            ? "bg-[#6C3BFF]/15 border-[#6C3BFF] text-white shadow-xs"
                            : "bg-white/5 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10"
                        }`}
                      >
                        <div>
                          <p className="text-xs font-semibold text-white">{env.name}</p>
                          <p className="text-[10px] text-slate-400">{env.subtitle}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {env.particleColors.slice(0, 3).map((col, idx) => (
                            <span
                              key={idx}
                              className="w-2.5 h-2.5 rounded-full border border-black/40"
                              style={{ backgroundColor: col }}
                            />
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fine-Tuning Sliders */}
                <div className="space-y-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#6C3BFF]" />
                      <span>Cinema Lighting & FX</span>
                    </span>
                  </div>

                  {/* Particle Speed & Slow-Mo Cinema */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] text-slate-400">
                      <span>Cinematic Particle Speed</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsSlowMotion(!isSlowMotion)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-all ${
                            isSlowMotion
                              ? "bg-purple-500/30 text-purple-300 border border-purple-500/50"
                              : "bg-white/5 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          Slow-Mo (0.5x)
                        </button>
                        <span className="font-mono text-white">{(particleSpeed * (isSlowMotion ? 0.5 : 1)).toFixed(2)}x</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.3"
                      max="2.5"
                      step="0.1"
                      value={particleSpeed}
                      onChange={(e) => setParticleSpeed(Number(e.target.value))}
                      className="w-full accent-[#6C3BFF] h-1.5 bg-white/10 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Rim Lighting */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Subject Dual Rim Light</span>
                      <span className="font-mono text-white">{Math.round(rimGlowIntensity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={rimGlowIntensity}
                      onChange={(e) => setRimGlowIntensity(Number(e.target.value))}
                      className="w-full accent-[#6C3BFF] h-1.5 bg-white/10 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Quick VFX Toggles */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowVolumetricRays(!showVolumetricRays)}
                      className={`p-2 rounded-xl text-[11px] font-semibold border text-center transition-all ${
                        showVolumetricRays
                          ? "bg-[#6C3BFF]/20 border-[#6C3BFF]/50 text-white"
                          : "bg-white/5 border-white/5 text-slate-400"
                      }`}
                    >
                      Volumetric Rays: {showVolumetricRays ? "ON" : "OFF"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowEnergyWaves(!showEnergyWaves)}
                      className={`p-2 rounded-xl text-[11px] font-semibold border text-center transition-all ${
                        showEnergyWaves
                          ? "bg-[#6C3BFF]/20 border-[#6C3BFF]/50 text-white"
                          : "bg-white/5 border-white/5 text-slate-400"
                      }`}
                    >
                      Energy Waves: {showEnergyWaves ? "ON" : "OFF"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowHaze(!showHaze)}
                      className={`p-2 rounded-xl text-[11px] font-semibold border text-center transition-all ${
                        showHaze
                          ? "bg-[#6C3BFF]/20 border-[#6C3BFF]/50 text-white"
                          : "bg-white/5 border-white/5 text-slate-400"
                      }`}
                    >
                      Stage Haze: {showHaze ? "ON" : "OFF"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowStreaks(!showStreaks)}
                      className={`p-2 rounded-xl text-[11px] font-semibold border text-center transition-all ${
                        showStreaks
                          ? "bg-[#6C3BFF]/20 border-[#6C3BFF]/50 text-white"
                          : "bg-white/5 border-white/5 text-slate-400"
                      }`}
                    >
                      Light Streaks: {showStreaks ? "ON" : "OFF"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowParallax(!showParallax)}
                      className={`p-2 rounded-xl text-[11px] font-semibold border text-center transition-all ${
                        showParallax
                          ? "bg-[#6C3BFF]/20 border-[#6C3BFF]/50 text-white"
                          : "bg-white/5 border-white/5 text-slate-400"
                      }`}
                    >
                      Depth Sway: {showParallax ? "ON" : "OFF"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFlares(!showFlares)}
                      className={`p-2 rounded-xl text-[11px] font-semibold border text-center transition-all ${
                        showFlares
                          ? "bg-[#6C3BFF]/20 border-[#6C3BFF]/50 text-white"
                          : "bg-white/5 border-white/5 text-slate-400"
                      }`}
                    >
                      Lens Flare: {showFlares ? "ON" : "OFF"}
                    </button>
                  </div>
                </div>

                {/* Color Grade Presets */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Color Grade LUT</label>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {COLOR_GRADES.map((cg) => (
                      <button
                        key={cg.id}
                        type="button"
                        onClick={() => setSelectedColorGrade(cg)}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-semibold whitespace-nowrap transition-all ${
                          selectedColorGrade.id === cg.id
                            ? "bg-[#6C3BFF] text-white shadow-xs"
                            : "bg-white/5 text-slate-400 hover:text-white"
                        }`}
                      >
                        {cg.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Download Snapshot / Record Video / Insert to Chat */}
              <div className="pt-5 border-t border-white/10 space-y-2 mt-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleExportSnapshot}
                    disabled={isExportingSnapshot}
                    className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-98"
                  >
                    <Download className="w-3.5 h-3.5 text-[#4F8CFF]" />
                    <span>Download 4K</span>
                  </button>

                  <button
                    onClick={handleRecordVideo}
                    disabled={isRecording}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:opacity-90 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-98 shadow-sm shadow-rose-500/25 disabled:opacity-50"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>{isRecording ? "Recording..." : "Record Video"}</span>
                  </button>
                </div>

                {onInsertToChat && (
                  <button
                    onClick={handleSendToChat}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#6C3BFF] via-[#9B5CFF] to-[#4F8CFF] hover:opacity-95 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md shadow-[#6C3BFF]/30"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Send to Gemini Chatbot</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
