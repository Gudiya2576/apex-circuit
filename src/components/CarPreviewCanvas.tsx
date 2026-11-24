import { useEffect, useRef } from 'react';
import { drawCarShape } from '../game/renderer';
import { CarSpec } from '../game/types';

interface CarPreviewCanvasProps {
  car: CarSpec;
  colorOverride?: string | null;
  active?: boolean;
  width?: number;
  height?: number;
}

export function CarPreviewCanvas({
  car,
  colorOverride,
  active = false,
  width = 220,
  height = 110,
}: CarPreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let angle = -0.32;

    const draw = () => {
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Subtle turntable floor ring
      ctx.strokeStyle = active ? 'rgba(239, 68, 68, 0.35)' : 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(width * 0.5, height * 0.54, width * 0.36, height * 0.28, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.translate(width * 0.5, height * 0.52);
      ctx.rotate(angle);
      const scale = 2.05;
      ctx.scale(scale, scale);

      drawCarShape(
        ctx,
        car.bodyStyle,
        colorOverride || car.defaultColor,
        car.secondaryColor,
        car.accentColor,
        car.physics.length,
        car.physics.width,
        {
          isBraking: false,
          isBoosting: false,
          steerVisual: active ? Math.sin(angle * 2) * 0.4 : 0,
          nightMode: false,
        }
      );
      ctx.restore();

      if (active) {
        angle += 0.008;
        rafId = requestAnimationFrame(draw);
      }
    };

    draw();
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [car, colorOverride, active, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className="block mx-auto pointer-events-none"
      aria-hidden="true"
    />
  );
}
