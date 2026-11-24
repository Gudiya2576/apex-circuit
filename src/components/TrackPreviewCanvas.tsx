import { useEffect, useRef } from 'react';
import { renderTrackOutline } from '../game/renderer';
import { compileTrack } from '../game/tracks';
import { TrackDefinition } from '../game/types';

interface TrackPreviewCanvasProps {
  track: TrackDefinition;
  width?: number;
  height?: number;
  className?: string;
}

export function TrackPreviewCanvas({
  track,
  width = 240,
  height = 148,
  className = '',
}: TrackPreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);
    const compiled = compileTrack(track);
    renderTrackOutline(ctx, width, height, compiled, { showWalls: true });
    ctx.restore();
  }, [track, width, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className={`block ${className}`}
      aria-hidden="true"
    />
  );
}
