import { useEffect, useRef } from "react";
import nacosLogo from "@/assets/nacos-logo.png";

interface Particle {
  tx: number;
  ty: number;
  tz: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  color: string;
  alpha: number;
  phase: number;
  isAmbient?: boolean;
}

interface HeroLogoParticlesProps {
  className?: string;
}

/**
 * Interactive 3D particle system sampled from the NACOS AKSU logo.
 * Supports perspective 3D rotation, pointer parallax, cursor repulsion,
 * and automatic off-screen pausing.
 */
export const HeroLogoParticles = ({ className = "" }: HeroLogoParticlesProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let animationFrameId = 0;
    let isVisible = true;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles: Particle[] = [];
    let isLoaded = false;

    const pointer = {
      x: 0,
      y: 0,
      nx: 0,
      ny: 0,
      active: false,
    };

    let currentRotX = 0;
    let currentRotY = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const nextWidth = Math.max(240, rect.width);
      const nextHeight = Math.max(240, rect.height);
      const prevScale = Math.min(width, height);
      const nextScale = Math.min(nextWidth, nextHeight);

      width = nextWidth;
      height = nextHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (prevScale > 0 && nextScale > 0 && prevScale !== nextScale && particles.length > 0) {
        const ratio = nextScale / prevScale;
        for (let i = 0; i < particles.length; i++) {
          particles[i].tx *= ratio;
          particles[i].ty *= ratio;
        }
      }
    };

    const buildParticles = (img: HTMLImageElement) => {
      const sampleSize = 156;
      const offscreen = document.createElement("canvas");
      offscreen.width = sampleSize;
      offscreen.height = sampleSize;
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) return;

      offCtx.drawImage(img, 0, 0, sampleSize, sampleSize);
      const { data } = offCtx.getImageData(0, 0, sampleSize, sampleSize);

      const half = sampleSize / 2;
      const spreadScale = Math.min(width, height) * 0.98;
      const step = 2;
      const nextParticles: Particle[] = [];

      const isGreenPixel = (r: number, g: number, b: number, a: number) =>
        a > 80 && g > 70 && g > r * 1.25 && g > b * 1.25;

      const isWhitePixel = (r: number, g: number, b: number, a: number) =>
        a > 120 && r > 205 && g > 205 && b > 205;

      const hasNeighborGreen = (px: number, py: number) => {
        for (let oy = -2; oy <= 2; oy += 2) {
          for (let ox = -2; ox <= 2; ox += 2) {
            const nx = px + ox;
            const ny = py + oy;
            if (nx < 0 || ny < 0 || nx >= sampleSize || ny >= sampleSize) continue;
            const nIdx = (ny * sampleSize + nx) * 4;
            if (isGreenPixel(data[nIdx], data[nIdx + 1], data[nIdx + 2], data[nIdx + 3])) {
              return true;
            }
          }
        }
        return false;
      };

      for (let y = 0; y < sampleSize; y += step) {
        for (let x = 0; x < sampleSize; x += step) {
          const idx = (y * sampleSize + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          if (a < 50) continue;

          const nx = (x - half) / half; // -1..1
          const ny = (y - half) / half; // -1..1
          const dist = Math.hypot(nx, ny);
          if (dist > 0.99) continue;

          const px = nx * (spreadScale * 0.5);
          const py = ny * (spreadScale * 0.5);

          let tz = 0;
          let color = "rgb(255, 255, 255)";
          let alpha = 0.9;
          let size = 1.95;

          if (isGreenPixel(r, g, b, a)) {
            if (dist < 0.56) {
              // Central Nigeria circuit map — raised 3D layer with luminous emerald
              tz = 22 + (Math.random() - 0.5) * 8;
              color = Math.random() > 0.35 ? "rgb(74, 222, 128)" : "rgb(134, 239, 172)";
              alpha = 0.95;
              size = 2.15;
            } else {
              // Outer badge ring
              tz = (Math.random() - 0.5) * 8;
              color = Math.random() > 0.4 ? "rgb(34, 197, 94)" : "rgb(74, 222, 128)";
              alpha = 0.85;
              size = 1.9;
            }
          } else if (isWhitePixel(r, g, b, a)) {
            if (dist >= 0.58) {
              // Outer ring lettering
              tz = 10 + (Math.random() - 0.5) * 4;
              color = "rgb(255, 255, 255)";
              alpha = 0.95;
              size = 2.0;
            } else if (hasNeighborGreen(x, y)) {
              // Circuit traces & NACOS chip lettering inside map
              tz = 26 + (Math.random() - 0.5) * 4;
              color = "rgb(240, 253, 244)";
              alpha = 0.95;
              size = 2.05;
            } else {
              // Subtle sparse halo for the inner white disc so the map pops in 3D
              if (Math.random() > 0.16) continue;
              tz = -12 + (Math.random() - 0.5) * 10;
              color = "rgb(187, 247, 208)";
              alpha = 0.16;
              size = 1.45;
            }
          } else {
            // Anti-aliased edge pixels
            if (Math.random() > 0.45) continue;
            tz = 6;
            color = "rgb(134, 239, 172)";
            alpha = 0.55;
            size = 1.65;
          }

          const scatterRadius = spreadScale * (0.75 + Math.random() * 0.65);
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);

          nextParticles.push({
            tx: px,
            ty: py,
            tz,
            x: prefersReducedMotion ? px : scatterRadius * Math.sin(phi) * Math.cos(theta),
            y: prefersReducedMotion ? py : scatterRadius * Math.sin(phi) * Math.sin(theta),
            z: prefersReducedMotion ? tz : scatterRadius * Math.cos(phi),
            vx: 0,
            vy: 0,
            vz: 0,
            size,
            color,
            alpha,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }

      // Add ambient 3D orbital particles around the logo for depth
      const ambientCount = 90;
      for (let i = 0; i < ambientCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = spreadScale * (0.45 + Math.random() * 0.25);
        const ax = Math.cos(angle) * radius;
        const ay = Math.sin(angle) * radius;
        const az = (Math.random() - 0.5) * 160;

        nextParticles.push({
          tx: ax,
          ty: ay,
          tz: az,
          x: ax,
          y: ay,
          z: az,
          vx: 0,
          vy: 0,
          vz: 0,
          size: 1.1 + Math.random() * 1.4,
          color: Math.random() > 0.5 ? "rgb(74, 222, 128)" : "rgb(255, 255, 255)",
          alpha: 0.22 + Math.random() * 0.35,
          phase: Math.random() * Math.PI * 2,
          isAmbient: true,
        });
      }

      particles = nextParticles;
      isLoaded = true;
    };

    const renderFrame = (timeMs: number) => {
      if (!isVisible) return;

      ctx.clearRect(0, 0, width, height);

      if (isLoaded) {
        const t = timeMs * 0.001;
        const cx = width * 0.5;
        const cy = height * 0.5;
        const fov = 460;

        const targetRotY = prefersReducedMotion
          ? 0.14
          : Math.sin(t * 0.5) * 0.24 + (pointer.active ? pointer.nx * 0.32 : 0);
        const targetRotX = prefersReducedMotion
          ? -0.06
          : Math.cos(t * 0.4) * 0.12 + (pointer.active ? -pointer.ny * 0.24 : 0);

        currentRotY += (targetRotY - currentRotY) * 0.07;
        currentRotX += (targetRotX - currentRotX) * 0.07;

        const cosY = Math.cos(currentRotY);
        const sinY = Math.sin(currentRotY);
        const cosX = Math.cos(currentRotX);
        const sinX = Math.sin(currentRotX);

        // Soft radial aura behind the 3D logo
        const auraRadius = Math.min(width, height) * 0.46;
        const aura = ctx.createRadialGradient(cx, cy, auraRadius * 0.1, cx, cy, auraRadius);
        aura.addColorStop(0, "rgba(74, 222, 128, 0.14)");
        aura.addColorStop(0.6, "rgba(34, 197, 94, 0.05)");
        aura.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(cx, cy, auraRadius, 0, Math.PI * 2);
        ctx.fill();

        const projected: Array<{ sx: number; sy: number; r: number; z: number; color: string; alpha: number }> = [];

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          if (!prefersReducedMotion) {
            let goalX = p.tx;
            let goalY = p.ty;
            let goalZ = p.tz;

            if (p.isAmbient) {
              const orbit = t * 0.22 + p.phase;
              goalX = p.tx + Math.cos(orbit) * 10;
              goalY = p.ty + Math.sin(orbit * 0.8) * 10;
              goalZ = p.tz + Math.sin(orbit) * 14;
            } else {
              goalZ += Math.sin(t * 1.4 + p.phase) * 2.2;
            }

            // Spring back toward target position
            p.vx += (goalX - p.x) * 0.065;
            p.vy += (goalY - p.y) * 0.065;
            p.vz += (goalZ - p.z) * 0.065;

            p.vx *= 0.84;
            p.vy *= 0.84;
            p.vz *= 0.84;

            p.x += p.vx;
            p.y += p.vy;
            p.z += p.vz;
          }

          // Rotate in 3D space (Y then X)
          const x1 = p.x * cosY - p.z * sinY;
          const z1 = p.z * cosY + p.x * sinY;
          const y2 = p.y * cosX - z1 * sinX;
          const z2 = z1 * cosX + p.y * sinX;

          const perspective = fov / (fov + z2 + 10);
          if (perspective <= 0) continue;

          let sx = cx + x1 * perspective;
          let sy = cy + y2 * perspective;

          // Pointer repulsion in screen space -> pushes particle in 3D
          if (pointer.active && !prefersReducedMotion) {
            const dx = sx - pointer.x;
            const dy = sy - pointer.y;
            const distSq = dx * dx + dy * dy;
            const maxDist = 78;
            if (distSq < maxDist * maxDist && distSq > 0.01) {
              const dist = Math.sqrt(distSq);
              const force = (1 - dist / maxDist) * 5.2;
              p.vx += (dx / dist) * force;
              p.vy += (dy / dist) * force;
              p.vz += force * 1.8;
              sx += (dx / dist) * force * 0.5;
              sy += (dy / dist) * force * 0.5;
            }
          }

          const twinkle = prefersReducedMotion ? 1 : 0.88 + 0.12 * Math.sin(t * 2.2 + p.phase);
          const depthAlpha = Math.max(0.15, Math.min(1, perspective * 1.05));

          projected.push({
            sx,
            sy,
            r: Math.max(0.6, p.size * perspective),
            z: z2,
            color: p.color,
            alpha: p.alpha * depthAlpha * twinkle,
          });
        }

        // Painter's algorithm: draw back-to-front
        projected.sort((a, b) => b.z - a.z);

        for (let i = 0; i < projected.length; i++) {
          const pt = projected[i];
          ctx.globalAlpha = pt.alpha;
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(pt.sx, pt.sy, pt.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      if (!prefersReducedMotion) {
        animationFrameId = window.requestAnimationFrame(renderFrame);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.nx = ((pointer.x / rect.width) - 0.5) * 2;
      pointer.ny = ((pointer.y / rect.height) - 0.5) * 2;
      pointer.active = true;
    };

    const handlePointerLeave = () => {
      pointer.active = false;
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        const wasVisible = isVisible;
        isVisible = entry.isIntersecting;
        if (isVisible && !wasVisible && !prefersReducedMotion) {
          animationFrameId = window.requestAnimationFrame(renderFrame);
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    const resizeObserver = new ResizeObserver(() => {
      resize();
    });
    resizeObserver.observe(container);

    resize();

    const img = new Image();
    img.src = nacosLogo;
    img.onload = () => {
      buildParticles(img);
      if (prefersReducedMotion) {
        renderFrame(0);
      } else {
        animationFrameId = window.requestAnimationFrame(renderFrame);
      }
    };

    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      resizeObserver.disconnect();
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center select-none ${className}`}
      aria-label="Interactive 3D NACOS AKSU logo particle visualization"
    >
      <canvas ref={canvasRef} className="block w-full h-full cursor-pointer touch-pan-y" />
    </div>
  );
};
