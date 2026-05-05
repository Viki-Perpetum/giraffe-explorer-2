import { useEffect, useRef } from "react";

/**
 * Animated gradient mesh canvas for the login background.
 * Renders soft, slowly-moving colour blobs on a dark navy base.
 */
export function GradientMesh() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let w = 0;
    let h = 0;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const blobs = [
      { x: 0.2, y: 0.3, r: 0.45, color: [56, 145, 220], speed: 0.0003, phase: 0 },
      { x: 0.7, y: 0.6, r: 0.5, color: [78, 185, 162], speed: 0.00025, phase: 2 },
      { x: 0.5, y: 0.8, r: 0.4, color: [45, 100, 180], speed: 0.00035, phase: 4 },
      { x: 0.8, y: 0.2, r: 0.35, color: [100, 200, 180], speed: 0.0002, phase: 1 },
      { x: 0.3, y: 0.7, r: 0.3, color: [60, 120, 200], speed: 0.0004, phase: 3 },
    ];

    const draw = (t: number) => {
      // Clear canvas (transparent so the photo shows through)
      ctx.clearRect(0, 0, w, h);

      for (const blob of blobs) {
        const cx = (blob.x + Math.sin(t * blob.speed + blob.phase) * 0.12) * w;
        const cy = (blob.y + Math.cos(t * blob.speed * 0.8 + blob.phase) * 0.1) * h;
        const radius = blob.r * Math.min(w, h);
        const [r, g, b] = blob.color;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, `rgba(${r},${g},${b},0.18)`);
        grad.addColorStop(0.5, `rgba(${r},${g},${b},0.06)`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
}
