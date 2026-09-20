import React, { useEffect, useRef } from "react";

export default function PrismNeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Subtle floating particles in soft pastel tones
    const particleCount = Math.min(Math.floor((width * height) / 32000), 38);
    const pastelColors = [
      "rgba(196, 181, 253, ", // Soft Pastel Lavender
      "rgba(251, 207, 232, ", // Soft Pastel Pink
      "rgba(191, 219, 254, ", // Soft Baby Blue
      "rgba(167, 243, 208, ", // Soft Mint
    ];

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      baseAlpha: number;
      pulseSpeed: number;
      pulseOffset: number;
    }

    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: -Math.random() * 0.25 - 0.05, // gentle slow upward drift
        radius: Math.random() * 1.8 + 1.0,
        color: pastelColors[Math.floor(Math.random() * pastelColors.length)],
        baseAlpha: Math.random() * 0.35 + 0.15,
        pulseSpeed: Math.random() * 0.015 + 0.008,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }

    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // Render gentle drifting particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around top or sides smoothly
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const currentAlpha = p.baseAlpha + Math.sin(frame * p.pulseSpeed + p.pulseOffset) * 0.12;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.max(0.05, currentAlpha)})`;
        ctx.fill();

        // Very faint ethereal connections between close particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 110;

          if (dist < maxDist) {
            const lineAlpha = (1 - dist / maxDist) * 0.1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(196, 181, 253, ${lineAlpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none bg-[#F8FAFD] dark:bg-[#0B0F19] transition-colors duration-300">
      {/* Base Canvas Layer */}
      <div className="absolute inset-0 bg-[#F8FAFD] dark:bg-[#0B0F19] transition-colors duration-300" />

      {/* 1. Pastel Lavender Aurora Blob / Dark Mode Violet Nebula */}
      <div
        className="animate-aurora-blob-1 absolute -top-[12%] -left-[6%] w-[720px] h-[720px] rounded-full opacity-65 dark:opacity-25 blur-[120px] pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(221, 214, 254, 0.75) 0%, rgba(196, 181, 253, 0.45) 45%, transparent 70%)",
        }}
      />

      {/* 2. Pastel Pink / Dark Mode Rose Nebula */}
      <div
        className="animate-aurora-blob-2 absolute top-[20%] -right-[12%] w-[760px] h-[760px] rounded-full opacity-60 dark:opacity-20 blur-[130px] pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(252, 231, 243, 0.8) 0%, rgba(251, 207, 232, 0.5) 45%, transparent 70%)",
        }}
      />

      {/* 3. Baby Blue / Dark Mode Indigo Nebula */}
      <div
        className="animate-aurora-blob-3 absolute -bottom-[15%] left-[8%] w-[680px] h-[680px] rounded-full opacity-65 dark:opacity-20 blur-[120px] pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(219, 234, 254, 0.75) 0%, rgba(191, 219, 254, 0.45) 45%, transparent 70%)",
        }}
      />

      {/* 4. Soft Mint / Dark Mode Teal Glow */}
      <div
        className="animate-aurora-blob-4 absolute top-[40%] left-[30%] w-[620px] h-[620px] rounded-full opacity-55 dark:opacity-15 blur-[125px] pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(209, 250, 229, 0.7) 0%, rgba(167, 243, 208, 0.4) 45%, transparent 70%)",
        }}
      />

      {/* Gentle Light Wave Sweep */}
      <div
        className="animate-light-wave absolute -inset-[50%] opacity-35 dark:opacity-15 pointer-events-none"
        style={{
          background:
            "conic-gradient(from 0deg at 50% 50%, rgba(221, 214, 254, 0.25) 0deg, rgba(252, 231, 243, 0.2) 90deg, rgba(209, 250, 229, 0.22) 180deg, rgba(219, 234, 254, 0.25) 270deg, rgba(221, 214, 254, 0.25) 360deg)",
          filter: "blur(90px)",
        }}
      />

      {/* Subtle organic dot matrix */}
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(rgba(147, 112, 219, 0.4) 1.2px, transparent 1.2px)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* HTML5 Canvas for Subtle Floating Pastel Dust Motes */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-85 dark:opacity-40"
      />
    </div>
  );
}
